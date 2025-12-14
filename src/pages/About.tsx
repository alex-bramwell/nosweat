import { Section, Container, Card, Button } from '../components/common';
import styles from './About.module.scss';

const About = () => {
  return (
    <>
      {/* Hero Section */}
      <Section spacing="large" background="dark">
        <Container>
          <div className={styles.hero}>
            <h1 className={styles.heroTitle}>Our Story</h1>
            <p className={styles.heroSubtitle}>
              More than a gym. We're a community dedicated to helping you achieve your fitness goals
              through the proven methodology of CrossFit.
            </p>
          </div>
        </Container>
      </Section>

      {/* Mission & Values */}
      <Section spacing="large" background="surface">
        <Container>
          <div className={styles.missionWrapper}>
            <div className={styles.missionText}>
              <h2 className={styles.sectionTitle}>Our Mission</h2>
              <p className={styles.paragraph}>
                At CrossFit Comet, we believe fitness is more than just a workout—it's a lifestyle.
                Our mission is to create a welcoming, inclusive community where athletes of all levels
                can push their limits, achieve their goals, and become the best version of themselves.
              </p>
              <p className={styles.paragraph}>
                Founded in Nottingham, we've built our gym on the principles of functional fitness,
                community support, and expert coaching. Whether you're a complete beginner or a seasoned
                athlete, we're here to guide you every step of the way.
              </p>
            </div>

            <div className={styles.valuesGrid}>
              <Card variant="elevated" padding="large">
                <div className={styles.valueCard}>
                  <h3 className={styles.valueTitle}>Community First</h3>
                  <p className={styles.valueText}>
                    We're stronger together. Our tight-knit community supports, motivates, and celebrates
                    each other's victories.
                  </p>
                </div>
              </Card>

              <Card variant="elevated" padding="large">
                <div className={styles.valueCard}>
                  <h3 className={styles.valueTitle}>Expert Coaching</h3>
                  <p className={styles.valueText}>
                    Our certified coaches bring years of experience and passion to every class, ensuring
                    safe, effective training.
                  </p>
                </div>
              </Card>

              <Card variant="elevated" padding="large">
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
      <Section spacing="large" background="dark">
        <Container>
          <h2 className={styles.sectionTitle}>What Makes Us Different</h2>
          <div className={styles.featuresGrid}>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2v6h10l-1-2.5 1-2.5z"/>
                  <path d="M5 10v12c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-12"/>
                  <path d="M10 2v6"/>
                  <path d="M7 8h10"/>
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Functional Fitness</h3>
              <p className={styles.featureText}>
                Constantly varied, high-intensity workouts that prepare you for anything life throws your way.
              </p>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Scalable Workouts</h3>
              <p className={styles.featureText}>
                Every WOD can be scaled to your fitness level—from day one to day one thousand.
              </p>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Track Progress</h3>
              <p className={styles.featureText}>
                Monitor your improvements with benchmark workouts and personal record tracking.
              </p>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4.5" y1="16.5" x2="19.5" y2="7.5"/>
                  <path d="M19.5 16.5c-2.5 0-2.5-3-5-3s-2.5 3-5 3-2.5-3-5-3"/>
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Premium Equipment</h3>
              <p className={styles.featureText}>
                Top-tier Rogue equipment and spacious facility designed for optimal training.
              </p>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Flexible Schedule</h3>
              <p className={styles.featureText}>
                40+ classes per week with morning, afternoon, and evening options to fit your lifestyle.
              </p>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Specialty Programs</h3>
              <p className={styles.featureText}>
                From Olympic Lifting to Gymnastics, enhance your skills with targeted programming.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* Location */}
      <Section spacing="large" background="surface" id="visit">
        <Container>
          <div className={styles.locationWrapper}>
            <div className={styles.locationInfo}>
              <h2 className={styles.sectionTitle}>Visit Us</h2>
              <div className={styles.locationDetails}>
                <div className={styles.locationItem}>
                  <h3 className={styles.locationLabel}>Address</h3>
                  <p className={styles.locationValue}>
                    Unit 24, Bar Lane Industrial Estate<br />
                    Basford, Nottingham<br />
                    NG6 0JA, United Kingdom
                  </p>
                </div>

                <div className={styles.locationItem}>
                  <h3 className={styles.locationLabel}>Hours</h3>
                  <p className={styles.locationValue}>
                    <strong>Monday - Friday:</strong> 9:00 AM - 8:00 PM<br />
                    <strong>Saturday - Sunday:</strong> 9:00 AM - 3:00 PM
                  </p>
                </div>

                <div className={styles.locationItem}>
                  <h3 className={styles.locationLabel}>Contact</h3>
                  <p className={styles.locationValue}>
                    Phone: <a href="tel:07740195130" className={styles.link}>07740 195130</a>
                  </p>
                </div>
              </div>
            </div>

<Card variant="elevated" padding="large">
              <div className={styles.ctaCard}>
                <h3 className={styles.ctaTitle}>Ready to Start Your Journey?</h3>
                <p className={styles.ctaText}>
                  Join us for a free trial class and experience the CrossFit Comet difference.
                  No experience necessary—just bring your energy and we'll take care of the rest.
                </p>
                <div className={styles.ctaButtons}>
                  <Button variant="primary" as="a" href="/schedule">
                    View Schedule
                  </Button>
                  <Button variant="outline" as="a" href="tel:07740195130">
                    Call Us Today
                  </Button>
                </div>

                <div className={styles.mapContainer}>
                  <iframe
                    src="https://maps.google.com/maps?q=Unit+24,+Bar+Lane+Industrial+Estate,+Basford,+Nottingham+NG6+0JA,+UK&t=&z=15&ie=UTF8&iwloc=&output=embed"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={true}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="CrossFit Comet Location"
                  ></iframe>
                </div>
              </div>
            </Card>
          </div>
        </Container>
      </Section>
    </>
  );
};

export default About;
