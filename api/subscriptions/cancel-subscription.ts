// =============================================================================
// Cancel Member Subscription
//
// Lets a member cancel their gym membership subscription. We cancel at the end
// of the current billing period (cancel_at_period_end) rather than immediately,
// so the member keeps access until the period they've already paid for ends.
//
// The subscription lives on the gym's connected Stripe account (it was created
// there by create-gym-subscription.ts), so the cancel call must be scoped to
// that account via { stripeAccount }. The customer.subscription.updated webhook
// then syncs cancel_at_period_end back into member_subscriptions.
// =============================================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { stripe } from '../lib/stripe';
import { supabase } from '../lib/supabase';
import { assertMethod, verifyAuth } from '../lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!assertMethod(req, res, 'POST')) return;

  try {
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ error: 'Missing subscriptionId' });
    }

    const user = await verifyAuth(req, res);
    if (!user) return;

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

    // The subscription lives on the gym's connected account.
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('stripe_account_id')
      .eq('id', memberSub.gym_id)
      .single();

    if (gymError || !gym?.stripe_account_id) {
      return res.status(400).json({ error: 'Gym payment account not found' });
    }

    // Cancel at period end - member keeps access until the paid period ends.
    const subscription = await stripe.subscriptions.update(
      subscriptionId,
      { cancel_at_period_end: true },
      { stripeAccount: gym.stripe_account_id }
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
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
