import { useState } from 'react';
import { Button, Section, Container } from '../../common';
import { TrialModal } from '../../TrialModal';
import styles from './Hero.module.scss';

const Hero = () => {
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);

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
          <div className={styles.features}>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>✓</span>
              <span>All Fitness Levels</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>✓</span>
              <span>Expert Coaches</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>✓</span>
              <span>Proven Results</span>
            </div>
          </div>
          <div className={styles.infoCard}>
            <span className={styles.infoContent}>
              <svg className={styles.infoIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              <span className={styles.infoText}>Please create an account to book a free trial</span>
            </span>
            <Button variant="outline" size="small" onClick={() => setIsTrialModalOpen(true)}>
              Book Trial
            </Button>
          </div>
          <div className={styles.actions}>
            <Button variant="primary" size="large" as="a" href="/schedule">
              View Schedule
            </Button>
          </div>
        </div>
      </Container>

      <TrialModal isOpen={isTrialModalOpen} onClose={() => setIsTrialModalOpen(false)} />
    </Section>
  );
};

export default Hero;
