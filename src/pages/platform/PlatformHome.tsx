import { Link } from 'react-router-dom';
import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
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

const PlatformHome = () => {
  const price = useMemo(() => getLocalizedPrice(), []);
  const [activeRole, setActiveRole] = useState<RoleTab>('owners');
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
          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeDot} />
            Built for gym owners, by athletes
          </div>
          <h1 className={styles.heroHeadline}>
            Stop juggling five apps to run one gym
          </h1>
          <p className={styles.heroSubtitle}>
            Booking, programming, payments, coaching tools, and your
            public website. Finally in a single platform. Branded to you.
            Live in 60 seconds.
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
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>{price.formatted}/mo</span>
              <span className={styles.heroStatLabel}>Everything included</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>60s</span>
              <span className={styles.heroStatLabel}>To go live</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>0</span>
              <span className={styles.heroStatLabel}>Other apps needed</span>
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
            <p className={styles.pricingNote}>No contracts. Cancel anytime.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PlatformHome;
