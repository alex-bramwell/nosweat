import { Section, Container, Card, Button } from '../components/common';
import { useTenant } from '../contexts/TenantContext';
import { useBrandingWithOverrides } from '../hooks/useBrandingWithOverrides';
import { AboutValueIcon, DEFAULT_ABOUT_VALUES } from '../data/aboutValues';
import styles from './About.module.scss';

const isValidMapsUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' &&
      (parsed.hostname === 'www.google.com' || parsed.hostname === 'maps.google.com' || parsed.hostname.endsWith('.google.com'));
  } catch {
    return false;
  }
};

const About = () => {
  const { gym } = useTenant();
  const branding = useBrandingWithOverrides();

  return (
    <>
      {/* Hero Section */}
      <Section spacing="relaxed" background="bold" className={styles.heroSection}>
        <Container>
          <div className={styles.hero}>
            <h1 className={styles.heroTitle}>Our Story</h1>
            <p className={styles.heroSubtitle}>
              More than a gym. We're a community dedicated to helping you achieve your fitness goals
              with expert coaching and a supportive environment.
            </p>
          </div>
        </Container>
      </Section>

      {/* Mission & Values */}
      <Section spacing="relaxed" background="surface">
        <Container>
          <div className={styles.missionWrapper}>
            <div className={styles.missionText}>
              <h2 className={styles.sectionTitle}>Our Mission</h2>
              <p className={styles.paragraph}>
                {branding.about_mission}
              </p>
              {branding.about_philosophy && (
                <p className={styles.paragraph}>
                  {branding.about_philosophy}
                </p>
              )}
              {!branding.about_philosophy && (
                <p className={styles.paragraph}>
                  We've built our gym on the principles of functional fitness,
                  community support, and expert coaching. Whether you're a complete beginner or a seasoned
                  athlete, we're here to guide you every step of the way.
                </p>
              )}
            </div>

            <div className={styles.valuesGrid}>
              <Card variant="raised" padding="spacious">
                <div className={styles.valueCard}>
                  <h3 className={styles.valueTitle}>Community First</h3>
                  <p className={styles.valueText}>
                    We're stronger together. Our tight-knit community supports, motivates, and celebrates
                    each other's victories.
                  </p>
                </div>
              </Card>

              <Card variant="raised" padding="spacious">
                <div className={styles.valueCard}>
                  <h3 className={styles.valueTitle}>Expert Coaching</h3>
                  <p className={styles.valueText}>
                    Our certified coaches bring years of experience and passion to every class, ensuring
                    safe, effective training.
                  </p>
                </div>
              </Card>

              <Card variant="raised" padding="spacious">
                <div className={styles.valueCard}>
                  <h3 className={styles.valueTitle}>Results Driven</h3>
                  <p className={styles.valueText}>
                    We track progress, celebrate milestones, and help you achieve measurable results
                    through proven programming.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </Container>
      </Section>

      {/* What We Offer */}
      <Section spacing="relaxed" background="bold">
        <Container>
          <h2 className={styles.sectionTitle}>What Makes Us Different</h2>
          <div className={styles.featuresGrid}>
            {(branding.about_values ?? DEFAULT_ABOUT_VALUES).map((value, i) => (
              <div key={i} className={styles.feature}>
                <div className={styles.featureIcon}>
                  <AboutValueIcon name={value.icon} />
                </div>
                <h3 className={styles.featureTitle}>{value.title}</h3>
                <p className={styles.featureText}>{value.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Location */}
      <Section spacing="relaxed" background="surface" id="visit">
        <Container>
          <div className={styles.locationWrapper}>
            <div className={styles.locationInfo}>
              <h2 className={styles.sectionTitle}>Visit Us</h2>
              <div className={styles.locationDetails}>
                {(gym?.address_line1 || gym?.city) && (
                  <div className={styles.locationItem}>
                    <h3 className={styles.locationLabel}>Address</h3>
                    <p className={styles.locationValue}>
                      {gym.address_line1 && <>{gym.address_line1}<br /></>}
                      {gym.address_line2 && <>{gym.address_line2}<br /></>}
                      {gym.city && <>{gym.city}<br /></>}
                      {gym.postcode && <>{gym.postcode}</>}
                      {gym.country && <>, {gym.country}</>}
                    </p>
                  </div>
                )}

                {gym?.contact_phone && (
                  <div className={styles.locationItem}>
                    <h3 className={styles.locationLabel}>Contact</h3>
                    <p className={styles.locationValue}>
                      Phone: <a href={`tel:${gym.contact_phone}`} className={styles.link}>{gym.contact_phone}</a>
                    </p>
                  </div>
                )}

                {gym?.contact_email && (
                  <div className={styles.locationItem}>
                    <h3 className={styles.locationLabel}>Email</h3>
                    <p className={styles.locationValue}>
                      <a href={`mailto:${gym.contact_email}`} className={styles.link}>{gym.contact_email}</a>
                    </p>
                  </div>
                )}
              </div>
            </div>

<Card variant="raised" padding="spacious">
              <div className={styles.ctaCard}>
                <h3 className={styles.ctaTitle}>Ready to Start Your Journey?</h3>
                <p className={styles.ctaText}>
                  Join us for a free trial class and experience the {gym?.name} difference.
                  No experience necessary. Just bring your energy and we'll take care of the rest.
                </p>
                <div className={styles.ctaButtons}>
                  <Button variant="primary" as="a" href="/schedule">
                    View Schedule
                  </Button>
                  {gym?.contact_phone && (
                    <Button variant="outline" as="a" href={`tel:${gym.contact_phone}`}>
                      Call Us Today
                    </Button>
                  )}
                </div>

                {gym?.google_maps_embed_url && isValidMapsUrl(gym.google_maps_embed_url) && (
                  <div className={styles.mapContainer}>
                    <iframe
                      src={gym.google_maps_embed_url}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen={true}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={`${gym?.name} Location`}
                    ></iframe>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </Container>
      </Section>
    </>
  );
};

export default About;
