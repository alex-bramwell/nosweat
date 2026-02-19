export type FeatureStatus = 'in_development' | 'planned' | 'under_consideration';

export type FeatureCategory = 'mobile' | 'engagement' | 'operations' | 'integrations' | 'commerce';

export interface RoadmapFeature {
  id: string;
  title: string;
  description: string;
  category: FeatureCategory;
  status: FeatureStatus;
}

export interface FeatureVoteSummary {
  featureId: string;
  voteCount: number;
  userHasVoted: boolean;
}

export const STATUS_CONFIG: Record<
  FeatureStatus,
  { label: string; order: number; color: string }
> = {
  in_development: { label: 'In Development', order: 1, color: '#34d399' },
  planned: { label: 'Planned', order: 2, color: '#60a5fa' },
  under_consideration: { label: 'Under Consideration', order: 3, color: '#a78bfa' },
};

export const CATEGORY_LABELS: Record<FeatureCategory, string> = {
  mobile: 'Mobile',
  engagement: 'Community & Engagement',
  operations: 'Operations',
  integrations: 'Integrations',
  commerce: 'Commerce',
};

export const ROADMAP_FEATURES: RoadmapFeature[] = [
  {
    id: 'workout-tracking',
    title: 'Workout Tracking & PR Logging',
    description:
      'Members log weights, times, and reps. Automatically track personal records and progress over time.',
    category: 'engagement',
    status: 'in_development',
  },
  {
    id: 'notifications',
    title: 'Automated Email & SMS Notifications',
    description:
      'Booking reminders, waitlist updates, and class changes sent automatically via email and SMS.',
    category: 'operations',
    status: 'in_development',
  },
  {
    id: 'billing-tiers',
    title: 'Automated Billing & Membership Tiers',
    description:
      'Recurring subscription payments with multiple membership levels. Upgrade, downgrade, and cancel flows.',
    category: 'commerce',
    status: 'in_development',
  },
  {
    id: 'mobile-app',
    title: 'Dedicated Mobile App',
    description:
      'Native iOS and Android app for members to log in, book classes, and view the WOD on the go.',
    category: 'mobile',
    status: 'planned',
  },
  {
    id: 'qr-checkin',
    title: 'QR Code Check-In',
    description:
      'Members scan a QR code on arrival to check in automatically. Track attendance effortlessly.',
    category: 'operations',
    status: 'planned',
  },
  {
    id: 'challenges-leaderboards',
    title: 'Group Challenges & Leaderboards',
    description:
      'Run competitions across your gym. Monthly challenges, leaderboards, and community motivation.',
    category: 'engagement',
    status: 'planned',
  },
  {
    id: 'custom-forms',
    title: 'Custom Forms',
    description:
      'Create waivers, health questionnaires, and onboarding forms. Collect signatures digitally.',
    category: 'operations',
    status: 'planned',
  },
  {
    id: 'shop-points',
    title: 'Coffee Shop / Shop Points',
    description:
      'Loyalty points system for your in-gym shop. Members earn and redeem points on purchases.',
    category: 'commerce',
    status: 'under_consideration',
  },
  {
    id: 'referral-programme',
    title: 'Member Referral Programme',
    description:
      'Reward members who bring new signups. Configurable incentives and tracking built in.',
    category: 'engagement',
    status: 'under_consideration',
  },
  {
    id: 'wearable-integration',
    title: 'Wearable Integration',
    description:
      'Connect Apple Watch, Fitbit, and Garmin to pull heart rate, calories, and workout data.',
    category: 'integrations',
    status: 'under_consideration',
  },
  {
    id: 'merch-store',
    title: 'Merchandise Store',
    description:
      'Sell branded gear, supplements, and accessories through your gym site. Integrated checkout.',
    category: 'commerce',
    status: 'under_consideration',
  },
  {
    id: 'social-feed',
    title: 'Social Feed & Community Wall',
    description:
      'Member posts, photos, and achievement sharing. Build community inside your platform.',
    category: 'engagement',
    status: 'under_consideration',
  },
];
