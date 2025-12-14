import { useState } from 'react';
import { Section, Container, Button } from '../../common';
import { AuthModal } from '../../AuthModal';
import styles from './CTA.module.scss';

const CTA = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const openAuthModal = () => {
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <>
      <Section spacing="xlarge" background="dark" className={styles.cta}>
        <Container size="small">
          <div className={styles.content}>
            <h2 className={styles.title}>Ready to Start Your Journey?</h2>
            <p className={styles.subtitle}>
              Join CrossFit Comet today and experience the difference. Your first class is free!
            </p>
            <div className={styles.actions}>
              <Button variant="primary" size="large" onClick={openAuthModal}>
                Book Free Trial
              </Button>
              <Button variant="outline" size="large" as="a" href="/about#visit">
                Contact Us
              </Button>
            </div>
            <p className={styles.note}>
              No commitment required. Come see what makes our community special.
            </p>
          </div>
        </Container>
      </Section>
      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} initialMode="signup" />
    </>
  );
};

export default CTA;
