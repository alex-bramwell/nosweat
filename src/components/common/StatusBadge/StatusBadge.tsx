import React from 'react';
import styles from './StatusBadge.module.scss';

export type BadgeVariant = 'default' | 'warning' | 'success' | 'error';

export interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}

const variantClassMap: Record<BadgeVariant, string> = {
  default: styles.variantDefault,
  warning: styles.variantWarning,
  success: styles.variantSuccess,
  error: styles.variantError,
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ label, variant = 'default', className }) => (
  <span className={`${styles.statusBadge} ${variantClassMap[variant]} ${className || ''}`}>
    {label}
  </span>
);

export default StatusBadge;
