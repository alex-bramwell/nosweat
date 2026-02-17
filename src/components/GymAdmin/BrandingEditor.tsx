import { useState, useEffect } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { supabase } from '../../lib/supabase';
import { AVAILABLE_FONTS } from '../../hooks/useTenantTheme';
import { Button, Card } from '../common';
import styles from './BrandingEditor.module.scss';

const BrandingEditor: React.FC = () => {
  const { gym, branding, refreshTenant } = useTenant();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Local state for form fields
  const [formData, setFormData] = useState({
    color_accent: branding.color_accent,
    color_secondary: branding.color_secondary,
    color_bg: branding.color_bg,
    color_surface: branding.color_surface,
    color_text: branding.color_text,
    color_muted: branding.color_muted,
    font_header: branding.font_header,
    font_body: branding.font_body,
    border_radius: branding.border_radius,
    theme_mode: branding.theme_mode,
    hero_headline: branding.hero_headline,
    hero_subtitle: branding.hero_subtitle,
    cta_headline: branding.cta_headline,
    cta_subtitle: branding.cta_subtitle,
    about_mission: branding.about_mission || '',
  });

  // Update form when branding changes
  useEffect(() => {
    setFormData({
      color_accent: branding.color_accent,
      color_secondary: branding.color_secondary,
      color_bg: branding.color_bg,
      color_surface: branding.color_surface,
      color_text: branding.color_text,
      color_muted: branding.color_muted,
      font_header: branding.font_header,
      font_body: branding.font_body,
      border_radius: branding.border_radius,
      theme_mode: branding.theme_mode,
      hero_headline: branding.hero_headline,
      hero_subtitle: branding.hero_subtitle,
      cta_headline: branding.cta_headline,
      cta_subtitle: branding.cta_subtitle,
      about_mission: branding.about_mission || '',
    });
  }, [branding]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBorderRadiusChange = (value: number) => {
    setFormData((prev) => ({ ...prev, border_radius: `${value}rem` }));
  };

  const getBorderRadiusValue = (): number => {
    const match = formData.border_radius.match(/^([\d.]+)rem$/);
    return match ? parseFloat(match[1]) : 0.5;
  };

  const handleReset = () => {
    setFormData({
      color_accent: branding.color_accent,
      color_secondary: branding.color_secondary,
      color_bg: branding.color_bg,
      color_surface: branding.color_surface,
      color_text: branding.color_text,
      color_muted: branding.color_muted,
      font_header: branding.font_header,
      font_body: branding.font_body,
      border_radius: branding.border_radius,
      theme_mode: branding.theme_mode,
      hero_headline: branding.hero_headline,
      hero_subtitle: branding.hero_subtitle,
      cta_headline: branding.cta_headline,
      cta_subtitle: branding.cta_subtitle,
      about_mission: branding.about_mission || '',
    });
    setMessage({ type: 'success', text: 'Changes reverted' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSave = async () => {
    if (!gym) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('gym_branding')
        .update({
          color_accent: formData.color_accent,
          color_secondary: formData.color_secondary,
          color_bg: formData.color_bg,
          color_surface: formData.color_surface,
          color_text: formData.color_text,
          color_muted: formData.color_muted,
          font_header: formData.font_header,
          font_body: formData.font_body,
          border_radius: formData.border_radius,
          theme_mode: formData.theme_mode,
          hero_headline: formData.hero_headline,
          hero_subtitle: formData.hero_subtitle,
          cta_headline: formData.cta_headline,
          cta_subtitle: formData.cta_subtitle,
          about_mission: formData.about_mission || null,
        })
        .eq('gym_id', gym.id);

      if (error) throw error;

      await refreshTenant();
      setMessage({ type: 'success', text: 'Branding updated successfully!' });
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      console.error('Error saving branding:', error);
      setMessage({ type: 'error', text: 'Failed to save changes. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.brandingEditor}>
      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <Card className={styles.section}>
        <h2 className={styles.sectionTitle}>Color Palette</h2>
        <div className={styles.colorGrid}>
          <div className={styles.colorField}>
            <label htmlFor="color_accent">Primary Brand Color</label>
            <span className={styles.colorLabel}>Buttons, links, CTAs</span>
            <div className={styles.colorInputWrapper}>
              <input
                type="color"
                id="color_accent"
                value={formData.color_accent}
                onChange={(e) => handleChange('color_accent', e.target.value)}
              />
              <span className={styles.colorValue}>{formData.color_accent}</span>
            </div>
          </div>

          <div className={styles.colorField}>
            <label htmlFor="color_secondary">Secondary Color</label>
            <span className={styles.colorLabel}>Accents and highlights</span>
            <div className={styles.colorInputWrapper}>
              <input
                type="color"
                id="color_secondary"
                value={formData.color_secondary}
                onChange={(e) => handleChange('color_secondary', e.target.value)}
              />
              <span className={styles.colorValue}>{formData.color_secondary}</span>
            </div>
          </div>

          <div className={styles.colorField}>
            <label htmlFor="color_bg">Background Color</label>
            <span className={styles.colorLabel}>Page background</span>
            <div className={styles.colorInputWrapper}>
              <input
                type="color"
                id="color_bg"
                value={formData.color_bg}
                onChange={(e) => handleChange('color_bg', e.target.value)}
              />
              <span className={styles.colorValue}>{formData.color_bg}</span>
            </div>
          </div>

          <div className={styles.colorField}>
            <label htmlFor="color_surface">Surface Color</label>
            <span className={styles.colorLabel}>Cards and panels</span>
            <div className={styles.colorInputWrapper}>
              <input
                type="color"
                id="color_surface"
                value={formData.color_surface}
                onChange={(e) => handleChange('color_surface', e.target.value)}
              />
              <span className={styles.colorValue}>{formData.color_surface}</span>
            </div>
          </div>

          <div className={styles.colorField}>
            <label htmlFor="color_text">Text Color</label>
            <span className={styles.colorLabel}>Body text</span>
            <div className={styles.colorInputWrapper}>
              <input
                type="color"
                id="color_text"
                value={formData.color_text}
                onChange={(e) => handleChange('color_text', e.target.value)}
              />
              <span className={styles.colorValue}>{formData.color_text}</span>
            </div>
          </div>

          <div className={styles.colorField}>
            <label htmlFor="color_muted">Muted Color</label>
            <span className={styles.colorLabel}>Secondary text</span>
            <div className={styles.colorInputWrapper}>
              <input
                type="color"
                id="color_muted"
                value={formData.color_muted}
                onChange={(e) => handleChange('color_muted', e.target.value)}
              />
              <span className={styles.colorValue}>{formData.color_muted}</span>
            </div>
          </div>
        </div>
      </Card>

      <Card className={styles.section}>
        <h2 className={styles.sectionTitle}>Typography</h2>
        <div className={styles.fontGrid}>
          <div className={styles.formField}>
            <label htmlFor="font_header">Header Font</label>
            <select
              id="font_header"
              value={formData.font_header}
              onChange={(e) => handleChange('font_header', e.target.value)}
              className={styles.select}
            >
              {AVAILABLE_FONTS.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formField}>
            <label htmlFor="font_body">Body Font</label>
            <select
              id="font_body"
              value={formData.font_body}
              onChange={(e) => handleChange('font_body', e.target.value)}
              className={styles.select}
            >
              {AVAILABLE_FONTS.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card className={styles.section}>
        <h2 className={styles.sectionTitle}>Shape & Theme</h2>
        <div className={styles.shapeGrid}>
          <div className={styles.formField}>
            <label htmlFor="border_radius">
              Border Radius
              <span className={styles.sliderValue}>{getBorderRadiusValue()}rem</span>
            </label>
            <input
              type="range"
              id="border_radius"
              min="0"
              max="2"
              step="0.125"
              value={getBorderRadiusValue()}
              onChange={(e) => handleBorderRadiusChange(parseFloat(e.target.value))}
              className={styles.slider}
            />
          </div>

          <div className={styles.formField}>
            <label>Theme Mode</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="theme_mode"
                  value="light"
                  checked={formData.theme_mode === 'light'}
                  onChange={(e) => handleChange('theme_mode', e.target.value)}
                />
                <span>Light</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="theme_mode"
                  value="dark"
                  checked={formData.theme_mode === 'dark'}
                  onChange={(e) => handleChange('theme_mode', e.target.value)}
                />
                <span>Dark</span>
              </label>
            </div>
          </div>
        </div>
      </Card>

      <Card className={styles.section}>
        <h2 className={styles.sectionTitle}>Content</h2>
        <div className={styles.contentGrid}>
          <div className={styles.formField}>
            <label htmlFor="hero_headline">Hero Headline</label>
            <input
              type="text"
              id="hero_headline"
              value={formData.hero_headline}
              onChange={(e) => handleChange('hero_headline', e.target.value)}
              className={styles.input}
              placeholder="Welcome to Your Gym"
            />
          </div>

          <div className={styles.formField}>
            <label htmlFor="hero_subtitle">Hero Subtitle</label>
            <input
              type="text"
              id="hero_subtitle"
              value={formData.hero_subtitle}
              onChange={(e) => handleChange('hero_subtitle', e.target.value)}
              className={styles.input}
              placeholder="Transform your fitness journey..."
            />
          </div>

          <div className={styles.formField}>
            <label htmlFor="cta_headline">CTA Headline</label>
            <input
              type="text"
              id="cta_headline"
              value={formData.cta_headline}
              onChange={(e) => handleChange('cta_headline', e.target.value)}
              className={styles.input}
              placeholder="Ready to Start Your Journey?"
            />
          </div>

          <div className={styles.formField}>
            <label htmlFor="cta_subtitle">CTA Subtitle</label>
            <input
              type="text"
              id="cta_subtitle"
              value={formData.cta_subtitle}
              onChange={(e) => handleChange('cta_subtitle', e.target.value)}
              className={styles.input}
              placeholder="Join us today..."
            />
          </div>

          <div className={styles.formField}>
            <label htmlFor="about_mission">About Mission</label>
            <textarea
              id="about_mission"
              value={formData.about_mission}
              onChange={(e) => handleChange('about_mission', e.target.value)}
              className={styles.textarea}
              placeholder="Our mission is to..."
              rows={4}
            />
          </div>
        </div>
      </Card>

      <div className={styles.actions}>
        <Button variant="outline" onClick={handleReset} disabled={isLoading}>
          Reset
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

export default BrandingEditor;
