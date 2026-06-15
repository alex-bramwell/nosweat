import React from 'react';
import { Button, modalStyles as m } from '../common';
import styles from './AuthModal.module.scss';

export interface CompletionStep {
  title: string;
  description: string;
}

interface AuthCompletionScreenProps {
  /** The status icon shown at the top of the screen. */
  icon: React.ReactNode;
  title: string;
  /** Lead paragraph - usually includes the user's email in <strong>. */
  message: React.ReactNode;
  steps: CompletionStep[];
  note: string;
  buttonLabel: string;
  onAcknowledge: () => void;
}

/**
 * Shared confirmation screen shown after a signup or a password-reset request:
 * an icon, a title, a lead message, the numbered next steps, a note, and a
 * single acknowledge button.
 */
const AuthCompletionScreen: React.FC<AuthCompletionScreenProps> = ({
  icon,
  title,
  message,
  steps,
  note,
  buttonLabel,
  onAcknowledge,
}) => (
  <div className={m.modalBody}>
    <div className={styles.completionContainer}>
      <div className={styles.completionIcon}>{icon}</div>
      <h2 className={styles.completionTitle}>{title}</h2>
      <p className={styles.completionMessage}>{message}</p>
      <div className={styles.completionSteps}>
        {steps.map((step, index) => (
          <div key={index} className={styles.completionStep}>
            <div className={styles.stepText}>
              <h4><span className={styles.stepNumber}>{index + 1}</span> {step.title}</h4>
              <p>{step.description}</p>
            </div>
          </div>
        ))}
      </div>
      <div className={styles.completionNote}>
        <span className={styles.iconWrapper}>
          <svg className={styles.infoIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </span>
        <p>{note}</p>
      </div>
      <Button variant="primary" size="prominent" fullWidth onClick={onAcknowledge}>
        {buttonLabel}
      </Button>
    </div>
  </div>
);

export default AuthCompletionScreen;
