import { Link } from 'react-router-dom';
import { useMemo, useState, useRef, useCallback, useEffect, useId } from 'react';
import { FEATURES } from '../../config/features';
import type { FeatureKey } from '../../types/tenant';
import FeatureIcon from '../../components/common/FeatureIcon';
import { ILLUSTRATIONS } from '../../components/guide/GuideIllustrations';
import { getLocalizedPrice } from '../../utils/pricing';
import HowItWorks from './HowItWorks';
import ContactCta from './ContactCta';
import styles from './PlatformHome.module.scss';

const FEATURE_ILLUSTRATION_MAP: Partial<Record<FeatureKey, string>> = {
  class_booking: 'schedule',
  wod_programming: 'wod',
  coach_profiles: 'coachProfile',
  day_passes: 'dayPass',
  trial_memberships: 'dayPass',
  service_booking: 'serviceBooking',
  accounting_integration: 'accounting',
  coach_analytics: 'analytics',
  member_management: 'memberManagement',
};

// ── Role-based feature tabs ──
type RoleTab = 'owners' | 'coaches' | 'members';

interface RoleFeature {
  key: FeatureKey;
  name: string;
  description: string;
}

const ROLE_TABS: { id: RoleTab; label: string; subtitle: string }[] = [
  { id: 'owners', label: 'Gym Owners', subtitle: 'Run and grow your business' },
  { id: 'coaches', label: 'Coaches', subtitle: 'Program, track, and earn' },
  { id: 'members', label: 'Members', subtitle: 'Book, train, and stay connected' },
];

const ROLE_FEATURES: Record<RoleTab, RoleFeature[]> = {
  owners: [
    { key: 'class_booking', name: 'Class Scheduling', description: 'Build your timetable, set capacity limits, and manage waitlists. Members book online so you never have to chase sign-ups again.' },
    { key: 'day_passes', name: 'Day Pass Sales', description: 'Sell drop-in passes online with Stripe. Visitors pay, pick a class, and show up. Zero admin on your end.' },
    { key: 'trial_memberships', name: 'Free Trial Funnels', description: 'Offer trial classes with card authorisation. Convert walk-ins to paying members with a seamless sign-up flow.' },
    { key: 'member_management', name: 'Member Management', description: 'View and manage your entire member base. Assign roles, invite coaches, and keep your community organised.' },
    { key: 'accounting_integration', name: 'Accounting Sync', description: 'Auto-sync every payment and invoice to QuickBooks or Xero. Spend less time on spreadsheets, more time on the gym floor.' },
    { key: 'custom_domain', name: 'Custom Domain', description: 'Use your own domain with SSL included. Your gym site looks fully yours, not hosted on someone else\'s platform.' },
  ],
  coaches: [
    { key: 'wod_programming', name: 'Workout Programming', description: 'Build daily workouts with the movement database. Program strength, metcons, and accessory work, then publish to your members.' },
    { key: 'coach_profiles', name: 'Your Profile Page', description: 'Showcase your certifications, specialties, bio, and photo. Members can find and connect with you directly.' },
    { key: 'service_booking', name: 'Service Booking', description: 'Offer PT sessions, sports massage, nutrition consults, or any 1-on-1 service. Members book and pay online.' },
    { key: 'coach_analytics', name: 'Programming Analytics', description: 'Track volume, movement frequency, and balance across your programming. Spot gaps and keep your athletes progressing.' },
  ],
  members: [
    { key: 'class_booking', name: 'Class Booking', description: 'Browse the schedule, reserve your spot, and manage your bookings. Get notified if a waitlisted class opens up.' },
    { key: 'wod_programming', name: 'Daily Workouts', description: 'See today\'s workout before you arrive. Know what\'s coming so you can prepare and show up ready to train.' },
    { key: 'day_passes', name: 'Drop-in Passes', description: 'Visiting a new gym? Buy a day pass online, pick a class, and you\'re in. No awkward front-desk conversations.' },
    { key: 'service_booking', name: 'Book a Coach', description: 'Find a coach, view their specialties, and book a session online. Pay up front and skip the back-and-forth.' },
    { key: 'coach_profiles', name: 'Meet the Coaches', description: 'See who\'s coaching each class. Read bios, check certifications, and find the right coach for your goals.' },
  ],
};

const SETUP_STEPS = [
  {
    title: 'Build your website',
    detail:
      'Pick your colours, fonts, logo and content in the visual site builder. No code, no designers, no agency. Publish your branded gym site when it is ready, and change it any time.',
  },
  {
    title: 'Add your staff',
    detail:
      'Invite your coaches and front-desk team, choose what each can do, and let them manage classes, programming and the schedule.',
  },
  {
    title: 'Invite your members',
    detail:
      'Taking payment is built in. Memberships, trials and day passes run straight through your own site with Stripe, so there is no separate payment app to wire up. Bring your members on board, take bookings and track attendance from day one.',
  },
  {
    title: 'Create or import your program',
    detail:
      'Build your programming in the workout editor, or import what you already run. Every session feeds built-in analytics covering volume, movement balance and time domains, so you can spot gaps and keep your athletes progressing.',
  },
];

// Hand-drawn underlines as filled brush strokes: a mostly straight line with a
// gentle wave, tapering to fine points at both ends. Built from a centerline
// plus a thickness profile so the ends stay thin (taperPow > 1 concentrates the
// width in the middle). Each word gets a different wave phase so the three do
// not look mechanically identical.
const buildUnderline = (waveAmp: number, phase: number, maxHalf = 1.05): string => {
  const SAMPLES = 48;
  const WIDTH = 200;
  const CENTER_Y = 7;
  const TAPER_POW = 1.7; // higher = thinner, finer ends
  const top: string[] = [];
  const bottom: string[] = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const t = i / SAMPLES;
    const x = +(t * WIDTH).toFixed(1);
    const center = CENTER_Y + waveAmp * Math.sin(phase + t * Math.PI * 2);
    const half = maxHalf * Math.pow(Math.sin(Math.PI * t), TAPER_POW);
    top.push(`${x} ${(center - half).toFixed(2)}`);
    bottom.push(`${x} ${(center + half).toFixed(2)}`);
  }
  const topEdge = top.map((p, i) => (i === 0 ? `M${p}` : `L${p}`)).join('');
  const bottomEdge = bottom.reverse().map((p) => `L${p}`).join('');
  return `${topEdge}${bottomEdge}Z`;
};

const UNDERLINE_PATHS = [
  buildUnderline(0.45, 0.4),
  buildUnderline(0.6, 2.3),
  buildUnderline(0.4, 4.2),
];

// Thicker, straighter variant for small body-text contexts where the standard
// underline would render too thin.
const UNDERLINE_PATH_THICK = buildUnderline(0.35, 1.5, 2.4);

// Detailed flexed-arm ("strong arm") line glyph stroked with the blue-to-purple
// accent gradient, inline in the hero subtitle. Artwork is the OpenMoji
// "flexed biceps" emoji (https://openmoji.org, CC BY-SA 4.0).
const StrongArmIcon = () => {
  const gradId = useId();
  return (
    <svg className={styles.strongArmIcon} viewBox="0 0 72 72" role="img" aria-label="strong arm">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <g fill="none" stroke={`url(#${gradId})`} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4">
        <path d="M27.4684,40.5519c-0.4282-4.2794-1.1326-12.7197-1.9548-13.7543c0,0,5.2009,1.1102,7.8117-2.9736" />
        <path d="M34.5031,53.0878c0,0,10.8019,2.7012,19.2868-4.3269" />
        <path d="M27.7195,50.6312c0,0,2.8688-14.4737,16.3682-16.3928s20.2138,8.5143,20.2138,8.5143s0.2302,0.2755,0.5269,0.7704c2.0724,3.4564,1.2505,7.9342-1.8035,10.5637C52.0326,63.551,36.5991,65.7993,16.5066,65.6836c0,0-3.7502,1.1456-4.6096-3.574c0,0-0.7689-20.9388,3.8178-35.6261c0,0-0.1965-6.0013,0.0307-9.9287c0.0388-0.67,0.3337-1.2971,0.827-1.7521c5.7789-5.3313,8.3742-6.1149,8.3742-6.1149l8.3881-1.4838c1.436,0.9837,4.7256,4.7388,3.5707,11.4953" />
        <path d="M25.5888,19.2948c0,0,1.8163,2.5911,3.6325-0.2835V16l-0.46-1.6583l-0.3606-0.278" />
        <path d="M29.5442,19.2948c0,0,1.8163,2.5911,3.6325-0.2835V16l-0.8731-2.1254" />
        <path d="M36.8203,19.0113c-1.9616,1.8889-3.3207,0-3.3207,0" />
        <path d="M20.301,16.4465c0.5038,0.4387,1.1429,1.2206,1.2784,2.4327c0.0322,0.2877,0.131,0.5691,0.3359,0.7736c0.595,0.5939,1.9586,1.5167,3.3223-0.6415V16l-0.6351-1.2677" />
        <path d="M40.3564,18.289c1.9261,0.5697,2.2618,3.4266-0.7028,4.0993c-6.3283,1.4358-6.3283,1.4358-6.3283,1.4358" />
      </g>
    </svg>
  );
};

const HandUnderline = ({ children, path, svgClassName }: { children: React.ReactNode; path: string; svgClassName?: string }) => {
  const gradId = useId();
  return (
    <span className={styles.underlinedWord}>
      {children}
      <svg className={`${styles.underlineSvg} ${svgClassName ?? ''}`} viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        <path d={path} fill={`url(#${gradId})`} />
      </svg>
    </span>
  );
};

const PlatformHome = () => {
  const price = useMemo(() => getLocalizedPrice(), []);
  const [activeRole, setActiveRole] = useState<RoleTab>('owners');
  const [openStep, setOpenStep] = useState(-1);
  const [contactOpen, setContactOpen] = useState(false);
  const touchStartX = useRef(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const missionRef = useRef<HTMLElement>(null);

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    const tabIds = ROLE_TABS.map((t) => t.id);
    const currentIdx = tabIds.indexOf(activeRole);
    if (direction === 'left' && currentIdx < tabIds.length - 1) {
      setActiveRole(tabIds[currentIdx + 1]);
    } else if (direction === 'right' && currentIdx > 0) {
      setActiveRole(tabIds[currentIdx - 1]);
    }
  }, [activeRole]);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };
    const onTouchEnd = (e: TouchEvent) => {
      const delta = e.changedTouches[0].clientX - touchStartX.current;
      if (Math.abs(delta) > 60) {
        handleSwipe(delta < 0 ? 'left' : 'right');
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [handleSwipe]);

  return (
    <div className={styles.platformHome}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroMain}>
          <h1 className={styles.heroHeadline}>
            No Sweat <HandUnderline path={UNDERLINE_PATHS[0]}>runs</HandUnderline> your gym so you can <HandUnderline path={UNDERLINE_PATHS[1]}>focus</HandUnderline> on what <HandUnderline path={UNDERLINE_PATHS[2]}>matters</HandUnderline>
          </h1>
          <p className={styles.heroSubtitle}>
            Everything a gym needs, inside your own website. Built for gym owners, by athletes.{' '}
            <span className={styles.heroSubtitleAccent}>No Apps needed</span>. We've done our
            mobility, our software is flexible to suit your needs <StrongArmIcon />
          </p>
          <div className={styles.heroCtas}>
            <Link to="/signup" className={styles.ctaPrimary}>
              Get Started
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link to="/guide" className={styles.ctaSecondary}>
              See All Features
            </Link>
          </div>
          </div>

          <div className={styles.heroSide}>
          <div className={styles.heroSteps}>
            <h2 className={styles.heroStepsHeading}>Gym management software</h2>
            <p className={styles.heroStepsTitle}>Up and running in a few steps</p>
            {SETUP_STEPS.map((step, i) => {
              const open = openStep === i;
              return (
                <div key={step.title} className={`${styles.heroStep} ${open ? styles.heroStepOpen : ''}`}>
                  <button
                    type="button"
                    className={styles.heroStepHeader}
                    onClick={() => setOpenStep(open ? -1 : i)}
                    aria-expanded={open}
                  >
                    <span className={styles.heroStepNumber}>{i + 1}</span>
                    <span className={styles.heroStepLabel}>{step.title}</span>
                    <svg className={styles.heroStepChevron} viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  <div className={styles.heroStepBody}>
                    <p>{step.detail}</p>
                  </div>
                </div>
              );
            })}
            <div className={styles.heroStepsFooter}>
              <span>powered by</span>
              <svg className={styles.stripeWordmark} viewBox="0 0 60 25" fill="none" role="img" aria-label="stripe">
                <path fill="#635BFF" d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.48zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V5.57h3.76l.08 1.02a4.7 4.7 0 0 1 3.23-1.29c2.9 0 5.62 2.6 5.62 7.4 0 5.23-2.7 7.6-5.63 7.6zM40 8.95c-.95 0-1.54.34-1.97.81l.02 6.12c.4.44.98.78 1.95.78 1.52 0 2.54-1.65 2.54-3.87 0-2.15-1.04-3.84-2.54-3.84zM28.24 5.57h4.13v14.44h-4.13V5.57zm0-4.7L32.37 0v3.36l-4.13.88V.88zm-4.32 9.35v9.79H19.8V5.57h3.7l.12 1.22c1-1.77 3.01-1.41 3.62-1.22v3.79c-.59-.19-2.31-.39-3.32.74zm-8.55 4.72c0 2.43 2.6 1.68 3.12 1.46v3.36c-.55.3-1.54.54-2.89.54a4.15 4.15 0 0 1-4.27-4.24l.02-13.21 4.02-.86v3.54h3.14V9.1h-3.14v5.64zM4.24 9.93c0 .65.6.9 1.58 1.31 1.97.84 4.5 1.91 4.51 4.41 0 2.95-2.36 4.59-5.79 4.59-1.42 0-2.97-.27-4.5-.93v-3.93c1.38.75 3.12 1.3 4.5 1.3.93 0 1.6-.25 1.6-1.02 0-.71-.65-.97-1.69-1.4C2.99 13.41.55 12.42.55 9.93c0-2.9 2.31-4.65 5.61-4.65 1.41 0 2.81.21 4.22.73v3.88c-1.29-.7-2.92-1.1-4.22-1.1-.88 0-1.42.27-1.42.95z" />
              </svg>
            </div>
          </div>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>{price.formatted}/mo</span>
              <span className={styles.heroStatLabel}>Everything included</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>Simple</span>
              <span className={styles.heroStatLabel}>To set up</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>0</span>
              <span className={styles.heroStatLabel}>Apps needed</span>
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className={styles.mission} ref={missionRef}>
        <div className={styles.platformHomeInner}>
          <h2 className={styles.missionHeadline}>
            Your Gym, online in one place
          </h2>
          <p className={styles.missionBody}>
            Everyone says &ldquo;just use AI to build it.&rdquo; But you shouldn&rsquo;t
            need to be a prompt engineer to run your gym. No Sweat has done all the
            work for you. Bookings, scheduling, payments, coaching tools and your
            public-facing site, all consolidated into one platform built specifically
            for gyms. No coding. No stitching tools together. Just one low monthly price.
          </p>
          <button className={styles.missionCta} onClick={() => setContactOpen(true)}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Got questions? Get in touch
          </button>
        </div>
      </section>

      {/* Contact CTA + floating FAB + modal */}
      <ContactCta
        missionRef={missionRef}
        isOpen={contactOpen}
        onOpen={() => setContactOpen(true)}
        onClose={() => setContactOpen(false)}
      />

      {/* Features Grid */}
      <section id="features" className={styles.features}>
        <div className={styles.platformHomeInner}>
          <h2 className={styles.sectionTitle}>Everything you need to run your gym</h2>
          <p className={styles.sectionSubtitle}>
            All features included for {price.formatted}/month
          </p>

          {/* Role Toggle */}
          <div className={styles.roleToggle}>
            {ROLE_TABS.map((tab) => (
              <button
                key={tab.id}
                className={`${styles.roleToggleTab} ${activeRole === tab.id ? styles.roleToggleTabActive : ''}`}
                onClick={() => setActiveRole(tab.id)}
              >
                <span className={styles.roleToggleLabel}>{tab.label}</span>
                <span className={styles.roleToggleSubtitle}>{tab.subtitle}</span>
              </button>
            ))}
            <div
              className={styles.roleToggleIndicator}
              style={{ transform: `translateX(${ROLE_TABS.findIndex((t) => t.id === activeRole) * 100}%)` }}
            />
          </div>

          <div className={styles.featuresGrid} ref={gridRef} key={activeRole}>
            {ROLE_FEATURES[activeRole].map((feature) => {
              const illustrationKey = FEATURE_ILLUSTRATION_MAP[feature.key];
              const Illustration = illustrationKey ? ILLUSTRATIONS[illustrationKey] : null;

              return (
                <div key={feature.key} className={styles.featureCard}>
                  {Illustration && (
                    <div className={styles.featureWatermark}>
                      <Illustration />
                    </div>
                  )}
                  <div className={styles.featureCardContent}>
                    <div className={styles.featureIcon}><FeatureIcon featureKey={feature.key} /></div>
                    <h3 className={styles.featureName}>{feature.name}</h3>
                    <p className={styles.featureDescription}>{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.featuresCta}>
            <Link to="/guide" className={styles.featuresCtaLink}>
              Explore all features in detail
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <HowItWorks />

      {/* Pricing */}
      <section className={styles.pricing}>
        <div className={styles.platformHomeInner}>
          <h2 className={styles.sectionTitle}>Simple, transparent pricing</h2>
          <p className={styles.pricingTagline}>
            One plan. Everything included. No surprises.
          </p>

          <div className={styles.pricingCard}>
            <div className={styles.priceDisplay}>
              <span className={styles.priceAmount}>{price.formatted}</span>
              <span className={styles.pricePeriod}>{price.period}</span>
            </div>
            <p className={styles.priceDescription}>
              Everything your gym needs, all in one place
            </p>

            <ul className={styles.priceFeatures}>
              {FEATURES.map((feature) => (
                <li key={feature.key} className={styles.priceFeatureItem}>
                  <svg className={styles.checkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {feature.name}
                </li>
              ))}
            </ul>

            <Link to="/signup" className={styles.pricingCta}>
              Get Started
            </Link>
            <p className={styles.pricingNote}>No contracts. <HandUnderline path={UNDERLINE_PATH_THICK} svgClassName={styles.underlineSvgNote}>Cancel anytime</HandUnderline>.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PlatformHome;
