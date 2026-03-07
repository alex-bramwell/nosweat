import { useState } from 'react';
import { Button, Section, Container } from '../../common';
import { TrialModal } from '../../TrialModal';
import { DayPassModal } from '../../DayPassModal';
import { useBrandingWithOverrides } from '../../../hooks/useBrandingWithOverrides';
import styles from './Hero.module.scss';

const FALLBACK_HERO = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop';

const Hero = () => {
  const branding = useBrandingWithOverrides();
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);
  const [isDayPassModalOpen, setIsDayPassModalOpen] = useState(false);

  const handleDayPassClick = () => {
    setIsDayPassModalOpen(true);
  };

  const handleTrialClick = () => {
    setIsTrialModalOpen(true);
  };

  return (
    <Section spacing="generous" background="bold" className={styles.heroSection}>
      <div
        className={styles.heroBackdrop}
        style={{ backgroundImage: `url(${branding.hero_image_url || FALLBACK_HERO})` }}
      />
      {branding.hero_effect === 'comet' && (
        <div className={styles.heroCometEffect}>
          <div className={styles.heroCometTrail}></div>
        </div>
      )}
      {branding.hero_effect === 'gradient' && (
        <div className={styles.heroGradientEffect} />
      )}
      <Container>
        <div className={styles.heroBody}>
          <h1 className={styles.heroHeadline}>
            {branding.hero_headline}
          </h1>
          <p className={styles.heroTagline}>
            {branding.hero_subtitle}
          </p>

          <div className={styles.heroActions}>
            <div className={styles.heroActionCard}>
              <h3 className={styles.heroCardTitle}>Day Pass</h3>
              <p className={styles.heroCardDescription}>
                Drop in for a single session and experience our community
              </p>
              <Button variant="primary" size="default" onClick={handleDayPassClick}>
                Book Day Pass
              </Button>
            </div>

            <div className={styles.heroActionCard}>
              <h3 className={styles.heroCardTitle}>Free Trial</h3>
              <p className={styles.heroCardDescription}>
                New here? Try your first class on us, no commitment
              </p>
              <Button variant="secondary" size="default" onClick={handleTrialClick}>
                Book Trial Pass
              </Button>
            </div>

            <div className={styles.heroActionCard}>
              <h3 className={styles.heroCardTitle}>Class Schedule</h3>
              <p className={styles.heroCardDescription}>
                View our full timetable and find a class that fits your day
              </p>
              <Button variant="outline" size="default" as="a" href="/schedule">
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
