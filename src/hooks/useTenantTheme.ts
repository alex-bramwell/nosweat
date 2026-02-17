import { useEffect } from 'react';
import { useTenant } from '../contexts/TenantContext';
import type { GymBranding } from '../types/tenant';

/**
 * Converts a hex color to its RGB components string (e.g. "255, 79, 31")
 * This allows using CSS variables inside rgba(): rgba(var(--color-accent-rgb), 0.5)
 */
function hexToRgb(hex: string): string {
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

/**
 * Map of branding fields to CSS variable names.
 * Each entry maps a GymBranding color field to its CSS custom property.
 */
const COLOR_MAP: { field: keyof GymBranding; cssVar: string }[] = [
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

/**
 * Curated Google Fonts available for gym branding.
 */
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

function loadGoogleFont(fontName: string) {
  if (SYSTEM_FONTS.includes(fontName)) return;
  if (!AVAILABLE_FONTS.includes(fontName)) return;

  const linkId = `google-font-${fontName.replace(/\s+/g, '-').toLowerCase()}`;
  if (document.getElementById(linkId)) return; // Already loaded

  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@300;400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

/**
 * Hook that reads branding from TenantContext and injects CSS custom properties
 * into document.documentElement.style, updates the page title, favicon, and
 * theme-color meta tag.
 */
export function useTenantTheme() {
  const { gym, branding, isPlatformSite } = useTenant();

  useEffect(() => {
    if (isPlatformSite) return;

    const root = document.documentElement;

    // 1. Inject color CSS variables + RGB versions
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

    // Cleanup: remove injected styles when tenant changes
    return () => {
      for (const { cssVar } of COLOR_MAP) {
        root.style.removeProperty(cssVar);
        root.style.removeProperty(`${cssVar}-rgb`);
      }
      root.style.removeProperty('--font-header');
      root.style.removeProperty('--font-body');
      root.style.removeProperty('--border-radius');
      root.removeAttribute('data-theme');
    };
  }, [gym, branding, isPlatformSite]);
}

export { AVAILABLE_FONTS };
