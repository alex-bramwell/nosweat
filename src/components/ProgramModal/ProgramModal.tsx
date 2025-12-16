import React from 'react';
import { Modal, Button } from '../common';
import { programDetails } from '../../data/programDetails';
import styles from './ProgramModal.module.scss';

interface ProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  programId: string;
  onGetStarted?: () => void;
}

const ProgramModal: React.FC<ProgramModalProps> = ({ isOpen, onClose, programId, onGetStarted }) => {
  const program = programDetails[programId];

  const handleGetStarted = () => {
    if (onGetStarted) {
      onGetStarted();
    } else {
      onClose();
    }
  };

  if (!program) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={styles.content}>
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
            Get Started
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ProgramModal;
