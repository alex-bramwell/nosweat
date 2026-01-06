import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Button } from '../common';
import { AuthModal } from '../AuthModal';
import { StripeCardSetupForm } from '../StripeCardSetupForm';
import { useAuth } from '../../contexts/AuthContext';
import { useRegistrationIntent } from '../../contexts/RegistrationContext';
import styles from './TrialModal.module.scss';

interface TrialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TrialModal: React.FC<TrialModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { updateStep, clearIntent } = useRegistrationIntent();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');
  const [setupError, setSetupError] = useState<string | null>(null);

  const handleCreateAccount = () => {
    setAuthMode('signup');
    setStep(2);
  };

  const handleSignIn = () => {
    setAuthMode('login');
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const resetModal = () => {
    setStep(1);
    setAuthMode('signup');
    setSetupError(null);
  };

  const handleClose = () => {
    if (step !== 3) {
      resetModal();
      onClose();
    }
  };

  const handleAuthSuccess = () => {
    if (isAuthenticated && user) {
      updateStep('payment');
      setStep(3);
    }
  };

  const handleSetupSuccess = () => {
    clearIntent();
    navigate('/schedule');
    setTimeout(() => {
      resetModal();
      onClose();
    }, 100);
  };

  const handleSetupError = (error: string) => {
    setSetupError(error);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      {step === 1 ? (
        <div className={styles.content}>
          <div className={styles.stepIndicator}>
            <div className={`${styles.step} ${styles.active}`}>
              <span className={styles.stepNumber}>1</span>
              <span className={styles.stepLabel}>What's Included</span>
            </div>
            <div className={styles.stepDivider} />
            <div className={styles.step}>
              <span className={styles.stepNumber}>2</span>
              <span className={styles.stepLabel}>Create Account</span>
            </div>
            <div className={styles.stepDivider} />
            <div className={styles.step}>
              <span className={styles.stepNumber}>3</span>
              <span className={styles.stepLabel}>Card Setup</span>
            </div>
          </div>

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
              Continue to Create Account
            </Button>
          </div>
        </div>
      ) : step === 2 ? (
        <div className={styles.content}>
          <div className={styles.stepIndicator}>
            <button className={`${styles.step} ${styles.clickable}`} onClick={handleBack}>
              <span className={styles.stepNumber}>1</span>
              <span className={styles.stepLabel}>What's Included</span>
            </button>
            <div className={styles.stepDivider} />
            <div className={`${styles.step} ${styles.active}`}>
              <span className={styles.stepNumber}>2</span>
              <span className={styles.stepLabel}>Create Account</span>
            </div>
            <div className={styles.stepDivider} />
            <div className={styles.step}>
              <span className={styles.stepNumber}>3</span>
              <span className={styles.stepLabel}>Card Setup</span>
            </div>
          </div>

          <div className={styles.authContainer}>
            <AuthModal
              isOpen={true}
              onClose={handleAuthSuccess}
              initialMode="signup"
              embedded={true}
            />
          </div>
        </div>
      ) : (
        <div className={styles.content}>
          <div className={styles.stepIndicator}>
            <div className={`${styles.step} ${styles.completed}`}>
              <span className={styles.stepNumber}>1</span>
              <span className={styles.stepLabel}>What's Included</span>
            </div>
            <div className={styles.stepDivider} />
            <div className={`${styles.step} ${styles.completed}`}>
              <span className={styles.stepNumber}>2</span>
              <span className={styles.stepLabel}>Account Created</span>
            </div>
            <div className={styles.stepDivider} />
            <div className={`${styles.step} ${styles.active}`}>
              <span className={styles.stepNumber}>3</span>
              <span className={styles.stepLabel}>Card Setup</span>
            </div>
          </div>

          <h2 className={styles.title}>Verify Your Payment Method</h2>
          <p className={styles.subtitle}>
            Complete your trial setup by adding a payment method. You won't be charged during your trial period.
          </p>

          {setupError && (
            <div className={styles.errorBanner}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <p>{setupError}</p>
            </div>
          )}

          <div className={styles.setupFormContainer}>
            {user && (
              <StripeCardSetupForm
                userId={user.id}
                onSuccess={handleSetupSuccess}
                onError={handleSetupError}
              />
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default TrialModal;
