import { Section, Container, Card } from '../components/common';
import { coaches } from '../data/coaches';
import styles from './Coaches.module.scss';

const Coaches = () => {
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

  return (
    <>
      {/* Hero Section */}
      <Section spacing="large" background="dark">
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
          <div className={styles.coachesGrid}>
            {coaches.map((coach) => (
              <Card key={coach.id} variant="elevated" padding="large">
                <div className={styles.coachCard}>
                  <div
                    className={styles.avatar}
                    style={{ background: getAvatarColor(coach.id) }}
                  >
                    <span className={styles.initials}>{getInitials(coach.name)}</span>
                  </div>

                  <div className={styles.coachInfo}>
                    <h3 className={styles.coachName}>{coach.name}</h3>
                    <p className={styles.coachTitle}>{coach.title}</p>
                    <p className={styles.coachBio}>{coach.bio}</p>

                    <div className={styles.section}>
                      <h4 className={styles.sectionTitle}>Certifications</h4>
                      <ul className={styles.list}>
                        {coach.certifications.map((cert, index) => (
                          <li key={index} className={styles.listItem}>
                            <span className={styles.bullet}>"</span>
                            {cert}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className={styles.section}>
                      <h4 className={styles.sectionTitle}>Specialties</h4>
                      <div className={styles.specialties}>
                        {coach.specialties.map((specialty, index) => (
                          <span key={index} className={styles.specialtyTag}>
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
};

export default Coaches;
