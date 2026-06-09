import type { VercelRequest, VercelResponse } from '@vercel/node';
import { stripe } from '../lib/stripe.js';
import { supabase } from '../lib/supabase.js';
import { verifyAuth, assertMethod } from '../lib/auth.js';
import { sanitizeMetadata, getOrCreateStripeCustomer } from '../lib/stripe-helpers.js';
import { checkRateLimit } from '../lib/rateLimit.js';
import { captureError } from '../lib/sentry.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!assertMethod(req, res, 'POST')) return;

  try {
    const { userId, gymId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
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

    if (!(await checkRateLimit(`setup-intent:${userId}`, 10, 60))) {
      return res.status(429).json({ error: 'Too many requests. Please slow down and try again shortly.' });
    }

    // Check if user already used their trial
    const { data: profile } = await supabase
      .from('profiles')
      .select('trial_used')
      .eq('id', userId)
      .single();

    if (profile && profile.trial_used) {
      return res.status(400).json({ error: 'Trial already used' });
    }

    // Get or create Stripe customer
    const stripeCustomerId = await getOrCreateStripeCustomer(userId, user.email);

    // Create setup intent for future payments (no charge now)
    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      metadata: {
        user_id: sanitizeMetadata(userId),
        payment_type: 'trial-setup',
      },
    });

    // Create trial membership record. gym_id is required: trial_memberships has
    // a NOT NULL gym_id on a freshly-provisioned database.
    await supabase.from('trial_memberships').insert({
      user_id: userId,
      gym_id: gymId,
      stripe_setup_intent_id: setupIntent.id,
      status: 'active',
      auto_convert_enabled: true,
    });

    return res.status(200).json({
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
    });
  } catch (error) {
    console.error('Error creating setup intent:', error);
    await captureError(error, { endpoint: 'payments/create-setup-intent' });
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
