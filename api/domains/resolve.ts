import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../lib/supabase';
import { assertMethod } from '../lib/auth';

/**
 * Public endpoint: resolve a hostname to a gym slug.
 * GET /api/domains/resolve?hostname=www.mygym.com
 * Returns { slug } or 404.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!assertMethod(req, res, 'GET')) return;

  const hostname = req.query.hostname as string;
  if (!hostname) {
    return res.status(400).json({ error: 'Missing hostname parameter' });
  }

  try {
    const { data, error } = await supabase
      .from('gyms')
      .select('slug')
      .eq('custom_domain', hostname.toLowerCase())
      .eq('custom_domain_status', 'verified')
      .eq('status', 'active')
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    // Cache at edge for 5 minutes
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
    return res.status(200).json({ slug: data.slug });
  } catch (err) {
    console.error('Domain resolve error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
