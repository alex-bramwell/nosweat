import type { FeatureKey } from '../types/tenant';

export interface FeatureDefinition {
  key: FeatureKey;
  name: string;
  description: string;
  monthlyPricePence: number;
  category: 'core' | 'coaching' | 'business';
  icon: string;
  illustrationKey: string;
  dependencies?: FeatureKey[];
}

export const FEATURES: FeatureDefinition[] = [
  {
    key: 'class_booking',
    name: 'Class Booking',
    description:
      'Let members browse your schedule and book classes online. Includes waitlist management and capacity limits.',
    monthlyPricePence: 1000,
    category: 'core',
    icon: '📅',
    illustrationKey: 'schedule',
  },
  {
    key: 'wod_programming',
    name: 'Workout Programming',
    description:
      'Create and publish daily workouts (WODs). Coaches can program with the movement database and members see the daily workout.',
    monthlyPricePence: 1000,
    category: 'coaching',
    icon: '💪',
    illustrationKey: 'wod',
  },
  {
    key: 'coach_profiles',
    name: 'Coach Profiles',
    description:
      'Dedicated coach profile pages with bios, certifications, specialties, and photos. Builds trust with potential members.',
    monthlyPricePence: 1000,
    category: 'coaching',
    icon: '👤',
    illustrationKey: 'coachProfile',
  },
  {
    key: 'day_passes',
    name: 'Day Passes',
    description:
      'Sell day passes online with Stripe payment processing. Drop-in visitors can buy and book in one flow.',
    monthlyPricePence: 1000,
    category: 'core',
    icon: '🎫',
    illustrationKey: 'dayPass',
    dependencies: ['class_booking'],
  },
  {
    key: 'trial_memberships',
    name: 'Free Trials',
    description:
      'Offer free trial classes with card authorisation. Convert visitors to members with a friction-free trial experience.',
    monthlyPricePence: 1000,
    category: 'core',
    icon: '🆓',
    illustrationKey: 'dayPass',
    dependencies: ['class_booking'],
  },
  {
    key: 'service_booking',
    name: 'Service Booking',
    description:
      'Let members book PT sessions, sports massage, nutrition consultations, and other coach services with online payment.',
    monthlyPricePence: 1000,
    category: 'coaching',
    icon: '🗓️',
    illustrationKey: 'serviceBooking',
    dependencies: ['coach_profiles'],
  },
  {
    key: 'accounting_integration',
    name: 'Accounting Integration',
    description:
      'Sync payments and invoices automatically with QuickBooks or Xero. Save hours on bookkeeping.',
    monthlyPricePence: 1000,
    category: 'business',
    icon: '🧾',
    illustrationKey: 'accounting',
  },
  {
    key: 'coach_analytics',
    name: 'Coach Analytics',
    description:
      'Track workout volume, movement frequency, and programming balance with visual analytics dashboards.',
    monthlyPricePence: 1000,
    category: 'coaching',
    icon: '📊',
    illustrationKey: 'analytics',
    dependencies: ['wod_programming'],
  },
  {
    key: 'member_management',
    name: 'Member Management',
    description:
      'Admin panel to manage members, update roles, invite coaches, and oversee your gym community.',
    monthlyPricePence: 1000,
    category: 'business',
    icon: '👥',
    illustrationKey: 'memberManagement',
  },
];

/** Get feature definition by key */
export function getFeatureDefinition(key: FeatureKey): FeatureDefinition | undefined {
  return FEATURES.find((f) => f.key === key);
}

/** Group features by category */
export function getFeaturesByCategory(): Record<string, FeatureDefinition[]> {
  const grouped: Record<string, FeatureDefinition[]> = {
    core: [],
    coaching: [],
    business: [],
  };
  for (const f of FEATURES) {
    grouped[f.category].push(f);
  }
  return grouped;
}
