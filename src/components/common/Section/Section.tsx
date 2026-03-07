import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Section.module.scss';

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  spacing?: 'none' | 'tight' | 'normal' | 'relaxed' | 'generous';
  background?: 'default' | 'surface' | 'bold';
  fullWidth?: boolean;
  as?: 'section' | 'div' | 'article';
}

const Section = ({
  children,
  spacing = 'normal',
  background = 'default',
  fullWidth = false,
  as: Component = 'section',
  className = '',
  ...rest
}: SectionProps) => {
  const spacingMap: Record<string, string> = {
    none: styles.spacingNone,
    tight: styles.spacingTight,
    normal: styles.spacingNormal,
    relaxed: styles.spacingRelaxed,
    generous: styles.spacingGenerous,
  };

  const bgMap: Record<string, string> = {
    default: styles.bgDefault,
    surface: styles.bgSurface,
    bold: styles.bgBold,
  };

  const sectionClasses = [
    styles.section,
    spacingMap[spacing],
    bgMap[background],
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
