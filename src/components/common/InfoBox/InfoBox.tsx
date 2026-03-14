import React from 'react';
import styles from './InfoBox.module.scss';

export type InfoBoxVariant = 'default' | 'accent';

export interface InfoBoxProps {
  title?: string;
  children: React.ReactNode;
  variant?: InfoBoxVariant;
  className?: string;
}

const variantClassMap: Record<InfoBoxVariant, string> = {
  default: styles.variantDefault,
  accent: styles.variantAccent,
};

const InfoBox: React.FC<InfoBoxProps> = ({ title, children, variant = 'default', className }) => (
  <div className={`${styles.infoBox} ${variantClassMap[variant]} ${className || ''}`}>
    {title && <p className={styles.infoBoxTitle}>{title}</p>}
    <div className={styles.infoBoxContent}>{children}</div>
  </div>
);

export default InfoBox;
