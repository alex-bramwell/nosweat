import { useState } from 'react';
import { Button, Section, Container } from '../../common';
import { TrialModal } from '../../TrialModal';
import { DayPassModal } from '../../DayPassModal';
import { useTenant } from '../../../contexts/TenantContext';
import styles from './Hero.module.scss';

const Hero = () => {
  const { branding } = useTenant();
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);
  const [isDayPassModalOpen, setIsDayPassModalOpen] = useState(false);

  const handleDayPassClick = () => {
    setIsDayPassModalOpen(true);
  };

  const handleTrialClick = () => {
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
            {branding.hero_headline}
          </h1>
          <p className={styles.subtitle}>
            {branding.hero_subtitle}
          </p>

          <div className={styles.actionCards}>
            <div className={styles.actionCard}>
              <h3 className={styles.cardTitle}>Day Pass</h3>
              <p className={styles.cardDescription}>
                Drop in for a single session and experience our community
              </p>
              <Button variant="primary" size="medium" onClick={handleDayPassClick}>
                Book Day Pass
              </Button>
            </div>

            <div className={styles.actionCard}>
              <h3 className={styles.cardTitle}>Free Trial</h3>
              <p className={styles.cardDescription}>
                New here? Try your first class on us—no commitment
              </p>
              <Button variant="secondary" size="medium" onClick={handleTrialClick}>
                Book Trial Pass
              </Button>
            </div>

            <div className={styles.actionCard}>
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
      <DayPassModal isOpen={isDayPassModalOpen} onClose={() => setIsDayPassModalOpen(false)} />
    </Section>
  );
};

export default Hero;
