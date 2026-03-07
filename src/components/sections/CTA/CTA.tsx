import { useState } from 'react';
import { Section, Container, Button } from '../../common';
import { TrialModal } from '../../TrialModal';
import { useBrandingWithOverrides } from '../../../hooks/useBrandingWithOverrides';
import styles from './CTA.module.scss';

const CTA = () => {
  const branding = useBrandingWithOverrides();
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);

  const openTrialModal = () => {
    setIsTrialModalOpen(true);
  };

  const closeTrialModal = () => {
    setIsTrialModalOpen(false);
  };

  return (
    <>
      <Section spacing="generous" background="bold" className={styles.ctaSection}>
        <Container size="contentNarrow">
          <div className={styles.ctaBody}>
            <h2 className={styles.ctaHeadline}>{branding.cta_headline}</h2>
            <p className={styles.ctaTagline}>
              {branding.cta_subtitle}
            </p>
            <div className={styles.ctaActions}>
              <Button variant="primary" size="prominent" onClick={openTrialModal}>
                Book Free Trial
              </Button>
              <Button variant="outline" size="prominent" as="a" href="/about#visit">
                Contact Us
              </Button>
            </div>
            <p className={styles.ctaNote}>
              No commitment required. Come see what makes our community special.
            </p>
          </div>
        </Container>
      </Section>
      <TrialModal isOpen={isTrialModalOpen} onClose={closeTrialModal} />
    </>
  );
};

export default CTA;
