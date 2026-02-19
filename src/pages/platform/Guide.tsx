import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { GUIDE_SECTIONS, GUIDE_NAV_ITEMS, PHOTO_DIVIDERS } from '../../components/guide/guideData';
import { ILLUSTRATIONS } from '../../components/guide/GuideIllustrations';
import { getLocalizedPrice } from '../../utils/pricing';
import styles from './Guide.module.scss';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1600&q=80';

const DIVIDER_TRANSITIONS: ('darkToLight' | 'lightToDark' | 'darkToDark')[] = [
  'darkToLight',
  'lightToDark',
  'darkToDark',
];

const CTA_IMAGE =
  'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=1600&q=80';

const Guide = () => {
  const price = useMemo(() => getLocalizedPrice(), []);
  const [activeSection, setActiveSection] = useState<string>(GUIDE_SECTIONS[0].id);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // IntersectionObserver to highlight the active section in the sticky nav
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 },
    );

    const refs = sectionRefs.current;
    for (const id of Object.keys(refs)) {
      const el = refs[id];
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  const assignRef = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      sectionRefs.current[id] = el;
    },
    [],
  );

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setSidebarOpen(false);
  };

  return (
    <div className={styles.guidePage}>
      {/* ── Hero ── */}
      <section className={styles.hero} style={{ '--hero-bg': `url(${HERO_IMAGE})` } as React.CSSProperties}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroHeadline}>The Complete Platform Guide</h1>
          <p className={styles.heroSubtitle}>
            Everything you need to launch, run, and grow your gym — explained step by step.
          </p>
          <div className={styles.heroCtas}>
            <Link to="/signup" className={styles.ctaPrimary}>
              Get Started
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <button onClick={() => scrollTo(GUIDE_SECTIONS[0].id)} className={styles.ctaSecondary}>
              Explore Features
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* ── Floating Sidebar Nav ── */}
      {sidebarOpen && (
        <div
          className={styles.sidebarBackdrop}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <nav className={`${styles.guideSidebar} ${sidebarOpen ? styles.guideSidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <span className={styles.sidebarTitle}>Sections</span>
          <button
            className={styles.sidebarClose}
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        {GUIDE_NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => scrollTo(item.id)}
            className={`${styles.sidebarLink} ${activeSection === item.id ? styles.sidebarLinkActive : ''}`}
          >
            <span className={styles.sidebarDot} />
            <span className={styles.sidebarLabel}>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Toggle button — always visible */}
      <button
        className={`${styles.sidebarToggle} ${sidebarOpen ? styles.sidebarToggleHidden : ''}`}
        onClick={() => setSidebarOpen(true)}
        aria-label="Open section navigation"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* ── Section Groups ── */}
      {GUIDE_SECTIONS.map((section, sectionIdx) => {
        const bgClass = section.background === 'light' ? styles.bgLight : styles.bgDark;

        return (
          <div key={section.id}>
            <section
              id={section.id}
              ref={assignRef(section.id)}
              className={`${styles.sectionGroup} ${bgClass}`}
            >
              <div className={styles.sectionContainer}>
                <header className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>{section.title}</h2>
                  <p className={styles.sectionSubtitle}>{section.subtitle}</p>
                </header>

                {section.features.map((feature, featureIdx) => {
                  const reversed = featureIdx % 2 !== 0;
                  const Illustration = ILLUSTRATIONS[feature.illustrationKey];

                  return (
                    <div
                      key={feature.id}
                      className={`${styles.featureRow} ${reversed ? styles.featureRowReversed : ''}`}
                    >
                      <div className={styles.featureText}>
                        <h3 className={styles.featureTitle}>{feature.title}</h3>
                        <p className={styles.featureDescription}>{feature.description}</p>
                        {feature.bullets && (
                          <ul className={styles.featureBullets}>
                            {feature.bullets.map((bullet) => (
                              <li key={bullet} className={styles.featureBullet}>
                                <span className={styles.bulletIcon}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                </span>
                                {bullet}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className={styles.featureVisual}>
                        <div className={styles.illustrationWrapper}>
                          {Illustration ? <Illustration /> : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Photo divider between sections (not after the last one) */}
            {sectionIdx < GUIDE_SECTIONS.length - 1 && (
              <div
                className={`${styles.photoDivider} ${
                  styles[
                    `divider${
                      DIVIDER_TRANSITIONS[sectionIdx]
                        ? DIVIDER_TRANSITIONS[sectionIdx].charAt(0).toUpperCase() +
                          DIVIDER_TRANSITIONS[sectionIdx].slice(1)
                        : 'DarkToDark'
                    }`
                  ] || ''
                }`}
                style={
                  {
                    '--divider-bg': `url(${PHOTO_DIVIDERS[sectionIdx]?.url ?? ''})`,
                  } as React.CSSProperties
                }
              />
            )}
          </div>
        );
      })}

      {/* ── Final CTA ── */}
      <section
        className={styles.cta}
        style={{ '--cta-bg': `url(${CTA_IMAGE})` } as React.CSSProperties}
      >
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaHeadline}>
            Everything your gym needs.<br />
            <span className={styles.ctaHighlight}>One platform. One price.</span>
          </h2>

          <div className={styles.ctaPriceBlock}>
            <span className={styles.ctaPriceAmount}>{price.formatted}</span>
            <span className={styles.ctaPricePeriod}>{price.period}</span>
          </div>

          <p className={styles.ctaSubtitle}>
            No stitching five apps together. No per-member fees.
            Booking, scheduling, payments, coaching tools, and your public site —
            all under one roof.
          </p>

          <div className={styles.ctaButtons}>
            <Link to="/signup" className={styles.ctaPrimary}>
              Get Started
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link to="/login" className={styles.ctaSecondary}>
              Log in
            </Link>
          </div>
          <p className={styles.ctaNote}>No credit card required. No contracts. Cancel anytime.</p>
        </div>
      </section>
    </div>
  );
};

export default Guide;
