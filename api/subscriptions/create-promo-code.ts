// =============================================================================
// Create a gym promotion code (owner only)
//
// Membership subscriptions are destination charges on the PLATFORM account, so
// a gym's promo is a platform Coupon + Promotion Code. Cross-tenant safety is
// enforced at APPLY time, not here: create-gym-subscription only applies a code
// after confirming it belongs to that gym (via gym_promo_codes), and checkout
// does NOT allow free-typed codes. So the coupon itself needs no product scoping.
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
    const { gymId, code, percentOff, duration, durationInMonths, maxRedemptions } = req.body;

    if (!gymId || !code || !percentOff) {
      return res.status(400).json({ error: 'Missing required fields: gymId, code, percentOff' });
    }

    const pct = Number(percentOff);
    if (!Number.isInteger(pct) || pct < 1 || pct > 100) {
      return res.status(400).json({ error: 'percentOff must be a whole number between 1 and 100' });
    }

    const dur = duration === 'forever' || duration === 'repeating' ? duration : 'once';
    if (dur === 'repeating' && (!durationInMonths || durationInMonths < 1)) {
      return res.status(400).json({ error: 'durationInMonths is required for a repeating promo' });
    }

    const user = await verifyAuth(req, res);
    if (!user) return;

    if (!(await checkRateLimit(`create-promo:${user.id}`, 10, 60))) {
      return res.status(429).json({ error: 'Too many requests. Please slow down and try again shortly.' });
    }

    // Authorise: must be the gym owner, or an admin scoped to this gym.
    const { data: gym } = await supabase
      .from('gyms')
      .select('id, name, owner_id')
      .eq('id', gymId)
      .single();

    if (!gym) return res.status(404).json({ error: 'Gym not found' });

    if (gym.owner_id !== user.id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, gym_id')
        .eq('id', user.id)
        .single();
      if (!profile || profile.role !== 'admin' || profile.gym_id !== gymId) {
        return res.status(403).json({ error: 'Not authorized - must be a gym owner or admin' });
      }
    }

    // Create the coupon + code. Cross-tenant safety is enforced when the code is
    // applied (create-gym-subscription checks it belongs to this gym), so no
    // product restriction is needed on the coupon itself.
    const coupon = await stripe.coupons.create({
      percent_off: pct,
      duration: dur,
      ...(dur === 'repeating' ? { duration_in_months: Number(durationInMonths) } : {}),
      name: `${gym.name} ${pct}% off`,
    });

    const normalisedCode = String(code).trim().toUpperCase().replace(/\s+/g, '');
    const promotionCode = await stripe.promotionCodes.create({
      promotion: { type: 'coupon', coupon: coupon.id },
      code: normalisedCode,
      ...(maxRedemptions ? { max_redemptions: Number(maxRedemptions) } : {}),
    });

    const { data: row, error: insertError } = await supabase
      .from('gym_promo_codes')
      .insert({
        gym_id: gymId,
        code: normalisedCode,
        stripe_promotion_code_id: promotionCode.id,
        stripe_coupon_id: coupon.id,
        percent_off: pct,
        duration: dur,
        duration_in_months: dur === 'repeating' ? Number(durationInMonths) : null,
        max_redemptions: maxRedemptions ? Number(maxRedemptions) : null,
        active: true,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return res.status(200).json({ promo: row });
  } catch (error) {
    console.error('Error creating promo code:', error);
    await captureError(error, { endpoint: 'subscriptions/create-promo-code' });
    const message = error instanceof Error ? error.message : 'Unknown error';
    // Stripe surfaces a clear message when a code already exists.
    return res.status(500).json({ error: 'Could not create promo code', message });
  }
}
