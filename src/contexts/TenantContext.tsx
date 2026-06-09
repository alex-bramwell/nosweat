// =============================================================================
// TenantContext - The Core Multi-Tenancy Data Layer
//
// ARCHITECTURE: This context is the single source of truth for "which gym are
// we looking at, and what does it look like?" Every gym-facing component reads
// from this context rather than fetching its own data.
//
// DATA FLOW:
//   1. SLUG RESOLUTION: Determines the gym from the URL. Two strategies:
//      - Path-based: /gym/:slug (production)
//      - Query param: ?tenant=slug (development convenience)
//      - Custom domain: slug injected via initialSlug prop from useDomainResolution()
//
//   2. PARALLEL FETCH: Once we have a slug, we fetch the gym record, then
//      fire 6 queries in parallel via Promise.all (branding, features, programs,
//      schedule, stats, memberships). This cuts the loading waterfall from
//      6 sequential round trips to just 2 (gym lookup + everything else).
//
//   3. MERGE WITH DEFAULTS: Branding merges DB values on top of DEFAULT_BRANDING,
//      so gyms only need to customize the fields they care about. Features default
//      to all-disabled, so new gyms start minimal and progressively unlock.
//
// EXPOSED HOOKS:
//   - useTenant()   - full context (gym, branding, features, programs, etc.)
//   - useFeature()  - single feature flag check (used by FeatureGate)
//   - useGymPath()  - path builder that adapts to custom domain vs path-based routing
// =============================================================================

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type {
  Gym,
  GymBranding,
  GymFeature,
  GymProgram,
  GymScheduleEntry,
  GymStat,
  GymMembership,
  FeatureKey,
} from '../types/tenant';

// -------------------------------------------------------------------
// Default branding - the fallback theme applied when a gym hasn't
// customized their branding yet. Every gym starts with this clean
// baseline, and any fields they override in the database merge on top.
// Uses Zinc neutrals + Blue-600 accent for WCAG AA contrast compliance.
// -------------------------------------------------------------------
export const DEFAULT_BRANDING: GymBranding = {
  id: '',
  gym_id: '',
  color_bg: '#181820',
  color_bg_light: '#2a2a38',
  color_bg_dark: '#0f0f14',
  color_surface: '#23232e',
  color_accent: '#ff4f1f',
  color_accent2: '#ff1f4f',
  color_secondary: '#00d4ff',
  color_secondary2: '#00ff88',
  color_specialty: '#9d4edd',
  color_text: '#ffffff',
  color_muted: '#888888',
  color_header: '#ffffff',
  color_footer: '#ffffff',
  font_header: 'Poppins',
  font_body: 'Open Sans',
  border_radius: '1rem',
  theme_mode: 'dark',
  nav_style: 'floating',
  logo_url: null,
  logo_dark_url: null,
  favicon_url: null,
  hero_image_url: null,
  about_image_url: null,
  og_image_url: null,
  hero_headline: 'Welcome to Your Gym',
  hero_subtitle: 'Where strength meets community. Transform your fitness journey with expert coaching, world-class programming, and a supportive atmosphere.',
  cta_headline: 'Ready to Start Your Journey?',
  cta_subtitle: 'Join us today and experience the difference. Your first class is free!',
  about_mission: 'We believe fitness is more than just a workout - it\'s a lifestyle. Our mission is to create a welcoming, inclusive community where athletes of all levels can push their limits, achieve their goals, and become the best version of themselves.',
  about_philosophy: 'Built on the principles of functional fitness, community support, and expert coaching. Whether you\'re a complete beginner or a seasoned athlete, we\'re here to guide you every step of the way.',
  about_facility: null,
  footer_text: null,
  custom_css: '',
  hero_effect: 'none',
  visible_sections: { hero: true, programs: true, wod: true, cta: true, stats: true },
  hero_cards: {
    daypass: { title: 'Day Pass', description: 'Drop in for a single session and experience our community', button: 'Book Day Pass' },
    trial: { title: 'Free Trial', description: 'New here? Try your first class on us, no commitment', button: 'Book Trial Pass' },
    schedule: { title: 'Class Schedule', description: 'View our full timetable and find a class that fits your day', button: 'View Schedule' },
  },
};

// -------------------------------------------------------------------
// Feature keys - each gym can toggle these on/off independently.
// Defaulting to all-disabled means new gyms start minimal and
// progressively enable features, which also maps to pricing tiers.
// -------------------------------------------------------------------
const ALL_FEATURE_KEYS: FeatureKey[] = [
  'class_booking',
  'wod_programming',
  'coach_profiles',
  'day_passes',
  'trial_memberships',
  'service_booking',
  'accounting_integration',
  'coach_analytics',
  'member_management',
  'custom_domain',
];

function buildFeatureMap(features: GymFeature[]): Record<FeatureKey, boolean> {
  const map = {} as Record<FeatureKey, boolean>;
  for (const key of ALL_FEATURE_KEYS) {
    map[key] = false;
  }
  for (const f of features) {
    if (ALL_FEATURE_KEYS.includes(f.feature_key)) {
      map[f.feature_key] = f.enabled;
    }
  }
  return map;
}

// -------------------------------------------------------------------
// Context interface
// -------------------------------------------------------------------
interface TenantContextType {
  // Gym data
  gym: Gym | null;
  branding: GymBranding;
  features: Record<FeatureKey, boolean>;
  programs: GymProgram[];
  schedule: GymScheduleEntry[];
  stats: GymStat[];
  memberships: GymMembership[];

  // State
  isLoading: boolean;
  error: string | null;
  isPlatformSite: boolean;
  isCustomDomain: boolean;
  tenantSlug: string | null;

  // Actions
  refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const useTenant = (): TenantContextType => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

// Convenience hook - components check a single feature without importing the
// full tenant context. Returns false for unknown keys, so new features are
// always opt-in. Used by FeatureGate component and navbar link visibility.
export const useFeature = (featureKey: FeatureKey): boolean => {
  const { features } = useTenant();
  return features[featureKey] ?? false;
};

// -------------------------------------------------------------------
// Slug resolution - determines which gym we're looking at from the URL.
// Two strategies: query param (?tenant=comet) for dev convenience, and
// path-based (/gym/comet) for production. Returns null for platform pages.
// -------------------------------------------------------------------
function resolveSlugFromLocation(pathname: string, search: string): string | null {
  // 1. Check query parameter (development convenience): ?tenant=comet
  const urlParams = new URLSearchParams(search);
  const tenantParam = urlParams.get('tenant');
  if (tenantParam) {
    return tenantParam;
  }

  // 2. Check path-based routing: /gym/:slug
  const pathMatch = pathname.match(/^\/gym\/([^/]+)/);
  if (pathMatch) {
    return pathMatch[1];
  }

  return null; // Platform site
}

// -------------------------------------------------------------------
// Gym path helper - the abstraction that makes custom domains work
// transparently. Every <Link> and navigate() call in the app uses this
// instead of hardcoding paths.
//
// Examples:
//   Standard mode:  gymPath('/schedule') -> '/gym/comet/schedule'
//   Custom domain:  gymPath('/schedule') -> '/schedule'
//
// This means components never need to know which routing mode they're in.
// The path prefix is determined once (by isCustomDomain flag from TenantProvider)
// and applied consistently everywhere.
// -------------------------------------------------------------------
export const useGymPath = () => {
  const { tenantSlug, isCustomDomain } = useTenant();
  return (path: string) => {
    if (!tenantSlug) return path;
    // Custom domain: paths are root-relative (no /gym/:slug prefix)
    if (isCustomDomain) return path;
    // Standard: gymPath('/schedule') -> '/gym/comet/schedule'
    const cleanPath = path === '/' ? '' : path;
    return `/gym/${tenantSlug}${cleanPath}`;
  };
};

// -------------------------------------------------------------------
// Provider
// -------------------------------------------------------------------
interface TenantProviderProps {
  children: ReactNode;
  initialSlug?: string | null;
  customDomain?: boolean;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children, initialSlug, customDomain = false }) => {
  const location = useLocation();
  const [gym, setGym] = useState<Gym | null>(null);
  const [branding, setBranding] = useState<GymBranding>(DEFAULT_BRANDING);
  const [features, setFeatures] = useState<Record<FeatureKey, boolean>>(
    buildFeatureMap([])
  );
  const [programs, setPrograms] = useState<GymProgram[]>([]);
  const [schedule, setSchedule] = useState<GymScheduleEntry[]>([]);
  const [stats, setStats] = useState<GymStat[]>([]);
  const [memberships, setMemberships] = useState<GymMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tenantSlug = initialSlug !== undefined ? initialSlug : resolveSlugFromLocation(location.pathname, location.search);
  const isPlatformSite = tenantSlug === null;

  const fetchTenantData = async () => {
    if (isPlatformSite) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // 1. Fetch the gym by slug
      const { data: gymData, error: gymError } = await supabase
        .from('gyms')
        .select('*')
        .eq('slug', tenantSlug)
        .eq('status', 'active')
        .single();

      if (gymError || !gymData) {
        setError(`Gym "${tenantSlug}" not found`);
        setIsLoading(false);
        return;
      }

      setGym(gymData as Gym);
      const gymId = gymData.id;

      // 2. PERFORMANCE: Fetch all related data in parallel. A single Promise.all
      // fires 6 queries simultaneously instead of sequentially. This cuts the
      // loading waterfall from ~6 round trips (~600ms) to ~1 round trip (~100ms),
      // which is critical for perceived performance on initial gym page load.
      const [
        brandingResult,
        featuresResult,
        programsResult,
        scheduleResult,
        statsResult,
        membershipsResult,
      ] = await Promise.all([
        supabase
          .from('gym_branding')
          .select('*')
          .eq('gym_id', gymId)
          .single(),
        supabase
          .from('gym_features')
          .select('*')
          .eq('gym_id', gymId),
        supabase
          .from('gym_programs')
          .select('*')
          .eq('gym_id', gymId)
          .eq('is_active', true)
          .order('sort_order'),
        supabase
          .from('gym_schedule')
          .select('*')
          .eq('gym_id', gymId)
          .eq('is_active', true)
          .order('start_time'),
        supabase
          .from('gym_stats')
          .select('*')
          .eq('gym_id', gymId)
          .order('sort_order'),
        supabase
          .from('gym_memberships')
          .select('*')
          .eq('gym_id', gymId)
          .eq('is_active', true)
          .order('sort_order'),
      ]);

      // Merge branding with defaults - spread order means DB values override
      // defaults, so gyms only need to set the fields they want to customize.
      if (brandingResult.data) {
        setBranding({ ...DEFAULT_BRANDING, ...brandingResult.data } as GymBranding);
      }

      // Set features
      if (featuresResult.data) {
        setFeatures(buildFeatureMap(featuresResult.data as GymFeature[]));
      }

      // Set programs
      if (programsResult.data) {
        setPrograms(programsResult.data as GymProgram[]);
      }

      // Set schedule
      if (scheduleResult.data) {
        setSchedule(scheduleResult.data as GymScheduleEntry[]);
      }

      // Set stats
      if (statsResult.data) {
        setStats(statsResult.data as GymStat[]);
      }

      // Set memberships
      if (membershipsResult.data) {
        setMemberships(membershipsResult.data as GymMembership[]);
      }
    } catch (err) {
      console.error('Error fetching tenant data:', err);
      setError('Failed to load gym data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenantData();
  }, [tenantSlug]);

  const value: TenantContextType = {
    gym,
    branding,
    features,
    programs,
    schedule,
    stats,
    memberships,
    isLoading,
    error,
    isPlatformSite,
    isCustomDomain: customDomain,
    tenantSlug,
    refreshTenant: fetchTenantData,
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};

export default TenantContext;
