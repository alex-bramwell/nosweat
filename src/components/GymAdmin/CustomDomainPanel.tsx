import { useState, useCallback } from 'react';
import { useTenant, useFeature } from '../../contexts/TenantContext';
import { authFetch } from '../../lib/auth';
import { Button, Card, Modal, StatusBadge, DetailGrid, SelectableCard, InfoBox } from '../common';
import type { BadgeVariant } from '../common';
import styles from './GymSettings.module.scss';

type SetupPath = 'choose' | 'new-domain' | 'existing-domain';

const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const PlusCircleIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const LinkIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const CustomDomainPanel: React.FC = () => {
  const { gym, refreshTenant } = useTenant();
  const hasFeature = useFeature('custom_domain');
  const [domainInput, setDomainInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dnsInfo, setDnsInfo] = useState<{ type: string; name: string; value: string } | null>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [setupPath, setSetupPath] = useState<SetupPath>('choose');

  const status = gym?.custom_domain_status || 'none';
  const currentDomain = gym?.custom_domain;

  const openSetupModal = () => {
    setSetupPath('choose');
    setDomainInput('');
    setError(null);
    setShowSetupModal(true);
  };

  const closeSetupModal = () => {
    setShowSetupModal(false);
    setSetupPath('choose');
    setDomainInput('');
    setError(null);
  };

  const handleAddDomain = useCallback(async () => {
    if (!gym || !domainInput.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const data = await authFetch<{ dns: { type: string; name: string; value: string } }>('/api/domains/add', {
        gymId: gym.id,
        domain: domainInput.trim(),
      });
      setDnsInfo(data.dns);
      setDomainInput('');
      closeSetupModal();
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
      const data = await authFetch<{ verified: boolean }>('/api/domains/verify', { gymId: gym.id });
      if (data.verified) setDnsInfo(null);
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
      await authFetch('/api/domains/remove', { gymId: gym.id });
      setDnsInfo(null);
      await refreshTenant();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [gym, refreshTenant]);

  const statusConfig: Record<string, { label: string; variant: BadgeVariant; description: string }> = {
    none: {
      label: 'Not Configured',
      variant: 'default',
      description: 'Connect your own domain so members can visit your gym site directly.',
    },
    pending: {
      label: 'Pending DNS',
      variant: 'warning',
      description: 'Your domain has been added. Configure your DNS records below, then click verify.',
    },
    verified: {
      label: 'Active',
      variant: 'success',
      description: 'Your custom domain is live and serving your gym site.',
    },
    failed: {
      label: 'Failed',
      variant: 'error',
      description: 'DNS verification failed. Check your DNS records and try again.',
    },
  };

  const config = statusConfig[status] || statusConfig.none;

  if (!gym) return null;

  // Feature not enabled - show free tier URL with upgrade prompt
  if (!hasFeature) {
    return (
      <Card className={styles.settingsSection}>
        <div className={styles.connectHeader}>
          <h2 className={styles.settingsSectionTitle}>Your Website URL</h2>
          <StatusBadge label="Free Tier" variant="default" />
        </div>

        <p className={styles.connectDescription}>
          You are currently on the free tier. Your gym site is hosted on a shared nosweat.fitness URL.
        </p>

        <DetailGrid items={[{ label: 'Your URL', value: `nosweat.fitness/gym/${gym.slug}` }]} />

        <InfoBox>
          <div className={styles.connectHeader} style={{ marginBottom: '0.5rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <GlobeIcon />
              <strong style={{ fontSize: '0.9375rem' }}>Upgrade to a Custom Domain</strong>
            </span>
          </div>
          <p>
            Use your own domain like <strong>www.{gym.slug}.com</strong> instead of a nosweat.fitness URL. Includes SSL certificate and automatic DNS verification.
          </p>
          <p style={{ color: 'var(--color-accent)', fontWeight: 600, marginTop: '0.75rem' }}>
            Enable "Custom Domain" in your Features tab to get started.
          </p>
        </InfoBox>
      </Card>
    );
  }

  // Feature enabled - full domain management UI
  return (
    <>
      <Card className={styles.settingsSection}>
        <div className={styles.connectHeader}>
          <h2 className={styles.settingsSectionTitle}>Custom Domain</h2>
          <StatusBadge label={config.label} variant={config.variant} />
        </div>

        <p className={styles.connectDescription}>{config.description}</p>

        {/* Current domain display */}
        {currentDomain && (
          <DetailGrid items={[
            { label: 'Domain', value: currentDomain, status: status === 'verified' ? 'enabled' : 'disabled' },
            { label: 'Also available at', value: `nosweat.fitness/gym/${gym.slug}`, status: 'muted' },
          ]} />
        )}

        {/* Free tier URL info when no domain set */}
        {status === 'none' && (
          <DetailGrid items={[{ label: 'Current URL', value: `nosweat.fitness/gym/${gym.slug}` }]} />
        )}

        {/* DNS instructions */}
        {(status === 'pending' || status === 'failed') && currentDomain && (
          <InfoBox title="DNS Configuration Required">
            <p>Add the following DNS record with your domain registrar:</p>
            <div className={styles.dnsGrid}>
              <span className={styles.dnsLabel}>Type:</span>
              <span className={styles.dnsValue}>CNAME</span>
              <span className={styles.dnsLabel}>Name:</span>
              <span className={styles.dnsValue}>
                {dnsInfo?.name || (currentDomain.startsWith('www.') ? 'www' : '@')}
              </span>
              <span className={styles.dnsLabel}>Value:</span>
              <span className={styles.dnsValue}>cname.vercel-dns.com</span>
            </div>
            <p style={{ marginTop: '0.75rem', fontSize: '0.8125rem' }}>
              DNS changes can take up to 48 hours to propagate. Click "Check Verification" once your records are configured.
            </p>
          </InfoBox>
        )}

        {error && !showSetupModal && (
          <div className={`${styles.settingsMessage} ${styles.error}`}>
            {error}
          </div>
        )}

        <div className={styles.connectActions} style={{ marginTop: '1rem' }}>
          {status === 'none' && (
            <Button onClick={openSetupModal}>
              Set Up Custom Domain
            </Button>
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

      {/* Setup modal - choose path then enter domain */}
      <Modal isOpen={showSetupModal} onClose={closeSetupModal} size="default">
        <div style={{ padding: '0.5rem' }}>
          <h2 className={styles.settingsSectionTitle} style={{ marginBottom: '0.25rem' }}>
            Set Up Your Custom Domain
          </h2>

          {setupPath === 'choose' && (
            <>
              <p className={styles.connectDescription} style={{ marginBottom: '1.5rem' }}>
                How would you like to get your custom domain?
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <SelectableCard
                  icon={<PlusCircleIcon />}
                  title="I need a new domain"
                  description="I don't have a domain yet and need to register one."
                  onClick={() => setSetupPath('new-domain')}
                />

                <SelectableCard
                  icon={<LinkIcon />}
                  title="I already have a domain"
                  description="I own a domain and want to connect it to my gym site."
                  onClick={() => setSetupPath('existing-domain')}
                />
              </div>
            </>
          )}

          {setupPath === 'new-domain' && (
            <>
              <p className={styles.connectDescription} style={{ marginBottom: '1.25rem' }}>
                To use a custom domain, you first need to register one with a domain registrar.
              </p>

              <InfoBox title="How to get a domain">
                <ol>
                  <li>Visit a domain registrar such as <strong>GoDaddy</strong>, <strong>Namecheap</strong>, <strong>Google Domains</strong>, or <strong>Cloudflare</strong></li>
                  <li>Search for a domain name you like (e.g. <strong>www.{gym.slug}.com</strong>)</li>
                  <li>Purchase the domain - most cost around $10-15 per year</li>
                  <li>Once registered, come back here and choose "I already have a domain" to connect it</li>
                </ol>
              </InfoBox>

              <InfoBox variant="accent" className={styles.modalTip}>
                <p><strong>Tip:</strong> You only need to buy the domain - we handle everything else including SSL certificates and DNS verification.</p>
              </InfoBox>

              <div className={styles.modalActions}>
                <Button variant="outline" onClick={() => setSetupPath('choose')}>
                  Back
                </Button>
                <Button onClick={() => setSetupPath('existing-domain')}>
                  I've got one - connect it now
                </Button>
              </div>
            </>
          )}

          {setupPath === 'existing-domain' && (
            <>
              <p className={styles.connectDescription} style={{ marginBottom: '1.25rem' }}>
                Enter the domain you want to use for your gym site. We'll provide the DNS records you need to configure.
              </p>

              <InfoBox title="How it works">
                <ol>
                  <li>Enter your domain below</li>
                  <li>We'll give you a DNS record to add with your domain registrar</li>
                  <li>Add the DNS record (usually a CNAME pointing to our servers)</li>
                  <li>Come back and click "Check Verification" - once confirmed, your domain is live</li>
                </ol>
                <p style={{ marginTop: '0.75rem', fontSize: '0.8125rem' }}>
                  DNS changes can take up to 48 hours to propagate, but usually complete within minutes.
                </p>
              </InfoBox>

              <div className={styles.modalInputGroup}>
                <label htmlFor="modal-custom-domain" className={styles.modalInputLabel}>
                  Your Domain
                </label>
                <input
                  id="modal-custom-domain"
                  type="text"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  className={styles.settingsInput}
                  placeholder="www.mygym.com"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && domainInput.trim()) handleAddDomain();
                  }}
                />
              </div>

              {error && (
                <div className={`${styles.settingsMessage} ${styles.error}`} style={{ marginBottom: '1rem' }}>
                  {error}
                </div>
              )}

              <div className={styles.modalActions}>
                <Button variant="outline" onClick={() => { setSetupPath('choose'); setError(null); }}>
                  Back
                </Button>
                <Button onClick={handleAddDomain} disabled={loading || !domainInput.trim()}>
                  {loading ? 'Adding...' : 'Connect Domain'}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
};

export default CustomDomainPanel;
