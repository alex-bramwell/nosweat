import { useState, useEffect, useCallback } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { supabase } from '../../lib/supabase';
import { Button, Card } from '../common';
import CustomDomainPanel from './CustomDomainPanel';
import styles from './GymSettings.module.scss';

async function getAccessToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated');
  return session.access_token;
}

// ── Stripe Connect Panel ──────────────────────────────────────────
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
        const token = await getAccessToken();
        const res = await fetch('/api/connect/account-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ gymId: gym.id }),
        });
        if (res.ok) {
          const data = await res.json();
          setAccountStatus(data);
        }
      } catch {
        // Silently fail — DB status is still shown
      }
    };
    fetchStatus();
  }, [gym?.stripe_account_id, gym?.id]);

  const handleStartOnboarding = useCallback(async () => {
    if (!gym) return;
    setConnectLoading(true);
    setConnectError(null);

    try {
      const token = await getAccessToken();

      // Step 1: Create Connect account if none exists
      if (!gym.stripe_account_id) {
        const createRes = await fetch('/api/connect/create-account', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ gymId: gym.id }),
        });

        if (!createRes.ok) {
          const err = await createRes.json();
          throw new Error(err.error || 'Failed to create Connect account');
        }

        await refreshTenant();
      }

      // Step 2: Get onboarding link
      const linkRes = await fetch('/api/connect/onboarding-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ gymId: gym.id }),
      });

      if (!linkRes.ok) {
        const err = await linkRes.json();
        throw new Error(err.error || 'Failed to create onboarding link');
      }

      const { url } = await linkRes.json();
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
      const token = await getAccessToken();
      const res = await fetch('/api/connect/dashboard-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ gymId: gym.id }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to get dashboard link');
      }

      const { url } = await res.json();
      window.open(url, '_blank');
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setConnectLoading(false);
    }
  }, [gym]);

  const statusConfig: Record<string, { label: string; className: string; description: string }> = {
    not_started: {
      label: 'Not Connected',
      className: styles.connectStatusDefault,
      description: 'Connect your Stripe account to receive payments from members.',
    },
    onboarding: {
      label: 'Onboarding',
      className: styles.connectStatusOnboarding,
      description: 'Your Stripe account setup is in progress. Continue onboarding to start accepting payments.',
    },
    active: {
      label: 'Active',
      className: styles.connectStatusActive,
      description: 'Your Stripe account is connected and ready to accept payments.',
    },
    restricted: {
      label: 'Restricted',
      className: styles.connectStatusRestricted,
      description: 'Your Stripe account has restrictions. Please complete any pending requirements.',
    },
    disabled: {
      label: 'Disabled',
      className: styles.connectStatusDisabled,
      description: 'Your Stripe account has been disabled. Please contact support.',
    },
  };

  const config = statusConfig[status] || statusConfig.not_started;

  return (
    <Card className={styles.settingsSection}>
      <div className={styles.connectHeader}>
        <h2 className={styles.settingsSectionTitle}>Payments</h2>
        <span className={`${styles.connectStatusBadge} ${config.className}`}>
          {config.label}
        </span>
      </div>

      <p className={styles.connectDescription}>{config.description}</p>

      {accountStatus && status === 'active' && (
        <div className={styles.connectDetails}>
          <div className={styles.connectDetailItem}>
            <span className={styles.connectDetailLabel}>Charges</span>
            <span className={accountStatus.chargesEnabled ? styles.connectEnabled : styles.connectDisabledText}>
              {accountStatus.chargesEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className={styles.connectDetailItem}>
            <span className={styles.connectDetailLabel}>Payouts</span>
            <span className={accountStatus.payoutsEnabled ? styles.connectEnabled : styles.connectDisabledText}>
              {accountStatus.payoutsEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      )}

      {connectError && (
        <div className={`${styles.settingsMessage} ${styles.error}`}>
          {connectError}
        </div>
      )}

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

// ── Main Settings Component ───────────────────────────────────────
const GymSettings: React.FC = () => {
  const { gym, refreshTenant } = useTenant();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    name: gym?.name || '',
    contact_email: gym?.contact_email || '',
    contact_phone: gym?.contact_phone || '',
    address_line1: gym?.address_line1 || '',
    address_line2: gym?.address_line2 || '',
    city: gym?.city || '',
    postcode: gym?.postcode || '',
    country: gym?.country || 'United Kingdom',
    google_maps_embed_url: gym?.google_maps_embed_url || '',
    social_facebook: gym?.social_facebook || '',
    social_instagram: gym?.social_instagram || '',
    social_twitter: gym?.social_twitter || '',
  });

  useEffect(() => {
    if (gym) {
      setFormData({
        name: gym.name || '',
        contact_email: gym.contact_email || '',
        contact_phone: gym.contact_phone || '',
        address_line1: gym.address_line1 || '',
        address_line2: gym.address_line2 || '',
        city: gym.city || '',
        postcode: gym.postcode || '',
        country: gym.country || 'United Kingdom',
        google_maps_embed_url: gym.google_maps_embed_url || '',
        social_facebook: gym.social_facebook || '',
        social_instagram: gym.social_instagram || '',
        social_twitter: gym.social_twitter || '',
      });
    }
  }, [gym]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!gym) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('gyms')
        .update({
          name: formData.name,
          contact_email: formData.contact_email || null,
          contact_phone: formData.contact_phone || null,
          address_line1: formData.address_line1 || null,
          address_line2: formData.address_line2 || null,
          city: formData.city || null,
          postcode: formData.postcode || null,
          country: formData.country || null,
          google_maps_embed_url: formData.google_maps_embed_url || null,
          social_facebook: formData.social_facebook || null,
          social_instagram: formData.social_instagram || null,
          social_twitter: formData.social_twitter || null,
        })
        .eq('id', gym.id);

      if (error) throw error;

      await refreshTenant();
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!gym) {
    return (
      <div className={styles.gymSettings}>
        <p>Loading gym information...</p>
      </div>
    );
  }

  return (
    <div className={styles.gymSettings}>
      {message && (
        <div className={`${styles.settingsMessage} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <Card className={styles.settingsSection}>
        <h2 className={styles.settingsSectionTitle}>Gym Information</h2>
        <div className={styles.settingsFormGrid}>
          <div className={styles.settingsFormField}>
            <label htmlFor="name">Gym Name *</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={styles.settingsInput}
              required
            />
          </div>

          <div className={styles.settingsFormField}>
            <label htmlFor="slug">URL Slug (read-only)</label>
            <input
              type="text"
              id="slug"
              value={gym.slug}
              className={styles.settingsInput}
              disabled
              readOnly
            />
            <span className={styles.settingsFieldHelp}>
              {gym.custom_domain && gym.custom_domain_status === 'verified'
                ? <>Custom domain: {gym.custom_domain} (also available at nosweat.fitness/gym/{gym.slug})</>
                : <>Your gym's URL: nosweat.fitness/gym/{gym.slug}</>
              }
            </span>
          </div>
        </div>
      </Card>

      <Card className={styles.settingsSection}>
        <h2 className={styles.settingsSectionTitle}>Contact Information</h2>
        <div className={styles.settingsFormGrid}>
          <div className={styles.settingsFormField}>
            <label htmlFor="contact_email">Contact Email</label>
            <input
              type="email"
              id="contact_email"
              value={formData.contact_email}
              onChange={(e) => handleChange('contact_email', e.target.value)}
              className={styles.settingsInput}
              placeholder="info@yourgym.com"
            />
          </div>

          <div className={styles.settingsFormField}>
            <label htmlFor="contact_phone">Contact Phone</label>
            <input
              type="tel"
              id="contact_phone"
              value={formData.contact_phone}
              onChange={(e) => handleChange('contact_phone', e.target.value)}
              className={styles.settingsInput}
              placeholder="+44 20 1234 5678"
            />
          </div>
        </div>
      </Card>

      <Card className={styles.settingsSection}>
        <h2 className={styles.settingsSectionTitle}>Address</h2>
        <div className={styles.settingsFormGrid}>
          <div className={styles.settingsFormField}>
            <label htmlFor="address_line1">Address Line 1</label>
            <input
              type="text"
              id="address_line1"
              value={formData.address_line1}
              onChange={(e) => handleChange('address_line1', e.target.value)}
              className={styles.settingsInput}
              placeholder="123 Main Street"
            />
          </div>

          <div className={styles.settingsFormField}>
            <label htmlFor="address_line2">Address Line 2</label>
            <input
              type="text"
              id="address_line2"
              value={formData.address_line2}
              onChange={(e) => handleChange('address_line2', e.target.value)}
              className={styles.settingsInput}
              placeholder="Suite 100"
            />
          </div>

          <div className={styles.settingsFormField}>
            <label htmlFor="city">City</label>
            <input
              type="text"
              id="city"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              className={styles.settingsInput}
              placeholder="London"
            />
          </div>

          <div className={styles.settingsFormField}>
            <label htmlFor="postcode">Postcode</label>
            <input
              type="text"
              id="postcode"
              value={formData.postcode}
              onChange={(e) => handleChange('postcode', e.target.value)}
              className={styles.settingsInput}
              placeholder="SW1A 1AA"
            />
          </div>

          <div className={styles.settingsFormField}>
            <label htmlFor="country">Country</label>
            <input
              type="text"
              id="country"
              value={formData.country}
              onChange={(e) => handleChange('country', e.target.value)}
              className={styles.settingsInput}
              placeholder="United Kingdom"
            />
          </div>

          <div className={styles.settingsFormField}>
            <label htmlFor="google_maps_embed_url">Google Maps Embed URL</label>
            <input
              type="url"
              id="google_maps_embed_url"
              value={formData.google_maps_embed_url}
              onChange={(e) => handleChange('google_maps_embed_url', e.target.value)}
              className={styles.settingsInput}
              placeholder="https://www.google.com/maps/embed?pb=..."
            />
            <span className={styles.settingsFieldHelp}>
              Get this from Google Maps: Share → Embed a map → Copy HTML
            </span>
          </div>
        </div>
      </Card>

      <Card className={styles.settingsSection}>
        <h2 className={styles.settingsSectionTitle}>Social Media</h2>
        <div className={styles.settingsFormGrid}>
          <div className={styles.settingsFormField}>
            <label htmlFor="social_facebook">Facebook URL</label>
            <input
              type="url"
              id="social_facebook"
              value={formData.social_facebook}
              onChange={(e) => handleChange('social_facebook', e.target.value)}
              className={styles.settingsInput}
              placeholder="https://facebook.com/yourgym"
            />
          </div>

          <div className={styles.settingsFormField}>
            <label htmlFor="social_instagram">Instagram URL</label>
            <input
              type="url"
              id="social_instagram"
              value={formData.social_instagram}
              onChange={(e) => handleChange('social_instagram', e.target.value)}
              className={styles.settingsInput}
              placeholder="https://instagram.com/yourgym"
            />
          </div>

          <div className={styles.settingsFormField}>
            <label htmlFor="social_twitter">Twitter/X URL</label>
            <input
              type="url"
              id="social_twitter"
              value={formData.social_twitter}
              onChange={(e) => handleChange('social_twitter', e.target.value)}
              className={styles.settingsInput}
              placeholder="https://twitter.com/yourgym"
            />
          </div>
        </div>
      </Card>

      <StripeConnectPanel />
      <CustomDomainPanel />

      <div className={styles.settingsActions}>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
};

export default GymSettings;
