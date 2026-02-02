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
import {
  createQBClient,
  getOrCreateCustomer,
  createSalesReceipt,
  createCreditMemo
} from '../../services/quickbooksService';

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

  // Create QuickBooks client
  const qbo = await createQBClient(integrationId);

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

      console.log(`[QB] Syncing payment ${payment.id}:`, {
        amount: payment.amount / 100,
        category,
        description,
        accountId: mapping.external_account_id
      });

      // Get user info for customer
      const { data: userData } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', payment.user_id)
        .single();

      const email = userData?.email || 'unknown@example.com';
      const displayName = userData?.full_name || 'Unknown Customer';

      // Get or create customer in QuickBooks
      const customer = await getOrCreateCustomer(qbo, email, displayName);

      // Convert amount from cents to dollars
      const amount = payment.amount / 100;
      const txnDate = new Date(payment.created_at).toISOString().split('T')[0];

      let externalTxn;
      if (category === 'refund') {
        // Create credit memo for refunds
        externalTxn = await createCreditMemo(qbo, {
          customerId: customer.Id,
          amount,
          description,
          accountId: mapping.external_account_id,
          txnDate
        });
      } else {
        // Create sales receipt for payments
        externalTxn = await createSalesReceipt(qbo, {
          customerId: customer.Id,
          amount,
          description,
          accountId: mapping.external_account_id,
          txnDate,
          paymentRefNum: payment.payment_intent_id || payment.id.substring(0, 8)
        });
      }

      // Store result
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
  // TODO: Implement Xero integration in Phase 6
  throw new Error('Xero integration not yet implemented');
}

/**
 * Sync to external provider (routes to appropriate service)
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

    // Sync to external provider
    const { succeeded, failed } = await syncToProvider(
      provider,
      integration.id,
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
          payment._externalId,
          payment._externalNumber,
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
