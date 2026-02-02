import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, Button } from '../common';
import { SyncDashboard } from './SyncDashboard';
import styles from './AccountingIntegration.module.scss';

export interface AccountingIntegration {
  id: string;
  provider: 'quickbooks' | 'xero';
  status: 'active' | 'disconnected' | 'error' | 'expired';
  companyName: string | null;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  lastError: string | null;
}

interface AccountingIntegrationCardProps {
  provider: 'quickbooks' | 'xero';
  integration: AccountingIntegration | null;
  onConnect: (provider: 'quickbooks' | 'xero') => Promise<void>;
  onDisconnect: (provider: 'quickbooks' | 'xero') => Promise<void>;
  loading: boolean;
}

export const AccountingIntegrationCard = ({
  provider,
  integration,
  onConnect,
  onDisconnect,
  loading
}: AccountingIntegrationCardProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const providerName = provider === 'quickbooks' ? 'QuickBooks' : 'Xero';
  const isConnected = integration?.status === 'active';
  const hasError = integration?.status === 'error' || integration?.status === 'expired';

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await onConnect(provider);
    } catch (error) {
      console.error('Connection error:', error);
      alert(`Failed to connect to ${providerName}. Please try again.`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm(`Are you sure you want to disconnect from ${providerName}?`)) {
      return;
    }

    setIsDisconnecting(true);
    try {
      await onDisconnect(provider);
    } catch (error) {
      console.error('Disconnect error:', error);
      alert(`Failed to disconnect from ${providerName}. Please try again.`);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const getStatusBadge = () => {
    if (!integration) {
      return <span className={`${styles.statusBadge} ${styles.disconnected}`}>Not Connected</span>;
    }

    switch (integration.status) {
      case 'active':
        return <span className={`${styles.statusBadge} ${styles.active}`}>Connected</span>;
      case 'error':
        return <span className={`${styles.statusBadge} ${styles.error}`}>Error</span>;
      case 'expired':
        return <span className={`${styles.statusBadge} ${styles.expired}`}>Expired</span>;
      case 'disconnected':
      default:
        return <span className={`${styles.statusBadge} ${styles.disconnected}`}>Disconnected</span>;
    }
  };

  const formatLastSync = (lastSyncAt: string | null) => {
    if (!lastSyncAt) return 'Never';

    const date = new Date(lastSyncAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  };

  return (
    <Card variant="default">
      <div className={styles.integrationCard}>
        <div className={styles.integrationHeader}>
          <div className={styles.providerInfo}>
            <div className={styles.providerIcon}>
              <img
                src={provider === 'quickbooks' ? '/images/quickbooks-logo.svg' : '/images/xero-logo.svg'}
                alt={providerName}
                className={styles.providerLogo}
              />
            </div>
            <div>
              <h3 className={styles.providerName}>{providerName}</h3>
              {integration?.companyName && (
                <p className={styles.companyName}>{integration.companyName}</p>
              )}
            </div>
          </div>
          {getStatusBadge()}
        </div>

        <div className={styles.integrationBody}>
          {isConnected && (
            <>
              <SyncDashboard
                provider={provider}
                lastSyncAt={integration.lastSyncAt}
                lastSyncStatus={integration.lastSyncStatus}
                isActive={isConnected}
              />
            </>
          )}

          {hasError && integration?.lastError && (
            <div className={styles.errorMessage}>
              <strong>Connection Error:</strong> {integration.lastError}
            </div>
          )}

          {!isConnected && !hasError && (
            <p className={styles.description}>
              Connect your {providerName} account to automatically sync payment transactions
              for accounting reconciliation.
            </p>
          )}
        </div>

        <div className={styles.integrationActions}>
          {isConnected ? (
            <Button
              variant="secondary"
              onClick={handleDisconnect}
              disabled={isDisconnecting || loading}
            >
              {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleConnect}
              disabled={isConnecting || loading}
            >
              {isConnecting ? 'Connecting...' : `Connect to ${providerName}`}
            </Button>
          )}

          {hasError && (
            <Button
              variant="primary"
              onClick={handleConnect}
              disabled={isConnecting || loading}
            >
              {isConnecting ? 'Reconnecting...' : 'Reconnect'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
