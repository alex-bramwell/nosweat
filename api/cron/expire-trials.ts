// =============================================================================
// Trial Expiry Sweep - Scheduled Cron Job
//
// PURPOSE: Member free trials run for 7 days (see create-setup-intent.ts and the
// trial_memberships table). When a trial period ends we simply mark it expired -
// no automatic charge is taken. Members are prompted to subscribe manually.
//
// SCHEDULE: Runs daily via vercel.json `crons`. Vercel invokes cron endpoints
// with a GET request and, when CRON_SECRET is configured in the project env,
// an `Authorization: Bearer <CRON_SECRET>` header. We verify that header so the
// endpoint can't be triggered by arbitrary callers.
// =============================================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../lib/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify the request came from Vercel Cron (or an authorised caller).
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const now = new Date().toISOString();

    // Find active trials whose end date has passed and mark them expired.
    // No charge is taken - the member is prompted to subscribe manually, driven
    // off this status in the member-facing UI.
    const { data: expired, error: updateError } = await supabase
      .from('trial_memberships')
      .update({ status: 'expired', updated_at: now })
      .eq('status', 'active')
      .lte('trial_end_date', now)
      .select('id, user_id');

    if (updateError) {
      console.error('Error expiring trials:', updateError);
      return res.status(500).json({ error: 'Failed to expire trials' });
    }

    const count = expired?.length || 0;
    console.log(`Trial expiry sweep complete - ${count} trial(s) expired`);

    return res.status(200).json({ expired: count });
  } catch (error) {
    console.error('Trial expiry sweep failed:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
