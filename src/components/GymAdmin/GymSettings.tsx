import { useState, useEffect } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { supabase } from '../../lib/supabase';
import { Button, Card } from '../common';
import styles from './GymSettings.module.scss';

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
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <Card className={styles.section}>
        <h2 className={styles.sectionTitle}>Gym Information</h2>
        <div className={styles.formGrid}>
          <div className={styles.formField}>
            <label htmlFor="name">Gym Name *</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.formField}>
            <label htmlFor="slug">URL Slug (read-only)</label>
            <input
              type="text"
              id="slug"
              value={gym.slug}
              className={styles.input}
              disabled
              readOnly
            />
            <span className={styles.fieldHelp}>
              Your gym's URL: nosweat.fitness/gym/{gym.slug}
            </span>
          </div>
        </div>
      </Card>

      <Card className={styles.section}>
        <h2 className={styles.sectionTitle}>Contact Information</h2>
        <div className={styles.formGrid}>
          <div className={styles.formField}>
            <label htmlFor="contact_email">Contact Email</label>
            <input
              type="email"
              id="contact_email"
              value={formData.contact_email}
              onChange={(e) => handleChange('contact_email', e.target.value)}
              className={styles.input}
              placeholder="info@yourgym.com"
            />
          </div>

          <div className={styles.formField}>
            <label htmlFor="contact_phone">Contact Phone</label>
            <input
              type="tel"
              id="contact_phone"
              value={formData.contact_phone}
              onChange={(e) => handleChange('contact_phone', e.target.value)}
              className={styles.input}
              placeholder="+44 20 1234 5678"
            />
          </div>
        </div>
      </Card>

      <Card className={styles.section}>
        <h2 className={styles.sectionTitle}>Address</h2>
        <div className={styles.formGrid}>
          <div className={styles.formField}>
            <label htmlFor="address_line1">Address Line 1</label>
            <input
              type="text"
              id="address_line1"
              value={formData.address_line1}
              onChange={(e) => handleChange('address_line1', e.target.value)}
              className={styles.input}
              placeholder="123 Main Street"
            />
          </div>

          <div className={styles.formField}>
            <label htmlFor="address_line2">Address Line 2</label>
            <input
              type="text"
              id="address_line2"
              value={formData.address_line2}
              onChange={(e) => handleChange('address_line2', e.target.value)}
              className={styles.input}
              placeholder="Suite 100"
            />
          </div>

          <div className={styles.formField}>
            <label htmlFor="city">City</label>
            <input
              type="text"
              id="city"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              className={styles.input}
              placeholder="London"
            />
          </div>

          <div className={styles.formField}>
            <label htmlFor="postcode">Postcode</label>
            <input
              type="text"
              id="postcode"
              value={formData.postcode}
              onChange={(e) => handleChange('postcode', e.target.value)}
              className={styles.input}
              placeholder="SW1A 1AA"
            />
          </div>

          <div className={styles.formField}>
            <label htmlFor="country">Country</label>
            <input
              type="text"
              id="country"
              value={formData.country}
              onChange={(e) => handleChange('country', e.target.value)}
              className={styles.input}
              placeholder="United Kingdom"
            />
          </div>

          <div className={styles.formField}>
            <label htmlFor="google_maps_embed_url">Google Maps Embed URL</label>
            <input
              type="url"
              id="google_maps_embed_url"
              value={formData.google_maps_embed_url}
              onChange={(e) => handleChange('google_maps_embed_url', e.target.value)}
              className={styles.input}
              placeholder="https://www.google.com/maps/embed?pb=..."
            />
            <span className={styles.fieldHelp}>
              Get this from Google Maps: Share → Embed a map → Copy HTML
            </span>
          </div>
        </div>
      </Card>

      <Card className={styles.section}>
        <h2 className={styles.sectionTitle}>Social Media</h2>
        <div className={styles.formGrid}>
          <div className={styles.formField}>
            <label htmlFor="social_facebook">Facebook URL</label>
            <input
              type="url"
              id="social_facebook"
              value={formData.social_facebook}
              onChange={(e) => handleChange('social_facebook', e.target.value)}
              className={styles.input}
              placeholder="https://facebook.com/yourgym"
            />
          </div>

          <div className={styles.formField}>
            <label htmlFor="social_instagram">Instagram URL</label>
            <input
              type="url"
              id="social_instagram"
              value={formData.social_instagram}
              onChange={(e) => handleChange('social_instagram', e.target.value)}
              className={styles.input}
              placeholder="https://instagram.com/yourgym"
            />
          </div>

          <div className={styles.formField}>
            <label htmlFor="social_twitter">Twitter/X URL</label>
            <input
              type="url"
              id="social_twitter"
              value={formData.social_twitter}
              onChange={(e) => handleChange('social_twitter', e.target.value)}
              className={styles.input}
              placeholder="https://twitter.com/yourgym"
            />
          </div>
        </div>
      </Card>

      <div className={styles.actions}>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
};

export default GymSettings;
