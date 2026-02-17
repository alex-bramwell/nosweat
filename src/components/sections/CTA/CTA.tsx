import { useState } from 'react';
import { Section, Container, Button } from '../../common';
import { TrialModal } from '../../TrialModal';
import { useTenant } from '../../../contexts/TenantContext';
import styles from './CTA.module.scss';

const CTA = () => {
  const { branding } = useTenant();
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);

  const openTrialModal = () => {
    setIsTrialModalOpen(true);
  };

  const closeTrialModal = () => {
    setIsTrialModalOpen(false);
  };

  return (
    <>
      <Section spacing="xlarge" background="dark" className={styles.cta}>
        <Container size="small">
          <div className={styles.content}>
            <h2 className={styles.title}>{branding.cta_headline}</h2>
            <p className={styles.subtitle}>
              {branding.cta_subtitle}
            </p>
            <div className={styles.actions}>
              <Button variant="primary" size="large" onClick={openTrialModal}>
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
      <TrialModal isOpen={isTrialModalOpen} onClose={closeTrialModal} />
    </>
  );
};

export default CTA;
