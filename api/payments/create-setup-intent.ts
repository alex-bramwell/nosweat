import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { supabase } from '../lib/supabase';
import { verifyAuth, assertMethod } from '../lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

function sanitizeMetadata(value: string): string {
  return String(value || '').replace(/<[^>]*>/g, '').slice(0, 500);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!assertMethod(req, res, 'POST')) return;

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    // Verify auth token
    const user = await verifyAuth(req, res);
    if (!user) return;

    if (user.id !== userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user already used their trial
    const { data: profile } = await supabase
      .from('profiles')
      .select('trial_used')
      .eq('id', userId)
      .single();

    if (profile && profile.trial_used) {
      return res.status(400).json({ error: 'Trial already used' });
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
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: userId,
        },
      });

      stripeCustomerId = customer.id;

      // Save to database
      await supabase.from('stripe_customers').insert({
        user_id: userId,
        stripe_customer_id: stripeCustomerId,
      });
    }

    // Create setup intent for future payments (no charge now)
    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      metadata: {
        user_id: sanitizeMetadata(userId),
        payment_type: 'trial-setup',
      },
    });

    // Create trial membership record
    await supabase.from('trial_memberships').insert({
      user_id: userId,
      stripe_setup_intent_id: setupIntent.id,
      status: 'active',
      auto_convert_enabled: true,
    });

    return res.status(200).json({
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
    });
  } catch (error) {
    console.error('Error creating setup intent:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
