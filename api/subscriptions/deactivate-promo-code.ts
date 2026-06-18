// =============================================================================
// Deactivate a gym promotion code (owner only)
//
// Turns off the Stripe promotion code (existing redemptions are unaffected) and
// marks our row inactive so it drops out of the owner's list.
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
    const { promoId } = req.body;
    if (!promoId) return res.status(400).json({ error: 'Missing promoId' });

    const user = await verifyAuth(req, res);
    if (!user) return;

    if (!(await checkRateLimit(`deactivate-promo:${user.id}`, 20, 60))) {
      return res.status(429).json({ error: 'Too many requests. Please slow down and try again shortly.' });
    }

    const { data: promo } = await supabase
      .from('gym_promo_codes')
      .select('id, gym_id, stripe_promotion_code_id')
      .eq('id', promoId)
      .single();

    if (!promo) return res.status(404).json({ error: 'Promo code not found' });

    // Authorise against the owning gym.
    const { data: gym } = await supabase.from('gyms').select('owner_id').eq('id', promo.gym_id).single();
    if (gym?.owner_id !== user.id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, gym_id')
        .eq('id', user.id)
        .single();
      if (!profile || profile.role !== 'admin' || profile.gym_id !== promo.gym_id) {
        return res.status(403).json({ error: 'Not authorized - must be a gym owner or admin' });
      }
    }

    if (promo.stripe_promotion_code_id) {
      await stripe.promotionCodes.update(promo.stripe_promotion_code_id, { active: false });
    }

    await supabase.from('gym_promo_codes').update({ active: false }).eq('id', promoId);

    return res.status(200).json({ deactivated: true });
  } catch (error) {
    console.error('Error deactivating promo code:', error);
    await captureError(error, { endpoint: 'subscriptions/deactivate-promo-code' });
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
