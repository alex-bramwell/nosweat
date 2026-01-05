import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Section, Container } from '../../common';
import { TrialModal } from '../../TrialModal';
import { useRegistrationIntent } from '../../../contexts/RegistrationContext';
import styles from './Hero.module.scss';

const Hero = () => {
  const navigate = useNavigate();
  const { setIntent } = useRegistrationIntent();
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);

  const handleDayPassClick = () => {
    setIntent({ type: 'day-pass', step: 'class-selection' });
    navigate('/schedule');
  };

  const handleTrialClick = () => {
    setIntent({ type: 'trial', step: 'intent' });
    setIsTrialModalOpen(true);
  };

  return (
    <Section spacing="xlarge" background="dark" className={styles.hero}>
      <div className={styles.comet}>
        <div className={styles.cometTrail}></div>
      </div>
      <Container>
        <div className={styles.content}>
          <h1 className={styles.title}>
            Welcome to CrossFit Comet
          </h1>
          <p className={styles.subtitle}>
            Where strength meets community. Transform your fitness journey with expert coaching,
            world-class programming, and a supportive atmosphere.
          </p>

          <div className={styles.actionCards}>
            <div className={styles.actionCard}>
              <div className={styles.cardIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <h3 className={styles.cardTitle}>Day Pass</h3>
              <p className={styles.cardDescription}>
                Drop in for a single session and experience our community
              </p>
              <Button variant="primary" size="medium" onClick={handleDayPassClick}>
                Book Day Pass
              </Button>
            </div>

            <div className={styles.actionCard}>
              <div className={styles.cardIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <h3 className={styles.cardTitle}>Free Trial</h3>
              <p className={styles.cardDescription}>
                New to CrossFit? Try your first class on us—no commitment
              </p>
              <Button variant="secondary" size="medium" onClick={handleTrialClick}>
                Book Trial Pass
              </Button>
            </div>

            <div className={styles.actionCard}>
              <div className={styles.cardIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <h3 className={styles.cardTitle}>Class Schedule</h3>
              <p className={styles.cardDescription}>
                View our full timetable and find a class that fits your day
              </p>
              <Button variant="outline" size="medium" as="a" href="/schedule">
                View Schedule
              </Button>
            </div>
          </div>
        </div>
      </Container>

      <TrialModal isOpen={isTrialModalOpen} onClose={() => setIsTrialModalOpen(false)} />
    </Section>
  );
};

export default Hero;
