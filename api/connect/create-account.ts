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

    // Verify user is gym owner
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('id, owner_id, name, contact_email, stripe_account_id, country')
      .eq('id', gymId)
      .single();

    if (gymError || !gym) {
      return res.status(404).json({ error: 'Gym not found' });
    }

    if (gym.owner_id !== user.id) {
      return res.status(403).json({ error: 'Not authorized — must be gym owner' });
    }

    // If account already exists, return it
    if (gym.stripe_account_id) {
      return res.status(200).json({
        accountId: gym.stripe_account_id,
        alreadyExists: true,
      });
    }

    // Create Express connected account
    const account = await stripe.accounts.create({
      type: 'express',
      country: gym.country || 'GB',
      email: gym.contact_email || user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'company',
      business_profile: {
        name: gym.name,
        mcc: '7941', // Sports clubs/fields
      },
      metadata: {
        gym_id: gymId,
        owner_user_id: user.id,
      },
    });

    // Save account ID to gym
    await supabase
      .from('gyms')
      .update({
        stripe_account_id: account.id,
        stripe_account_status: 'onboarding',
      })
      .eq('id', gymId);

    return res.status(200).json({
      accountId: account.id,
      alreadyExists: false,
    });
  } catch (error) {
    console.error('Error creating Connect account:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
