/**
 * Accounting Integration Service
 * Handles API calls for QuickBooks/Xero integration
 */

import { supabase } from '../lib/supabase';

export interface AccountingIntegration {
  id: string;
  provider: 'quickbooks' | 'xero';
  status: 'active' | 'disconnected' | 'error' | 'expired';
  companyName: string | null;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  lastError: string | null;
  autoSyncEnabled: boolean;
  syncFrequencyMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface SyncResult {
  syncLogId: string;
  status: 'in_progress' | 'completed' | 'partial' | 'failed';
  attempted: number;
  succeeded: number;
  failed: number;
  errors: Array<{
    paymentId: string;
    error: string;
  }>;
}

export interface SyncStatus {
  syncLogId: string;
  provider: string;
  syncType: string;
  status: 'in_progress' | 'completed' | 'partial' | 'failed';
  startedAt: string;
  completedAt: string | null;
  durationSeconds: number | null;
  attempted: number;
  succeeded: number;
  failed: number;
  errorMessage: string | null;
  errorDetails: any;
  dateRangeStart: string | null;
  dateRangeEnd: string | null;
  triggeredBy: string | null;
}

/**
 * Get all accounting integrations
 */
export async function getIntegrations(): Promise<AccountingIntegration[]> {
  const { data, error } = await supabase
    .from('accounting_integrations')
    .select('*')
    .order('provider');

  if (error) {
    console.error('Error fetching integrations:', error);
    throw new Error('Failed to fetch accounting integrations');
  }

  return data.map(row => ({
    id: row.id,
    provider: row.provider,
    status: row.status,
    companyName: row.company_name,
    lastSyncAt: row.last_sync_at,
    lastSyncStatus: row.last_sync_status,
    lastError: row.last_error,
    autoSyncEnabled: row.auto_sync_enabled,
    syncFrequencyMinutes: row.sync_frequency_minutes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Initiate OAuth connection to QuickBooks or Xero
 * Returns authorization URL to redirect user to
 */
export async function connectProvider(
  provider: 'quickbooks' | 'xero'
): Promise<string> {
  // Get current user's access token
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Not authenticated');
  }

  // Call backend API to get authorization URL
  const response = await fetch('/api/accounting/connect', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      provider,
      redirectUrl: window.location.origin + '/coach-dashboard'
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to initiate OAuth connection');
  }

  const data = await response.json();
  return data.authorizationUrl;
}

/**
 * Disconnect from QuickBooks or Xero
 * Revokes OAuth tokens and removes integration
 */
export async function disconnectProvider(
  provider: 'quickbooks' | 'xero'
): Promise<void> {
  // Get current user's access token
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Not authenticated');
  }

  // Call backend API to disconnect
  const response = await fetch('/api/accounting/disconnect', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ provider }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to disconnect integration');
  }
}

/**
 * Handle OAuth callback result
 * Checks URL parameters for success/error after OAuth redirect
 */
export function handleOAuthCallback(): {
  success: boolean;
  provider?: 'quickbooks' | 'xero';
  error?: string;
} {
  const params = new URLSearchParams(window.location.search);

  const accountingParam = params.get('accounting');
  const statusParam = params.get('status');
  const errorMessage = params.get('message');

  // Clean up URL parameters
  if (accountingParam || statusParam || errorMessage) {
    window.history.replaceState({}, '', window.location.pathname);
  }

  if (statusParam === 'connected' && accountingParam) {
    return {
      success: true,
      provider: accountingParam as 'quickbooks' | 'xero',
    };
  }

  if (accountingParam === 'error' && errorMessage) {
    return {
      success: false,
      error: decodeURIComponent(errorMessage),
    };
  }

  return { success: false };
}

/**
 * Trigger a manual sync of payments to QuickBooks or Xero
 */
export async function triggerManualSync(
  provider: 'quickbooks' | 'xero',
  limit: number = 100
): Promise<SyncResult> {
  // Get current user's access token
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Not authenticated');
  }

  // Call backend API to trigger sync
  const response = await fetch('/api/accounting/sync/manual', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      provider,
      limit
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to trigger sync');
  }

  return await response.json();
}

/**
 * Get the status of a sync operation
 */
export async function getSyncStatus(syncLogId: string): Promise<SyncStatus> {
  // Get current user's access token
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Not authenticated');
  }

  // Call backend API to get status
  const response = await fetch(`/api/accounting/sync/status?syncLogId=${syncLogId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to get sync status');
  }

  return await response.json();
}

export const accountingService = {
  getIntegrations,
  connectProvider,
  disconnectProvider,
  handleOAuthCallback,
  triggerManualSync,
  getSyncStatus,
};
