import { useState } from 'react';
import { Section, Container, Button } from '../../common';
import { TrialModal } from '../../TrialModal';
import { useBrandingWithOverrides } from '../../../hooks/useBrandingWithOverrides';
import { useGymPath } from '../../../contexts/TenantContext';
import { DEFAULT_BRANDING } from '../../../contexts/TenantContext';
import styles from './CTA.module.scss';

const CTA = () => {
  const branding = useBrandingWithOverrides();
  const gymPath = useGymPath();
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);

  const primaryText = branding.cta_primary_text || DEFAULT_BRANDING.cta_primary_text || 'Book Free Trial';
  const secondaryText = branding.cta_secondary_text || DEFAULT_BRANDING.cta_secondary_text || 'Contact Us';
  const note = branding.cta_note ?? DEFAULT_BRANDING.cta_note ?? '';

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
                {primaryText}
              </Button>
              <Button variant="outline" size="prominent" as="a" href={gymPath('/about#visit')}>
                {secondaryText}
              </Button>
            </div>
            {note && <p className={styles.ctaNote}>{note}</p>}
          </div>
        </Container>
      </Section>
      <TrialModal isOpen={isTrialModalOpen} onClose={closeTrialModal} />
    </>
  );
};

export default CTA;
