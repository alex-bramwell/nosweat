import { useState, useEffect, useCallback } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { authFetch } from '../../lib/auth';
import { Button, Card, StatusBadge, DetailGrid } from '../common';
import type { BadgeVariant, DetailGridItem } from '../common';
import styles from './StripeConnectPanel.module.scss';

const statusConfig: Record<string, { label: string; variant: BadgeVariant; description: string }> = {
  not_started: {
    label: 'Not Connected',
    variant: 'default',
    description: 'Connect your Stripe account to receive payments from members.',
  },
  onboarding: {
    label: 'Onboarding',
    variant: 'warning',
    description: 'Your Stripe account setup is in progress. Continue onboarding to start accepting payments.',
  },
  active: {
    label: 'Active',
    variant: 'success',
    description: 'Your Stripe account is connected and ready to accept payments.',
  },
  restricted: {
    label: 'Restricted',
    variant: 'warning',
    description: 'Your Stripe account has restrictions. Please complete any pending requirements.',
  },
  disabled: {
    label: 'Disabled',
    variant: 'error',
    description: 'Your Stripe account has been disabled. Please contact support.',
  },
};

/**
 * Lets a gym owner connect their own Stripe account (Stripe Connect) so member
 * payments - memberships, day passes, trials and service bookings - are paid
 * directly to them. Until this is active, those payments cannot be collected.
 */
const StripeConnectPanel: React.FC = () => {
  const { gym, refreshTenant } = useTenant();
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [accountStatus, setAccountStatus] = useState<{
    chargesEnabled?: boolean;
    payoutsEnabled?: boolean;
    detailsSubmitted?: boolean;
  } | null>(null);

  const status = gym?.stripe_account_status || 'not_started';

  // Fetch live account status from Stripe when gym has an account
  useEffect(() => {
    if (!gym?.stripe_account_id) return;

    const fetchStatus = async () => {
      try {
        const data = await authFetch('/api/connect/account-status', { gymId: gym.id });
        setAccountStatus(data as { chargesEnabled?: boolean; payoutsEnabled?: boolean; detailsSubmitted?: boolean });
      } catch {
        // Silently fail - DB status is still shown
      }
    };
    fetchStatus();
  }, [gym?.stripe_account_id, gym?.id]);

  const handleStartOnboarding = useCallback(async () => {
    if (!gym) return;
    setConnectLoading(true);
    setConnectError(null);

    try {
      // Step 1: Create Connect account if none exists
      if (!gym.stripe_account_id) {
        await authFetch('/api/connect/create-account', { gymId: gym.id });
        await refreshTenant();
      }

      // Step 2: Get onboarding link
      const { url } = await authFetch<{ url: string }>('/api/connect/onboarding-link', { gymId: gym.id });
      window.location.href = url;
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setConnectLoading(false);
    }
  }, [gym, refreshTenant]);

  const handleOpenDashboard = useCallback(async () => {
    if (!gym) return;
    setConnectLoading(true);
    setConnectError(null);

    try {
      const { url } = await authFetch<{ url: string }>('/api/connect/dashboard-link', { gymId: gym.id });
      window.open(url, '_blank');
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setConnectLoading(false);
    }
  }, [gym]);

  const config = statusConfig[status] || statusConfig.not_started;

  const detailItems: DetailGridItem[] = accountStatus && status === 'active'
    ? [
        { label: 'Charges', value: accountStatus.chargesEnabled ? 'Enabled' : 'Disabled', status: accountStatus.chargesEnabled ? 'enabled' : 'disabled' },
        { label: 'Payouts', value: accountStatus.payoutsEnabled ? 'Enabled' : 'Disabled', status: accountStatus.payoutsEnabled ? 'enabled' : 'disabled' },
      ]
    : [];

  return (
    <Card className={styles.settingsSection}>
      <div className={styles.connectHeader}>
        <h2 className={styles.settingsSectionTitle}>Payments</h2>
        <StatusBadge label={config.label} variant={config.variant} />
      </div>

      <p className={styles.connectDescription}>{config.description}</p>

      {status !== 'active' && (
        <div className={styles.connectIntro}>
          <span className={styles.connectIntroIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </span>
          <span className={styles.connectIntroText}>
            <strong>How getting paid works</strong>
            <span>
              No Sweat uses Stripe to take payments. Connect your account once and
              every membership, day pass, trial and service booking is paid straight
              to your bank. Stripe handles the card processing and security; you keep
              the money and can open your Stripe dashboard any time. Setup takes a few
              minutes and you will need your bank details to hand.
            </span>
          </span>
        </div>
      )}

      {detailItems.length > 0 && <DetailGrid items={detailItems} />}

      {connectError && <div className={styles.connectError}>{connectError}</div>}

      <div className={styles.connectActions}>
        {(status === 'not_started' || status === 'onboarding' || status === 'restricted') && (
          <Button onClick={handleStartOnboarding} disabled={connectLoading}>
            {connectLoading
              ? 'Loading...'
              : status === 'not_started'
                ? 'Connect Stripe Account'
                : 'Continue Setup'}
          </Button>
        )}

        {status === 'active' && (
          <Button onClick={handleOpenDashboard} disabled={connectLoading} variant="secondary">
            {connectLoading ? 'Loading...' : 'Open Stripe Dashboard'}
          </Button>
        )}
      </div>
    </Card>
  );
};

export default StripeConnectPanel;
