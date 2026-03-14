import { createClient } from '@supabase/supabase-js';

/**
 * Shared Supabase service client for all API endpoints.
 * Uses the service key for full admin access (server-side only).
 */
export const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);
