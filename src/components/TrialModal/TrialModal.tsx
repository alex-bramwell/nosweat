import React, { useState } from 'react';
import { Modal, Button } from '../common';
import { AuthModal } from '../AuthModal';
import styles from './TrialModal.module.scss';

interface TrialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TrialModal: React.FC<TrialModalProps> = ({ isOpen, onClose }) => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleCreateAccount = () => {
    setIsAuthModalOpen(true);
    onClose();
  };

  const handleSignIn = () => {
    setIsAuthModalOpen(true);
    onClose();
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className={styles.content}>
          <h2 className={styles.title}>Start Your Free Trial</h2>
          <p className={styles.subtitle}>
            Experience the CrossFit Comet difference with no commitment
          </p>

          <div className={styles.benefits}>
            <div className={styles.benefit}>
              <div className={styles.benefitContent}>
                <h3 className={styles.benefitTitle}>
                  <span className={styles.icon}>✓</span>
                  Personal Consultation
                </h3>
                <p className={styles.benefitText}>
                  Meet with a coach to discuss your fitness goals and experience level
                </p>
              </div>
            </div>

            <div className={styles.benefit}>
              <div className={styles.benefitContent}>
                <h3 className={styles.benefitTitle}>
                  <span className={styles.icon}>✓</span>
                  Facility Tour
                </h3>
                <p className={styles.benefitText}>
                  Explore our gym and learn about our equipment and amenities
                </p>
              </div>
            </div>

            <div className={styles.benefit}>
              <div className={styles.benefitContent}>
                <h3 className={styles.benefitTitle}>
                  <span className={styles.icon}>✓</span>
                  No Obligations
                </h3>
                <p className={styles.benefitText}>
                  Try us out with absolutely no pressure to join or commitment required
                </p>
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <Button
              variant="primary"
              size="large"
              fullWidth
              onClick={handleCreateAccount}
            >
              Create Account to Book
            </Button>
            <p className={styles.note}>
              Already have an account?{' '}
              <button onClick={handleSignIn} className={styles.link}>
                Sign in
              </button>
            </p>
          </div>
        </div>
      </Modal>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode="signup"
      />
    </>
  );
};

export default TrialModal;
