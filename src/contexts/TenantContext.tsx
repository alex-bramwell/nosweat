import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
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
// Default branding (clean white-label light theme)
// -------------------------------------------------------------------
const DEFAULT_BRANDING: GymBranding = {
  id: '',
  gym_id: '',
  color_bg: '#ffffff',
  color_bg_light: '#f8f9fa',
  color_bg_dark: '#e9ecef',
  color_surface: '#ffffff',
  color_accent: '#2563eb',
  color_accent2: '#dc2626',
  color_secondary: '#0891b2',
  color_secondary2: '#059669',
  color_specialty: '#7c3aed',
  color_text: '#1f2937',
  color_muted: '#6b7280',
  color_header: '#111827',
  color_footer: '#111827',
  font_header: 'Inter',
  font_body: 'Inter',
  border_radius: '0.5rem',
  theme_mode: 'light',
  logo_url: null,
  logo_dark_url: null,
  favicon_url: null,
  hero_image_url: null,
  about_image_url: null,
  og_image_url: null,
  hero_headline: 'Welcome to Your Gym',
  hero_subtitle: 'Transform your fitness journey with expert coaching and a supportive community.',
  cta_headline: 'Ready to Start Your Journey?',
  cta_subtitle: 'Join us today and experience the difference. Your first class is free!',
  about_mission: null,
  about_philosophy: null,
  about_facility: null,
  footer_text: null,
};

// -------------------------------------------------------------------
// All feature keys (default all disabled)
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

// Convenience hook for checking a single feature
export const useFeature = (featureKey: FeatureKey): boolean => {
  const { features } = useTenant();
  return features[featureKey] ?? false;
};

// -------------------------------------------------------------------
// Slug resolution
// -------------------------------------------------------------------
function resolveSlugFromUrl(): string | null {
  // 1. Check query parameter (development convenience): ?tenant=comet
  const urlParams = new URLSearchParams(window.location.search);
  const tenantParam = urlParams.get('tenant');
  if (tenantParam) {
    return tenantParam;
  }

  // 2. Check path-based routing: /gym/:slug
  const pathMatch = window.location.pathname.match(/^\/gym\/([^/]+)/);
  if (pathMatch) {
    return pathMatch[1];
  }

  return null; // Platform site
}

// -------------------------------------------------------------------
// Gym path helper hook
// -------------------------------------------------------------------
export const useGymPath = () => {
  const { tenantSlug } = useTenant();
  return (path: string) => {
    if (!tenantSlug) return path;
    // Normalize: gymPath('/schedule') → '/gym/comet/schedule'
    // gymPath('/') → '/gym/comet'
    const cleanPath = path === '/' ? '' : path;
    return `/gym/${tenantSlug}${cleanPath}`;
  };
};

// -------------------------------------------------------------------
// Provider
// -------------------------------------------------------------------
interface TenantProviderProps {
  children: ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
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

  const tenantSlug = resolveSlugFromUrl();
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

      // 2. Fetch all related data in parallel
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

      // Set branding (fallback to defaults)
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
