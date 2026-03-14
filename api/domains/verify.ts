import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN!;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID!;

/**
 * Check domain verification status.
 * POST /api/domains/verify { gymId }
 * Requires auth.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify auth
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { gymId } = req.body;
    if (!gymId) {
      return res.status(400).json({ error: 'Missing gymId' });
    }

    // Get gym with domain
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('id, owner_id, custom_domain, custom_domain_status')
      .eq('id', gymId)
      .single();

    if (gymError || !gym) {
      return res.status(404).json({ error: 'Gym not found' });
    }

    if (!gym.custom_domain) {
      return res.status(400).json({ error: 'No custom domain configured' });
    }

    // Check domain status with Vercel
    const vercelRes = await fetch(
      `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${gym.custom_domain}`,
      {
        headers: {
          Authorization: `Bearer ${VERCEL_API_TOKEN}`,
        },
      }
    );

    if (!vercelRes.ok) {
      return res.status(502).json({ error: 'Failed to check domain status' });
    }

    const vercelData = await vercelRes.json();
    const isVerified = vercelData.verified === true;
    const newStatus = isVerified ? 'verified' : (vercelData.verification ? 'pending' : 'failed');

    // Update gym status
    const updateData: Record<string, unknown> = {
      custom_domain_status: newStatus,
    };
    if (isVerified && gym.custom_domain_status !== 'verified') {
      updateData.custom_domain_verified_at = new Date().toISOString();
    }

    await supabase
      .from('gyms')
      .update(updateData)
      .eq('id', gymId);

    return res.status(200).json({
      domain: gym.custom_domain,
      status: newStatus,
      verified: isVerified,
      verification: vercelData.verification || [],
      misconfigured: vercelData.misconfigured || false,
    });
  } catch (err) {
    console.error('Domain verify error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
