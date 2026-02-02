/**
 * Sync Status Endpoint
 * Check the status and results of a sync operation
 * GET /api/accounting/sync/status?syncLogId=xxx
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

/**
 * Verify user is authenticated and has admin role
 */
async function verifyAdmin(authHeader: string | undefined): Promise<boolean> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.substring(7);

  // Verify JWT and get user
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return false;
  }

  // Check if user has admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role === 'admin';
}

/**
 * Main handler
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify admin authentication
    const isAdmin = await verifyAdmin(req.headers.authorization);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Unauthorized - Admin access required' });
    }

    // Get sync log ID from query
    const { syncLogId } = req.query;

    if (!syncLogId || typeof syncLogId !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid syncLogId parameter'
      });
    }

    // Fetch sync log
    const { data: syncLog, error } = await supabase
      .from('accounting_sync_logs')
      .select('*')
      .eq('id', syncLogId)
      .single();

    if (error || !syncLog) {
      return res.status(404).json({
        error: 'Sync log not found'
      });
    }

    // Fetch error details if there were failures
    let errorDetails = null;
    if (syncLog.transactions_failed > 0) {
      const { data: failedTransactions } = await supabase
        .from('accounting_synced_transactions')
        .select('payment_id, sync_error')
        .eq('sync_log_id', syncLogId)
        .not('sync_error', 'is', null);

      errorDetails = failedTransactions || [];
    }

    // Return status
    return res.status(200).json({
      syncLogId: syncLog.id,
      provider: syncLog.provider,
      syncType: syncLog.sync_type,
      status: syncLog.status,
      startedAt: syncLog.started_at,
      completedAt: syncLog.completed_at,
      durationSeconds: syncLog.duration_seconds,
      attempted: syncLog.transactions_attempted,
      succeeded: syncLog.transactions_succeeded,
      failed: syncLog.transactions_failed,
      errorMessage: syncLog.error_message,
      errorDetails: errorDetails,
      dateRangeStart: syncLog.date_range_start,
      dateRangeEnd: syncLog.date_range_end,
      triggeredBy: syncLog.triggered_by
    });

  } catch (error: any) {
    console.error('[Sync Status] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}
