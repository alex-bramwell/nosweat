import { useState } from 'react';
import type { ReactElement } from 'react';
import { Button, Section, Container } from '../../common';
import { TrialModal } from '../../TrialModal';
import { DayPassModal } from '../../DayPassModal';
import { useBrandingWithOverrides } from '../../../hooks/useBrandingWithOverrides';
import { useFeature, useGymPath } from '../../../contexts/TenantContext';
import { DEFAULT_BRANDING } from '../../../contexts/TenantContext';
import type { HeroCardKey } from '../../../types/tenant';
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
  const order = (branding.hero_card_order ?? DEFAULT_BRANDING.hero_card_order) as HeroCardKey[];

  // Each card needs its feature enabled AND requires the owner has not switched
  // it off in the builder (enabled !== false). Rendered in the owner's order.
  const cardSetup: Record<HeroCardKey, { feature: boolean; action: (label: string) => ReactElement }> = {
    daypass: {
      feature: hasDayPasses,
      action: (label) => (
        <Button variant="primary" size="default" onClick={() => setIsDayPassModalOpen(true)}>{label}</Button>
      ),
    },
    trial: {
      feature: hasTrials,
      action: (label) => (
        <Button variant="secondary" size="default" onClick={() => setIsTrialModalOpen(true)}>{label}</Button>
      ),
    },
    schedule: {
      feature: hasClassBooking,
      action: (label) => (
        <Button variant="outline" size="default" as="a" href={gymPath('/schedule')}>{label}</Button>
      ),
    },
  };

  const visibleKeys = order.filter(
    (key) => cardSetup[key] && cardSetup[key].feature && cards[key] && cards[key].enabled !== false
  );

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

          {visibleKeys.length > 0 && (
            <div className={styles.heroActions}>
              {visibleKeys.map((key) => (
                <div key={key} className={styles.heroActionCard}>
                  <h3 className={styles.heroCardTitle}>{cards[key].title}</h3>
                  <p className={styles.heroCardDescription}>{cards[key].description}</p>
                  {cardSetup[key].action(cards[key].button)}
                </div>
              ))}
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
