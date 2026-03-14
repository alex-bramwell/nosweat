import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../lib/supabase';
import { verifyAuth, assertMethod } from '../lib/auth';

const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN!;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID!;

/**
 * Remove a custom domain from a gym.
 * POST /api/domains/remove { gymId }
 * Requires auth.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!assertMethod(req, res, 'POST')) return;

  try {
    const user = await verifyAuth(req, res);
    if (!user) return;

    const { gymId } = req.body;
    if (!gymId) {
      return res.status(400).json({ error: 'Missing gymId' });
    }

    // Get gym
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('id, owner_id, custom_domain')
      .eq('id', gymId)
      .single();

    if (gymError || !gym) {
      return res.status(404).json({ error: 'Gym not found' });
    }

    if (gym.owner_id !== user.id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .eq('gym_id', gymId)
        .single();

      if (!profile || profile.role !== 'admin') {
        return res.status(403).json({ error: 'Only gym owners and admins can manage domains' });
      }
    }

    // Remove from Vercel if domain exists
    if (gym.custom_domain) {
      try {
        await fetch(
          `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${gym.custom_domain}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${VERCEL_API_TOKEN}`,
            },
          }
        );
      } catch {
        // Non-critical: domain may have already been removed from Vercel
      }
    }

    // Clear domain from gym
    const { error: updateError } = await supabase
      .from('gyms')
      .update({
        custom_domain: null,
        custom_domain_status: 'none',
        custom_domain_verified_at: null,
      })
      .eq('id', gymId);

    if (updateError) {
      return res.status(500).json({ error: 'Failed to remove domain' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Domain remove error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
