import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Card.module.scss';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'flat' | 'raised' | 'outlined';
  padding?: 'none' | 'compact' | 'normal' | 'spacious';
  hoverable?: boolean;
}

const variantClass: Record<string, string> = {
  flat: styles.cardFlat,
  raised: styles.cardRaised,
  outlined: styles.cardOutlined,
};

const paddingClass: Record<string, string> = {
  none: styles.paddingNone,
  compact: styles.paddingCompact,
  normal: styles.paddingNormal,
  spacious: styles.paddingSpacious,
};

const Card = ({
  children,
  variant = 'flat',
  padding = 'normal',
  hoverable = false,
  className = '',
  ...rest
}: CardProps) => {
  const cardClasses = [
    styles.card,
    variantClass[variant],
    paddingClass[padding],
    hoverable ? styles.hoverable : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cardClasses} {...rest}>
      {children}
    </div>
  );
};

export default Card;
