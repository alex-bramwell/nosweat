import React from 'react';
import styles from './SelectableCard.module.scss';

export interface SelectableCardProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  onClick: () => void;
  className?: string;
}

const SelectableCard: React.FC<SelectableCardProps> = ({
  icon,
  title,
  description,
  onClick,
  className,
}) => (
  <div className={`${styles.selectableCard} ${className || ''}`} onClick={onClick} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}>
    <div className={styles.selectableCardHeader}>
      {icon && <span className={styles.selectableCardIcon}>{icon}</span>}
      <span className={styles.selectableCardTitle}>{title}</span>
    </div>
    {description && (
      <p className={styles.selectableCardDescription}>{description}</p>
    )}
  </div>
);

export default SelectableCard;
