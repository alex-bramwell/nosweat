import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

/**
 * Verify the Bearer token from the request and return the authenticated user.
 * Returns null and sends a 401 response if authentication fails.
 *
 * Usage:
 *   const user = await verifyAuth(req, res);
 *   if (!user) return; // response already sent
 */
export async function verifyAuth(
  req: VercelRequest,
  res: VercelResponse
): Promise<User | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }

  const token = authHeader.substring(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }

  return user;
}

/**
 * Enforce that the request method matches, sending 405 otherwise.
 * Returns true if the method matches.
 *
 * Usage:
 *   if (!assertMethod(req, res, 'POST')) return;
 */
export function assertMethod(
  req: VercelRequest,
  res: VercelResponse,
  method: string
): boolean {
  if (req.method !== method) {
    res.status(405).json({ error: 'Method not allowed' });
    return false;
  }
  return true;
}
