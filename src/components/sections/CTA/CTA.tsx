import { Section, Container, Button } from '../../common';
import styles from './CTA.module.scss';

const CTA = () => {
  return (
    <Section spacing="xlarge" background="dark" className={styles.cta}>
      <Container size="small">
        <div className={styles.content}>
          <h2 className={styles.title}>Ready to Start Your Journey?</h2>
          <p className={styles.subtitle}>
            Join CrossFit Comet today and experience the difference. Your first class is free!
          </p>
          <div className={styles.actions}>
            <Button variant="primary" size="large">
              Book Free Trial
            </Button>
            <Button variant="outline" size="large">
              Contact Us
            </Button>
          </div>
          <p className={styles.note}>
            No commitment required. Come see what makes our community special.
          </p>
        </div>
      </Container>
    </Section>
  );
};

export default CTA;
