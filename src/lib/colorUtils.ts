/**
 * Derive a full branding palette from 4 core colors.
 * Generates lighter/darker variants, surface, muted, etc.
 */

interface RGB { r: number; g: number; b: number }

function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }: RGB): string {
  return '#' + [r, g, b].map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0')).join('');
}

function lighten(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex({
    r: r + (255 - r) * amount,
    g: g + (255 - g) * amount,
    b: b + (255 - b) * amount,
  });
}

function darken(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex({
    r: r * (1 - amount),
    g: g * (1 - amount),
    b: b * (1 - amount),
  });
}

function mix(hex1: string, hex2: string, weight: number): string {
  const a = hexToRgb(hex1);
  const b = hexToRgb(hex2);
  return rgbToHex({
    r: a.r * weight + b.r * (1 - weight),
    g: a.g * weight + b.g * (1 - weight),
    b: a.b * weight + b.b * (1 - weight),
  });
}

function getLightness(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return (r * 0.299 + g * 0.587 + b * 0.114) / 255;
}

export interface DerivedPalette {
  color_accent2: string;
  color_secondary2: string;
  color_specialty: string;
  color_surface: string;
  color_muted: string;
  color_bg_light: string;
  color_bg_dark: string;
  color_header: string;
  color_footer: string;
}

export function derivePalette(
  accent: string,
  secondary: string,
  bg: string,
  text: string
): DerivedPalette {
  const isDark = getLightness(bg) < 0.5;

  return {
    color_accent2: lighten(accent, 0.2),
    color_secondary2: lighten(secondary, 0.2),
    color_specialty: mix(accent, secondary, 0.4),
    color_surface: isDark ? lighten(bg, 0.06) : darken(bg, 0.03),
    color_muted: mix(text, bg, 0.45),
    color_bg_light: isDark ? darken(bg, 0.15) : lighten(bg, 0.4),
    color_bg_dark: isDark ? lighten(bg, 0.12) : darken(bg, 0.08),
    color_header: text,
    color_footer: mix(text, bg, 0.4),
  };
}
