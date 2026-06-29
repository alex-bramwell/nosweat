import { useEffect, type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import type { Decorator } from '@storybook/react-vite';
import TenantContext, { DEFAULT_BRANDING } from '../src/contexts/TenantContext';
import { AuthContext, type AuthContextType } from '../src/contexts/AuthContext';
import { RegistrationProvider } from '../src/contexts/RegistrationContext';
import { COLOR_MAP, hexToRgb, loadGoogleFont } from '../src/hooks/useTenantTheme';
import type { GymBranding } from '../src/types/tenant';
import {
  mockGym,
  mockBranding,
  mockPrograms,
  mockSchedule,
  mockStats,
  mockMemberships,
  mockMemberUser,
  allFeaturesOn,
} from './mockData';

// ---------------------------------------------------------------------------
// Theme presets — selectable from the Storybook toolbar. Each is a GymBranding
// the theme decorator injects into :root the same way useTenantTheme does.
// ---------------------------------------------------------------------------
const forgeDark = mockBranding;

const forgeLight: GymBranding = {
  ...mockBranding,
  theme_mode: 'light',
  color_bg: '#ffffff',
  color_bg_light: '#f4f4f7',
  color_bg_dark: '#e7e7ee',
  color_surface: '#ffffff',
  color_accent: '#2563eb',
  color_accent2: '#1e40af',
  color_secondary: '#0ea5e9',
  color_secondary2: '#0284c7',
  color_specialty: '#7c3aed',
  color_text: '#16161d',
  color_muted: '#6b7280',
  color_header: '#0f0f14',
  color_footer: '#16161d',
};

const platformDark: GymBranding = {
  ...mockBranding,
  color_bg: '#0b0f17',
  color_bg_light: '#141a26',
  color_bg_dark: '#070a10',
  color_surface: '#121826',
  color_accent: '#6366f1',
  color_accent2: '#8b5cf6',
  color_secondary: '#22d3ee',
  color_secondary2: '#06b6d4',
};

export const THEMES: Record<string, GymBranding> = {
  'forge-dark': forgeDark,
  'forge-light': forgeLight,
  'platform-dark': platformDark,
};

function applyTheme(branding: GymBranding) {
  const root = document.documentElement;
  for (const { field, cssVar } of COLOR_MAP) {
    const value = branding[field] as string;
    if (!value) continue;
    root.style.setProperty(cssVar, value);
    try {
      root.style.setProperty(`${cssVar}-rgb`, hexToRgb(value));
    } catch {
      /* not a hex value */
    }
  }
  if (branding.font_header) {
    root.style.setProperty('--font-header', `'${branding.font_header}', sans-serif`);
    loadGoogleFont(branding.font_header);
  }
  if (branding.font_body) {
    root.style.setProperty('--font-body', `'${branding.font_body}', sans-serif`);
    loadGoogleFont(branding.font_body);
  }
  if (branding.border_radius) root.style.setProperty('--border-radius', branding.border_radius);
  root.setAttribute('data-theme', branding.theme_mode || 'light');
}

const ThemedCanvas = ({ branding, children }: { branding: GymBranding; children: ReactNode }) => {
  useEffect(() => {
    applyTheme(branding);
    document.body.style.background = 'var(--color-bg)';
    document.body.style.color = 'var(--color-text)';
    document.body.style.fontFamily = 'var(--font-body)';
  }, [branding]);

  return (
    <div
      style={{
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
        fontFamily: 'var(--font-body)',
        minHeight: '100%',
        padding: '1.5rem',
      }}
    >
      {children}
    </div>
  );
};

export const withTheme: Decorator = (Story, context) => {
  const themeKey = (context.globals.theme as string) || 'forge-dark';
  const branding = THEMES[themeKey] || forgeDark;
  return (
    <ThemedCanvas branding={branding}>
      <Story />
    </ThemedCanvas>
  );
};

// ---------------------------------------------------------------------------
// Provider decorator — supplies router + a mocked TenantContext + AuthContext.
// Stories tune behaviour via parameters:
//   parameters.auth   = User | null   (default: logged-in member; null = logged out)
//   parameters.tenant = Partial<TenantContextType> overrides (e.g. { features })
//   parameters.route  = initial MemoryRouter entry (default '/gym/iron-forge')
// ---------------------------------------------------------------------------
const noop = async () => {};

export const withProviders: Decorator = (Story, context) => {
  const themeKey = (context.globals.theme as string) || 'forge-dark';
  const branding = THEMES[themeKey] || forgeDark;

  const authParam = context.parameters.auth;
  const user = authParam === undefined ? mockMemberUser : authParam;

  const authValue: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading: false,
    login: noop,
    signup: noop,
    logout: noop,
    resetPassword: noop,
    changePassword: noop,
    updateProfile: noop,
    loginWithOAuth: noop,
    resendVerificationEmail: noop,
  };

  const tenantValue = {
    gym: mockGym,
    branding: branding || DEFAULT_BRANDING,
    features: allFeaturesOn,
    programs: mockPrograms,
    schedule: mockSchedule,
    stats: mockStats,
    memberships: mockMemberships,
    isLoading: false,
    error: null,
    isPlatformSite: false,
    isCustomDomain: false,
    isDemoGym: false,
    tenantSlug: 'iron-forge',
    refreshTenant: noop,
    ...(context.parameters.tenant || {}),
  };

  const route = context.parameters.route || '/gym/iron-forge';

  return (
    <MemoryRouter initialEntries={[route]}>
      <AuthContext.Provider value={authValue}>
        <TenantContext.Provider value={tenantValue}>
          <RegistrationProvider>
            <Story />
          </RegistrationProvider>
        </TenantContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>
  );
};
