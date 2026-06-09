import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './lib/supabase.js';

/**
 * Health check for uptime monitoring and load balancers.
 *   GET /api/health        - liveness: 200 if the function runs at all
 *   GET /api/health?deep=1 - readiness: also verifies Supabase connectivity
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const body: { status: string; timestamp: string; database?: string } = {
    status: 'ok',
    timestamp: new Date().toISOString(),
  };

  if (req.query.deep === '1') {
    const { error } = await supabase.from('gyms').select('id').limit(1);
    if (error) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(503).json({ ...body, status: 'degraded', database: 'error' });
    }
    body.database = 'ok';
  }

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json(body);
}
