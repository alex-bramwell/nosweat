import { useEffect, type RefObject } from 'react';
import type { GymBranding } from '../types/tenant';
import { COLOR_MAP, hexToRgb, loadGoogleFont } from './useTenantTheme';

/**
 * Applies branding CSS variables to a specific container element
 * (the builder preview area) rather than to document.documentElement.
 * This scopes live preview changes to the preview pane only.
 */
export function usePreviewTheme(
  containerRef: RefObject<HTMLDivElement | null>,
  draftBranding: Partial<GymBranding> | null
) {
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const cleanup = () => {
      for (const { cssVar } of COLOR_MAP) {
        el.style.removeProperty(cssVar);
        el.style.removeProperty(`${cssVar}-rgb`);
      }
      el.style.removeProperty('--font-header');
      el.style.removeProperty('--font-body');
      el.style.removeProperty('--border-radius');
      el.removeAttribute('data-theme');
    };

    // Always clean up previous inline styles first
    cleanup();

    if (!draftBranding) return cleanup;

    // Apply color CSS variables
    for (const { field, cssVar } of COLOR_MAP) {
      const value = draftBranding[field] as string | undefined;
      if (value) {
        el.style.setProperty(cssVar, value);
        try {
          el.style.setProperty(`${cssVar}-rgb`, hexToRgb(value));
        } catch {
          // skip invalid hex
        }
      }
    }

    // Apply typography
    if (draftBranding.font_header) {
      el.style.setProperty('--font-header', `'${draftBranding.font_header}', sans-serif`);
      loadGoogleFont(draftBranding.font_header);
    }
    if (draftBranding.font_body) {
      el.style.setProperty('--font-body', `'${draftBranding.font_body}', sans-serif`);
      loadGoogleFont(draftBranding.font_body);
    }

    // Apply border radius
    if (draftBranding.border_radius) {
      el.style.setProperty('--border-radius', draftBranding.border_radius);
    }

    // Apply theme mode
    if (draftBranding.theme_mode) {
      el.setAttribute('data-theme', draftBranding.theme_mode);
    }

    return cleanup;
  }, [containerRef, draftBranding]);
}
