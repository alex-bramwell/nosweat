/**
 * Accounting Sync Service
 * Core business logic for syncing payments to QuickBooks/Xero
 *
 * This service handles:
 * - Transaction categorization
 * - Idempotency checks
 * - Sync orchestration
 * - Error handling and retry logic
 * - Progress tracking
 */

import { supabase } from '../lib/supabase';

// ============================================================================
// Types
// ============================================================================

export type RevenueCategory =
  | 'day_pass'
  | 'service_pt'
  | 'service_specialty_class'
  | 'service_sports_massage'
  | 'service_nutrition'
  | 'service_physio'
  | 'refund';

export type Provider = 'quickbooks' | 'xero';
export type SyncStatus = 'in_progress' | 'completed' | 'partial' | 'failed';
export type SyncType = 'manual' | 'automatic' | 'retry';

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  payment_type: string;
  payment_intent_id: string | null;
  status: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  accounting_synced_qb: boolean;
  accounting_synced_xero: boolean;
  accounting_last_sync_attempt: string | null;
}

export interface SyncLogEntry {
  id: string;
  provider: Provider;
  sync_type: SyncType;
  status: SyncStatus;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  transactions_attempted: number;
  transactions_succeeded: number;
  transactions_failed: number;
  error_message: string | null;
  error_details: any;
  date_range_start: string | null;
  date_range_end: string | null;
  triggered_by: string | null;
}

export interface CategorizedPayment {
  payment: Payment;
  category: RevenueCategory;
  description: string;
}

export interface SyncResult {
  syncLogId: string;
  status: SyncStatus;
  attempted: number;
  succeeded: number;
  failed: number;
  errors: Array<{
    paymentId: string;
    error: string;
  }>;
}

export interface AccountMapping {
  id: string;
  provider: Provider;
  revenue_category: RevenueCategory;
  external_account_id: string;
  external_account_name: string;
  external_account_code: string | null;
  is_active: boolean;
}

// ============================================================================
// Payment Categorization
// ============================================================================

/**
 * Categorize a payment into a revenue category
 */
export function categorizePayment(payment: Payment): CategorizedPayment {
  // Handle refunds
  if (payment.status === 'refunded') {
    return {
      payment,
      category: 'refund',
      description: 'Refund'
    };
  }

  // Day pass bookings
  if (payment.payment_type === 'day-pass') {
    return {
      payment,
      category: 'day_pass',
      description: 'Day Pass'
    };
  }

  // Service bookings - categorize by service type
  if (payment.payment_type === 'service-booking') {
    const serviceType = payment.metadata?.service_type;

    switch (serviceType) {
      case 'pt':
        return {
          payment,
          category: 'service_pt',
          description: 'Personal Training Session'
        };

      case 'specialty_class':
        return {
          payment,
          category: 'service_specialty_class',
          description: 'Specialty Class'
        };

      case 'sports_massage':
        return {
          payment,
          category: 'service_sports_massage',
          description: 'Sports Massage'
        };

      case 'nutrition':
        return {
          payment,
          category: 'service_nutrition',
          description: 'Nutrition Coaching'
        };

      case 'physio':
        return {
          payment,
          category: 'service_physio',
          description: 'Physiotherapy'
        };

      default:
        // Default to PT if service type is unknown
        console.warn(`Unknown service type: ${serviceType}, defaulting to PT`);
        return {
          payment,
          category: 'service_pt',
          description: 'Service Booking'
        };
    }
  }

  // Default fallback - treat as day pass
  console.warn(`Unknown payment type: ${payment.payment_type}, defaulting to day_pass`);
  return {
    payment,
    category: 'day_pass',
    description: 'Payment'
  };
}

/**
 * Batch categorize multiple payments
 */
export function categorizePayments(payments: Payment[]): CategorizedPayment[] {
  return payments.map(categorizePayment);
}

// ============================================================================
// Idempotency Checks
// ============================================================================

/**
 * Check if a payment has already been synced to a provider
 */
export async function isPaymentSynced(
  paymentId: string,
  provider: Provider
): Promise<boolean> {
  const { data, error } = await supabase
    .from('accounting_synced_transactions')
    .select('id')
    .eq('payment_id', paymentId)
    .eq('provider', provider)
    .maybeSingle();

  if (error) {
    console.error('Error checking payment sync status:', error);
    return false;
  }

  return data !== null;
}

/**
 * Get all synced payment IDs for a provider
 */
export async function getSyncedPaymentIds(provider: Provider): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('accounting_synced_transactions')
    .select('payment_id')
    .eq('provider', provider);

  if (error) {
    console.error('Error fetching synced payment IDs:', error);
    return new Set();
  }

  return new Set(data.map(row => row.payment_id));
}

/**
 * Filter out already-synced payments
 */
export async function filterUnsyncedPayments(
  payments: Payment[],
  provider: Provider
): Promise<Payment[]> {
  const syncedIds = await getSyncedPaymentIds(provider);
  return payments.filter(payment => !syncedIds.has(payment.id));
}

// ============================================================================
// Query Payments for Sync
// ============================================================================

/**
 * Get all unsynced payments for a provider
 */
export async function getUnsyncedPayments(
  provider: Provider,
  limit: number = 100
): Promise<Payment[]> {
  const syncedField = provider === 'quickbooks'
    ? 'accounting_synced_qb'
    : 'accounting_synced_xero';

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq(syncedField, false)
    .eq('status', 'succeeded')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching unsynced payments:', error);
    throw new Error(`Failed to fetch unsynced payments: ${error.message}`);
  }

  return data || [];
}

/**
 * Get payments in a date range for sync
 */
export async function getPaymentsInRange(
  provider: Provider,
  startDate: string,
  endDate: string
): Promise<Payment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('status', 'succeeded')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching payments in range:', error);
    throw new Error(`Failed to fetch payments: ${error.message}`);
  }

  // Filter out already-synced payments
  return filterUnsyncedPayments(data || [], provider);
}

// ============================================================================
// Sync Log Management
// ============================================================================

/**
 * Create a new sync log entry
 */
export async function createSyncLog(
  provider: Provider,
  syncType: SyncType,
  userId: string | null = null
): Promise<string> {
  const { data, error } = await supabase
    .from('accounting_sync_logs')
    .insert({
      provider,
      sync_type: syncType,
      status: 'in_progress',
      started_at: new Date().toISOString(),
      triggered_by: userId,
      transactions_attempted: 0,
      transactions_succeeded: 0,
      transactions_failed: 0
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating sync log:', error);
    throw new Error(`Failed to create sync log: ${error.message}`);
  }

  return data.id;
}

/**
 * Update sync log with progress
 */
export async function updateSyncLog(
  syncLogId: string,
  updates: {
    status?: SyncStatus;
    transactions_attempted?: number;
    transactions_succeeded?: number;
    transactions_failed?: number;
    error_message?: string;
    error_details?: any;
    date_range_start?: string;
    date_range_end?: string;
  }
): Promise<void> {
  const updateData: any = { ...updates };

  // Calculate duration if completing
  if (updates.status && updates.status !== 'in_progress') {
    // Fetch started_at time
    const { data: logData } = await supabase
      .from('accounting_sync_logs')
      .select('started_at')
      .eq('id', syncLogId)
      .single();

    if (logData) {
      const startedAt = new Date(logData.started_at);
      const now = new Date();
      updateData.duration_seconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
      updateData.completed_at = now.toISOString();
    }
  }

  const { error } = await supabase
    .from('accounting_sync_logs')
    .update(updateData)
    .eq('id', syncLogId);

  if (error) {
    console.error('Error updating sync log:', error);
    throw new Error(`Failed to update sync log: ${error.message}`);
  }
}

/**
 * Mark sync log as completed
 */
export async function completeSyncLog(
  syncLogId: string,
  status: SyncStatus,
  attempted: number,
  succeeded: number,
  failed: number,
  errorMessage?: string
): Promise<void> {
  await updateSyncLog(syncLogId, {
    status,
    transactions_attempted: attempted,
    transactions_succeeded: succeeded,
    transactions_failed: failed,
    error_message: errorMessage
  });
}

// ============================================================================
// Mark Payments as Synced
// ============================================================================

/**
 * Mark a payment as synced
 */
export async function markPaymentSynced(
  paymentId: string,
  provider: Provider
): Promise<void> {
  const syncedField = provider === 'quickbooks'
    ? 'accounting_synced_qb'
    : 'accounting_synced_xero';

  const { error } = await supabase
    .from('payments')
    .update({
      [syncedField]: true,
      accounting_last_sync_attempt: new Date().toISOString()
    })
    .eq('id', paymentId);

  if (error) {
    console.error('Error marking payment as synced:', error);
    throw new Error(`Failed to mark payment as synced: ${error.message}`);
  }
}

/**
 * Record a synced transaction
 */
export async function recordSyncedTransaction(
  paymentId: string,
  provider: Provider,
  externalTransactionId: string,
  externalTransactionNumber: string | null,
  syncLogId: string,
  amount: number
): Promise<void> {
  const { error } = await supabase
    .from('accounting_synced_transactions')
    .insert({
      provider,
      payment_id: paymentId,
      external_transaction_id: externalTransactionId,
      external_transaction_number: externalTransactionNumber,
      sync_log_id: syncLogId,
      synced_amount: amount,
      synced_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error recording synced transaction:', error);
    throw new Error(`Failed to record synced transaction: ${error.message}`);
  }
}

// ============================================================================
// Account Mappings
// ============================================================================

/**
 * Get account mappings for a provider
 */
export async function getAccountMappings(provider: Provider): Promise<AccountMapping[]> {
  const { data, error } = await supabase
    .from('accounting_account_mappings')
    .select('*')
    .eq('provider', provider)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching account mappings:', error);
    throw new Error(`Failed to fetch account mappings: ${error.message}`);
  }

  return data || [];
}

/**
 * Get account mapping for a specific category
 */
export async function getAccountMapping(
  provider: Provider,
  category: RevenueCategory
): Promise<AccountMapping | null> {
  const { data, error } = await supabase
    .from('accounting_account_mappings')
    .select('*')
    .eq('provider', provider)
    .eq('revenue_category', category)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('Error fetching account mapping:', error);
    return null;
  }

  return data;
}

/**
 * Validate that all required mappings exist
 */
export async function validateAccountMappings(
  provider: Provider,
  categories: RevenueCategory[]
): Promise<{ valid: boolean; missing: RevenueCategory[] }> {
  const mappings = await getAccountMappings(provider);
  const mappedCategories = new Set(mappings.map(m => m.revenue_category));

  const missing = categories.filter(cat => !mappedCategories.has(cat));

  return {
    valid: missing.length === 0,
    missing
  };
}

// ============================================================================
// Integration Status
// ============================================================================

/**
 * Check if a provider integration is active
 */
export async function isProviderActive(provider: Provider): Promise<boolean> {
  const { data, error } = await supabase
    .from('accounting_integrations')
    .select('status')
    .eq('provider', provider)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return data.status === 'active';
}

/**
 * Get integration details
 */
export async function getIntegration(provider: Provider) {
  const { data, error } = await supabase
    .from('accounting_integrations')
    .select('*')
    .eq('provider', provider)
    .maybeSingle();

  if (error) {
    console.error('Error fetching integration:', error);
    return null;
  }

  return data;
}

/**
 * Update integration last sync time
 */
export async function updateIntegrationLastSync(
  provider: Provider,
  status: string,
  error?: string
): Promise<void> {
  const updateData: any = {
    last_sync_at: new Date().toISOString(),
    last_sync_status: status,
    updated_at: new Date().toISOString()
  };

  if (error) {
    updateData.last_error = error;
  } else {
    updateData.last_error = null;
  }

  const { error: updateError } = await supabase
    .from('accounting_integrations')
    .update(updateData)
    .eq('provider', provider);

  if (updateError) {
    console.error('Error updating integration sync time:', error);
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format amount from cents to dollars
 */
export function formatAmount(amountInCents: number): string {
  return (amountInCents / 100).toFixed(2);
}

/**
 * Get date range for sync
 */
export function getDateRange(days: number = 30): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);

  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
}

/**
 * Sleep for retry logic
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Exponential backoff delay
 */
export function getBackoffDelay(attempt: number, baseDelay: number = 1000): number {
  return Math.min(baseDelay * Math.pow(2, attempt), 30000); // Max 30 seconds
}
