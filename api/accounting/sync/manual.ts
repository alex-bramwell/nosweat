/**
 * Manual Sync Endpoint
 * Triggers a manual sync of payments to QuickBooks/Xero
 * POST /api/accounting/sync/manual
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
} from '../../../src/services/accountingSyncService';

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

  // Verify JWT and get user
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return null;
  }

  // Check if user has admin role
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
 * Mock sync to external provider
 * TODO: Replace with actual QuickBooks/Xero API calls in Phase 3
 */
async function syncToProvider(
  provider: Provider,
  categorizedPayments: any[],
  accountMappings: any[]
): Promise<{
  succeeded: string[];
  failed: Array<{ paymentId: string; error: string }>;
}> {
  const succeeded: string[] = [];
  const failed: Array<{ paymentId: string; error: string }> = [];

  for (const { payment, category, description } of categorizedPayments) {
    try {
      // Find account mapping for this category
      const mapping = accountMappings.find(m => m.revenue_category === category);

      if (!mapping) {
        failed.push({
          paymentId: payment.id,
          error: `No account mapping found for category: ${category}`
        });
        continue;
      }

      // TODO Phase 3: Replace with actual API calls
      // For now, simulate successful sync
      console.log(`[MOCK] Syncing payment ${payment.id} to ${provider}:`, {
        amount: payment.amount,
        category,
        description,
        accountId: mapping.external_account_id,
        accountName: mapping.external_account_name
      });

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 100));

      // Mock external transaction ID
      const externalTransactionId = `${provider.toUpperCase()}-${Date.now()}-${payment.id.substring(0, 8)}`;
      const externalTransactionNumber = `TXN-${Math.floor(Math.random() * 10000)}`;

      // Store result (this is real, not mocked)
      succeeded.push(payment.id);

      // Return mock result
      payment._mockExternalId = externalTransactionId;
      payment._mockExternalNumber = externalTransactionNumber;

    } catch (error: any) {
      console.error(`Error syncing payment ${payment.id}:`, error);
      failed.push({
        paymentId: payment.id,
        error: error.message || 'Unknown error'
      });
    }
  }

  return { succeeded, failed };
}

/**
 * Main handler
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify admin authentication
    const userId = await verifyAdmin(req.headers.authorization);
    if (!userId) {
      return res.status(403).json({ error: 'Unauthorized - Admin access required' });
    }

    // Parse request body
    const { provider, limit = 100 } = req.body;

    // Validate provider
    if (!provider || !['quickbooks', 'xero'].includes(provider)) {
      return res.status(400).json({
        error: 'Invalid provider. Must be "quickbooks" or "xero"'
      });
    }

    console.log(`[Sync] Starting manual sync for ${provider}...`);

    // Check if provider is active
    const active = await isProviderActive(provider);
    if (!active) {
      return res.status(400).json({
        error: `${provider} integration is not active. Please connect first.`
      });
    }

    // Get integration details
    const integration = await getIntegration(provider);
    if (!integration) {
      return res.status(400).json({
        error: `${provider} integration not found`
      });
    }

    // Get account mappings
    const accountMappings = await getAccountMappings(provider);
    if (accountMappings.length === 0) {
      return res.status(400).json({
        error: 'No account mappings configured. Please map revenue categories to accounts first.'
      });
    }

    // Validate required mappings exist
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
      return res.status(400).json({
        error: `Missing account mappings for categories: ${validation.missing.join(', ')}`
      });
    }

    // Create sync log
    const syncLogId = await createSyncLog(provider, 'manual', userId);
    console.log(`[Sync] Created sync log: ${syncLogId}`);

    // Fetch unsynced payments
    const payments = await getUnsyncedPayments(provider, limit);
    console.log(`[Sync] Found ${payments.length} unsynced payments`);

    if (payments.length === 0) {
      await completeSyncLog(syncLogId, 'completed', 0, 0, 0);
      await updateIntegrationLastSync(provider, 'success');
      return res.status(200).json({
        syncLogId,
        status: 'completed',
        message: 'No unsynced payments found',
        attempted: 0,
        succeeded: 0,
        failed: 0,
        errors: []
      });
    }

    // Categorize payments
    const categorizedPayments = categorizePayments(payments);
    console.log(`[Sync] Categorized ${categorizedPayments.length} payments`);

    // Filter out already-synced payments (double-check idempotency)
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

    // Update sync log with attempt count
    await updateSyncLog(syncLogId, {
      transactions_attempted: unsyncedCategorized.length
    });

    // Sync to external provider (mocked for now)
    const { succeeded, failed } = await syncToProvider(
      provider,
      unsyncedCategorized,
      accountMappings
    );

    console.log(`[Sync] Sync complete: ${succeeded.length} succeeded, ${failed.length} failed`);

    // Mark successful payments as synced
    for (const paymentId of succeeded) {
      const payment = unsyncedCategorized.find(cp => cp.payment.id === paymentId)?.payment;
      if (payment) {
        await markPaymentSynced(paymentId, provider);

        // Record synced transaction
        await recordSyncedTransaction(
          paymentId,
          provider,
          payment._mockExternalId,
          payment._mockExternalNumber,
          syncLogId,
          payment.amount
        );
      }
    }

    // Determine final status
    let status: 'completed' | 'partial' | 'failed';
    if (failed.length === 0) {
      status = 'completed';
    } else if (succeeded.length > 0) {
      status = 'partial';
    } else {
      status = 'failed';
    }

    // Complete sync log
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

    // Update integration last sync
    await updateIntegrationLastSync(
      provider,
      status === 'failed' ? 'error' : 'success',
      errorMessage
    );

    // Return result
    const result: SyncResult = {
      syncLogId,
      status,
      attempted: unsyncedCategorized.length,
      succeeded: succeeded.length,
      failed: failed.length,
      errors: failed
    };

    console.log(`[Sync] Final result:`, result);

    return res.status(200).json(result);

  } catch (error: any) {
    console.error('[Sync] Fatal error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}
