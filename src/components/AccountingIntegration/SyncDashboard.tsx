/**
 * Sync Dashboard Component
 * Allows admin to trigger manual sync and view sync status
 */

import React, { useState } from 'react';
import { accountingService, SyncResult } from '../../services/accountingService';
import styles from './AccountingIntegration.module.scss';

interface SyncDashboardProps {
  provider: 'quickbooks' | 'xero';
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  isActive: boolean;
}

export const SyncDashboard: React.FC<SyncDashboardProps> = ({
  provider,
  lastSyncAt,
  lastSyncStatus,
  isActive
}) => {
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const providerName = provider === 'quickbooks' ? 'QuickBooks' : 'Xero';

  const handleManualSync = async () => {
    if (!isActive) {
      setError(`Please connect to ${providerName} first`);
      return;
    }

    setSyncing(true);
    setError(null);
    setSyncResult(null);

    try {
      const result = await accountingService.triggerManualSync(provider);
      setSyncResult(result);

      // Refresh integrations after sync
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (err: any) {
      console.error('Sync error:', err);
      setError(err.message || 'Failed to sync');
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getSyncStatusBadge = (status: string | null) => {
    if (!status) return null;

    let badgeClass = styles.statusBadge;
    switch (status) {
      case 'success':
      case 'completed':
        badgeClass += ` ${styles.active}`;
        break;
      case 'error':
      case 'failed':
        badgeClass += ` ${styles.error}`;
        break;
      case 'partial':
        badgeClass += ` ${styles.expired}`;
        break;
      default:
        badgeClass += ` ${styles.disconnected}`;
    }

    return <span className={badgeClass}>{status}</span>;
  };

  return (
    <div className={styles.syncDashboard}>
      <div className={styles.syncHeader}>
        <h3>Sync Status</h3>
      </div>

      <div className={styles.syncInfo}>
        <div className={styles.syncInfoItem}>
          <span className={styles.label}>Last Sync:</span>
          <span className={styles.value}>{formatDate(lastSyncAt)}</span>
        </div>
        {lastSyncStatus && (
          <div className={styles.syncInfoItem}>
            <span className={styles.label}>Status:</span>
            {getSyncStatusBadge(lastSyncStatus)}
          </div>
        )}
      </div>

      {error && (
        <div className={styles.errorMessage}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {syncResult && (
        <div className={styles.syncResultBox}>
          <h4>Sync Complete</h4>
          <div className={styles.syncStats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{syncResult.attempted}</span>
              <span className={styles.statLabel}>Attempted</span>
            </div>
            <div className={styles.stat}>
              <span className={`${styles.statValue} ${styles.success}`}>
                {syncResult.succeeded}
              </span>
              <span className={styles.statLabel}>Succeeded</span>
            </div>
            <div className={styles.stat}>
              <span className={`${styles.statValue} ${styles.failed}`}>
                {syncResult.failed}
              </span>
              <span className={styles.statLabel}>Failed</span>
            </div>
          </div>

          {syncResult.errors.length > 0 && (
            <div className={styles.syncErrors}>
              <h5>Errors:</h5>
              <ul>
                {syncResult.errors.map((err, idx) => (
                  <li key={idx}>
                    Payment {err.paymentId.substring(0, 8)}...: {err.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className={styles.syncActions}>
        <button
          className={styles.syncButton}
          onClick={handleManualSync}
          disabled={syncing || !isActive}
        >
          {syncing ? (
            <>
              <span className={styles.spinner}></span>
              Syncing...
            </>
          ) : (
            'Sync Now'
          )}
        </button>
        {!isActive && (
          <p className={styles.helpText}>
            Connect to {providerName} to enable manual sync
          </p>
        )}
      </div>
    </div>
  );
};
