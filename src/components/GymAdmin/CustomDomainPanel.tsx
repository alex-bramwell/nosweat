import { useState, useCallback } from 'react';
import { useTenant, useFeature } from '../../contexts/TenantContext';
import { supabase } from '../../lib/supabase';
import { Button, Card } from '../common';
import { FeatureGate } from '../common';
import styles from './GymSettings.module.scss';

async function getAccessToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated');
  return session.access_token;
}

const CustomDomainPanel: React.FC = () => {
  const { gym, refreshTenant } = useTenant();
  const hasFeature = useFeature('custom_domain');
  const [domainInput, setDomainInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dnsInfo, setDnsInfo] = useState<{ type: string; name: string; value: string } | null>(null);

  const status = gym?.custom_domain_status || 'none';
  const currentDomain = gym?.custom_domain;

  const handleAddDomain = useCallback(async () => {
    if (!gym || !domainInput.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const token = await getAccessToken();
      const res = await fetch('/api/domains/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ gymId: gym.id, domain: domainInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add domain');

      setDnsInfo(data.dns);
      setDomainInput('');
      await refreshTenant();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [gym, domainInput, refreshTenant]);

  const handleVerify = useCallback(async () => {
    if (!gym) return;
    setLoading(true);
    setError(null);

    try {
      const token = await getAccessToken();
      const res = await fetch('/api/domains/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ gymId: gym.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification check failed');

      if (data.verified) {
        setDnsInfo(null);
      }
      await refreshTenant();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [gym, refreshTenant]);

  const handleRemove = useCallback(async () => {
    if (!gym) return;
    if (!confirm('Are you sure you want to remove your custom domain? Visitors using this domain will no longer be able to access your site.')) return;

    setLoading(true);
    setError(null);

    try {
      const token = await getAccessToken();
      const res = await fetch('/api/domains/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ gymId: gym.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove domain');

      setDnsInfo(null);
      await refreshTenant();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [gym, refreshTenant]);

  const statusConfig: Record<string, { label: string; className: string; description: string }> = {
    none: {
      label: 'Not Configured',
      className: styles.connectStatusDefault,
      description: 'Connect your own domain so members can visit your gym site directly.',
    },
    pending: {
      label: 'Pending DNS',
      className: styles.connectStatusOnboarding,
      description: 'Your domain has been added. Configure your DNS records below, then click verify.',
    },
    verified: {
      label: 'Active',
      className: styles.connectStatusActive,
      description: 'Your custom domain is live and serving your gym site.',
    },
    failed: {
      label: 'Failed',
      className: styles.connectStatusRestricted,
      description: 'DNS verification failed. Check your DNS records and try again.',
    },
  };

  const config = statusConfig[status] || statusConfig.none;

  if (!hasFeature) return null;

  return (
    <FeatureGate feature="custom_domain">
      <Card className={styles.settingsSection}>
        <div className={styles.connectHeader}>
          <h2 className={styles.settingsSectionTitle}>Custom Domain</h2>
          <span className={`${styles.connectStatusBadge} ${config.className}`}>
            {config.label}
          </span>
        </div>

        <p className={styles.connectDescription}>{config.description}</p>

        {/* Current domain display */}
        {currentDomain && (
          <div className={styles.connectDetails}>
            <div className={styles.connectDetailItem}>
              <span className={styles.connectDetailLabel}>Domain</span>
              <span className={status === 'verified' ? styles.connectEnabled : styles.connectDisabledText}>
                {currentDomain}
              </span>
            </div>
          </div>
        )}

        {/* Free tier URL info */}
        {status === 'none' && gym && (
          <div className={styles.connectDetails}>
            <div className={styles.connectDetailItem}>
              <span className={styles.connectDetailLabel}>Current URL</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>
                nosweat.fitness/gym/{gym.slug}
              </span>
            </div>
          </div>
        )}

        {/* DNS instructions */}
        {(status === 'pending' || status === 'failed') && currentDomain && (
          <div style={{
            background: 'var(--color-bg-light)',
            borderRadius: 'var(--border-radius)',
            padding: '1rem 1.25rem',
            marginTop: '0.5rem',
            fontSize: '0.875rem',
          }}>
            <p style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text)' }}>
              DNS Configuration Required
            </p>
            <p style={{ color: 'var(--color-muted)', marginBottom: '0.75rem' }}>
              Add the following DNS record with your domain registrar:
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: '0.25rem 1rem',
              fontFamily: 'monospace',
              fontSize: '0.8125rem',
            }}>
              <span style={{ color: 'var(--color-muted)' }}>Type:</span>
              <span style={{ color: 'var(--color-text)' }}>CNAME</span>
              <span style={{ color: 'var(--color-muted)' }}>Name:</span>
              <span style={{ color: 'var(--color-text)' }}>
                {dnsInfo?.name || (currentDomain.startsWith('www.') ? 'www' : '@')}
              </span>
              <span style={{ color: 'var(--color-muted)' }}>Value:</span>
              <span style={{ color: 'var(--color-text)' }}>cname.vercel-dns.com</span>
            </div>
            <p style={{ color: 'var(--color-muted)', marginTop: '0.75rem', fontSize: '0.8125rem' }}>
              DNS changes can take up to 48 hours to propagate. Click "Check Verification" once your records are configured.
            </p>
          </div>
        )}

        {error && (
          <div className={`${styles.settingsMessage} ${styles.error}`} style={{ marginTop: '0.5rem' }}>
            {error}
          </div>
        )}

        <div className={styles.connectActions} style={{ marginTop: '1rem' }}>
          {status === 'none' && (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', width: '100%' }}>
              <div style={{ flex: 1 }}>
                <label htmlFor="custom-domain" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text)' }}>
                  Your Domain
                </label>
                <input
                  id="custom-domain"
                  type="text"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  className={styles.settingsInput}
                  placeholder="www.mygym.com"
                />
              </div>
              <Button onClick={handleAddDomain} disabled={loading || !domainInput.trim()}>
                {loading ? 'Adding...' : 'Add Domain'}
              </Button>
            </div>
          )}

          {(status === 'pending' || status === 'failed') && (
            <>
              <Button onClick={handleVerify} disabled={loading}>
                {loading ? 'Checking...' : 'Check Verification'}
              </Button>
              <Button onClick={handleRemove} disabled={loading} variant="outline">
                Remove Domain
              </Button>
            </>
          )}

          {status === 'verified' && (
            <Button onClick={handleRemove} disabled={loading} variant="outline">
              {loading ? 'Removing...' : 'Remove Domain'}
            </Button>
          )}
        </div>
      </Card>
    </FeatureGate>
  );
};

export default CustomDomainPanel;
