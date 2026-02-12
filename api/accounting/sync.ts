/**
 * Unified Sync Endpoint
 * Handles both manual sync triggering and status checking
 *
 * POST /api/accounting/sync - Trigger manual sync
 * GET /api/accounting/sync?syncLogId=xxx - Check sync status
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import {
  Provider,
  SyncResult,
  isProviderActive,
  getAccountMappings,
  validateAccountMappings,
  getUnsyncedPayments,
  categorizePayments,
  createSyncLog,
  updateSyncLog,
  completeSyncLog,
  isPaymentSynced,
  markPaymentSynced,
  recordSyncedTransaction,
  getIntegration,
  updateIntegrationLastSync,
} from '../../src/services/accountingSyncService.js';
import {
  createQBClient,
  getOrCreateCustomer,
  createSalesReceipt,
  createCreditMemo
} from '../services/quickbooksService.js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

/**
 * Verify user is authenticated and has admin role
 */
async function verifyAdmin(authHeader: string | undefined): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return null;
  }

  return user.id;
}

/**
 * Sync payments to QuickBooks
 */
async function syncToQuickBooks(
  integrationId: string,
  categorizedPayments: any[],
  accountMappings: any[]
): Promise<{
  succeeded: string[];
  failed: Array<{ paymentId: string; error: string }>;
}> {
  const succeeded: string[] = [];
  const failed: Array<{ paymentId: string; error: string }> = [];

  const qbo = await createQBClient(integrationId);

  for (const { payment, category, description } of categorizedPayments) {
    try {
      const mapping = accountMappings.find(m => m.revenue_category === category);

      if (!mapping) {
        failed.push({
          paymentId: payment.id,
          error: `No account mapping found for category: ${category}`
        });
        continue;
      }

      console.log(`[QB] Syncing payment ${payment.id}:`, {
        amount: payment.amount / 100,
        category,
        description,
        accountId: mapping.external_account_id
      });

      const { data: userData } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', payment.user_id)
        .single();

      const email = userData?.email || 'unknown@example.com';
      const displayName = userData?.full_name || 'Unknown Customer';

      const customer = await getOrCreateCustomer(qbo, email, displayName);

      const amount = payment.amount / 100;
      const txnDate = new Date(payment.created_at).toISOString().split('T')[0];

      let externalTxn;
      if (category === 'refund') {
        externalTxn = await createCreditMemo(qbo, {
          customerId: customer.Id,
          amount,
          description,
          accountId: mapping.external_account_id,
          txnDate
        });
      } else {
        externalTxn = await createSalesReceipt(qbo, {
          customerId: customer.Id,
          amount,
          description,
          accountId: mapping.external_account_id,
          txnDate,
          paymentRefNum: payment.payment_intent_id || payment.id.substring(0, 8)
        });
      }

      succeeded.push(payment.id);
      payment._externalId = externalTxn.Id;
      payment._externalNumber = externalTxn.DocNumber;

      console.log(`[QB] Successfully synced payment ${payment.id} as ${externalTxn.DocNumber}`);

    } catch (error: any) {
      console.error(`[QB] Error syncing payment ${payment.id}:`, error);
      failed.push({
        paymentId: payment.id,
        error: error.message || 'Unknown error'
      });
    }
  }

  return { succeeded, failed };
}

/**
 * Sync payments to Xero (placeholder for Phase 6)
 */
async function syncToXero(
  integrationId: string,
  categorizedPayments: any[],
  accountMappings: any[]
): Promise<{
  succeeded: string[];
  failed: Array<{ paymentId: string; error: string }>;
}> {
  throw new Error('Xero integration not yet implemented');
}

/**
 * Sync to external provider
 */
async function syncToProvider(
  provider: Provider,
  integrationId: string,
  categorizedPayments: any[],
  accountMappings: any[]
): Promise<{
  succeeded: string[];
  failed: Array<{ paymentId: string; error: string }>;
}> {
  if (provider === 'quickbooks') {
    return syncToQuickBooks(integrationId, categorizedPayments, accountMappings);
  } else if (provider === 'xero') {
    return syncToXero(integrationId, categorizedPayments, accountMappings);
  } else {
    throw new Error(`Unsupported provider: ${provider}`);
  }
}

/**
 * Handle POST - Manual sync trigger
 */
async function handleManualSync(req: VercelRequest, userId: string): Promise<{ status: number; body: any }> {
  const { provider, limit = 100 } = req.body;

  if (!provider || !['quickbooks', 'xero'].includes(provider)) {
    return {
      status: 400,
      body: { error: 'Invalid provider. Must be "quickbooks" or "xero"' }
    };
  }

  console.log(`[Sync] Starting manual sync for ${provider}...`);

  const active = await isProviderActive(provider);
  if (!active) {
    return {
      status: 400,
      body: { error: `${provider} integration is not active. Please connect first.` }
    };
  }

  const integration = await getIntegration(provider);
  if (!integration) {
    return {
      status: 400,
      body: { error: `${provider} integration not found` }
    };
  }

  const accountMappings = await getAccountMappings(provider);
  if (accountMappings.length === 0) {
    return {
      status: 400,
      body: { error: 'No account mappings configured. Please map revenue categories to accounts first.' }
    };
  }

  const requiredCategories = [
    'day_pass',
    'service_pt',
    'service_specialty_class',
    'service_sports_massage',
    'service_nutrition',
    'service_physio',
    'refund'
  ];
  const validation = await validateAccountMappings(provider, requiredCategories as any);
  if (!validation.valid) {
    return {
      status: 400,
      body: { error: `Missing account mappings for categories: ${validation.missing.join(', ')}` }
    };
  }

  const syncLogId = await createSyncLog(provider, 'manual', userId);
  console.log(`[Sync] Created sync log: ${syncLogId}`);

  const payments = await getUnsyncedPayments(provider, limit);
  console.log(`[Sync] Found ${payments.length} unsynced payments`);

  if (payments.length === 0) {
    await completeSyncLog(syncLogId, 'completed', 0, 0, 0);
    await updateIntegrationLastSync(provider, 'success');
    return {
      status: 200,
      body: {
        syncLogId,
        status: 'completed',
        message: 'No unsynced payments found',
        attempted: 0,
        succeeded: 0,
        failed: 0,
        errors: []
      }
    };
  }

  const categorizedPayments = categorizePayments(payments);
  console.log(`[Sync] Categorized ${categorizedPayments.length} payments`);

  const unsyncedCategorized = [];
  for (const cp of categorizedPayments) {
    const alreadySynced = await isPaymentSynced(cp.payment.id, provider);
    if (!alreadySynced) {
      unsyncedCategorized.push(cp);
    } else {
      console.log(`[Sync] Skipping already-synced payment: ${cp.payment.id}`);
    }
  }

  console.log(`[Sync] Processing ${unsyncedCategorized.length} payments after idempotency check`);

  await updateSyncLog(syncLogId, {
    transactions_attempted: unsyncedCategorized.length
  });

  const { succeeded, failed } = await syncToProvider(
    provider,
    integration.id,
    unsyncedCategorized,
    accountMappings
  );

  console.log(`[Sync] Sync complete: ${succeeded.length} succeeded, ${failed.length} failed`);

  for (const paymentId of succeeded) {
    const payment = unsyncedCategorized.find(cp => cp.payment.id === paymentId)?.payment;
    if (payment) {
      await markPaymentSynced(paymentId, provider);

      await recordSyncedTransaction(
        paymentId,
        provider,
        payment._externalId,
        payment._externalNumber,
        syncLogId,
        payment.amount
      );
    }
  }

  let status: 'completed' | 'partial' | 'failed';
  if (failed.length === 0) {
    status = 'completed';
  } else if (succeeded.length > 0) {
    status = 'partial';
  } else {
    status = 'failed';
  }

  const errorMessage = failed.length > 0
    ? `${failed.length} transactions failed to sync`
    : undefined;

  await completeSyncLog(
    syncLogId,
    status,
    unsyncedCategorized.length,
    succeeded.length,
    failed.length,
    errorMessage
  );

  await updateIntegrationLastSync(
    provider,
    status === 'failed' ? 'error' : 'success',
    errorMessage
  );

  const result: SyncResult = {
    syncLogId,
    status,
    attempted: unsyncedCategorized.length,
    succeeded: succeeded.length,
    failed: failed.length,
    errors: failed
  };

  console.log(`[Sync] Final result:`, result);

  return {
    status: 200,
    body: result
  };
}

/**
 * Handle GET - Sync status check
 */
async function handleSyncStatus(req: VercelRequest): Promise<{ status: number; body: any }> {
  const { syncLogId } = req.query;

  if (!syncLogId || typeof syncLogId !== 'string') {
    return {
      status: 400,
      body: { error: 'Missing or invalid syncLogId parameter' }
    };
  }

  const { data: syncLog, error } = await supabase
    .from('accounting_sync_logs')
    .select('*')
    .eq('id', syncLogId)
    .single();

  if (error || !syncLog) {
    return {
      status: 404,
      body: { error: 'Sync log not found' }
    };
  }

  let errorDetails = null;
  if (syncLog.transactions_failed > 0) {
    const { data: failedTransactions } = await supabase
      .from('accounting_synced_transactions')
      .select('payment_id, sync_error')
      .eq('sync_log_id', syncLogId)
      .not('sync_error', 'is', null);

    errorDetails = failedTransactions || [];
  }

  return {
    status: 200,
    body: {
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
    }
  };
}

/**
 * Main handler
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const userId = await verifyAdmin(req.headers.authorization);
    if (!userId) {
      return res.status(403).json({ error: 'Unauthorized - Admin access required' });
    }

    let result;
    if (req.method === 'POST') {
      result = await handleManualSync(req, userId);
    } else if (req.method === 'GET') {
      result = await handleSyncStatus(req);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    return res.status(result.status).json(result.body);

  } catch (error: any) {
    console.error('[Sync] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}
