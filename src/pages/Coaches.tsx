import { useEffect, useRef, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Section, Container, Card, Button } from '../components/common';
import { coachProfileService, type CoachProfile } from '../services/coachProfileService';
import { SERVICE_LABELS } from '../services/coachServicesService';
import { coaches as fallbackCoaches } from '../data/coaches';
import styles from './Coaches.module.scss';

const Coaches = () => {
  const location = useLocation();
  const coachRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [coaches, setCoaches] = useState<CoachProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);

  // Load coaches from database
  useEffect(() => {
    const loadCoaches = async () => {
      setIsLoading(true);
      try {
        const dbCoaches = await coachProfileService.getAllCoachProfiles();
        // Only use DB coaches if they have profile data
        const coachesWithProfiles = dbCoaches.filter(c => c.bio || c.certifications.length > 0);
        if (coachesWithProfiles.length > 0) {
          setCoaches(coachesWithProfiles);
          setUseFallback(false);
        } else {
          // Fall back to hardcoded data if no coaches have filled out profiles
          setUseFallback(true);
        }
      } catch (error) {
        console.error('Error loading coaches:', error);
        setUseFallback(true);
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
      'linear-gradient(135deg, #FF4F1F 0%, #FF6B3D 100%)',
      'linear-gradient(135deg, #00E5FF 0%, #00FFAA 100%)',
      'linear-gradient(135deg, #1d1d26 0%, #23232e 100%)',
      'linear-gradient(135deg, #FF4F1F 20%, #00E5FF 100%)',
      'linear-gradient(135deg, #00FFAA 0%, #00E5FF 100%)',
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

  // Render coach card - works with both DB coaches and fallback data
  const renderCoachCard = (coach: CoachProfile | typeof fallbackCoaches[0], index: number) => {
    const isDBCoach = 'fullName' in coach;
    const id = isDBCoach ? (coach as CoachProfile).coachId || (coach as CoachProfile).id : coach.id;
    const name = isDBCoach ? (coach as CoachProfile).fullName : coach.name;
    const title = isDBCoach ? (coach as CoachProfile).title : coach.title;
    const bio = isDBCoach ? (coach as CoachProfile).bio : coach.bio;
    const certifications = isDBCoach ? (coach as CoachProfile).certifications : coach.certifications;
    const specialties = isDBCoach ? (coach as CoachProfile).specialties : coach.specialties;
    const services = isDBCoach ? getActiveServices(coach as CoachProfile) : [];

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
          ) : (
            <div className={styles.coachesGrid}>
              {useFallback
                ? fallbackCoaches.map((coach, index) => renderCoachCard(coach, index))
                : coaches.map((coach, index) => renderCoachCard(coach, index))
              }
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
              <Link to="/schedule">
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
