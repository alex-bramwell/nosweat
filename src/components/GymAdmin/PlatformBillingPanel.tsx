import React, { useState } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button, StatusBadge, DetailGrid, InfoBox } from '../common';
import type { BadgeVariant } from '../common';
import { useMessage } from '../../hooks/useMessage';
import { getLocalizedPrice, getPriceByStripeId } from '../../utils/pricing';
import { platformSubscriptionService } from '../../services/platformSubscriptionService';
import styles from './PlatformBillingPanel.module.scss';

const formatDate = (iso: string | null): string =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
    : '-';

const PlatformBillingPanel: React.FC = () => {
  const { gym } = useTenant();
  const { user } = useAuth();
  const { message, showSuccess, showError } = useMessage();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Local mirror of the subscription state so the UI updates instantly after a
  // cancel/resume without waiting for a full tenant refetch.
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(
    gym?.subscription_cancel_at_period_end ?? false
  );
  const [periodEnd, setPeriodEnd] = useState(gym?.subscription_current_period_end ?? null);
  const [status, setStatus] = useState(gym?.subscription_status ?? null);

  if (!gym) return null;

  const isSubscribed =
    Boolean(gym.stripe_subscription_id) &&
    (status === 'active' || status === 'past_due' || status === 'trialing');
  const plan = getPriceByStripeId(gym.stripe_price_id) ?? getLocalizedPrice();
  const planLabel = `noSweat Platform - ${plan.formatted}${plan.period}`;

  const subscribeHref = `/subscribe?email=${encodeURIComponent(
    user?.email ?? gym.contact_email ?? ''
  )}&uid=${gym.owner_id ?? ''}`;

  const badge = ((): { label: string; variant: BadgeVariant } => {
    if (!isSubscribed) return { label: 'Not subscribed', variant: 'warning' };
    if (cancelAtPeriodEnd) return { label: 'Ending', variant: 'warning' };
    if (status === 'past_due') return { label: 'Past due', variant: 'error' };
    return { label: 'Active', variant: 'success' };
  })();

  const handleCancel = async () => {
    setBusy(true);
    try {
      const r = await platformSubscriptionService.cancel(gym.id);
      setCancelAtPeriodEnd(r.cancelAtPeriodEnd);
      setPeriodEnd(r.currentPeriodEnd);
      setStatus(r.status);
      setConfirming(false);
      showSuccess(`Subscription cancelled. You keep full access until ${formatDate(r.currentPeriodEnd)}.`);
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Could not cancel subscription');
    } finally {
      setBusy(false);
    }
  };

  const handleResume = async () => {
    setBusy(true);
    try {
      const r = await platformSubscriptionService.resume(gym.id);
      setCancelAtPeriodEnd(r.cancelAtPeriodEnd);
      setStatus(r.status);
      showSuccess('Subscription resumed. Billing will continue as normal.');
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Could not resume subscription');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.billingPanel}>
      <div className={styles.panelHeader}>
        <h2>noSweat Subscription</h2>
        <p>Manage your platform plan and billing.</p>
      </div>

      {message && (
        <div className={message.type === 'success' ? styles.feedbackSuccess : styles.feedbackError}>
          {message.text}
        </div>
      )}

      <DetailGrid
        items={[
          { label: 'Plan', value: planLabel },
          { label: 'Status', value: <StatusBadge label={badge.label} variant={badge.variant} /> },
          ...(isSubscribed
            ? [{ label: cancelAtPeriodEnd ? 'Access until' : 'Renews on', value: formatDate(periodEnd) }]
            : []),
        ]}
      />

      {isSubscribed ? (
        cancelAtPeriodEnd ? (
          <>
            <InfoBox variant="accent" title="Subscription ending">
              Your subscription is set to end on {formatDate(periodEnd)}. You keep full access until
              then and you will not be billed again. Changed your mind? You can resume any time before
              it ends.
            </InfoBox>
            <Button variant="primary" onClick={handleResume} disabled={busy}>
              {busy ? 'Resuming...' : 'Resume subscription'}
            </Button>
          </>
        ) : confirming ? (
          <InfoBox title="Cancel your subscription?">
            <p className={styles.confirmText}>
              You will keep full access until {formatDate(periodEnd)}, and you will not be billed again
              after that.
            </p>
            <div className={styles.confirmActions}>
              <Button variant="outline" onClick={() => setConfirming(false)} disabled={busy}>
                Keep subscription
              </Button>
              <Button variant="secondary" onClick={handleCancel} disabled={busy}>
                {busy ? 'Cancelling...' : 'Yes, cancel'}
              </Button>
            </div>
          </InfoBox>
        ) : (
          <Button variant="outline" onClick={() => setConfirming(true)} disabled={busy}>
            Cancel subscription
          </Button>
        )
      ) : (
        <>
          <InfoBox variant="accent" title="Subscribe to noSweat">
            Subscribe to keep your gym site live with every feature after your trial. Cancel any time -
            you keep access until the end of the period you have paid for.
          </InfoBox>
          <Button as="a" href={subscribeHref} variant="primary">
            Subscribe
          </Button>
        </>
      )}
    </div>
  );
};

export default PlatformBillingPanel;
