import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { FEATURES } from '../../config/features';
import type { FeatureKey } from '../../types/tenant';
import FeatureIcon from '../../components/common/FeatureIcon';
import { ILLUSTRATIONS } from '../../components/guide/GuideIllustrations';
import { getLocalizedPrice } from '../../utils/pricing';
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

const PlatformHome = () => {
  const price = useMemo(() => getLocalizedPrice(), []);

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
            Stop juggling five apps<br />to run one gym
          </h1>
          <p className={styles.heroSubtitle}>
            Booking, programming, payments, coaching tools, and your
            public website — finally in a single platform. Branded to you.
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
      <section className={styles.mission}>
        <div className={styles.container}>
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
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className={styles.features}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Everything you need to run your gym</h2>
          <p className={styles.sectionSubtitle}>
            All features included for {price.formatted}/month
          </p>

          <div className={styles.featuresGrid}>
            {FEATURES.map((feature) => {
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
      <section className={styles.howItWorks}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>How It Works</h2>
          <div className={styles.stepsGrid}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <h3 className={styles.stepTitle}>Sign up</h3>
              <p className={styles.stepDescription}>
                Create your account in seconds. No credit card required to start.
              </p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <h3 className={styles.stepTitle}>Customise your brand</h3>
              <p className={styles.stepDescription}>
                Choose your colours, upload your logo, set your theme. Make it yours.
              </p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <h3 className={styles.stepTitle}>Choose your features</h3>
              <p className={styles.stepDescription}>
                Toggle on the features you need. Everything is included in your plan.
              </p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>4</div>
              <h3 className={styles.stepTitle}>Go live</h3>
              <p className={styles.stepDescription}>
                Your gym is online instantly. No technical skills needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className={styles.pricing}>
        <div className={styles.container}>
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
