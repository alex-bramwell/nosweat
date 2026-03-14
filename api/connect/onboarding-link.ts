import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { supabase } from '../lib/supabase';
import { verifyAuth, assertMethod } from '../lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!assertMethod(req, res, 'POST')) return;

  try {
    const { gymId } = req.body;

    if (!gymId) {
      return res.status(400).json({ error: 'Missing gymId' });
    }

    const user = await verifyAuth(req, res);
    if (!user) return;

    // Verify user is gym owner and get stripe account
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('id, owner_id, slug, stripe_account_id')
      .eq('id', gymId)
      .single();

    if (gymError || !gym) {
      return res.status(404).json({ error: 'Gym not found' });
    }

    if (gym.owner_id !== user.id) {
      return res.status(403).json({ error: 'Not authorized — must be gym owner' });
    }

    if (!gym.stripe_account_id) {
      return res.status(400).json({ error: 'No Stripe account — create one first' });
    }

    const origin = req.headers.origin || 'https://nosweat.fitness';

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: gym.stripe_account_id,
      refresh_url: `${origin}/gym/${gym.slug}/gym-admin?tab=settings&stripe=refresh`,
      return_url: `${origin}/gym/${gym.slug}/gym-admin?tab=settings&stripe=complete`,
      type: 'account_onboarding',
    });

    return res.status(200).json({
      url: accountLink.url,
    });
  } catch (error) {
    console.error('Error creating onboarding link:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
