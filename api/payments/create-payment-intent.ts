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
    const { userId, classId, classDetails, gymId } = req.body;

    if (!userId || !classId || !classDetails) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify auth token
    const user = await verifyAuth(req, res);
    if (!user) return;

    if (user.id !== userId) {
      return res.status(401).json({ error: 'Unauthorized' });
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

    // Look up gym's Connect account if gymId provided
    let connectAccountId: string | undefined;
    let applicationFeeAmount: number | undefined;

    if (gymId) {
      const { data: gym } = await supabase
        .from('gyms')
        .select('stripe_account_id, stripe_onboarding_complete, platform_fee_percent')
        .eq('id', gymId)
        .single();

      if (gym?.stripe_account_id && gym.stripe_onboarding_complete) {
        connectAccountId = gym.stripe_account_id;
        const feePercent = gym.platform_fee_percent || 10;
        applicationFeeAmount = Math.round(1000 * (feePercent / 100));
      }
    }

    // Create payment intent for £10 (1000 pence)
    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: 1000, // £10 in pence
      currency: 'gbp',
      customer: stripeCustomerId,
      metadata: {
        user_id: sanitizeMetadata(userId),
        class_id: sanitizeMetadata(classId),
        class_day: sanitizeMetadata(classDetails.day),
        class_time: sanitizeMetadata(classDetails.time),
        class_name: sanitizeMetadata(classDetails.className),
        coach_name: sanitizeMetadata(classDetails.coach || ''),
        payment_type: 'day-pass',
        gym_id: sanitizeMetadata(gymId || ''),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    };

    // Route payment through Connect if gym has an account
    if (connectAccountId && applicationFeeAmount) {
      paymentIntentParams.transfer_data = { destination: connectAccountId };
      paymentIntentParams.application_fee_amount = applicationFeeAmount;
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    // Save payment record to database
    await supabase.from('payments').insert({
      user_id: userId,
      stripe_payment_intent_id: paymentIntent.id,
      stripe_customer_id: stripeCustomerId,
      amount: 1000,
      currency: 'gbp',
      status: 'pending',
      payment_type: 'day-pass',
      metadata: {
        class_id: classId,
        class_details: classDetails,
      },
    });

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
