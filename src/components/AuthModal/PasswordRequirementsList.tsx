import React from 'react';
import type { PasswordRequirements } from '../../utils/security';
import styles from './AuthModal.module.scss';

interface PasswordRequirementsListProps {
  requirements: PasswordRequirements | null;
}

const REQUIREMENTS: { key: keyof PasswordRequirements; label: string }[] = [
  { key: 'minLength', label: 'At least 12 characters' },
  { key: 'hasUppercase', label: 'One uppercase letter' },
  { key: 'hasLowercase', label: 'One lowercase letter' },
  { key: 'hasNumber', label: 'One number' },
  { key: 'hasSpecial', label: 'One special character' },
];

/** Live checklist of the password rules plus the password-manager tip. */
const PasswordRequirementsList: React.FC<PasswordRequirementsListProps> = ({ requirements }) => (
  <div className={styles.passwordRequirements}>
    <div className={styles.requirementsList}>
      {REQUIREMENTS.map(({ key, label }) => {
        const met = requirements?.[key];
        return (
          <div key={key} className={`${styles.requirement} ${met ? styles.met : ''}`}>
            <span className={styles.checkmark}>{met ? '✓' : '✗'}</span>
            <span>{label}</span>
          </div>
        );
      })}
    </div>
    <div className={styles.passwordTip}>
      <svg className={styles.tipIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18h6" />
        <path d="M10 22h4" />
        <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
      </svg>
      <span>Tip: Use your browser's password manager to generate a strong password for easier sign in</span>
    </div>
  </div>
);

export default PasswordRequirementsList;
