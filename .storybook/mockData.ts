// Shared dummy data for Storybook stories. Mirrors the shapes in
// src/types/tenant.ts and src/contexts/* so components render realistically
// without a live Supabase backend.
import { DEFAULT_BRANDING } from '../src/contexts/TenantContext';
import type { User } from '../src/contexts/AuthContext';
import type {
  Gym,
  GymBranding,
  GymProgram,
  GymScheduleEntry,
  GymStat,
  GymMembership,
  FeatureKey,
} from '../src/types/tenant';
import type { WorkoutDB, MovementSelection, CrossFitMovement } from '../src/types';
import type { CoachService } from '../src/services/coachServicesService';

const ALL_FEATURE_KEYS: FeatureKey[] = [
  'class_booking',
  'wod_programming',
  'coach_profiles',
  'day_passes',
  'trial_memberships',
  'service_booking',
  'coach_analytics',
  'member_management',
  'custom_domain',
];

export const featureMap = (
  overrides: Partial<Record<FeatureKey, boolean>> = {},
  defaultValue = true,
): Record<FeatureKey, boolean> => {
  const map = {} as Record<FeatureKey, boolean>;
  for (const key of ALL_FEATURE_KEYS) map[key] = defaultValue;
  return { ...map, ...overrides };
};

export const allFeaturesOn = featureMap({}, true);
export const allFeaturesOff = featureMap({}, false);

export const mockBranding: GymBranding = {
  ...DEFAULT_BRANDING,
  id: 'branding-1',
  gym_id: 'gym-1',
  hero_image_url:
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1920&q=80',
  about_image_url:
    'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=1200&q=80',
  gallery_items: [
    { type: 'image', url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80' },
    { type: 'image', url: 'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?auto=format&fit=crop&w=800&q=80' },
    { type: 'image', url: 'https://images.unsplash.com/photo-1554284126-aa88f22d8b74?auto=format&fit=crop&w=800&q=80' },
    { type: 'image', url: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=800&q=80' },
  ],
  about_values: [
    { icon: 'community', title: 'Community First', description: 'We are stronger together. Our members lift each other up, every single day.' },
    { icon: 'trophy', title: 'Results Driven', description: 'Proven programming and real coaching that gets you measurable results.' },
    { icon: 'heart', title: 'All Levels Welcome', description: 'From first-timers to seasoned athletes, every workout scales to you.' },
  ],
};

export const mockGym: Gym = {
  id: 'gym-1',
  name: 'Iron Forge Fitness',
  slug: 'iron-forge',
  owner_id: 'owner-1',
  status: 'active',
  contact_email: 'hello@ironforge.fit',
  contact_phone: '+44 20 7946 0958',
  address_line1: '12 Anvil Street',
  address_line2: 'Unit 4',
  city: 'Manchester',
  postcode: 'M1 2AB',
  country: 'United Kingdom',
  timezone: 'Europe/London',
  website_url: 'https://ironforge.fit',
  google_maps_embed_url: null,
  social_facebook: 'https://facebook.com/ironforge',
  social_instagram: 'https://instagram.com/ironforge',
  social_twitter: 'https://twitter.com/ironforge',
  stripe_account_id: 'acct_mock',
  stripe_account_status: 'active',
  stripe_onboarding_complete: true,
  platform_fee_percent: 2,
  day_pass_price_pence: 1000,
  trial_start_date: null,
  trial_end_date: null,
  trial_member_limit: 5,
  trial_status: 'converted',
  stripe_subscription_id: 'sub_mock',
  stripe_price_id: 'price_mock',
  subscription_status: 'active',
  subscription_cancel_at_period_end: false,
  subscription_current_period_end: '2026-12-31T00:00:00Z',
  custom_domain: 'www.ironforge.fit',
  custom_domain_status: 'verified',
  custom_domain_verified_at: '2026-01-15T00:00:00Z',
  created_at: '2025-06-01T00:00:00Z',
  updated_at: '2026-06-01T00:00:00Z',
};

export const mockPrograms: GymProgram[] = [
  {
    id: 'prog-1', gym_id: 'gym-1', slug: 'group-classes', title: 'Group Classes',
    description: 'High-energy coached sessions blending strength and conditioning. Scaled for every level.',
    tagline: 'Train together, get stronger together', overview: null,
    features: ['Expert coaching', 'All levels welcome', 'Strength + conditioning', 'Community atmosphere'],
    benefits: [], who_is_it_for: [], level: 'all',
    price_pence: 5900, price_unit: 'month', price_note: 'per person',
    schedule_info: '20+ weekly sessions', sort_order: 0, is_active: true,
  },
  {
    id: 'prog-2', gym_id: 'gym-1', slug: 'fundamentals', title: 'Fundamentals',
    description: 'New to training? Learn the core movements safely in a small-group setting before joining classes.',
    tagline: 'Start strong', overview: null,
    features: ['Beginner friendly', 'Small groups', 'Movement coaching', 'Confidence building'],
    benefits: [], who_is_it_for: [], level: 'beginner',
    price_pence: 4900, price_unit: 'month', price_note: '4-week course',
    schedule_info: '3 weekly sessions', sort_order: 1, is_active: true,
  },
  {
    id: 'prog-3', gym_id: 'gym-1', slug: 'competitor', title: 'Competitor Track',
    description: 'Advanced programming for athletes chasing the podium. Olympic lifting, gymnastics and engine work.',
    tagline: 'Built for the podium', overview: null,
    features: ['Advanced programming', 'Olympic lifting', 'Gymnastics skills', 'Performance testing'],
    benefits: [], who_is_it_for: [], level: 'advanced',
    price_pence: 7900, price_unit: 'month', price_note: 'per person',
    schedule_info: '5 weekly sessions', sort_order: 2, is_active: true,
  },
];

const DAYS: GymScheduleEntry['day_of_week'][] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
export const mockSchedule: GymScheduleEntry[] = DAYS.flatMap((day, di) => [
  { id: `sch-${di}-1`, gym_id: 'gym-1', day_of_week: day, start_time: '06:00', end_time: '07:00', class_name: 'Group Class', coach_id: 'coach-1', program_id: 'prog-1', max_capacity: 20, is_active: true },
  { id: `sch-${di}-2`, gym_id: 'gym-1', day_of_week: day, start_time: '12:00', end_time: '13:00', class_name: 'Open Gym', coach_id: null, program_id: null, max_capacity: 15, is_active: true },
  { id: `sch-${di}-3`, gym_id: 'gym-1', day_of_week: day, start_time: '18:00', end_time: '19:00', class_name: 'Group Class', coach_id: 'coach-2', program_id: 'prog-1', max_capacity: 20, is_active: true },
]);

export const mockStats: GymStat[] = [
  { id: 'stat-1', gym_id: 'gym-1', label: 'Weekly Classes', value: 24, suffix: '+', sort_order: 0 },
  { id: 'stat-2', gym_id: 'gym-1', label: 'Certified Coaches', value: 8, suffix: '', sort_order: 1 },
  { id: 'stat-3', gym_id: 'gym-1', label: 'Active Members', value: 350, suffix: '+', sort_order: 2 },
  { id: 'stat-4', gym_id: 'gym-1', label: 'Years Strong', value: 6, suffix: '', sort_order: 3 },
];

export const mockMemberships: GymMembership[] = [
  {
    id: 'mem-1', gym_id: 'gym-1', slug: 'unlimited', display_name: 'Unlimited',
    description: 'Train as often as you like, every day of the week.',
    price_pence: 6900, billing_period: 'month',
    features: ['Unlimited classes', 'Open gym access', 'Free re-tests', 'Member events'],
    stripe_price_id: 'price_unlimited', stripe_product_id: 'prod_unlimited', sort_order: 0, is_active: true,
  },
  {
    id: 'mem-2', gym_id: 'gym-1', slug: 'three-x', display_name: '3x / Week',
    description: 'Perfect for a consistent routine without going all in.',
    price_pence: 4900, billing_period: 'month',
    features: ['12 classes per month', 'Open gym access', 'Member app'],
    stripe_price_id: 'price_3x', stripe_product_id: 'prod_3x', sort_order: 1, is_active: true,
  },
  {
    id: 'mem-3', gym_id: 'gym-1', slug: 'annual', display_name: 'Annual',
    description: 'Best value - two months free when you pay yearly.',
    price_pence: 69000, billing_period: 'year',
    features: ['Unlimited classes', 'Open gym access', '2 months free', 'Priority booking'],
    stripe_price_id: 'price_annual', stripe_product_id: 'prod_annual', sort_order: 2, is_active: true,
  },
];

export const mockMemberUser: User = {
  id: 'user-1', email: 'alex@example.com', name: 'Alex Morgan',
  firstName: 'Alex', lastName: 'Morgan', role: 'member', membershipType: 'unlimited',
  joinDate: '2025-09-01', phone: '+44 7700 900123',
};

export const mockAdminUser: User = {
  ...mockMemberUser,
  id: 'admin-1', email: 'owner@ironforge.fit', name: 'Jordan Blake',
  firstName: 'Jordan', lastName: 'Blake', role: 'admin',
};

export const mockCoachUser: User = {
  ...mockMemberUser,
  id: 'coach-1', email: 'coach@ironforge.fit', name: 'Sam Rivera',
  firstName: 'Sam', lastName: 'Rivera', role: 'coach',
};

// -- Workout / movement fixtures (WOD editor, drawers, view) ----------------
export const mockWorkout: WorkoutDB = {
  id: 'wod-1',
  date: '2026-06-29',
  title: 'Hump Day Hero',
  description: 'A classic couplet to test the engine and the legs.',
  type: 'fortime',
  duration: '20 min',
  rounds: 5,
  movements: ['21-15-9 Thrusters', '21-15-9 Pull-ups'],
  warmup: ['400m run', '2 rounds: 10 air squats, 10 push-ups'],
  strength: ['Back Squat 5-5-5 @ building'],
  metcon: ['21-15-9: Thrusters (43/30kg)', '21-15-9: Pull-ups'],
  cooldown: ['2 min couch stretch each side', 'Foam roll quads'],
  coachNotes: 'Push the pace on the thrusters - aim for unbroken on the round of 9.',
  scalingNotes: 'Scale pull-ups to ring rows; reduce thruster load to maintain cycle speed.',
  status: 'published',
};

const mockMovement = (over: Partial<CrossFitMovement> = {}): CrossFitMovement => ({
  id: 'mv-1', name: 'Back Squat', category: 'weightlifting', subcategory: 'Powerlifting',
  primary_muscle_groups: ['legs'], secondary_muscle_groups: ['core'],
  functional_pattern: 'squat', equipment: ['barbell'], difficulty: 'intermediate',
  description: 'A foundational lower-body strength movement.', scaling_options: ['Goblet squat', 'Box squat'],
  ...over,
});

export const mockSectionMovements: {
  warmup: MovementSelection[]; strength: MovementSelection[]; metcon: MovementSelection[]; cooldown: MovementSelection[];
} = {
  warmup: [{ movement: mockMovement({ id: 'mv-w', name: 'Air Squat', subcategory: 'Accessory', difficulty: 'beginner' }), reps: '15' }],
  strength: [{ movement: mockMovement(), reps: '5', weight: '80kg', notes: 'Across, building' }],
  metcon: [
    { movement: mockMovement({ id: 'mv-t', name: 'Thruster' }), reps: '21-15-9', weight: '43kg' },
    { movement: mockMovement({ id: 'mv-p', name: 'Pull-up', category: 'gymnastic', subcategory: 'Gymnastic Skill', primary_muscle_groups: ['back'], functional_pattern: 'pull' }), reps: '21-15-9' },
  ],
  cooldown: [{ movement: mockMovement({ id: 'mv-c', name: 'Couch Stretch', category: 'skill', primary_muscle_groups: ['legs'], functional_pattern: 'other' }), duration: '2:00' }],
};

export const mockCoachService: CoachService = {
  id: 'svc-1', coachId: 'coach-1', serviceType: 'pt', isActive: true,
  hourlyRate: 45, description: '1-on-1 personal training tailored to your goals.',
  createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  coachName: 'Sam Rivera', coachEmail: 'coach@ironforge.fit',
};
