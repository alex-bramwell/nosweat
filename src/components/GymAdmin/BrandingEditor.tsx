import { useState, useEffect } from 'react';
import { useTenant, DEFAULT_BRANDING } from '../../contexts/TenantContext';
import { supabase } from '../../lib/supabase';
import { AVAILABLE_FONTS } from '../../hooks/useTenantTheme';
import { FEATURES, type FeatureDefinition } from '../../config/features';
import type { FeatureKey, HeroCards, HeroCardKey, AboutValue } from '../../types/tenant';
import { Button } from '../common';
import ImageUpload from './ImageUpload';
import FeatureDisableModal from './FeatureDisableModal';
import { extractPaletteFromImage, type ExtractedPalette } from '../../lib/colorExtractor';
import { derivePalette } from '../../lib/colorUtils';
import { ABOUT_ICON_OPTIONS, DEFAULT_ABOUT_VALUES } from '../../data/aboutValues';
import type { GymBranding } from '../../types/tenant';
import styles from './BrandingEditor.module.scss';

const HERO_EFFECTS = [
  { value: 'none', label: 'None' },
  { value: 'gradient', label: 'Gradient Shift' },
];

const SECTION_LABELS: Record<string, string> = {
  hero: 'Hero Banner',
  programs: 'Programs',
  stats: 'Stats',
  wod: 'Workout of the Day',
  cta: 'Call to Action',
};

const HERO_CARD_LABELS: Record<HeroCardKey, string> = {
  daypass: 'Day Pass',
  trial: 'Free Trial',
  schedule: 'Schedule',
};

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
  const [suggestedPalette, setSuggestedPalette] = useState<ExtractedPalette | null>(null);
  const [smartColourEnabled, setSmartColourEnabled] = useState(true);
  const [showAdvancedColors, setShowAdvancedColors] = useState(false);
  const [gradientLocked, setGradientLocked] = useState({ primary: true, secondary: true });

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
    cta_primary_text: source.cta_primary_text || DEFAULT_BRANDING.cta_primary_text || '',
    cta_secondary_text: source.cta_secondary_text || DEFAULT_BRANDING.cta_secondary_text || '',
    cta_note: source.cta_note ?? DEFAULT_BRANDING.cta_note ?? '',
    about_mission: source.about_mission || '',
    about_philosophy: source.about_philosophy || '',
    about_facility: source.about_facility || '',
    about_values: source.about_values ?? DEFAULT_ABOUT_VALUES,
    footer_text: source.footer_text || '',
    // SEO
    seo_title: source.seo_title || '',
    seo_description: source.seo_description || '',
    // Custom code
    custom_css: source.custom_css || '',
    hero_effect: source.hero_effect || 'none',
    // Sections
    visible_sections: source.visible_sections ?? { hero: true, programs: true, wod: true, cta: true, stats: true },
    section_order: source.section_order ?? DEFAULT_BRANDING.section_order,
    // Hero cards
    hero_cards: source.hero_cards ?? DEFAULT_BRANDING.hero_cards,
    hero_card_order: source.hero_card_order ?? DEFAULT_BRANDING.hero_card_order,
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
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-derive when a core color changes
      if (['color_accent', 'color_secondary', 'color_bg', 'color_text'].includes(field)) {
        const derived = derivePalette(next.color_accent, next.color_secondary, next.color_bg, next.color_text);
        // Always derive gradient ends if locked
        if (gradientLocked.primary) next.color_accent2 = derived.color_accent2;
        if (gradientLocked.secondary) next.color_secondary2 = derived.color_secondary2;
        // Derive remaining palette colors unless user is fine-tuning
        if (!showAdvancedColors) {
          next.color_specialty = derived.color_specialty;
          next.color_surface = derived.color_surface;
          next.color_muted = derived.color_muted;
          next.color_bg_light = derived.color_bg_light;
          next.color_bg_dark = derived.color_bg_dark;
          next.color_header = derived.color_header;
          next.color_footer = derived.color_footer;
        }
      }
      return next;
    });
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

  const handleHeroCardEnabledToggle = (card: HeroCardKey) => {
    setFormData((prev) => ({
      ...prev,
      hero_cards: {
        ...prev.hero_cards,
        [card]: { ...prev.hero_cards[card], enabled: prev.hero_cards[card].enabled === false },
      },
    }));
  };

  // Move an item up/down within an ordered string array stored on formData.
  const moveInOrder = (field: 'section_order' | 'hero_card_order', index: number, dir: -1 | 1) => {
    setFormData((prev) => {
      const arr = [...prev[field]];
      const target = index + dir;
      if (target < 0 || target >= arr.length) return prev;
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return { ...prev, [field]: arr };
    });
  };

  const handleAboutValueChange = (index: number, field: keyof AboutValue, value: string) => {
    setFormData((prev) => {
      const next = prev.about_values.map((v, i) => (i === index ? { ...v, [field]: value } : v));
      return { ...prev, about_values: next };
    });
  };

  const handleAboutValueMove = (index: number, dir: -1 | 1) => {
    setFormData((prev) => {
      const arr = [...prev.about_values];
      const target = index + dir;
      if (target < 0 || target >= arr.length) return prev;
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return { ...prev, about_values: arr };
    });
  };

  const handleAboutValueAdd = () => {
    setFormData((prev) => ({
      ...prev,
      about_values: [...prev.about_values, { icon: ABOUT_ICON_OPTIONS[0], title: 'New value', description: 'Describe what makes your gym different.' }],
    }));
  };

  const handleAboutValueRemove = (index: number) => {
    setFormData((prev) => ({ ...prev, about_values: prev.about_values.filter((_, i) => i !== index) }));
  };

  const handleImageUpload = async (field: string, url: string) => {
    setFormData((prev) => ({ ...prev, [field]: url }));
    // Extract colors when a logo is uploaded and Smart Colour is enabled
    if (field === 'logo_url' && smartColourEnabled) {
      const palette = await extractPaletteFromImage(url);
      if (palette) setSuggestedPalette(palette);
    }
  };

  const applySuggestedPalette = () => {
    if (!suggestedPalette) return;
    setFormData((prev) => ({ ...prev, ...suggestedPalette }));
    setSuggestedPalette(null);
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
          cta_primary_text: formData.cta_primary_text || null,
          cta_secondary_text: formData.cta_secondary_text || null,
          cta_note: formData.cta_note || null,
          about_mission: formData.about_mission || null,
          about_philosophy: formData.about_philosophy || null,
          about_facility: formData.about_facility || null,
          about_values: formData.about_values,
          footer_text: formData.footer_text || null,
          // SEO
          seo_title: formData.seo_title || null,
          seo_description: formData.seo_description || null,
          // Custom code
          custom_css: formData.custom_css,
          hero_effect: formData.hero_effect,
          // Sections + order
          visible_sections: formData.visible_sections,
          section_order: formData.section_order,
          // Hero cards
          hero_cards: formData.hero_cards,
          hero_card_order: formData.hero_card_order,
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
      <div className={styles.colorFieldHeader}>
        <label htmlFor={field}>{label}</label>
        <span className={styles.colorLabel}>{description}</span>
      </div>
      <div className={styles.colorInputWrapper}>
        <div className={styles.colorSwatchOuter}>
          <div className={styles.colorSwatchInner} style={{ background: getColorValue(field) }} />
          <input
            type="color"
            id={field}
            value={getColorValue(field)}
            onChange={(e) => handleChange(field, e.target.value)}
            className={styles.colorNativeInput}
          />
        </div>
        <div className={styles.colorHexField}>
          <span className={styles.colorHexPrefix}>#</span>
          <input
            type="text"
            value={getColorValue(field).replace('#', '')}
            onChange={(e) => {
              const hex = e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
              if (hex.length === 6) handleChange(field, `#${hex}`);
              else handleChange(field, `#${hex}`);
            }}
            className={styles.colorHexInput}
            maxLength={6}
            spellCheck={false}
          />
        </div>
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

      {suggestedPalette && (
        <div className={styles.paletteSuggestion}>
          <div className={styles.paletteSuggestionHeader}>
            <div className={styles.paletteSuggestionBrand}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>
              <span className={styles.paletteSuggestionTitle}>Smart Colour</span>
            </div>
            <button className={styles.paletteSuggestionDismiss} onClick={() => setSuggestedPalette(null)} aria-label="Dismiss">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
          <p className={styles.paletteSuggestionDesc}>We extracted these colours from your logo. Apply them to your site palette?</p>
          <div className={styles.paletteSuggestionSwatches}>
            {Object.entries(suggestedPalette).map(([key, hex]) => (
              <div key={key} className={styles.paletteSwatch} style={{ background: hex }} title={hex} />
            ))}
          </div>
          <div className={styles.paletteSuggestionActions}>
            <Button variant="primary" size="compact" onClick={applySuggestedPalette}>Apply Colours</Button>
            <Button variant="ghost" size="compact" onClick={() => setSuggestedPalette(null)}>No thanks</Button>
          </div>
        </div>
      )}

      {/* Starter design notice */}
      <div className={styles.starterNotice}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <p>This is a starter design. Customise the colours, fonts, and content below to make it yours.</p>
      </div>

      {/* ━━ GLOBAL ━━ */}
      <div className={styles.sectionGroupHeading}>Global</div>

      {/* ── Color Palette ── */}
      {renderAccordion('colors', 'Color Palette',
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>,
        <div className={styles.colorGrid}>
          {/* Smart Colour toggle */}
          <div className={styles.smartColourCard}>
            <label className={styles.smartColourToggle}>
              <input
                type="checkbox"
                checked={smartColourEnabled}
                onChange={(e) => setSmartColourEnabled(e.target.checked)}
              />
              <span className={styles.smartColourSlider}></span>
              <span className={styles.smartColourLabel}>Use Smart Colour</span>
            </label>
            <div className={styles.smartColourInfo}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
              <span>Upload your logo in Brand Assets to auto-generate a matching palette.</span>
            </div>
          </div>

          {/* Core colors — just 4 picks */}
          {renderColorField('color_accent', 'Primary', 'Buttons, links, CTAs')}
          {renderColorField('color_secondary', 'Secondary', 'Menu, badges, accents')}
          {renderColorField('color_bg', 'Background', 'Page background')}
          {renderColorField('color_text', 'Text', 'Body text')}

          {/* Gradient rows */}
          <div className={styles.gradientSection}>
            <span className={styles.gradientSectionLabel}>Gradients</span>

            {/* Primary gradient */}
            <div className={styles.gradientRow}>
              <div className={styles.gradientPreviewBar} style={{ background: `linear-gradient(135deg, ${formData.color_accent} 0%, ${formData.color_accent2 || formData.color_accent} 100%)` }} />
              <div className={styles.gradientControls}>
                <span className={styles.gradientLabel}>Primary</span>
                <button
                  type="button"
                  className={`${styles.gradientLockBtn} ${gradientLocked.primary ? styles.gradientLocked : ''}`}
                  onClick={() => {
                    const next = !gradientLocked.primary;
                    setGradientLocked((prev) => ({ ...prev, primary: next }));
                    if (next) {
                      // Re-lock: derive accent2 from accent
                      const derived = derivePalette(formData.color_accent, formData.color_secondary, formData.color_bg, formData.color_text);
                      setFormData((prev) => ({ ...prev, color_accent2: derived.color_accent2 }));
                    }
                  }}
                  title={gradientLocked.primary ? 'Auto-derived from Primary — click to customise' : 'Custom — click to lock to Primary'}
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {gradientLocked.primary
                      ? <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>
                      : <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" /></>}
                  </svg>
                </button>
                {!gradientLocked.primary && (
                  <div className={styles.gradientPickerInline}>
                    <div className={styles.colorSwatchOuter} style={{ width: '1.5rem', height: '1.5rem' }}>
                      <div className={styles.colorSwatchInner} style={{ background: formData.color_accent2 || formData.color_accent }} />
                      <input
                        type="color"
                        value={formData.color_accent2 || formData.color_accent}
                        onChange={(e) => handleChange('color_accent2', e.target.value)}
                        className={styles.colorNativeInput}
                      />
                    </div>
                    <div className={styles.colorHexField}>
                      <span className={styles.colorHexPrefix}>#</span>
                      <input
                        type="text"
                        value={(formData.color_accent2 || formData.color_accent).replace('#', '')}
                        onChange={(e) => {
                          const hex = e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
                          if (hex.length === 6) handleChange('color_accent2', `#${hex}`);
                        }}
                        className={styles.colorHexInput}
                        maxLength={6}
                        spellCheck={false}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Secondary gradient */}
            <div className={styles.gradientRow}>
              <div className={styles.gradientPreviewBar} style={{ background: `linear-gradient(135deg, ${formData.color_secondary} 0%, ${formData.color_secondary2 || formData.color_secondary} 100%)` }} />
              <div className={styles.gradientControls}>
                <span className={styles.gradientLabel}>Secondary</span>
                <button
                  type="button"
                  className={`${styles.gradientLockBtn} ${gradientLocked.secondary ? styles.gradientLocked : ''}`}
                  onClick={() => {
                    const next = !gradientLocked.secondary;
                    setGradientLocked((prev) => ({ ...prev, secondary: next }));
                    if (next) {
                      const derived = derivePalette(formData.color_accent, formData.color_secondary, formData.color_bg, formData.color_text);
                      setFormData((prev) => ({ ...prev, color_secondary2: derived.color_secondary2 }));
                    }
                  }}
                  title={gradientLocked.secondary ? 'Auto-derived from Secondary — click to customise' : 'Custom — click to lock to Secondary'}
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {gradientLocked.secondary
                      ? <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>
                      : <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" /></>}
                  </svg>
                </button>
                {!gradientLocked.secondary && (
                  <div className={styles.gradientPickerInline}>
                    <div className={styles.colorSwatchOuter} style={{ width: '1.5rem', height: '1.5rem' }}>
                      <div className={styles.colorSwatchInner} style={{ background: formData.color_secondary2 || formData.color_secondary }} />
                      <input
                        type="color"
                        value={formData.color_secondary2 || formData.color_secondary}
                        onChange={(e) => handleChange('color_secondary2', e.target.value)}
                        className={styles.colorNativeInput}
                      />
                    </div>
                    <div className={styles.colorHexField}>
                      <span className={styles.colorHexPrefix}>#</span>
                      <input
                        type="text"
                        value={(formData.color_secondary2 || formData.color_secondary).replace('#', '')}
                        onChange={(e) => {
                          const hex = e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
                          if (hex.length === 6) handleChange('color_secondary2', `#${hex}`);
                        }}
                        className={styles.colorHexInput}
                        maxLength={6}
                        spellCheck={false}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Fine-tune toggle */}
          <button
            type="button"
            className={styles.advancedToggle}
            onClick={() => setShowAdvancedColors(!showAdvancedColors)}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points={showAdvancedColors ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} />
            </svg>
            {showAdvancedColors ? 'Hide advanced colours' : 'Fine-tune colours'}
          </button>

          {showAdvancedColors && (
            <>
              {renderColorField('color_specialty', 'Specialty', 'Special badges & highlights')}
              {renderColorField('color_surface', 'Surface', 'Cards and panels')}
              {renderColorField('color_muted', 'Muted Text', 'Secondary text')}
              {renderColorField('color_bg_light', 'Background Light', 'Lighter background areas')}
              {renderColorField('color_bg_dark', 'Background Dark', 'Darker background areas')}
              {renderColorField('color_header', 'Header', 'Navbar text')}
              {renderColorField('color_footer', 'Footer', 'Footer text')}
            </>
          )}
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

      {/* ── Brand Assets ── */}
      {renderAccordion('assets', 'Brand Assets',
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>,
        <div className={styles.assetsGrid}>
          <ImageUpload label="Logo" description="Smart Colour will suggest a palette from your logo" value={formData.logo_url} gymId={gym?.id || ''} assetType="logo" onUpload={(url) => handleImageUpload('logo_url', url)} onRemove={() => handleImageRemove('logo_url')} />
          <ImageUpload label="Logo (Dark Mode)" description="Used on dark backgrounds" value={formData.logo_dark_url} gymId={gym?.id || ''} assetType="logo_dark" onUpload={(url) => handleImageUpload('logo_dark_url', url)} onRemove={() => handleImageRemove('logo_dark_url')} />
          <ImageUpload label="Favicon" description="Browser tab icon" value={formData.favicon_url} gymId={gym?.id || ''} assetType="favicon" onUpload={(url) => handleImageUpload('favicon_url', url)} onRemove={() => handleImageRemove('favicon_url')} accept="image/png,image/x-icon,image/svg+xml" />
          <ImageUpload label="Social Share Image" description="Preview when sharing links" value={formData.og_image_url} gymId={gym?.id || ''} assetType="og_image" onUpload={(url) => handleImageUpload('og_image_url', url)} onRemove={() => handleImageRemove('og_image_url')} />
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

      {/* ━━ HOMEPAGE ━━ */}
      <div className={styles.sectionGroupHeading}>Homepage</div>

      {/* ── Sections: visibility + order ── */}
      {renderAccordion('sections', 'Sections & Order',
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>,
        <div className={styles.contentGrid}>
          <p className={styles.featuresHint}>Show, hide and reorder the sections on your homepage. Use the arrows to move a section up or down.</p>
          {formData.section_order.map((key, i) => (
            <div key={key} className={styles.orderRow}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.visible_sections[key] !== false}
                  onChange={() => handleSectionToggle(key)}
                />
                <span>{SECTION_LABELS[key] ?? key}</span>
              </label>
              <div className={styles.orderControls}>
                <button type="button" className={styles.orderButton} aria-label={`Move ${SECTION_LABELS[key] ?? key} up`} disabled={i === 0} onClick={() => moveInOrder('section_order', i, -1)}>↑</button>
                <button type="button" className={styles.orderButton} aria-label={`Move ${SECTION_LABELS[key] ?? key} down`} disabled={i === formData.section_order.length - 1} onClick={() => moveInOrder('section_order', i, 1)}>↓</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Hero ── */}
      {renderAccordion('hero', 'Hero',
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>,
        <div className={styles.contentGrid}>
          <div className={styles.brandingFormField}>
            <label htmlFor="hero_headline">Headline</label>
            <input type="text" id="hero_headline" value={formData.hero_headline} onChange={(e) => handleChange('hero_headline', e.target.value)} className={styles.brandingInput} placeholder="Welcome to Your Gym" />
          </div>
          <div className={styles.brandingFormField}>
            <label htmlFor="hero_subtitle">Subtitle</label>
            <input type="text" id="hero_subtitle" value={formData.hero_subtitle} onChange={(e) => handleChange('hero_subtitle', e.target.value)} className={styles.brandingInput} placeholder="Transform your fitness journey..." />
          </div>
          <ImageUpload label="Background Image" description="Background image for the hero section" value={formData.hero_image_url} gymId={gym?.id || ''} assetType="hero_image" onUpload={(url) => handleImageUpload('hero_image_url', url)} onRemove={() => handleImageRemove('hero_image_url')} />
          <div className={styles.brandingFormField}>
            <label htmlFor="hero_effect">Background Effect</label>
            <select id="hero_effect" value={formData.hero_effect} onChange={(e) => handleChange('hero_effect', e.target.value)} className={styles.brandingSelect}>
              {HERO_EFFECTS.map((effect) => (
                <option key={effect.value} value={effect.value}>{effect.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* ── Hero Action Cards ── */}
      {renderAccordion('heroCards', 'Hero Action Cards',
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>,
        <div className={styles.contentGrid}>
          <p className={styles.featuresHint}>
            Toggle, reorder and edit each action card on your homepage hero. A card also requires its feature to be enabled to appear (e.g. the Day Pass card needs Day Passes on).
          </p>

          {(formData.hero_card_order as HeroCardKey[]).map((card, i) => (
            <div key={card} className={styles.heroCardGroup}>
              <div className={styles.heroCardGroupHeader}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.hero_cards[card].enabled !== false}
                    onChange={() => handleHeroCardEnabledToggle(card)}
                  />
                  <span className={styles.heroCardGroupLabel}>{HERO_CARD_LABELS[card]} Card</span>
                </label>
                <div className={styles.orderControls}>
                  <button type="button" className={styles.orderButton} aria-label={`Move ${HERO_CARD_LABELS[card]} up`} disabled={i === 0} onClick={() => moveInOrder('hero_card_order', i, -1)}>↑</button>
                  <button type="button" className={styles.orderButton} aria-label={`Move ${HERO_CARD_LABELS[card]} down`} disabled={i === formData.hero_card_order.length - 1} onClick={() => moveInOrder('hero_card_order', i, 1)}>↓</button>
                </div>
              </div>
              <div className={styles.brandingFormField}>
                <label htmlFor={`${card}_title`}>Title</label>
                <input type="text" id={`${card}_title`} value={formData.hero_cards[card].title} onChange={(e) => handleHeroCardChange(card, 'title', e.target.value)} className={styles.brandingInput} />
              </div>
              <div className={styles.brandingFormField}>
                <label htmlFor={`${card}_desc`}>Description</label>
                <input type="text" id={`${card}_desc`} value={formData.hero_cards[card].description} onChange={(e) => handleHeroCardChange(card, 'description', e.target.value)} className={styles.brandingInput} />
              </div>
              <div className={styles.brandingFormField}>
                <label htmlFor={`${card}_btn`}>Button Text</label>
                <input type="text" id={`${card}_btn`} value={formData.hero_cards[card].button} onChange={(e) => handleHeroCardChange(card, 'button', e.target.value)} className={styles.brandingInput} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── CTA Section ── */}
      {renderAccordion('cta', 'Call to Action',
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
        <div className={styles.contentGrid}>
          <div className={styles.brandingFormField}>
            <label htmlFor="cta_headline">Headline</label>
            <input type="text" id="cta_headline" value={formData.cta_headline} onChange={(e) => handleChange('cta_headline', e.target.value)} className={styles.brandingInput} placeholder="Ready to Start Your Journey?" />
          </div>
          <div className={styles.brandingFormField}>
            <label htmlFor="cta_subtitle">Subtitle</label>
            <input type="text" id="cta_subtitle" value={formData.cta_subtitle} onChange={(e) => handleChange('cta_subtitle', e.target.value)} className={styles.brandingInput} placeholder="Join us today..." />
          </div>
          <div className={styles.brandingFormField}>
            <label htmlFor="cta_primary_text">Primary Button</label>
            <input type="text" id="cta_primary_text" value={formData.cta_primary_text} onChange={(e) => handleChange('cta_primary_text', e.target.value)} className={styles.brandingInput} placeholder="Book Free Trial" />
          </div>
          <div className={styles.brandingFormField}>
            <label htmlFor="cta_secondary_text">Secondary Button</label>
            <input type="text" id="cta_secondary_text" value={formData.cta_secondary_text} onChange={(e) => handleChange('cta_secondary_text', e.target.value)} className={styles.brandingInput} placeholder="Contact Us" />
          </div>
          <div className={styles.brandingFormField}>
            <label htmlFor="cta_note">Small Note (under buttons)</label>
            <input type="text" id="cta_note" value={formData.cta_note} onChange={(e) => handleChange('cta_note', e.target.value)} className={styles.brandingInput} placeholder="No commitment required..." />
          </div>
        </div>
      )}

      {/* ━━ ABOUT PAGE ━━ */}
      <div className={styles.sectionGroupHeading}>About Page</div>

      {/* ── About Content ── */}
      {renderAccordion('about', 'About Content',
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>,
        <div className={styles.contentGrid}>
          <div className={styles.brandingFormField}>
            <label htmlFor="about_mission">Mission</label>
            <textarea id="about_mission" value={formData.about_mission} onChange={(e) => handleChange('about_mission', e.target.value)} className={styles.brandingTextarea} placeholder="Our mission is to..." rows={3} />
          </div>
          <div className={styles.brandingFormField}>
            <label htmlFor="about_philosophy">Philosophy</label>
            <textarea id="about_philosophy" value={formData.about_philosophy} onChange={(e) => handleChange('about_philosophy', e.target.value)} className={styles.brandingTextarea} placeholder="Our training philosophy..." rows={3} />
          </div>
          <div className={styles.brandingFormField}>
            <label htmlFor="about_facility">Facility Description</label>
            <textarea id="about_facility" value={formData.about_facility} onChange={(e) => handleChange('about_facility', e.target.value)} className={styles.brandingTextarea} placeholder="Our facility features..." rows={3} />
          </div>
          <ImageUpload label="About Page Image" description="Image for the about page" value={formData.about_image_url} gymId={gym?.id || ''} assetType="about_image" onUpload={(url) => handleImageUpload('about_image_url', url)} onRemove={() => handleImageRemove('about_image_url')} />
        </div>
      )}

      {/* ── About Value Cards ── */}
      {renderAccordion('aboutValues', 'About: Value Cards',
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>,
        <div className={styles.contentGrid}>
          <p className={styles.featuresHint}>The "What makes us different" cards on your About page. Edit, reorder, add or remove them.</p>
          {formData.about_values.map((value, i) => (
            <div key={i} className={styles.heroCardGroup}>
              <div className={styles.heroCardGroupHeader}>
                <span className={styles.heroCardGroupLabel}>Card {i + 1}</span>
                <div className={styles.orderControls}>
                  <button type="button" className={styles.orderButton} aria-label="Move card up" disabled={i === 0} onClick={() => handleAboutValueMove(i, -1)}>↑</button>
                  <button type="button" className={styles.orderButton} aria-label="Move card down" disabled={i === formData.about_values.length - 1} onClick={() => handleAboutValueMove(i, 1)}>↓</button>
                  <button type="button" className={styles.orderButton} aria-label="Remove card" onClick={() => handleAboutValueRemove(i)}>✕</button>
                </div>
              </div>
              <div className={styles.brandingFormField}>
                <label htmlFor={`av_icon_${i}`}>Icon</label>
                <select id={`av_icon_${i}`} value={value.icon} onChange={(e) => handleAboutValueChange(i, 'icon', e.target.value)} className={styles.brandingSelect}>
                  {ABOUT_ICON_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className={styles.brandingFormField}>
                <label htmlFor={`av_title_${i}`}>Title</label>
                <input type="text" id={`av_title_${i}`} value={value.title} onChange={(e) => handleAboutValueChange(i, 'title', e.target.value)} className={styles.brandingInput} />
              </div>
              <div className={styles.brandingFormField}>
                <label htmlFor={`av_desc_${i}`}>Description</label>
                <input type="text" id={`av_desc_${i}`} value={value.description} onChange={(e) => handleAboutValueChange(i, 'description', e.target.value)} className={styles.brandingInput} />
              </div>
            </div>
          ))}
          <Button variant="ghost" onClick={handleAboutValueAdd} disabled={isLoading}>+ Add card</Button>
        </div>
      )}

      {/* ━━ SITE-WIDE ━━ */}
      <div className={styles.sectionGroupHeading}>Site-wide</div>

      {/* ── Footer ── */}
      {renderAccordion('footer', 'Footer',
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="15" x2="21" y2="15" /></svg>,
        <div className={styles.contentGrid}>
          <div className={styles.brandingFormField}>
            <label htmlFor="footer_text">Footer Text</label>
            <input type="text" id="footer_text" value={formData.footer_text} onChange={(e) => handleChange('footer_text', e.target.value)} className={styles.brandingInput} placeholder="Additional footer text..." />
          </div>
        </div>
      )}

      {/* ── SEO ── */}
      {renderAccordion('seo', 'SEO & Sharing',
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
        <div className={styles.contentGrid}>
          <p className={styles.featuresHint}>How your site shows up in search results and link previews. Leave blank to use your gym name.</p>
          <div className={styles.brandingFormField}>
            <label htmlFor="seo_title">Page Title</label>
            <input type="text" id="seo_title" value={formData.seo_title} onChange={(e) => handleChange('seo_title', e.target.value)} className={styles.brandingInput} placeholder={gym?.name || 'Your Gym'} />
          </div>
          <div className={styles.brandingFormField}>
            <label htmlFor="seo_description">Meta Description</label>
            <textarea id="seo_description" value={formData.seo_description} onChange={(e) => handleChange('seo_description', e.target.value)} className={styles.brandingTextarea} rows={2} placeholder="A short description of your gym for search engines and social previews." />
          </div>
        </div>
      )}

      {/* ── Custom Code ── */}
      {renderAccordion('custom', 'Custom CSS',
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>,
        <div className={styles.contentGrid}>
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
