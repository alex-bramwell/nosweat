// =============================================================================
// Create Stripe Billing Portal Session (member)
//
// Lets a member manage their own membership billing - update the card on file
// (the key dunning action when a payment fails), view invoices, and cancel.
//
// Membership subscriptions are destination charges on the PLATFORM account, so
// the customer + saved card live there and the portal session is created on the
// platform account (no { stripeAccount }). Requires a Billing Portal
// configuration to be active on the platform Stripe account.
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
    const { gymId } = req.body;

    const user = await verifyAuth(req, res);
    if (!user) return;

    if (!(await checkRateLimit(`portal-session:${user.id}`, 10, 60))) {
      return res.status(429).json({ error: 'Too many requests. Please slow down and try again shortly.' });
    }

    // Find the member's Stripe customer (platform account).
    const { data: customer } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (!customer?.stripe_customer_id) {
      return res.status(404).json({ error: 'No billing account found for this member.' });
    }

    // Return the member to their dashboard. Use the gym slug when we can resolve it.
    const origin = req.headers.origin || 'https://nosweat.fitness';
    let returnUrl = `${origin}/dashboard`;
    if (gymId) {
      const { data: gym } = await supabase.from('gyms').select('slug').eq('id', gymId).single();
      if (gym?.slug) returnUrl = `${origin}/gym/${gym.slug}/dashboard`;
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customer.stripe_customer_id,
      return_url: returnUrl,
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Error creating billing portal session:', error);
    await captureError(error, { endpoint: 'subscriptions/create-portal-session' });
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
