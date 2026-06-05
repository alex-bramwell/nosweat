// =============================================================================
// create-payment-intent - Day Pass Payment with Stripe Connect
//
// MARKETPLACE PAYMENT MODEL: This endpoint demonstrates the Stripe Connect
// "destination charge" pattern for a two-sided marketplace:
//
//   User pays £10 -> Stripe splits it:
//     - £9 goes to the gym's Connect account (transfer_data.destination)
//     - £1 stays with noSweat as platform fee (application_fee_amount)
//
// The platform fee percentage is configurable per gym (default 10%), stored
// in the gyms table as platform_fee_percent.
//
// GRACEFUL FALLBACK: If a gym hasn't completed Stripe Connect onboarding,
// the payment goes directly to the platform's Stripe account (no transfer_data).
// This means gyms can accept day passes immediately, even before finishing KYC.
//
// SECURITY:
//   - verifyAuth() validates the JWT and confirms the requesting user matches
//     the userId in the request body (prevents paying on behalf of others)
//   - sanitizeMetadata() strips HTML tags from class details before storing
//     in Stripe metadata (prevents XSS in the Stripe dashboard)
//   - All class details are stored in payment metadata so the webhook handler
//     can create the booking without additional DB lookups
// =============================================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { supabase } from '../lib/supabase';
import { verifyAuth, assertMethod } from '../lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

// Sanitize metadata values before sending to Stripe - strip HTML tags and
// truncate to 500 chars. Stripe metadata is visible in the dashboard and
// passed to webhooks, so we prevent XSS/injection at the boundary.
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

    if (!gymId) {
      return res.status(400).json({ error: 'Missing gymId' });
    }

    // Verify auth token
    const user = await verifyAuth(req, res);
    if (!user) return;

    if (user.id !== userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // IDEMPOTENT CUSTOMER CREATION: Check if we already have a Stripe customer
    // record for this user. If not, create one and persist the mapping.
    // This avoids creating duplicate Stripe customers on repeat purchases.
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

    // Stripe Connect - look up whether this gym has completed Connect onboarding.
    // If they have, payments are routed through their Connect account with a
    // platform fee (default 10%) retained by noSweat. If not, payments go
    // directly to the platform's Stripe account (pre-Connect fallback).
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

    // Route payment through Connect if gym has an active account.
    // transfer_data sends the payment to the gym's account, while
    // application_fee_amount is the platform's cut retained automatically.
    // This is the marketplace payment model - gym gets paid directly minus our fee.
    if (connectAccountId && applicationFeeAmount) {
      paymentIntentParams.transfer_data = { destination: connectAccountId };
      paymentIntentParams.application_fee_amount = applicationFeeAmount;
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    // Save payment record to database. gym_id is required: payments has a
    // NOT NULL gym_id on a freshly-provisioned database.
    await supabase.from('payments').insert({
      user_id: userId,
      gym_id: gymId,
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
