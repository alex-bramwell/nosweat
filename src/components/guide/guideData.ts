export interface GuideFeature {
  id: string;
  title: string;
  description: string;
  bullets?: string[];
  illustrationKey: string;
}

export interface GuideSectionGroup {
  id: string;
  title: string;
  subtitle: string;
  background: 'dark' | 'light';
  features: GuideFeature[];
}

export const GUIDE_SECTIONS: GuideSectionGroup[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    subtitle: 'From sign-up to a live, branded site - no agency, no waiting.',
    background: 'light',
    features: [
      {
        id: 'signup',
        title: 'Sign up, name your gym, go live',
        description:
          'Create your account and choose a name for your gym, and you immediately get a branded URL at nosweat.fitness/gym/your-name. No DNS configuration, no hosting to manage. Customise it and publish whenever you are ready.',
        bullets: ['Branded URL included', 'No technical setup', 'Go live the same day'],
        illustrationKey: 'signup',
      },
      {
        id: 'branding',
        title: 'Make it yours with full brand control',
        description:
          'Upload your logo, pick your colours, choose fonts, and select a theme. Every member-facing page reflects your gym\'s identity. Your site should look like you, not like a template.',
        bullets: ['Custom colours and fonts', 'Light or dark theme', 'Logo and imagery upload'],
        illustrationKey: 'branding',
      },
      {
        id: 'toggles',
        title: 'Choose exactly what you need',
        description:
          'Every feature is included in your plan, but you decide what is active. Toggle on class booking, WOD programming, day passes, and more. Turn features on and off any time.',
        bullets: ['All features included', 'Toggle on or off any time', 'Smart dependency handling'],
        illustrationKey: 'toggles',
      },
    ],
  },
  {
    id: 'core-features',
    title: 'Core Features',
    subtitle: 'The tools your gym runs on, every single day.',
    background: 'dark',
    features: [
      {
        id: 'scheduling',
        title: 'A schedule your members will actually use',
        description:
          'Build a weekly timetable with class types, coaches, capacity limits, and automatic waitlists. Members book in one tap. Coaches see who is coming. You see it all from your admin panel.',
        bullets: ['Weekly recurring timetable', 'Capacity limits with waitlists', 'One-tap mobile booking'],
        illustrationKey: 'schedule',
      },
      {
        id: 'wod',
        title: 'Program workouts your athletes will love',
        description:
          'Create daily workouts with the built-in movement database. Structure sessions with warmup, strength, metcon, and cooldown blocks. Members see the WOD on their dashboard each morning.',
        bullets: ['Structured workout builder', 'Movement database built in', 'Published to members daily'],
        illustrationKey: 'wod',
      },
      {
        id: 'coaches',
        title: 'Put your coaches front and centre',
        description:
          'Each coach gets a dedicated profile page with their bio, photo, certifications, specialties, and bookable services. Build trust with prospective members before they walk through the door.',
        bullets: ['Dedicated coach pages', 'Certifications and specialties', 'Direct service booking'],
        illustrationKey: 'coachProfile',
      },
    ],
  },
  {
    id: 'member-experience',
    title: 'Member Experience',
    subtitle: 'Everything your members need, right at their fingertips.',
    background: 'light',
    features: [
      {
        id: 'dashboard',
        title: 'One place for everything your members need',
        description:
          'Members log in and see today\'s workout, upcoming bookings, and their profile. They can book classes, purchase day passes, and manage their account from a single dashboard.',
        bullets: ['Daily WOD at a glance', 'Upcoming bookings overview', 'Profile and settings'],
        illustrationKey: 'dashboard',
      },
      {
        id: 'day-passes',
        title: 'Convert visitors into members',
        description:
          'Let anyone buy a day pass or claim a free trial directly from your site. Stripe powers the payment flow. Free trials collect a card for authorisation without charging. The lowest-friction way to get people through your door.',
        bullets: ['Stripe-powered payments', 'Free trial with card auth', 'Zero friction for visitors'],
        illustrationKey: 'dayPass',
      },
      {
        id: 'service-booking',
        title: 'Let members book 1-on-1 services online',
        description:
          'Personal training, sports massage, nutrition consultations. Whatever your coaches offer, members pick a coach, choose a time, and book online. Coaches manage their own availability.',
        bullets: ['PT, massage, nutrition and more', 'Coach-managed availability', 'Online payment at booking'],
        illustrationKey: 'serviceBooking',
      },
    ],
  },
  {
    id: 'business-tools',
    title: 'Business Tools',
    subtitle: 'Run your gym like a business, not a hobby.',
    background: 'dark',
    features: [
      {
        id: 'members',
        title: 'Know your members, manage your team',
        description:
          'View all members in one admin panel. Assign roles for admin, coach, and member. Send invitations by email. See join dates, activity, and manage access. Everything you need to run your community.',
        bullets: ['Full member directory', 'Role-based access control', 'Email invitations'],
        illustrationKey: 'memberManagement',
      },
      {
        id: 'analytics',
        title: 'Programming insights that make you a better coach',
        description:
          'Track muscle group distribution, monitor weekly volume, and visualise programming balance across time domains. See at a glance whether your programming is well-rounded or over-indexing on certain movements.',
        bullets: ['Muscle group tracking', 'Weekly volume analysis', 'Programming balance score'],
        illustrationKey: 'analytics',
      },
    ],
  },
];

export const PHOTO_DIVIDERS = [
  {
    url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1600&q=80',
    alt: 'Athlete performing barbell exercise',
  },
  {
    url: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=1600&q=80',
    alt: 'Group fitness class in action',
  },
  {
    url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=1600&q=80',
    alt: 'Gym business operations',
  },
];

export const GUIDE_NAV_ITEMS = GUIDE_SECTIONS.map((s) => ({
  id: s.id,
  label: s.title,
}));
