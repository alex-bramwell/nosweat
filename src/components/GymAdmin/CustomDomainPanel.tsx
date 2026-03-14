import { useState, useCallback, useRef, useEffect } from 'react';
import { useTenant, useFeature } from '../../contexts/TenantContext';
import { authFetch } from '../../lib/auth';
import { Button, Card, Modal, modalStyles as m, StatusBadge, DetailGrid, SelectableCard, InfoBox } from '../common';
import type { BadgeVariant } from '../common';
import styles from './GymSettings.module.scss';

type SetupPath = 'choose' | 'new-domain' | 'existing-domain';

interface CustomDomainPanelProps {
  gymName: string;
  onNameChange: (name: string) => void;
  slug: string;
  onSlugChange: (slug: string) => void;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

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

const PencilIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
);

const CustomDomainPanel: React.FC<CustomDomainPanelProps> = ({ gymName, onNameChange, slug, onSlugChange }) => {
  const { gym, refreshTenant } = useTenant();
  const hasFeature = useFeature('custom_domain');
  const [domainInput, setDomainInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dnsInfo, setDnsInfo] = useState<{ type: string; name: string; value: string } | null>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [setupPath, setSetupPath] = useState<SetupPath>('choose');
  const [editingSlug, setEditingSlug] = useState(false);
  const slugInputRef = useRef<HTMLInputElement>(null);

  // Track whether the user has manually edited the slug
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const savedSlug = gym?.slug || '';
  const slugChanged = slug !== savedSlug;

  const status = gym?.custom_domain_status || 'none';
  const currentDomain = gym?.custom_domain;

  // Auto-update slug from name if user hasn't manually edited it
  const handleNameChange = (name: string) => {
    onNameChange(name);
    if (!slugManuallyEdited) {
      onSlugChange(slugify(name));
    }
  };

  const handleSlugEdit = (value: string) => {
    setSlugManuallyEdited(true);
    onSlugChange(slugify(value));
  };

  // Focus slug input when editing starts
  useEffect(() => {
    if (editingSlug && slugInputRef.current) {
      slugInputRef.current.focus();
    }
  }, [editingSlug]);

  // Reset manual edit tracking when gym data changes (after save)
  useEffect(() => {
    setSlugManuallyEdited(false);
  }, [savedSlug]);

  const displaySlug = slug || 'your-gym';

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

  // Gym name input + live URL preview (shared across both tiers)
  const nameAndUrlSection = (
    <>
      <div className={styles.settingsFormField}>
        <label htmlFor="gym-name">Gym Name</label>
        <input
          type="text"
          id="gym-name"
          value={gymName}
          onChange={(e) => handleNameChange(e.target.value)}
          className={styles.settingsInput}
          placeholder="Enter your gym name"
          required
        />
      </div>

      <div className={styles.urlPreview}>
        <div className={styles.urlPreviewHeader}>
          <span className={styles.urlPreviewLabel}>Your website address</span>
          {!editingSlug && (
            <button
              type="button"
              className={styles.urlEditButton}
              onClick={() => setEditingSlug(true)}
              title="Edit URL"
            >
              <PencilIcon /> Edit
            </button>
          )}
        </div>

        {editingSlug ? (
          <div className={styles.urlEditRow}>
            <span className={styles.urlPreviewBase}>nosweat.fitness/gym/</span>
            <input
              ref={slugInputRef}
              type="text"
              value={slug}
              onChange={(e) => handleSlugEdit(e.target.value)}
              onBlur={() => setEditingSlug(false)}
              onKeyDown={(e) => { if (e.key === 'Enter') setEditingSlug(false); }}
              className={styles.slugInput}
              placeholder="your-gym"
            />
          </div>
        ) : (
          <span className={styles.urlPreviewUrl}>
            <span className={styles.urlPreviewBase}>nosweat.fitness/gym/</span>
            <span className={styles.urlPreviewSlug}>{displaySlug}</span>
          </span>
        )}

        {slugChanged && (
          <p className={styles.slugWarning}>
            Changing your URL will break any existing links or bookmarks. The change takes effect when you save.
          </p>
        )}
      </div>
    </>
  );

  // Feature not enabled - show free tier URL with upgrade prompt
  if (!hasFeature) {
    return (
      <Card className={styles.settingsSection}>
        <div className={styles.connectHeader}>
          <h2 className={styles.settingsSectionTitle}>Your Website</h2>
          <StatusBadge label="Free Tier" variant="default" />
        </div>

        {nameAndUrlSection}

        <DetailGrid items={[{
          label: 'Live URL',
          value: `nosweat.fitness/gym/${savedSlug}`,
          href: `https://nosweat.fitness/gym/${savedSlug}`,
          copyValue: `https://nosweat.fitness/gym/${savedSlug}`,
        }]} />

        <InfoBox>
          <div className={styles.connectHeader} style={{ marginBottom: '0.5rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <GlobeIcon />
              <strong style={{ fontSize: '0.9375rem' }}>Upgrade to a Custom Domain</strong>
            </span>
          </div>
          <p>
            Use your own domain like <strong>www.{displaySlug}.com</strong> instead of a nosweat.fitness URL. Includes SSL certificate and automatic DNS verification.
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
          <h2 className={styles.settingsSectionTitle}>Your Website</h2>
          <StatusBadge label={config.label} variant={config.variant} />
        </div>

        {nameAndUrlSection}

        {/* Current domain display */}
        {currentDomain && (
          <DetailGrid items={[
            {
              label: 'Custom Domain',
              value: currentDomain,
              status: status === 'verified' ? 'enabled' : 'disabled',
              href: `https://${currentDomain}`,
              copyValue: `https://${currentDomain}`,
            },
            {
              label: 'Also available at',
              value: `nosweat.fitness/gym/${savedSlug}`,
              href: `https://nosweat.fitness/gym/${savedSlug}`,
              copyValue: `https://nosweat.fitness/gym/${savedSlug}`,
            },
          ]} />
        )}

        {/* Default URL when no custom domain set */}
        {status === 'none' && (
          <DetailGrid items={[{
            label: 'Live URL',
            value: `nosweat.fitness/gym/${savedSlug}`,
            href: `https://nosweat.fitness/gym/${savedSlug}`,
            copyValue: `https://nosweat.fitness/gym/${savedSlug}`,
          }]} />
        )}

        {/* Status description for non-none states */}
        {status !== 'none' && (
          <p className={styles.connectDescription}>{config.description}</p>
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

        {/* Custom Domain section */}
        <div className={styles.domainSection}>
          <h3 className={styles.domainSectionTitle}>Custom Domain</h3>

          {status === 'none' && (
            <>
              <p className={styles.connectDescription}>
                Use your own domain name instead of the default nosweat.fitness URL. We handle SSL certificates, DNS verification, and routing automatically.
              </p>
              <div className={styles.connectActions}>
                <Button onClick={openSetupModal}>
                  Set Up Custom Domain
                </Button>
              </div>
            </>
          )}

          {(status === 'pending' || status === 'failed') && (
            <div className={styles.connectActions}>
              <Button onClick={handleVerify} disabled={loading}>
                {loading ? 'Checking...' : 'Check Verification'}
              </Button>
              <Button onClick={handleRemove} disabled={loading} variant="outline">
                Remove Domain
              </Button>
            </div>
          )}

          {status === 'verified' && (
            <div className={styles.connectActions}>
              <Button onClick={handleRemove} disabled={loading} variant="outline">
                {loading ? 'Removing...' : 'Remove Domain'}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Setup modal - choose path then enter domain */}
      <Modal isOpen={showSetupModal} onClose={closeSetupModal} size="default">
        <div className={m.modalBody}>
          <div className={m.modalHeader}>
            <h2 className={m.modalTitle}>Set Up Your Custom Domain</h2>
            {setupPath === 'choose' && (
              <p className={m.modalSubtitle}>How would you like to get your custom domain?</p>
            )}
            {setupPath === 'new-domain' && (
              <p className={m.modalSubtitle}>To use a custom domain, you first need to register one with a domain registrar.</p>
            )}
            {setupPath === 'existing-domain' && (
              <p className={m.modalSubtitle}>Enter the domain you want to use for your gym site. We will provide the DNS records you need to configure.</p>
            )}
          </div>

          {setupPath === 'choose' && (
            <>
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
            </>
          )}

          {setupPath === 'new-domain' && (
            <>
              <InfoBox title="How to get a domain">
                <ol>
                  <li>Visit a domain registrar such as <strong>GoDaddy</strong>, <strong>Namecheap</strong>, <strong>Google Domains</strong>, or <strong>Cloudflare</strong></li>
                  <li>Search for a domain name you like (e.g. <strong>www.{displaySlug}.com</strong>)</li>
                  <li>Purchase the domain - most cost around $10-15 per year</li>
                  <li>Once registered, come back here and choose "I already have a domain" to connect it</li>
                </ol>
              </InfoBox>

              <InfoBox variant="accent" className={styles.modalTip}>
                <p><strong>Tip:</strong> You only need to buy the domain - we handle everything else including SSL certificates and DNS verification.</p>
              </InfoBox>

              <div className={m.modalActions}>
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
              <InfoBox title="How it works">
                <ol>
                  <li>Enter your domain below</li>
                  <li>We will give you a DNS record to add with your domain registrar</li>
                  <li>Add the DNS record (usually a CNAME pointing to our servers)</li>
                  <li>Come back and click "Check Verification" - once confirmed, your domain is live</li>
                </ol>
              </InfoBox>

              <div className={m.modalFieldGroup}>
                <label htmlFor="modal-custom-domain" className={m.modalFieldLabel}>
                  Your Domain
                </label>
                <input
                  id="modal-custom-domain"
                  type="text"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  className={m.modalInput}
                  placeholder="www.mygym.com"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && domainInput.trim()) handleAddDomain();
                  }}
                />
              </div>

              {error && (
                <div className={m.modalError}>
                  {error}
                </div>
              )}

              <div className={m.modalActions}>
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
