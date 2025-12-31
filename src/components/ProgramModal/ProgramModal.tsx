import React, { useState } from 'react';
import { Modal, Button } from '../common';
import { AuthModal } from '../AuthModal';
import { programDetails } from '../../data/programDetails';
import styles from './ProgramModal.module.scss';

interface ProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  programId: string;
}

const ProgramModal: React.FC<ProgramModalProps> = ({ isOpen, onClose, programId }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');
  const program = programDetails[programId];

  const handleGetStarted = () => {
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
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleAuthSuccess = () => {
    resetModal();
    onClose();
  };

  if (!program) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      {step === 1 ? (
        <div className={styles.content}>
          <div className={styles.stepIndicator}>
            <div className={`${styles.step} ${styles.active}`}>
              <span className={styles.stepNumber}>1</span>
              <span className={styles.stepLabel}>Program Details</span>
            </div>
            <div className={styles.stepDivider} />
            <div className={styles.step}>
              <span className={styles.stepNumber}>2</span>
              <span className={styles.stepLabel}>Get Started</span>
            </div>
          </div>

          <div className={styles.header}>
            <h2 className={styles.title}>{program.title}</h2>
            <p className={styles.tagline}>{program.tagline}</p>
          </div>

          <p className={styles.overview}>{program.overview}</p>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>What You'll Get</h3>
            <div className={styles.benefits}>
              {program.benefits.map((benefit, index) => (
                <div key={index} className={styles.benefit}>
                  <div className={styles.benefitContent}>
                    <h4 className={styles.benefitTitle}>
                      <span className={styles.icon}>✓</span>
                      {benefit.title}
                    </h4>
                    <p className={styles.benefitText}>{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Who Is This For?</h3>
            <ul className={styles.whoList}>
              {program.whoIsItFor.map((item, index) => (
                <li key={index} className={styles.whoItem}>
                  <span className={styles.bullet}>•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {(program.schedule || program.pricing) && (
            <div className={styles.details}>
              {program.schedule && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Schedule:</span>
                  <span className={styles.detailValue}>{program.schedule}</span>
                </div>
              )}
              {program.pricing && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Pricing:</span>
                  <span className={styles.detailValue}>{program.pricing}</span>
                </div>
              )}
            </div>
          )}

          <div className={styles.actions}>
            <Button variant="primary" size="large" fullWidth onClick={handleGetStarted}>
              Continue to Get Started
            </Button>
            <p className={styles.note}>
              Already have an account?{' '}
              <button onClick={handleSignIn} className={styles.link}>
                Sign in
              </button>
            </p>
          </div>
        </div>
      ) : (
        <div className={styles.content}>
          <div className={styles.stepIndicator}>
            <button className={`${styles.step} ${styles.clickable}`} onClick={handleBack}>
              <span className={styles.stepNumber}>1</span>
              <span className={styles.stepLabel}>Program Details</span>
            </button>
            <div className={styles.stepDivider} />
            <div className={`${styles.step} ${styles.active}`}>
              <span className={styles.stepNumber}>2</span>
              <span className={styles.stepLabel}>{authMode === 'signup' ? 'Get Started' : 'Sign In'}</span>
            </div>
          </div>

          <div className={styles.authContainer}>
            <AuthModal
              isOpen={true}
              onClose={handleAuthSuccess}
              initialMode={authMode}
              embedded={true}
            />
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ProgramModal;
