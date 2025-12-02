import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Section.module.scss';

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  spacing?: 'none' | 'small' | 'medium' | 'large' | 'xlarge';
  background?: 'default' | 'surface' | 'dark';
  fullWidth?: boolean;
  as?: 'section' | 'div' | 'article';
}

const Section = ({
  children,
  spacing = 'medium',
  background = 'default',
  fullWidth = false,
  as: Component = 'section',
  className = '',
  ...rest
}: SectionProps) => {
  const sectionClasses = [
    styles.section,
    styles[`spacing-${spacing}`],
    styles[`bg-${background}`],
    fullWidth ? styles.fullWidth : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Component className={sectionClasses} {...rest}>
      {children}
    </Component>
  );
};

export default Section;
