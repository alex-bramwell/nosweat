// =============================================================================
// Stripe Webhook Handler - Central Payment Event Router
//
// ARCHITECTURE: This is the server-side counterpart to the frontend payment
// flows. Stripe sends events here after payments succeed/fail, and this handler
// updates the database accordingly. It's a Vercel serverless function, so it
// scales automatically and runs independently of the frontend.
//
// SECURITY: Two layers of protection:
//   1. assertMethod() - rejects non-POST requests
//   2. stripe.webhooks.constructEvent() - verifies the request signature using
//      STRIPE_WEBHOOK_SECRET. This proves the request came from Stripe, not an
//      attacker. Raw body parsing (bodyParser: false) is required because
//      signature verification needs the exact bytes Stripe sent.
//
// EVENT TYPES HANDLED (full payment lifecycle):
//   - payment_intent.succeeded/failed - Day pass payments
//   - setup_intent.succeeded/failed   - Trial signups (card saved, not charged)
//   - checkout.session.completed      - Subscriptions (gym memberships + platform)
//   - customer.subscription.updated/deleted - Subscription lifecycle changes
//   - account.updated                 - Stripe Connect onboarding status
//
// DESIGN CHOICE: All class details (day, time, name, coach) are stored in
// payment metadata when the intent is created, so this webhook handler is
// self-contained - it doesn't need to look up class data from the database.
// =============================================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { stripe } from '../lib/stripe.js';
import { supabase } from '../lib/supabase.js';
import { assertMethod } from '../lib/auth.js';
import { captureError } from '../lib/sentry.js';
import { buffer } from 'micro';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Disable Vercel's default body parsing so we can access the raw request
// body for Stripe signature verification. Without this, the signature
// check fails because the body gets parsed and re-serialized.
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!assertMethod(req, res, 'POST')) return;

  try {
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      return res.status(400).json({ error: 'Missing stripe signature' });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return res.status(400).json({ error: 'Webhook signature verification failed' });
    }

    // Central event router - handles the full payment lifecycle:
    // - Day pass payments (payment_intent.succeeded/failed)
    // - Trial signups (setup_intent.succeeded/failed) - card saved but not charged
    // - Platform & gym subscriptions (checkout.session.completed, subscription updates)
    // - Stripe Connect onboarding status (account.updated)
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentSucceeded(paymentIntent);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentFailed(paymentIntent);
        break;
      }

      case 'setup_intent.succeeded': {
        const setupIntent = event.data.object as Stripe.SetupIntent;
        await handleSetupIntentSucceeded(setupIntent);
        break;
      }

      case 'setup_intent.setup_failed': {
        const setupIntent = event.data.object as Stripe.SetupIntent;
        await handleSetupIntentFailed(setupIntent);
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        await handleAccountUpdated(account);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    await captureError(error, { endpoint: 'webhooks/stripe' });
    return res.status(500).json({
      error: 'Webhook handler failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Day pass payment succeeded - update the payment record and create a confirmed
// booking. All the class details were stored in payment metadata when the intent
// was created, so the webhook is self-contained and doesn't need extra DB lookups.
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    const userId = paymentIntent.metadata.user_id;
    const classId = paymentIntent.metadata.class_id;

    // Update payment status
    await supabase
      .from('payments')
      .update({ status: 'succeeded' })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    // Create booking. gym_id is carried in the payment metadata and is required:
    // bookings has a NOT NULL gym_id on a freshly-provisioned database.
    await supabase.from('bookings').insert({
      user_id: userId,
      gym_id: paymentIntent.metadata.gym_id || null,
      class_id: classId,
      class_day: paymentIntent.metadata.class_day,
      class_time: paymentIntent.metadata.class_time,
      class_name: paymentIntent.metadata.class_name,
      coach_name: paymentIntent.metadata.coach_name || null,
      booking_type: 'day-pass',
      status: 'confirmed',
    });

    console.log(`Payment succeeded and booking created for user ${userId}`);
  } catch (error) {
    console.error('Error handling payment_intent.succeeded:', error);
    throw error;
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    // Update payment status
    await supabase
      .from('payments')
      .update({ status: 'failed' })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    console.log(`Payment failed for payment intent ${paymentIntent.id}`);
  } catch (error) {
    console.error('Error handling payment_intent.payment_failed:', error);
    throw error;
  }
}

// Trial signup completed - a SetupIntent saves the user's card without charging.
// We activate the trial membership and mark trial_used on their profile so they
// can't sign up for multiple free trials at the same gym.
async function handleSetupIntentSucceeded(setupIntent: Stripe.SetupIntent) {
  try {
    const userId = setupIntent.metadata.user_id;

    // Update trial membership with payment method
    await supabase
      .from('trial_memberships')
      .update({
        stripe_payment_method_id: setupIntent.payment_method as string,
        status: 'active',
      })
      .eq('stripe_setup_intent_id', setupIntent.id);

    // Update user profile - set trial as used and membership type to trial
    await supabase
      .from('profiles')
      .update({
        trial_used: true,
        trial_started_at: new Date().toISOString(),
        membership_type: 'trial',
      })
      .eq('id', userId);

    console.log(`Trial setup succeeded for user ${userId}`);
  } catch (error) {
    console.error('Error handling setup_intent.succeeded:', error);
    throw error;
  }
}

// TWO-SIDED MARKETPLACE: This handler processes subscriptions for both sides:
//   1. Gym memberships (payment_type: 'gym-membership') - a member subscribing
//      to a gym. Payment flows through Stripe Connect to the gym's account.
//   2. Platform subscriptions - a gym owner subscribing to noSweat's SaaS.
//      Payment goes directly to the platform's Stripe account.
// The payment_type metadata (set during checkout creation) determines which path.
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    const userId = session.metadata?.user_id;
    const subscriptionId = session.subscription as string | null;
    const paymentType = session.metadata?.payment_type;

    if (!userId || !subscriptionId) {
      console.log('Checkout session completed without user_id or subscription — skipping');
      return;
    }

    // Handle gym membership subscriptions (via Connect)
    if (paymentType === 'gym-membership') {
      const gymId = session.metadata?.gym_id;
      const membershipId = session.metadata?.membership_id;

      await supabase.from('member_subscriptions').insert({
        gym_id: gymId,
        user_id: userId,
        membership_id: membershipId,
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: session.customer as string,
        status: 'active',
      });

      // Update user profile membership type
      await supabase
        .from('profiles')
        .update({ membership_type: 'member' })
        .eq('id', userId);

      console.log(`Gym membership subscription created for user ${userId} at gym ${gymId}`);
      return;
    }

    // Handle platform subscriptions (gym owners subscribing to noSweat)
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const priceId = subscription.items.data[0]?.price?.id;

    await supabase
      .from('profiles')
      .update({
        membership_type: 'platform_subscriber',
        stripe_subscription_id: subscriptionId,
        stripe_price_id: priceId || null,
        subscription_status: 'active',
      })
      .eq('id', userId);

    // Ensure stripe customer record exists
    const customerId = session.customer as string;
    if (customerId) {
      const { data: existing } = await supabase
        .from('stripe_customers')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!existing) {
        await supabase.from('stripe_customers').insert({
          user_id: userId,
          stripe_customer_id: customerId,
        });
      }
    }

    console.log(`Platform subscription completed for user ${userId}, subscription ${subscriptionId}`);
  } catch (error) {
    console.error('Error handling checkout.session.completed:', error);
    throw error;
  }
}

async function handleSetupIntentFailed(setupIntent: Stripe.SetupIntent) {
  try {
    // Update trial membership status
    await supabase
      .from('trial_memberships')
      .update({ status: 'cancelled' })
      .eq('stripe_setup_intent_id', setupIntent.id);

    console.log(`Trial setup failed for setup intent ${setupIntent.id}`);
  } catch (error) {
    console.error('Error handling setup_intent.setup_failed:', error);
    throw error;
  }
}

// STRIPE CONNECT ONBOARDING: Tracks whether a gym has completed Stripe's KYC
// verification. Status progression: onboarding -> restricted -> active.
// A gym can only receive payments once charges_enabled && payouts_enabled are
// both true. Until then, payments fall back to the platform's direct account
// (see create-payment-intent.ts for the fallback logic).
async function handleAccountUpdated(account: Stripe.Account) {
  try {
    const gymId = account.metadata?.gym_id;
    if (!gymId) {
      // Find gym by stripe_account_id
      const { data: gym } = await supabase
        .from('gyms')
        .select('id')
        .eq('stripe_account_id', account.id)
        .single();

      if (!gym) {
        console.log(`No gym found for Connect account ${account.id}`);
        return;
      }

      let status = 'onboarding';
      if (account.charges_enabled && account.payouts_enabled) {
        status = 'active';
      } else if (account.details_submitted) {
        status = 'restricted';
      }

      await supabase
        .from('gyms')
        .update({
          stripe_account_status: status,
          stripe_onboarding_complete: status === 'active',
        })
        .eq('id', gym.id);

      console.log(`Connect account ${account.id} updated — status: ${status}`);
      return;
    }

    let status = 'onboarding';
    if (account.charges_enabled && account.payouts_enabled) {
      status = 'active';
    } else if (account.details_submitted) {
      status = 'restricted';
    }

    await supabase
      .from('gyms')
      .update({
        stripe_account_status: status,
        stripe_onboarding_complete: status === 'active',
      })
      .eq('id', gymId);

    console.log(`Connect account for gym ${gymId} updated — status: ${status}`);
  } catch (error) {
    console.error('Error handling account.updated:', error);
    throw error;
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const { data: memberSub } = await supabase
      .from('member_subscriptions')
      .select('id')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (!memberSub) {
      console.log(`No member subscription found for ${subscription.id}`);
      return;
    }

    const statusMap: Record<string, string> = {
      active: 'active',
      past_due: 'past_due',
      canceled: 'cancelled',
      incomplete: 'incomplete',
      trialing: 'trialing',
      incomplete_expired: 'cancelled',
      unpaid: 'past_due',
    };

    await supabase
      .from('member_subscriptions')
      .update({
        status: statusMap[subscription.status] || subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
      })
      .eq('stripe_subscription_id', subscription.id);

    console.log(`Member subscription ${subscription.id} updated — status: ${subscription.status}`);
  } catch (error) {
    console.error('Error handling customer.subscription.updated:', error);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    await supabase
      .from('member_subscriptions')
      .update({ status: 'cancelled' })
      .eq('stripe_subscription_id', subscription.id);

    console.log(`Member subscription ${subscription.id} cancelled`);
  } catch (error) {
    console.error('Error handling customer.subscription.deleted:', error);
    throw error;
  }
}
