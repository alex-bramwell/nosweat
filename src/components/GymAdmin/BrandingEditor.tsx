import { useState, useEffect } from 'react';
import { useTenant, DEFAULT_BRANDING } from '../../contexts/TenantContext';
import { supabase } from '../../lib/supabase';
import { AVAILABLE_FONTS } from '../../hooks/useTenantTheme';
import { FEATURES, type FeatureDefinition } from '../../config/features';
import type { FeatureKey, HeroCards } from '../../types/tenant';
import { Button } from '../common';
import ImageUpload from './ImageUpload';
import FeatureDisableModal from './FeatureDisableModal';
import type { GymBranding } from '../../types/tenant';
import styles from './BrandingEditor.module.scss';

const HERO_EFFECTS = [
  { value: 'none', label: 'None' },
  { value: 'comet', label: 'Comet' },
  { value: 'particles', label: 'Particles' },
  { value: 'gradient', label: 'Gradient Shift' },
];

const SECTION_OPTIONS = [
  { key: 'hero', label: 'Hero Banner' },
  { key: 'programs', label: 'Programs' },
  { key: 'stats', label: 'Stats' },
  { key: 'wod', label: 'Workout of the Day' },
  { key: 'cta', label: 'Call to Action' },
];

interface BrandingEditorProps {
  onDraftChange?: (data: Partial<GymBranding> | null) => void;
}

const BrandingEditor: React.FC<BrandingEditorProps> = ({ onDraftChange }) => {
  const { gym, branding, features, refreshTenant } = useTenant();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [openSections, setOpenSections] = useState<Set<string>>(() => new Set());
  const [featureLoading, setFeatureLoading] = useState(false);
  const [disableModalData, setDisableModalData] = useState<{
    feature: FeatureDefinition;
    dependents: FeatureDefinition[];
  } | null>(null);

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const buildFormData = (source: GymBranding = branding) => ({
    // Core colors
    color_accent: source.color_accent,
    color_secondary: source.color_secondary,
    color_bg: source.color_bg,
    color_surface: source.color_surface,
    color_text: source.color_text,
    color_muted: source.color_muted,
    // Advanced colors
    color_accent2: source.color_accent2,
    color_secondary2: source.color_secondary2,
    color_specialty: source.color_specialty,
    color_bg_light: source.color_bg_light,
    color_bg_dark: source.color_bg_dark,
    color_header: source.color_header,
    color_footer: source.color_footer,
    // Typography
    font_header: source.font_header,
    font_body: source.font_body,
    // Shape
    border_radius: source.border_radius,
    theme_mode: source.theme_mode,
    nav_style: source.nav_style,
    // Assets
    logo_url: source.logo_url || '',
    logo_dark_url: source.logo_dark_url || '',
    favicon_url: source.favicon_url || '',
    hero_image_url: source.hero_image_url || '',
    about_image_url: source.about_image_url || '',
    og_image_url: source.og_image_url || '',
    // Content
    hero_headline: source.hero_headline,
    hero_subtitle: source.hero_subtitle,
    cta_headline: source.cta_headline,
    cta_subtitle: source.cta_subtitle,
    about_mission: source.about_mission || '',
    about_philosophy: source.about_philosophy || '',
    about_facility: source.about_facility || '',
    footer_text: source.footer_text || '',
    // Custom code
    custom_css: source.custom_css || '',
    hero_effect: source.hero_effect || 'comet',
    // Sections
    visible_sections: source.visible_sections ?? { hero: true, programs: true, wod: true, cta: true, stats: true },
    // Hero cards
    hero_cards: source.hero_cards ?? DEFAULT_BRANDING.hero_cards,
  });

  const [formData, setFormData] = useState(buildFormData);

  // Sync form when branding changes (e.g. after save + refresh)
  useEffect(() => {
    setFormData(buildFormData());
  }, [branding]); // eslint-disable-line react-hooks/exhaustive-deps

  // Emit draft changes for live preview
  useEffect(() => {
    onDraftChange?.(formData);
  }, [formData]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleSectionToggle = (key: string) => {
    setFormData((prev) => ({
      ...prev,
      visible_sections: {
        ...prev.visible_sections,
        [key]: !prev.visible_sections[key],
      },
    }));
  };

  const handleHeroCardChange = (card: keyof HeroCards, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      hero_cards: {
        ...prev.hero_cards,
        [card]: {
          ...prev.hero_cards[card],
          [field]: value,
        },
      },
    }));
  };

  const handleImageUpload = (field: string, url: string) => {
    setFormData((prev) => ({ ...prev, [field]: url }));
  };

  const handleImageRemove = (field: string) => {
    setFormData((prev) => ({ ...prev, [field]: '' }));
  };

  const handleReset = () => {
    const defaults = buildFormData(DEFAULT_BRANDING);
    setFormData(defaults);
    onDraftChange?.(defaults);
    setMessage({ type: 'success', text: 'Reset to defaults — click Save to apply' });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSave = async () => {
    if (!gym) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('gym_branding')
        .update({
          // Colors
          color_accent: formData.color_accent,
          color_secondary: formData.color_secondary,
          color_bg: formData.color_bg,
          color_surface: formData.color_surface,
          color_text: formData.color_text,
          color_muted: formData.color_muted,
          color_accent2: formData.color_accent2,
          color_secondary2: formData.color_secondary2,
          color_specialty: formData.color_specialty,
          color_bg_light: formData.color_bg_light,
          color_bg_dark: formData.color_bg_dark,
          color_header: formData.color_header,
          color_footer: formData.color_footer,
          // Typography
          font_header: formData.font_header,
          font_body: formData.font_body,
          // Shape
          border_radius: formData.border_radius,
          theme_mode: formData.theme_mode,
          nav_style: formData.nav_style,
          // Assets
          logo_url: formData.logo_url || null,
          logo_dark_url: formData.logo_dark_url || null,
          favicon_url: formData.favicon_url || null,
          hero_image_url: formData.hero_image_url || null,
          about_image_url: formData.about_image_url || null,
          og_image_url: formData.og_image_url || null,
          // Content
          hero_headline: formData.hero_headline,
          hero_subtitle: formData.hero_subtitle,
          cta_headline: formData.cta_headline,
          cta_subtitle: formData.cta_subtitle,
          about_mission: formData.about_mission || null,
          about_philosophy: formData.about_philosophy || null,
          about_facility: formData.about_facility || null,
          footer_text: formData.footer_text || null,
          // Custom code
          custom_css: formData.custom_css,
          hero_effect: formData.hero_effect,
          // Sections
          visible_sections: formData.visible_sections,
          // Hero cards
          hero_cards: formData.hero_cards,
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

  // ── Feature toggle logic ──
  const isDependencyMet = (feature: FeatureDefinition): boolean => {
    if (!feature.dependencies || feature.dependencies.length === 0) return true;
    return feature.dependencies.every((dep) => features[dep]);
  };

  const getDependents = (featureKey: FeatureKey): FeatureKey[] => {
    return FEATURES.filter((f) => f.dependencies?.includes(featureKey)).map((f) => f.key);
  };

  const toggleFeature = async (featureKey: FeatureKey, enabled: boolean) => {
    if (!gym) return;
    setFeatureLoading(true);
    try {
      const feature = FEATURES.find((f) => f.key === featureKey);
      if (!feature) throw new Error('Feature not found');
      const { error } = await supabase.from('gym_features').upsert(
        {
          gym_id: gym.id,
          feature_key: featureKey,
          enabled,
          enabled_at: enabled ? new Date().toISOString() : null,
          monthly_cost_pence: feature.monthlyPricePence,
        },
        { onConflict: 'gym_id,feature_key' }
      );
      if (error) throw error;
      await refreshTenant();
      setMessage({ type: 'success', text: `${feature.name} ${enabled ? 'enabled' : 'disabled'}` });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error toggling feature:', error);
      setMessage({ type: 'error', text: 'Failed to update feature.' });
    } finally {
      setFeatureLoading(false);
    }
  };

  const handleFeatureToggle = (featureKey: FeatureKey, currentValue: boolean) => {
    const feature = FEATURES.find((f) => f.key === featureKey);
    if (!feature) return;

    if (currentValue) {
      const dependents = getDependents(featureKey);
      const enabledDependents = dependents.filter((dep) => features[dep]);
      const dependentFeatures = enabledDependents
        .map((dep) => FEATURES.find((f) => f.key === dep))
        .filter((f): f is FeatureDefinition => f !== undefined);
      setDisableModalData({ feature, dependents: dependentFeatures });
      return;
    }

    toggleFeature(featureKey, true);
  };

  const handleDisableConfirm = async () => {
    if (!disableModalData) return;
    for (const dep of disableModalData.dependents) {
      await toggleFeature(dep.key, false);
    }
    await toggleFeature(disableModalData.feature.key, false);
    setDisableModalData(null);
  };

  // Accordion helper
  const renderAccordion = (
    id: string,
    title: string,
    icon: React.ReactNode,
    children: React.ReactNode
  ) => (
    <div className={styles.accordion}>
      <button
        className={`${styles.accordionHeader} ${openSections.has(id) ? styles.accordionOpen : ''}`}
        onClick={() => toggleSection(id)}
      >
        <span className={styles.accordionIcon}>{icon}</span>
        <span className={styles.accordionTitle}>{title}</span>
        <span className={styles.accordionChevron}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
        </span>
      </button>
      {openSections.has(id) && (
        <div className={styles.accordionBody}>{children}</div>
      )}
    </div>
  );

  // Color field helper
  const getColorValue = (field: string): string => {
    return (formData as unknown as Record<string, string>)[field] ?? '';
  };

  const renderColorField = (field: string, label: string, description: string) => (
    <div className={styles.colorField} key={field}>
      <label htmlFor={field}>{label}</label>
      <span className={styles.colorLabel}>{description}</span>
      <div className={styles.colorInputWrapper}>
        <input
          type="color"
          id={field}
          value={getColorValue(field)}
          onChange={(e) => handleChange(field, e.target.value)}
        />
        <span className={styles.colorValue}>{getColorValue(field)}</span>
      </div>
    </div>
  );

  return (
    <div className={styles.brandingEditor}>
      {message && (
        <div className={`${styles.brandingMessage} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      {/* ── Color Palette ── */}
      {renderAccordion('colors', 'Color Palette',
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>,
        <div className={styles.colorGrid}>
          {renderColorField('color_accent', 'Primary Brand Color', 'Buttons, links, CTAs')}
          {renderColorField('color_secondary', 'Secondary Color', 'Accents and highlights')}
          {renderColorField('color_bg', 'Background', 'Page background')}
          {renderColorField('color_surface', 'Surface', 'Cards and panels')}
          {renderColorField('color_text', 'Text Color', 'Body text')}
          {renderColorField('color_muted', 'Muted Color', 'Secondary text')}

          <div className={styles.advancedDivider}>Advanced Colors</div>

          {renderColorField('color_accent2', 'Accent 2', 'Secondary accent highlights')}
          {renderColorField('color_secondary2', 'Secondary 2', 'Additional secondary tones')}
          {renderColorField('color_specialty', 'Specialty', 'Specialty program badges')}
          {renderColorField('color_bg_light', 'Background Light', 'Light background areas')}
          {renderColorField('color_bg_dark', 'Background Dark', 'Dark background areas')}
          {renderColorField('color_header', 'Header', 'Navbar & header areas')}
          {renderColorField('color_footer', 'Footer', 'Footer background')}
        </div>
      )}

      {/* ── Typography ── */}
      {renderAccordion('typography', 'Typography',
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" /></svg>,
        <div className={styles.fontGrid}>
          <div className={styles.brandingFormField}>
            <label htmlFor="font_header">Header Font</label>
            <select id="font_header" value={formData.font_header} onChange={(e) => handleChange('font_header', e.target.value)} className={styles.brandingSelect}>
              {AVAILABLE_FONTS.map((font) => (<option key={font} value={font}>{font}</option>))}
            </select>
          </div>
          <div className={styles.brandingFormField}>
            <label htmlFor="font_body">Body Font</label>
            <select id="font_body" value={formData.font_body} onChange={(e) => handleChange('font_body', e.target.value)} className={styles.brandingSelect}>
              {AVAILABLE_FONTS.map((font) => (<option key={font} value={font}>{font}</option>))}
            </select>
          </div>
        </div>
      )}

      {/* ── Shape & Theme ── */}
      {renderAccordion('shape', 'Shape & Theme',
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>,
        <div className={styles.shapeGrid}>
          <div className={styles.brandingFormField}>
            <label htmlFor="border_radius">
              Border Radius
              <span className={styles.brandingSliderValue}>{getBorderRadiusValue()}rem</span>
            </label>
            <input type="range" id="border_radius" min="0" max="2" step="0.125" value={getBorderRadiusValue()} onChange={(e) => handleBorderRadiusChange(parseFloat(e.target.value))} className={styles.brandingSlider} />
          </div>
          <div className={styles.brandingFormField}>
            <label>Theme Mode</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input type="radio" name="theme_mode" value="light" checked={formData.theme_mode === 'light'} onChange={(e) => handleChange('theme_mode', e.target.value)} />
                <span>Light</span>
              </label>
              <label className={styles.radioLabel}>
                <input type="radio" name="theme_mode" value="dark" checked={formData.theme_mode === 'dark'} onChange={(e) => handleChange('theme_mode', e.target.value)} />
                <span>Dark</span>
              </label>
            </div>
          </div>
          <div className={styles.brandingFormField}>
            <label>Navbar Style</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input type="radio" name="nav_style" value="floating" checked={formData.nav_style === 'floating'} onChange={(e) => handleChange('nav_style', e.target.value)} />
                <span>Floating</span>
              </label>
              <label className={styles.radioLabel}>
                <input type="radio" name="nav_style" value="standard" checked={formData.nav_style === 'standard'} onChange={(e) => handleChange('nav_style', e.target.value)} />
                <span>Standard</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ── Assets ── */}
      {renderAccordion('assets', 'Assets & Images',
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>,
        <div className={styles.assetsGrid}>
          <ImageUpload label="Logo" description="Displayed in navbar" value={formData.logo_url} gymId={gym?.id || ''} assetType="logo" onUpload={(url) => handleImageUpload('logo_url', url)} onRemove={() => handleImageRemove('logo_url')} />
          <ImageUpload label="Logo (Dark Mode)" description="Used on dark backgrounds" value={formData.logo_dark_url} gymId={gym?.id || ''} assetType="logo_dark" onUpload={(url) => handleImageUpload('logo_dark_url', url)} onRemove={() => handleImageRemove('logo_dark_url')} />
          <ImageUpload label="Favicon" description="Browser tab icon" value={formData.favicon_url} gymId={gym?.id || ''} assetType="favicon" onUpload={(url) => handleImageUpload('favicon_url', url)} onRemove={() => handleImageRemove('favicon_url')} accept="image/png,image/x-icon,image/svg+xml" />
          <ImageUpload label="Hero Background" description="Hero section background image" value={formData.hero_image_url} gymId={gym?.id || ''} assetType="hero_image" onUpload={(url) => handleImageUpload('hero_image_url', url)} onRemove={() => handleImageRemove('hero_image_url')} />
          <ImageUpload label="About Page Image" description="Image for the about page" value={formData.about_image_url} gymId={gym?.id || ''} assetType="about_image" onUpload={(url) => handleImageUpload('about_image_url', url)} onRemove={() => handleImageRemove('about_image_url')} />
          <ImageUpload label="Social Share Image" description="Preview when sharing links" value={formData.og_image_url} gymId={gym?.id || ''} assetType="og_image" onUpload={(url) => handleImageUpload('og_image_url', url)} onRemove={() => handleImageRemove('og_image_url')} />
        </div>
      )}

      {/* ── Sections ── */}
      {renderAccordion('sections', 'Homepage Sections',
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>,
        <div className={styles.sectionsGrid}>
          {SECTION_OPTIONS.map((section) => (
            <label key={section.key} className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.visible_sections[section.key] !== false}
                onChange={() => handleSectionToggle(section.key)}
              />
              <span>{section.label}</span>
            </label>
          ))}
        </div>
      )}

      {/* ── Features ── */}
      {renderAccordion('features', 'Features',
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
        <div className={styles.featuresGrid}>
          <p className={styles.featuresHint}>
            Toggle features for your gym site. You can also manage these from the Features tab in your Dashboard.
          </p>
          {FEATURES.map((feature) => {
            const isEnabled = features[feature.key];
            const canToggle = isDependencyMet(feature);
            const isDisabled = featureLoading || (!canToggle && !isEnabled);

            return (
              <div key={feature.key} className={`${styles.featureToggleRow} ${isDisabled ? styles.featureToggleDisabled : ''}`}>
                <div className={styles.featureToggleInfo}>
                  <span className={styles.featureToggleName}>{feature.name}</span>
                  {feature.dependencies && !canToggle && (
                    <span className={styles.featureToggleDep}>
                      Requires {feature.dependencies.map((dep) => FEATURES.find((f) => f.key === dep)?.name || dep).join(', ')}
                    </span>
                  )}
                </div>
                <label className={styles.featureSwitch}>
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    disabled={isDisabled}
                    onChange={() => handleFeatureToggle(feature.key, isEnabled)}
                  />
                  <span className={styles.featureSwitchSlider}></span>
                </label>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Content ── */}
      {renderAccordion('content', 'Content',
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>,
        <div className={styles.contentGrid}>
          <div className={styles.brandingFormField}>
            <label htmlFor="hero_headline">Hero Headline</label>
            <input type="text" id="hero_headline" value={formData.hero_headline} onChange={(e) => handleChange('hero_headline', e.target.value)} className={styles.brandingInput} placeholder="Welcome to Your Gym" />
          </div>
          <div className={styles.brandingFormField}>
            <label htmlFor="hero_subtitle">Hero Subtitle</label>
            <input type="text" id="hero_subtitle" value={formData.hero_subtitle} onChange={(e) => handleChange('hero_subtitle', e.target.value)} className={styles.brandingInput} placeholder="Transform your fitness journey..." />
          </div>
          <div className={styles.brandingFormField}>
            <label htmlFor="cta_headline">CTA Headline</label>
            <input type="text" id="cta_headline" value={formData.cta_headline} onChange={(e) => handleChange('cta_headline', e.target.value)} className={styles.brandingInput} placeholder="Ready to Start Your Journey?" />
          </div>
          <div className={styles.brandingFormField}>
            <label htmlFor="cta_subtitle">CTA Subtitle</label>
            <input type="text" id="cta_subtitle" value={formData.cta_subtitle} onChange={(e) => handleChange('cta_subtitle', e.target.value)} className={styles.brandingInput} placeholder="Join us today..." />
          </div>
          <div className={styles.brandingFormField}>
            <label htmlFor="about_mission">About Mission</label>
            <textarea id="about_mission" value={formData.about_mission} onChange={(e) => handleChange('about_mission', e.target.value)} className={styles.brandingTextarea} placeholder="Our mission is to..." rows={3} />
          </div>
          <div className={styles.brandingFormField}>
            <label htmlFor="about_philosophy">About Philosophy</label>
            <textarea id="about_philosophy" value={formData.about_philosophy} onChange={(e) => handleChange('about_philosophy', e.target.value)} className={styles.brandingTextarea} placeholder="Our training philosophy..." rows={3} />
          </div>
          <div className={styles.brandingFormField}>
            <label htmlFor="about_facility">Facility Description</label>
            <textarea id="about_facility" value={formData.about_facility} onChange={(e) => handleChange('about_facility', e.target.value)} className={styles.brandingTextarea} placeholder="Our facility features..." rows={3} />
          </div>
          <div className={styles.brandingFormField}>
            <label htmlFor="footer_text">Footer Text</label>
            <input type="text" id="footer_text" value={formData.footer_text} onChange={(e) => handleChange('footer_text', e.target.value)} className={styles.brandingInput} placeholder="Additional footer text..." />
          </div>
        </div>
      )}

      {/* ── Hero Action Cards ── */}
      {renderAccordion('heroCards', 'Hero Action Cards',
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>,
        <div className={styles.contentGrid}>
          <p className={styles.featuresHint}>
            Customise the title, description, and button text for each action card on your homepage hero. Cards only appear when their feature is enabled.
          </p>

          <div className={styles.heroCardGroup}>
            <span className={styles.heroCardGroupLabel}>Day Pass Card</span>
            <div className={styles.brandingFormField}>
              <label htmlFor="daypass_title">Title</label>
              <input type="text" id="daypass_title" value={formData.hero_cards.daypass.title} onChange={(e) => handleHeroCardChange('daypass', 'title', e.target.value)} className={styles.brandingInput} placeholder="Day Pass" />
            </div>
            <div className={styles.brandingFormField}>
              <label htmlFor="daypass_desc">Description</label>
              <input type="text" id="daypass_desc" value={formData.hero_cards.daypass.description} onChange={(e) => handleHeroCardChange('daypass', 'description', e.target.value)} className={styles.brandingInput} placeholder="Drop in for a single session..." />
            </div>
            <div className={styles.brandingFormField}>
              <label htmlFor="daypass_btn">Button Text</label>
              <input type="text" id="daypass_btn" value={formData.hero_cards.daypass.button} onChange={(e) => handleHeroCardChange('daypass', 'button', e.target.value)} className={styles.brandingInput} placeholder="Book Day Pass" />
            </div>
          </div>

          <div className={styles.heroCardGroup}>
            <span className={styles.heroCardGroupLabel}>Free Trial Card</span>
            <div className={styles.brandingFormField}>
              <label htmlFor="trial_title">Title</label>
              <input type="text" id="trial_title" value={formData.hero_cards.trial.title} onChange={(e) => handleHeroCardChange('trial', 'title', e.target.value)} className={styles.brandingInput} placeholder="Free Trial" />
            </div>
            <div className={styles.brandingFormField}>
              <label htmlFor="trial_desc">Description</label>
              <input type="text" id="trial_desc" value={formData.hero_cards.trial.description} onChange={(e) => handleHeroCardChange('trial', 'description', e.target.value)} className={styles.brandingInput} placeholder="Try your first class on us..." />
            </div>
            <div className={styles.brandingFormField}>
              <label htmlFor="trial_btn">Button Text</label>
              <input type="text" id="trial_btn" value={formData.hero_cards.trial.button} onChange={(e) => handleHeroCardChange('trial', 'button', e.target.value)} className={styles.brandingInput} placeholder="Book Trial Pass" />
            </div>
          </div>

          <div className={styles.heroCardGroup}>
            <span className={styles.heroCardGroupLabel}>Schedule Card</span>
            <div className={styles.brandingFormField}>
              <label htmlFor="schedule_title">Title</label>
              <input type="text" id="schedule_title" value={formData.hero_cards.schedule.title} onChange={(e) => handleHeroCardChange('schedule', 'title', e.target.value)} className={styles.brandingInput} placeholder="Class Schedule" />
            </div>
            <div className={styles.brandingFormField}>
              <label htmlFor="schedule_desc">Description</label>
              <input type="text" id="schedule_desc" value={formData.hero_cards.schedule.description} onChange={(e) => handleHeroCardChange('schedule', 'description', e.target.value)} className={styles.brandingInput} placeholder="View our full timetable..." />
            </div>
            <div className={styles.brandingFormField}>
              <label htmlFor="schedule_btn">Button Text</label>
              <input type="text" id="schedule_btn" value={formData.hero_cards.schedule.button} onChange={(e) => handleHeroCardChange('schedule', 'button', e.target.value)} className={styles.brandingInput} placeholder="View Schedule" />
            </div>
          </div>
        </div>
      )}

      {/* ── Custom Code ── */}
      {renderAccordion('custom', 'Custom Code',
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>,
        <div className={styles.contentGrid}>
          <div className={styles.brandingFormField}>
            <label htmlFor="hero_effect">Hero Effect</label>
            <select id="hero_effect" value={formData.hero_effect} onChange={(e) => handleChange('hero_effect', e.target.value)} className={styles.brandingSelect}>
              {HERO_EFFECTS.map((effect) => (
                <option key={effect.value} value={effect.value}>{effect.label}</option>
              ))}
            </select>
          </div>
          <div className={styles.brandingFormField}>
            <label htmlFor="custom_css">Custom CSS</label>
            <span className={styles.colorLabel}>Add custom styles to your gym site</span>
            <textarea
              id="custom_css"
              value={formData.custom_css}
              onChange={(e) => handleChange('custom_css', e.target.value)}
              className={`${styles.brandingTextarea} ${styles.codeTextarea}`}
              placeholder={`.hero {\n  /* your custom styles */\n}`}
              rows={8}
            />
          </div>
        </div>
      )}

      <div className={styles.brandingActions}>
        <Button variant="ghost" onClick={handleReset} disabled={isLoading}>
          Reset
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {disableModalData && (
        <FeatureDisableModal
          isOpen={true}
          onClose={() => setDisableModalData(null)}
          onConfirm={handleDisableConfirm}
          feature={disableModalData.feature}
          dependentFeatures={disableModalData.dependents}
          isLoading={featureLoading}
        />
      )}
    </div>
  );
};

export default BrandingEditor;
