import { useState } from 'react';
import { Button, Section, Container } from '../../common';
import { TrialModal } from '../../TrialModal';
import { DayPassModal } from '../../DayPassModal';
import { useBrandingWithOverrides } from '../../../hooks/useBrandingWithOverrides';
import { useFeature, useGymPath } from '../../../contexts/TenantContext';
import { DEFAULT_BRANDING } from '../../../contexts/TenantContext';
import styles from './Hero.module.scss';

const FALLBACK_HERO = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop';

const Hero = () => {
  const branding = useBrandingWithOverrides();
  const hasDayPasses = useFeature('day_passes');
  const hasTrials = useFeature('trial_memberships');
  const hasClassBooking = useFeature('class_booking');
  const gymPath = useGymPath();
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);
  const [isDayPassModalOpen, setIsDayPassModalOpen] = useState(false);

  const cards = branding.hero_cards ?? DEFAULT_BRANDING.hero_cards;

  const handleDayPassClick = () => {
    setIsDayPassModalOpen(true);
  };

  const handleTrialClick = () => {
    setIsTrialModalOpen(true);
  };

  const hasAnyAction = hasDayPasses || hasTrials || hasClassBooking;

  return (
    <Section spacing="generous" background="bold" className={styles.heroSection}>
      <div
        className={styles.heroBackdrop}
        style={{ backgroundImage: `url(${branding.hero_image_url || FALLBACK_HERO})` }}
      />
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

          {hasAnyAction && (
            <div className={styles.heroActions}>
              {hasDayPasses && (
                <div className={styles.heroActionCard}>
                  <h3 className={styles.heroCardTitle}>{cards.daypass.title}</h3>
                  <p className={styles.heroCardDescription}>
                    {cards.daypass.description}
                  </p>
                  <Button variant="primary" size="default" onClick={handleDayPassClick}>
                    {cards.daypass.button}
                  </Button>
                </div>
              )}

              {hasTrials && (
                <div className={styles.heroActionCard}>
                  <h3 className={styles.heroCardTitle}>{cards.trial.title}</h3>
                  <p className={styles.heroCardDescription}>
                    {cards.trial.description}
                  </p>
                  <Button variant="secondary" size="default" onClick={handleTrialClick}>
                    {cards.trial.button}
                  </Button>
                </div>
              )}

              {hasClassBooking && (
                <div className={styles.heroActionCard}>
                  <h3 className={styles.heroCardTitle}>{cards.schedule.title}</h3>
                  <p className={styles.heroCardDescription}>
                    {cards.schedule.description}
                  </p>
                  <Button variant="outline" size="default" as="a" href={gymPath('/schedule')}>
                    {cards.schedule.button}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </Container>

      {hasDayPasses && (
        <DayPassModal isOpen={isDayPassModalOpen} onClose={() => setIsDayPassModalOpen(false)} />
      )}
      {hasTrials && (
        <TrialModal isOpen={isTrialModalOpen} onClose={() => setIsTrialModalOpen(false)} />
      )}
    </Section>
  );
};

export default Hero;
