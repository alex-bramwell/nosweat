// Multi-tenancy types for the SaaS platform

export interface Gym {
  id: string;
  name: string;
  slug: string;
  owner_id: string | null;
  status: 'active' | 'suspended' | 'cancelled' | 'onboarding';
  contact_email: string | null;
  contact_phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  postcode: string | null;
  country: string | null;
  timezone: string;
  website_url: string | null;
  google_maps_embed_url: string | null;
  social_facebook: string | null;
  social_instagram: string | null;
  social_twitter: string | null;
  stripe_account_id: string | null;
  trial_start_date: string | null;
  trial_end_date: string | null;
  trial_member_limit: number;
  trial_status: 'none' | 'active' | 'expired' | 'converted';
  created_at: string;
  updated_at: string;
}

export interface GymBranding {
  id: string;
  gym_id: string;

  // Colors
  color_bg: string;
  color_bg_light: string;
  color_bg_dark: string;
  color_surface: string;
  color_accent: string;
  color_accent2: string;
  color_secondary: string;
  color_secondary2: string;
  color_specialty: string;
  color_text: string;
  color_muted: string;
  color_header: string;
  color_footer: string;

  // Typography
  font_header: string;
  font_body: string;

  // Shape
  border_radius: string;

  // Theme mode
  theme_mode: 'light' | 'dark';

  // Assets
  logo_url: string | null;
  logo_dark_url: string | null;
  favicon_url: string | null;
  hero_image_url: string | null;
  about_image_url: string | null;
  og_image_url: string | null;

  // Content
  hero_headline: string;
  hero_subtitle: string;
  cta_headline: string;
  cta_subtitle: string;
  about_mission: string | null;
  about_philosophy: string | null;
  about_facility: string | null;
  footer_text: string | null;
}

export interface GymFeature {
  id: string;
  gym_id: string;
  feature_key: FeatureKey;
  enabled: boolean;
  enabled_at: string | null;
  monthly_cost_pence: number;
}

export type FeatureKey =
  | 'class_booking'
  | 'wod_programming'
  | 'coach_profiles'
  | 'day_passes'
  | 'trial_memberships'
  | 'service_booking'
  | 'accounting_integration'
  | 'coach_analytics'
  | 'member_management';

export interface GymProgram {
  id: string;
  gym_id: string;
  slug: string;
  title: string;
  description: string | null;
  tagline: string | null;
  overview: string | null;
  features: string[];
  benefits: { title: string; description: string }[];
  who_is_it_for: string[];
  level: 'beginner' | 'intermediate' | 'advanced' | 'all' | null;
  price_pence: number | null;
  price_unit: string | null;
  price_note: string | null;
  schedule_info: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface GymScheduleEntry {
  id: string;
  gym_id: string;
  day_of_week: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  start_time: string;
  end_time: string | null;
  class_name: string;
  coach_id: string | null;
  program_id: string | null;
  max_capacity: number;
  is_active: boolean;
}

export interface GymStat {
  id: string;
  gym_id: string;
  label: string;
  value: number;
  suffix: string | null;
  sort_order: number;
}

export interface GymMembership {
  id: string;
  gym_id: string;
  slug: string;
  display_name: string;
  description: string | null;
  price_pence: number | null;
  billing_period: string;
  features: string[];
  sort_order: number;
  is_active: boolean;
}

export interface TenantData {
  gym: Gym;
  branding: GymBranding;
  features: Record<FeatureKey, boolean>;
  programs: GymProgram[];
  schedule: GymScheduleEntry[];
  stats: GymStat[];
  memberships: GymMembership[];
}
