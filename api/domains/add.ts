import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../lib/supabase';
import { verifyAuth, assertMethod } from '../lib/auth';

const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN!;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID!;

/**
 * Add a custom domain to a gym.
 * POST /api/domains/add { gymId, domain }
 * Requires auth. Adds domain to Vercel project and updates gym record.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!assertMethod(req, res, 'POST')) return;

  try {
    const user = await verifyAuth(req, res);
    if (!user) return;

    const { gymId, domain } = req.body;
    if (!gymId || !domain) {
      return res.status(400).json({ error: 'Missing gymId or domain' });
    }

    // Validate domain format
    const domainClean = domain.toLowerCase().trim();
    const domainRegex = /^([a-z0-9-]+\.)+[a-z]{2,}$/;
    if (!domainRegex.test(domainClean)) {
      return res.status(400).json({ error: 'Invalid domain format. Use something like www.mygym.com' });
    }

    // Verify user owns this gym
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('id, owner_id, custom_domain')
      .eq('id', gymId)
      .single();

    if (gymError || !gym) {
      return res.status(404).json({ error: 'Gym not found' });
    }

    if (gym.owner_id !== user.id) {
      // Check if user is admin via profiles
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

    // Check feature is enabled
    const { data: feature } = await supabase
      .from('gym_features')
      .select('enabled')
      .eq('gym_id', gymId)
      .eq('feature_key', 'custom_domain')
      .single();

    if (!feature?.enabled) {
      return res.status(403).json({ error: 'Custom domain feature is not enabled. Enable it in your Features settings.' });
    }

    // Check domain not already in use
    const { data: existing } = await supabase
      .from('gyms')
      .select('id')
      .eq('custom_domain', domainClean)
      .neq('id', gymId)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'This domain is already in use by another gym' });
    }

    // Add domain to Vercel project
    const vercelRes = await fetch(
      `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${VERCEL_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: domainClean }),
      }
    );

    const vercelData = await vercelRes.json();

    if (!vercelRes.ok && vercelData.error?.code !== 'domain_already_in_use') {
      console.error('Vercel API error:', vercelData);
      return res.status(502).json({
        error: 'Failed to add domain to hosting provider',
        details: vercelData.error?.message,
      });
    }

    // Update gym record
    const { error: updateError } = await supabase
      .from('gyms')
      .update({
        custom_domain: domainClean,
        custom_domain_status: 'pending',
      })
      .eq('id', gymId);

    if (updateError) {
      console.error('DB update error:', updateError);
      return res.status(500).json({ error: 'Failed to save domain configuration' });
    }

    // Return DNS configuration instructions
    const dnsConfig = vercelData.verification || [];
    return res.status(200).json({
      domain: domainClean,
      status: 'pending',
      dns: {
        type: 'CNAME',
        name: domainClean.startsWith('www.') ? 'www' : domainClean.split('.')[0],
        value: 'cname.vercel-dns.com',
      },
      verification: dnsConfig,
      message: 'Domain added. Configure your DNS records and then verify.',
    });
  } catch (err) {
    console.error('Domain add error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
