// =============================================================================
// Cancel Member Subscription
//
// Lets a member cancel their gym membership subscription. We cancel at the end
// of the current billing period (cancel_at_period_end) rather than immediately,
// so the member keeps access until the period they've already paid for ends.
//
// The subscription lives on the PLATFORM account (created as a destination
// charge by create-gym-subscription.ts, with funds routed to the gym), so the
// cancel call runs on the platform account - no { stripeAccount } scoping. The
// customer.subscription.updated webhook then syncs cancel_at_period_end back
// into member_subscriptions.
// =============================================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { stripe } from '../lib/stripe.js';
import { supabase } from '../lib/supabase.js';
import { assertMethod, verifyAuth } from '../lib/auth.js';
import { checkRateLimit } from '../lib/rateLimit.js';
import { captureError } from '../lib/sentry.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!assertMethod(req, res, 'POST')) return;

  try {
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ error: 'Missing subscriptionId' });
    }

    const user = await verifyAuth(req, res);
    if (!user) return;

    if (!(await checkRateLimit(`cancel-subscription:${user.id}`, 10, 60))) {
      return res.status(429).json({ error: 'Too many requests. Please slow down and try again shortly.' });
    }

    // Look up the subscription and verify it belongs to the caller.
    const { data: memberSub, error: subError } = await supabase
      .from('member_subscriptions')
      .select('id, user_id, gym_id, status, stripe_subscription_id')
      .eq('stripe_subscription_id', subscriptionId)
      .single();

    if (subError || !memberSub) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    if (memberSub.user_id !== user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (memberSub.status === 'cancelled') {
      return res.status(400).json({ error: 'Subscription already cancelled' });
    }

    // Cancel at period end - member keeps access until the paid period ends.
    // Runs on the platform account (destination-charge subscription).
    const subscription = await stripe.subscriptions.update(
      subscriptionId,
      { cancel_at_period_end: true }
    );

    // Reflect the pending cancellation immediately; the webhook will also sync
    // this, but updating here gives instant UI feedback.
    await supabase
      .from('member_subscriptions')
      .update({ cancel_at_period_end: true })
      .eq('stripe_subscription_id', subscriptionId);

    return res.status(200).json({
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    await captureError(error, { endpoint: 'subscriptions/cancel-subscription' });
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
