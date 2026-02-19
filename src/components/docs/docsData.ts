export type CalloutType = 'tip' | 'note' | 'warning';

export interface DocsStep {
  text: string;
  detail?: string;
}

export interface DocsCallout {
  type: CalloutType;
  text: string;
}

export interface DocsExternalLink {
  label: string;
  url: string;
}

export interface DocsTopic {
  id: string;
  title: string;
  summary: string;
  illustrationKey: string;
  steps: DocsStep[];
  callouts?: DocsCallout[];
  relatedTopics?: string[];
  externalLinks?: DocsExternalLink[];
}

export interface DocsSection {
  id: string;
  title: string;
  topics: DocsTopic[];
}

export interface DocsNavItem {
  sectionId: string;
  sectionTitle: string;
  topics: { id: string; title: string }[];
}

// ── Docs Content ──

export const DOCS_SECTIONS: DocsSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    topics: [
      {
        id: 'signup',
        title: 'Sign Up & Get Your URL',
        summary:
          'Create your account and get a branded URL at nosweat.fitness/gym/your-name instantly.',
        illustrationKey: 'signup',
        steps: [
          { text: 'Go to nosweat.fitness and click "Get Started".' },
          { text: 'Enter your email address and create a password.' },
          {
            text: 'Choose a name for your gym.',
            detail:
              'This becomes your URL slug, e.g. nosweat.fitness/gym/iron-den. Spaces are converted to hyphens automatically.',
          },
          { text: 'Confirm your email address via the verification link.' },
          { text: 'Your site is live immediately after verification.' },
        ],
        callouts: [
          {
            type: 'tip',
            text: 'Pick a short, memorable name. Avoid special characters — hyphens are added automatically for spaces.',
          },
          {
            type: 'note',
            text: 'Your gym URL can be changed later from the Admin panel under Settings.',
          },
        ],
        relatedTopics: ['branding', 'toggles'],
      },
      {
        id: 'branding',
        title: 'Brand Customisation',
        summary:
          'Upload your logo, pick colours, choose fonts, and select a theme so your site looks like you — not a template.',
        illustrationKey: 'branding',
        steps: [
          { text: 'Open the Admin panel and navigate to "Branding".' },
          {
            text: 'Upload your gym logo.',
            detail:
              'Supported formats: PNG, SVG, or JPG. Recommended minimum size: 400 x 200px.',
          },
          { text: 'Choose your primary and secondary brand colours using the colour picker.' },
          { text: 'Select a font pairing from the available options.' },
          { text: 'Toggle between light and dark theme.' },
          { text: 'Click "Save" to apply. Your public site updates immediately.' },
        ],
        callouts: [
          {
            type: 'tip',
            text: 'Use a transparent PNG for your logo so it looks good on both light and dark themes.',
          },
        ],
        relatedTopics: ['signup', 'toggles'],
      },
      {
        id: 'toggles',
        title: 'Feature Toggles',
        summary:
          'Every feature is included in your plan. Toggle features on or off to control what appears on your site.',
        illustrationKey: 'toggles',
        steps: [
          { text: 'Open the Admin panel and navigate to "Features".' },
          { text: 'You\'ll see a list of all available features with toggle switches.' },
          {
            text: 'Flip a toggle to enable or disable a feature.',
            detail:
              'Some features have dependencies. For example, Day Passes requires Class Booking to be enabled first.',
          },
          { text: 'Disabled features are hidden from your public site and member dashboard.' },
        ],
        callouts: [
          {
            type: 'note',
            text: 'All features are included at no extra cost. Disabling a feature simply hides it from your site.',
          },
          {
            type: 'warning',
            text: 'Disabling a feature that others depend on will also disable those dependent features. You\'ll be warned before this happens.',
          },
        ],
        relatedTopics: ['signup'],
      },
    ],
  },
  {
    id: 'core-features',
    title: 'Core Features',
    topics: [
      {
        id: 'scheduling',
        title: 'Class Scheduling',
        summary:
          'Build a weekly timetable with class types, coaches, capacity limits, and automatic waitlists.',
        illustrationKey: 'schedule',
        steps: [
          { text: 'Navigate to "Schedule" in the Admin panel.' },
          {
            text: 'Click "Add Class" to create a new class slot.',
            detail: 'Set the class name, day, time, duration, and assign a coach.',
          },
          { text: 'Set the maximum capacity for the class.' },
          {
            text: 'Enable or disable the waitlist for when classes are full.',
            detail: 'When a spot opens, the next person on the waitlist is notified automatically.',
          },
          { text: 'Click "Save". The class appears on your public timetable immediately.' },
          { text: 'Repeat for each class in your weekly schedule.' },
        ],
        callouts: [
          {
            type: 'tip',
            text: 'Classes repeat weekly by default. You can cancel individual sessions without affecting the recurring schedule.',
          },
          {
            type: 'note',
            text: 'Members can book classes from their dashboard or your public site. Coaches see bookings in their panel.',
          },
        ],
        relatedTopics: ['day-passes', 'coaches'],
      },
      {
        id: 'wod',
        title: 'Workout Programming',
        summary:
          'Create daily workouts with a built-in movement database. Members see the WOD on their dashboard each morning.',
        illustrationKey: 'wod',
        steps: [
          { text: 'Navigate to "Programming" in the Admin panel.' },
          { text: 'Select a date to programme a workout for.' },
          {
            text: 'Build your workout using the block editor.',
            detail:
              'Structure sessions with Warmup, Strength, Metcon, and Cooldown blocks. Each block can have multiple movements.',
          },
          {
            text: 'Search the built-in movement database to add exercises.',
            detail:
              'The database includes hundreds of common gym movements with muscle group tags.',
          },
          { text: 'Add rep schemes, weights, and time domains for each movement.' },
          { text: 'Click "Publish" to make the workout visible to members.' },
        ],
        callouts: [
          {
            type: 'tip',
            text: 'You can programme workouts days or weeks in advance. They become visible to members on the scheduled date.',
          },
        ],
        relatedTopics: ['analytics', 'dashboard'],
      },
      {
        id: 'coaches',
        title: 'Coach Profiles',
        summary:
          'Each coach gets a dedicated profile page with their bio, certifications, specialties, and bookable services.',
        illustrationKey: 'coachProfile',
        steps: [
          { text: 'Invite a coach by email from the Admin panel under "Members".' },
          { text: 'Once they accept, change their role to "Coach" using the role dropdown.' },
          {
            text: 'The coach can now edit their own profile.',
            detail: 'They can add a bio, profile photo, certifications, and specialties.',
          },
          { text: 'Coach profiles are listed on your public site under the "Coaches" section.' },
          { text: 'If Service Booking is enabled, members can book directly from the coach\'s profile.' },
        ],
        callouts: [
          {
            type: 'note',
            text: 'Coaches manage their own profiles and availability. You retain admin control to edit any profile.',
          },
        ],
        relatedTopics: ['service-booking', 'members'],
      },
    ],
  },
  {
    id: 'member-experience',
    title: 'Member Experience',
    topics: [
      {
        id: 'dashboard',
        title: 'Member Dashboard',
        summary:
          'Members log in and see today\'s workout, upcoming bookings, and their profile — all in one place.',
        illustrationKey: 'dashboard',
        steps: [
          { text: 'Members log in at your gym URL (e.g. nosweat.fitness/gym/your-name).' },
          { text: 'The dashboard shows today\'s published workout at the top.' },
          { text: 'Upcoming class bookings are displayed with date, time, and coach.' },
          { text: 'Members can manage their profile, view booking history, and update their details.' },
          { text: 'Quick action buttons allow booking a class or viewing the full schedule.' },
        ],
        callouts: [
          {
            type: 'tip',
            text: 'The dashboard adapts based on which features you have enabled. Only active features appear.',
          },
        ],
        relatedTopics: ['scheduling', 'wod'],
      },
      {
        id: 'day-passes',
        title: 'Day Passes & Trials',
        summary:
          'Let anyone buy a day pass or claim a free trial directly from your site. Stripe powers the payment flow.',
        illustrationKey: 'dayPass',
        steps: [
          { text: 'Enable "Day Passes" from the Feature Toggles panel.' },
          {
            text: 'Configure your day pass pricing in the Admin panel under "Day Passes".',
            detail: 'Set the price, currency, and any restrictions (e.g. valid class types).',
          },
          { text: 'Optionally enable free trials with card authorisation.' },
          { text: 'Visitors can purchase day passes from your public site without creating an account.' },
          { text: 'After purchase, they select a class to attend from the available schedule.' },
        ],
        callouts: [
          {
            type: 'note',
            text: 'Day pass payments are processed via Stripe. You\'ll need to connect your Stripe account in Settings.',
          },
          {
            type: 'tip',
            text: 'Free trials collect card details for authorisation but don\'t charge. Great for converting visitors into members.',
          },
        ],
        relatedTopics: ['scheduling', 'toggles'],
      },
      {
        id: 'service-booking',
        title: 'Service Booking',
        summary:
          'Personal training, sports massage, nutrition consultations — members pick a coach, choose a time, and book online.',
        illustrationKey: 'serviceBooking',
        steps: [
          { text: 'Enable "Service Booking" from the Feature Toggles panel.' },
          {
            text: 'Coaches set up their available services in their coach profile.',
            detail:
              'Each service has a name, description, duration, and price.',
          },
          { text: 'Coaches manage their own availability by setting weekly time slots.' },
          { text: 'Members browse available services and coaches on the public site.' },
          { text: 'They select a coach, pick an available slot, and pay online.' },
        ],
        callouts: [
          {
            type: 'note',
            text: 'Service Booking requires Coach Profiles to be enabled. You\'ll be prompted to enable it if needed.',
          },
        ],
        relatedTopics: ['coaches', 'day-passes'],
      },
    ],
  },
  {
    id: 'business-tools',
    title: 'Business Tools',
    topics: [
      {
        id: 'members',
        title: 'Member Management',
        summary:
          'View all members in one admin panel. Assign roles, send invitations, and manage access.',
        illustrationKey: 'memberManagement',
        steps: [
          { text: 'Navigate to "Members" in the Admin panel.' },
          { text: 'View your full member directory with search and filtering.' },
          {
            text: 'Invite new members or coaches by email.',
            detail: 'They receive an invitation link to create their account and join your gym.',
          },
          {
            text: 'Assign roles using the dropdown: Admin, Coach, or Member.',
            detail:
              'Admins have full access. Coaches can manage their profiles, programming, and bookings. Members can view and book.',
          },
          { text: 'View join dates, activity, and manage individual member access.' },
        ],
        callouts: [
          {
            type: 'tip',
            text: 'You can have multiple admins. Useful if you have a business partner or operations manager.',
          },
        ],
        relatedTopics: ['coaches', 'toggles'],
      },
      {
        id: 'analytics',
        title: 'Coach Analytics',
        summary:
          'Track muscle group distribution, weekly volume, and programming balance to ensure well-rounded training.',
        illustrationKey: 'analytics',
        steps: [
          { text: 'Navigate to "Analytics" in the Admin panel.' },
          {
            text: 'View the muscle group distribution chart.',
            detail:
              'This shows how your programming targets different muscle groups over a selected period.',
          },
          { text: 'Check weekly volume trends to monitor training load over time.' },
          { text: 'Review the programming balance score for movement pattern variety.' },
          { text: 'Use the date range selector to analyse specific weeks or months.' },
        ],
        callouts: [
          {
            type: 'note',
            text: 'Analytics data is generated from your published workouts. The more you programme, the more detailed the insights.',
          },
          {
            type: 'tip',
            text: 'A balanced programme targets all major muscle groups. The balance score highlights if you\'re over-indexing on certain movements.',
          },
        ],
        relatedTopics: ['wod'],
      },
      {
        id: 'accounting',
        title: 'Accounting Integration',
        summary:
          'Connect QuickBooks or Xero and let payments sync automatically into your accounting software.',
        illustrationKey: 'accounting',
        steps: [
          { text: 'Navigate to "Integrations" in the Admin panel.' },
          {
            text: 'Select your accounting software: QuickBooks or Xero.',
          },
          { text: 'Click "Connect" and authorise access via the OAuth flow.' },
          {
            text: 'Configure sync preferences.',
            detail:
              'Choose which transaction types to sync: day pass sales, service bookings, subscription revenue.',
          },
          { text: 'Transactions sync in real-time as payments are processed through Stripe.' },
        ],
        callouts: [
          {
            type: 'tip',
            text: 'Set up accounting integration early so all your revenue data flows through from day one.',
          },
          {
            type: 'warning',
            text: 'Ensure your chart of accounts in QuickBooks/Xero is set up before connecting. Transactions need valid account categories to sync correctly.',
          },
        ],
        relatedTopics: ['day-passes', 'service-booking'],
        externalLinks: [
          { label: 'QuickBooks', url: 'https://quickbooks.intuit.com' },
          { label: 'Xero', url: 'https://www.xero.com' },
        ],
      },
    ],
  },
];

export const DOCS_NAV_ITEMS: DocsNavItem[] = DOCS_SECTIONS.map((s) => ({
  sectionId: s.id,
  sectionTitle: s.title,
  topics: s.topics.map((t) => ({ id: t.id, title: t.title })),
}));
