import type { VercelRequest, VercelResponse } from '@vercel/node';
import { stripe } from '../lib/stripe.js';
import { supabase } from '../lib/supabase.js';
import { assertMethod, verifyAuth } from '../lib/auth.js';
import { captureError } from '../lib/sentry.js';

// Cancel (or resume) a gym's noSweat platform subscription.
//
// Cancel uses Stripe's cancel_at_period_end so the gym keeps access until the
// end of the period it already paid for; no further billing occurs and Stripe
// fires customer.subscription.deleted at period end, which reverts the gym to
// 'expired'. Resume (resume: true) clears the pending cancellation.
//
// Platform subscriptions live on noSweat's own Stripe account (not a gym's
// Connect account), so we call Stripe without a stripeAccount option.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!assertMethod(req, res, 'POST')) return;

  try {
    const { gymId, resume } = req.body ?? {};
    if (!gymId) {
      return res.status(400).json({ error: 'Missing gymId' });
    }

    const user = await verifyAuth(req, res);
    if (!user) return;

    // Verify the caller owns this gym and grab its subscription.
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('id, owner_id, stripe_subscription_id, subscription_status')
      .eq('id', gymId)
      .single();

    if (gymError || !gym) {
      return res.status(404).json({ error: 'Gym not found' });
    }
    if (gym.owner_id !== user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (!gym.stripe_subscription_id) {
      return res.status(400).json({ error: 'No active subscription for this gym' });
    }

    const cancelAtPeriodEnd = !resume;

    const subscription = await stripe.subscriptions.update(gym.stripe_subscription_id, {
      cancel_at_period_end: cancelAtPeriodEnd,
    });

    // current_period_end moved onto the subscription item in recent API
    // versions; read the item first, fall back to the legacy top-level field.
    const item = subscription.items?.data?.[0] as { current_period_end?: number } | undefined;
    const periodEndTs = item?.current_period_end ?? subscription.current_period_end;
    const currentPeriodEnd = periodEndTs ? new Date(periodEndTs * 1000).toISOString() : null;

    // Reflect the change immediately for instant UI feedback; the
    // customer.subscription.updated webhook also syncs this.
    await supabase
      .from('gyms')
      .update({
        subscription_cancel_at_period_end: subscription.cancel_at_period_end,
        subscription_status: subscription.status,
        subscription_current_period_end: currentPeriodEnd,
      })
      .eq('id', gym.id);

    return res.status(200).json({
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEnd,
      status: subscription.status,
    });
  } catch (error) {
    console.error('Error cancelling platform subscription:', error);
    await captureError(error, { endpoint: 'subscriptions/cancel-platform-subscription' });
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
