import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { gymId, membershipId, userId } = req.body;

    if (!gymId || !membershipId || !userId) {
      return res.status(400).json({ error: 'Missing required fields: gymId, membershipId, userId' });
    }

    // Verify auth token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user || user.id !== userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get gym with Connect account
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('id, name, slug, stripe_account_id, stripe_onboarding_complete, platform_fee_percent')
      .eq('id', gymId)
      .single();

    if (gymError || !gym) {
      return res.status(404).json({ error: 'Gym not found' });
    }

    if (!gym.stripe_account_id || !gym.stripe_onboarding_complete) {
      return res.status(400).json({ error: 'Gym has not completed payment setup' });
    }

    // Get the membership plan
    const { data: membership, error: membershipError } = await supabase
      .from('gym_memberships')
      .select('*')
      .eq('id', membershipId)
      .eq('gym_id', gymId)
      .eq('is_active', true)
      .single();

    if (membershipError || !membership) {
      return res.status(404).json({ error: 'Membership plan not found' });
    }

    if (!membership.price_pence || membership.price_pence <= 0) {
      return res.status(400).json({ error: 'Membership plan has no valid price' });
    }

    // Check if user already has an active subscription to this gym
    const { data: existingSub } = await supabase
      .from('member_subscriptions')
      .select('id, status')
      .eq('gym_id', gymId)
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .single();

    if (existingSub) {
      return res.status(400).json({ error: 'Already subscribed to this gym' });
    }

    // Get or create Stripe customer
    const { data: existingCustomer } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    let stripeCustomerId: string;

    if (existingCustomer) {
      stripeCustomerId = existingCustomer.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: userId },
      });

      stripeCustomerId = customer.id;

      await supabase.from('stripe_customers').insert({
        user_id: userId,
        stripe_customer_id: stripeCustomerId,
      });
    }

    // Get or create Stripe product + price on the connected account
    let stripePriceId = membership.stripe_price_id;

    if (!stripePriceId) {
      // Create product on connected account
      const product = await stripe.products.create({
        name: `${gym.name} — ${membership.display_name}`,
        metadata: {
          gym_id: gymId,
          membership_id: membershipId,
        },
      }, {
        stripeAccount: gym.stripe_account_id,
      });

      // Create recurring price on connected account
      const interval = membership.billing_period === 'yearly' ? 'year' : 'month';
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: membership.price_pence,
        currency: 'gbp',
        recurring: { interval },
      }, {
        stripeAccount: gym.stripe_account_id,
      });

      stripePriceId = price.id;

      // Save back to DB for reuse
      await supabase
        .from('gym_memberships')
        .update({
          stripe_price_id: price.id,
          stripe_product_id: product.id,
        })
        .eq('id', membershipId);
    }

    // Calculate application fee (platform cut)
    const feePercent = gym.platform_fee_percent || 10;
    const applicationFeePercent = feePercent / 100;

    const origin = req.headers.origin || 'https://nosweat.fitness';

    // Create checkout session on connected account with application fee
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [{ price: stripePriceId, quantity: 1 }],
      subscription_data: {
        application_fee_percent: applicationFeePercent * 100,
        metadata: {
          gym_id: gymId,
          membership_id: membershipId,
          user_id: userId,
        },
      },
      metadata: {
        gym_id: gymId,
        membership_id: membershipId,
        user_id: userId,
        payment_type: 'gym-membership',
      },
      success_url: `${origin}/gym/${gym.slug}/dashboard?subscription=success`,
      cancel_url: `${origin}/gym/${gym.slug}?subscription=cancelled`,
    }, {
      stripeAccount: gym.stripe_account_id,
    });

    return res.status(200).json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Error creating gym subscription:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
