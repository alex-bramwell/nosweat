import type { VercelRequest } from '@vercel/node';
import { supabase } from './supabase';

/**
 * Sliding-window rate limit backed by Postgres (no external service).
 * Returns true if the action is allowed, false if the limit is exceeded.
 *
 * Fails OPEN (returns true) if the limiter itself errors, so a limiter problem
 * never blocks legitimate traffic - the trade-off is intentional for a throttle.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error('[rateLimit] check failed, allowing request:', error.message);
    return true;
  }
  return data === true;
}

/** Best-effort client IP from proxy headers, for unauthenticated endpoints. */
export function clientIp(req: VercelRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string') return fwd.split(',')[0].trim();
  if (Array.isArray(fwd)) return String(fwd[0]);
  return 'unknown';
}
