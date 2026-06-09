// =============================================================================
// useTenantTheme - Runtime White-Label Theming Engine
//
// THE CORE INSIGHT: Instead of building separate CSS bundles per gym (which
// would require a build step every time a gym changes their branding), we use
// CSS custom properties injected at runtime. Every gym shares the same React
// bundle, but when a gym's page loads, this hook overwrites :root CSS variables
// with the gym's brand colors from the database.
//
// WHAT IT INJECTS:
//   - 13 color tokens + their RGB variants (for rgba() without a preprocessor)
//   - Typography (header + body font families, dynamically loading Google Fonts)
//   - Border radius, theme mode (light/dark), favicon, page title
//   - Arbitrary custom CSS the gym admin can inject via the site builder
//
// WHY CSS CUSTOM PROPERTIES:
//   - All component SCSS uses var(--color-accent) etc., so changing the
//     property value re-themes the ENTIRE app instantly - no prop drilling,
//     no re-renders, pure CSS cascade
//   - Works with SCSS modules - components don't need to know about theming
//   - Cleanup function prevents style leakage when navigating between gyms
//
// RGB VARIANTS: Every color gets both a hex var (--color-accent: #2563eb) and
// an RGB var (--color-accent-rgb: 37, 99, 235). This enables transparency in
// pure CSS: rgba(var(--color-accent-rgb), 0.5) - no Sass color functions needed.
// =============================================================================

import { useEffect } from 'react';
import { useTenant } from '../contexts/TenantContext';
import type { GymBranding } from '../types/tenant';

/**
 * Converts a hex color to its RGB components string (e.g. "255, 79, 31").
 * Every color token gets both a hex variable (--color-accent: #2563eb) and an
 * RGB variable (--color-accent-rgb: 37, 99, 235) so SCSS/CSS can use them
 * in rgba() for transparency without a preprocessor: rgba(var(--color-accent-rgb), 0.5)
 */
export function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  if (clean.length === 3) {
    const r = ((bigint >> 8) & 0xf) * 17;
    const g = ((bigint >> 4) & 0xf) * 17;
    const b = (bigint & 0xf) * 17;
    return `${r}, ${g}, ${b}`;
  }
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r}, ${g}, ${b}`;
}

// Single source of truth for branding-to-CSS mapping. This array is also
// imported by the site builder's BrandingEditor, so the admin UI and the
// runtime theming always stay in sync.
export const COLOR_MAP: { field: keyof GymBranding; cssVar: string }[] = [
  { field: 'color_bg', cssVar: '--color-bg' },
  { field: 'color_bg_light', cssVar: '--color-bg-light' },
  { field: 'color_bg_dark', cssVar: '--color-bg-dark' },
  { field: 'color_surface', cssVar: '--color-surface' },
  { field: 'color_accent', cssVar: '--color-accent' },
  { field: 'color_accent2', cssVar: '--color-accent2' },
  { field: 'color_secondary', cssVar: '--color-secondary' },
  { field: 'color_secondary2', cssVar: '--color-secondary2' },
  { field: 'color_specialty', cssVar: '--color-specialty' },
  { field: 'color_text', cssVar: '--color-text' },
  { field: 'color_muted', cssVar: '--color-muted' },
  { field: 'color_header', cssVar: '--color-header' },
  { field: 'color_footer', cssVar: '--color-footer' },
];

// Curated allowlist of Google Fonts - restricts which fonts gyms can use.
// This prevents arbitrary font injection and keeps bundle predictable.
const AVAILABLE_FONTS = [
  'Inter',
  'Poppins',
  'Open Sans',
  'Roboto',
  'Montserrat',
  'Lato',
  'Oswald',
  'Raleway',
  'Playfair Display',
  'Merriweather',
];

/** Fonts that are system fonts and don't need loading */
const SYSTEM_FONTS = ['Arial', 'Helvetica', 'sans-serif', 'serif'];

// Dynamic font loading - injects a <link> tag for Google Fonts on demand.
// Deduplicates via DOM ID check so switching between gyms that use the
// same font doesn't create duplicate network requests.
export function loadGoogleFont(fontName: string) {
  if (SYSTEM_FONTS.includes(fontName)) return;   // No network needed
  if (!AVAILABLE_FONTS.includes(fontName)) return; // Not on allowlist

  const linkId = `google-font-${fontName.replace(/\s+/g, '-').toLowerCase()}`;
  if (document.getElementById(linkId)) return; // Already loaded

  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@300;400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

/**
 * The core theming hook - reads branding from TenantContext and injects it into
 * the DOM at runtime. This is what makes white-labeling work without separate
 * builds per gym: every gym shares the same bundle, but CSS custom properties
 * on :root are overwritten when a gym's page loads. It also handles fonts
 * (dynamically loading Google Fonts), favicon, page title, and arbitrary
 * custom CSS the gym admin can inject via the site builder.
 *
 * The cleanup function removes all injected styles when the tenant changes,
 * preventing style leakage between gyms during navigation.
 */
export function useTenantTheme() {
  const { gym, branding, isPlatformSite } = useTenant();

  useEffect(() => {
    if (isPlatformSite) return;

    const root = document.documentElement;

    // 1. Inject color CSS variables + RGB versions onto :root.
    // All component styles reference var(--color-accent) etc., so
    // changing these properties re-themes the entire app instantly.
    for (const { field, cssVar } of COLOR_MAP) {
      const value = branding[field] as string;
      if (value) {
        root.style.setProperty(cssVar, value);
        // Also set the RGB channel version for rgba() usage
        try {
          root.style.setProperty(`${cssVar}-rgb`, hexToRgb(value));
        } catch {
          // Skip if not a valid hex
        }
      }
    }

    // 2. Inject typography
    if (branding.font_header) {
      root.style.setProperty('--font-header', `'${branding.font_header}', sans-serif`);
      loadGoogleFont(branding.font_header);
    }
    if (branding.font_body) {
      root.style.setProperty('--font-body', `'${branding.font_body}', sans-serif`);
      loadGoogleFont(branding.font_body);
    }

    // 3. Inject border radius
    if (branding.border_radius) {
      root.style.setProperty('--border-radius', branding.border_radius);
    }

    // 4. Set theme mode attribute
    root.setAttribute('data-theme', branding.theme_mode || 'light');

    // 5. Update page title
    if (gym?.name) {
      document.title = gym.name;
    }

    // 6. Update favicon
    if (branding.favicon_url) {
      let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      favicon.href = branding.favicon_url;
    }

    // 7. Update theme-color meta tag
    let themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!themeMeta) {
      themeMeta = document.createElement('meta');
      themeMeta.name = 'theme-color';
      document.head.appendChild(themeMeta);
    }
    themeMeta.content = branding.color_bg || '#ffffff';

    // 8. Inject custom CSS
    const customStyleId = 'tenant-custom-css';
    let customStyle = document.getElementById(customStyleId) as HTMLStyleElement | null;
    if (branding.custom_css) {
      if (!customStyle) {
        customStyle = document.createElement('style');
        customStyle.id = customStyleId;
        document.head.appendChild(customStyle);
      }
      customStyle.textContent = branding.custom_css;
    } else if (customStyle) {
      customStyle.remove();
    }

    // CLEANUP: Remove all injected styles when tenant changes or unmounts.
    // Without this, navigating from one gym to another would inherit the
    // previous gym's colors until the new theme loaded - a "flash of wrong
    // branding" similar to FOUC. The cleanup runs before the next effect,
    // so there's a clean slate for the new gym's theme injection.
    return () => {
      for (const { cssVar } of COLOR_MAP) {
        root.style.removeProperty(cssVar);
        root.style.removeProperty(`${cssVar}-rgb`);
      }
      root.style.removeProperty('--font-header');
      root.style.removeProperty('--font-body');
      root.style.removeProperty('--border-radius');
      root.removeAttribute('data-theme');
      const existingCustomStyle = document.getElementById(customStyleId);
      if (existingCustomStyle) existingCustomStyle.remove();
    };
  }, [gym, branding, isPlatformSite]);
}

export { AVAILABLE_FONTS };
