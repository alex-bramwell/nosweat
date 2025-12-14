import { Section, Container, Card, Button } from '../components/common';
import styles from './About.module.scss';

const About = () => {
  return (
    <>
      {/* Hero Section */}
      <Section spacing="large" background="dark" className={styles.heroSection}>
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
                  {/* Dumbbell icon */}
                  <path d="M6.5 6.5l11 11"/>
                  <path d="M17.5 6.5l-11 11"/>
                  <circle cx="5" cy="5" r="2"/>
                  <circle cx="19" cy="5" r="2"/>
                  <circle cx="5" cy="19" r="2"/>
                  <circle cx="19" cy="19" r="2"/>
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
                  {/* Activity/heart rate icon */}
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
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
                  {/* Trophy icon */}
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                  <path d="M4 22h16"/>
                  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
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
                  {/* Barbell/weight icon */}
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <rect x="2" y="8" width="3" height="8" rx="1"/>
                  <rect x="19" y="8" width="3" height="8" rx="1"/>
                  <rect x="7" y="10" width="2" height="4"/>
                  <rect x="15" y="10" width="2" height="4"/>
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
                  {/* Calendar with checkmark icon */}
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                  <path d="M9 16l2 2 4-4"/>
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
                  {/* Target/bullseye icon */}
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="6"/>
                  <circle cx="12" cy="12" r="2"/>
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
