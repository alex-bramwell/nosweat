import { useEffect, useRef, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useGymPath } from '../contexts/TenantContext';
import { Section, Container, Card, Button } from '../components/common';
import { coachProfileService, type CoachProfile } from '../services/coachProfileService';
import { SERVICE_LABELS } from '../services/coachServicesService';
import styles from './Coaches.module.scss';

const Coaches = () => {
  const location = useLocation();
  const gymPath = useGymPath();
  const coachRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [coaches, setCoaches] = useState<CoachProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load coaches from database
  useEffect(() => {
    const loadCoaches = async () => {
      setIsLoading(true);
      try {
        const dbCoaches = await coachProfileService.getAllCoachProfiles();
        setCoaches(dbCoaches);
      } catch (error) {
        console.error('Error loading coaches:', error);
        setCoaches([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadCoaches();
  }, []);

  // Generate initials for avatar
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Generate a consistent color based on name
  const getAvatarColor = (id: string) => {
    const colors = [
      'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
      'linear-gradient(135deg, #0891b2 0%, #22d3ee 100%)',
      'linear-gradient(135deg, #374151 0%, #4b5563 100%)',
      'linear-gradient(135deg, #dc2626 0%, #f87171 100%)',
      'linear-gradient(135deg, #059669 0%, #34d399 100%)',
    ];
    const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  // Scroll to and highlight coach if hash is present
  useEffect(() => {
    if (location.hash && !isLoading) {
      const coachId = location.hash.replace('#', '');
      const coachElement = coachRefs.current[coachId];

      if (coachElement) {
        setTimeout(() => {
          coachElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  }, [location, isLoading]);

  // Get active services for a coach
  const getActiveServices = (coach: CoachProfile) => {
    return (coach.services || []).filter(s => s.isActive).map(s => s.serviceType);
  };

  // Render coach card
  const renderCoachCard = (coach: CoachProfile, index: number) => {
    const id = coach.coachId || coach.id;
    const name = coach.fullName;
    const title = coach.title;
    const bio = coach.bio;
    const certifications = coach.certifications;
    const specialties = coach.specialties;
    const services = getActiveServices(coach);

    return (
      <Card
        key={id || index}
        variant="elevated"
        padding="large"
        id={id}
        className={location.hash === `#${id}` ? styles.highlighted : ''}
      >
        <div
          className={styles.coachCard}
          ref={(el) => { coachRefs.current[id] = el; }}
        >
          <div
            className={styles.avatar}
            style={{ background: getAvatarColor(id || name) }}
          >
            <span className={styles.initials}>{getInitials(name)}</span>
          </div>

          <div className={styles.coachInfo}>
            <h3 className={styles.coachName}>{name}</h3>
            {title && <p className={styles.coachTitle}>{title}</p>}
            {bio && <p className={styles.coachBio}>{bio}</p>}

            {/* Services Offered */}
            {services.length > 0 && (
              <div className={styles.section}>
                <h4 className={styles.sectionTitle}>Services Offered</h4>
                <div className={styles.servicesBadges}>
                  {services.map((serviceType) => (
                    <span key={serviceType} className={styles.serviceBadge}>
                      {SERVICE_LABELS[serviceType]}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {certifications && certifications.length > 0 && (
              <div className={styles.section}>
                <h4 className={styles.sectionTitle}>Certifications</h4>
                <ul className={styles.list}>
                  {certifications.map((cert, i) => (
                    <li key={i} className={styles.listItem}>
                      <span className={styles.bullet}>"</span>
                      {cert}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {specialties && specialties.length > 0 && (
              <div className={styles.section}>
                <h4 className={styles.sectionTitle}>Specialties</h4>
                <div className={styles.specialties}>
                  {specialties.map((specialty, i) => (
                    <span key={i} className={styles.specialtyTag}>
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <>
      {/* Hero Section */}
      <Section spacing="large" background="dark" className={styles.heroSection}>
        <Container>
          <div className={styles.hero}>
            <h1 className={styles.heroTitle}>Meet Our Coaches</h1>
            <p className={styles.heroSubtitle}>
              Our certified coaching team is dedicated to helping you achieve your fitness goals.
              Each coach brings unique expertise, experience, and passion to create a supportive
              and results-driven training environment.
            </p>
          </div>
        </Container>
      </Section>

      {/* Coaches Grid */}
      <Section spacing="large" background="surface">
        <Container>
          {isLoading ? (
            <div className={styles.loading}>
              <p>Loading coaches...</p>
            </div>
          ) : coaches.length > 0 ? (
            <div className={styles.coachesGrid}>
              {coaches.map((coach, index) => renderCoachCard(coach, index))}
            </div>
          ) : (
            <div className={styles.loading}>
              <p>No coaches available at this time.</p>
            </div>
          )}
        </Container>
      </Section>

      {/* CTA Section */}
      <Section spacing="large" background="dark" className={styles.ctaSection}>
        <Container>
          <div className={styles.cta}>
            <h2 className={styles.ctaTitle}>Ready to Train with Our Coaches?</h2>
            <p className={styles.ctaText}>
              Our coaches offer personal training, specialty classes, nutrition coaching, and more.
              Log in to your account to book a session or explore available services.
            </p>
            <div className={styles.ctaButtons}>
              <Link to="/login">
                <Button variant="primary" size="large">
                  Login for My Services
                </Button>
              </Link>
              <Link to={gymPath('/schedule')}>
                <Button variant="outline" size="large">
                  View Class Schedule
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
};

export default Coaches;
