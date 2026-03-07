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
    const { gymId } = req.body;

    if (!gymId) {
      return res.status(400).json({ error: 'Missing gymId' });
    }

    // Verify auth token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get gym
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('id, owner_id, stripe_account_id, stripe_account_status')
      .eq('id', gymId)
      .single();

    if (gymError || !gym) {
      return res.status(404).json({ error: 'Gym not found' });
    }

    if (gym.owner_id !== user.id) {
      return res.status(403).json({ error: 'Not authorized — must be gym owner' });
    }

    if (!gym.stripe_account_id) {
      return res.status(200).json({
        status: 'not_started',
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
      });
    }

    // Retrieve account from Stripe to get current status
    const account = await stripe.accounts.retrieve(gym.stripe_account_id);

    // Determine status
    let status = 'onboarding';
    if (account.charges_enabled && account.payouts_enabled) {
      status = 'active';
    } else if (account.details_submitted) {
      status = 'restricted';
    }

    // Update gym status if it changed
    if (status !== gym.stripe_account_status) {
      await supabase
        .from('gyms')
        .update({
          stripe_account_status: status,
          stripe_onboarding_complete: status === 'active',
        })
        .eq('id', gymId);
    }

    return res.status(200).json({
      status,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      dashboardUrl: account.charges_enabled
        ? `https://dashboard.stripe.com/${account.id}`
        : null,
    });
  } catch (error) {
    console.error('Error checking account status:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
