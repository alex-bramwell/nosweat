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
import { stripe } from '../lib/stripe.js';
import { supabase } from '../lib/supabase.js';
import { verifyAuth, assertMethod } from '../lib/auth.js';
import { sanitizeMetadata, getOrCreateStripeCustomer } from '../lib/stripe-helpers.js';
import { checkRateLimit } from '../lib/rateLimit.js';
import { captureError } from '../lib/sentry.js';

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

    if (!(await checkRateLimit(`payment-intent:${userId}`, 10, 60))) {
      return res.status(429).json({ error: 'Too many requests. Please slow down and try again shortly.' });
    }

    // Get or create the Stripe customer for this user (idempotent).
    const stripeCustomerId = await getOrCreateStripeCustomer(userId, user.email);

    // Look up the gym: the day-pass price is owner-configured (day_pass_price_pence,
    // default £10), and we always resolve the charge amount server-side from the
    // database - never trust an amount from the client. We also check whether the
    // gym has completed Connect onboarding to route the payment + platform fee.
    const { data: gym } = await supabase
      .from('gyms')
      .select('stripe_account_id, stripe_onboarding_complete, platform_fee_percent, day_pass_price_pence')
      .eq('id', gymId)
      .single();

    // Resolve the price from the gym record, with a sane floor. Stripe's minimum
    // GBP card charge is 30p, so never let a misconfigured price fall below that.
    const amount = Math.max(gym?.day_pass_price_pence ?? 1000, 30);

    let connectAccountId: string | undefined;
    let applicationFeeAmount: number | undefined;

    if (gym?.stripe_account_id && gym.stripe_onboarding_complete) {
      connectAccountId = gym.stripe_account_id;
      const feePercent = gym.platform_fee_percent || 10;
      applicationFeeAmount = Math.round(amount * (feePercent / 100));
    }

    // Create payment intent for the gym's configured day-pass price.
    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount,
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
      amount,
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
    await captureError(error, { endpoint: 'payments/create-payment-intent' });
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
