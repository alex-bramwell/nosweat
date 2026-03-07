import type { HTMLAttributes, ReactNode } from 'react';
import styles from './GlassCard.module.scss';

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  blur?: 'subtle' | 'normal' | 'strong';
  tint?: 'neutral' | 'accent' | 'secondary';
  hoverable?: boolean;
  glow?: boolean;
  padding?: 'none' | 'compact' | 'normal' | 'spacious';
}

const GlassCard = ({
  children,
  blur = 'normal',
  tint = 'neutral',
  hoverable = false,
  glow = false,
  padding = 'normal',
  className = '',
  ...rest
}: GlassCardProps) => {
  const blurMap = { subtle: 'blurSubtle', normal: 'blurNormal', strong: 'blurStrong' } as const;
  const tintMap = { neutral: 'tintNeutral', accent: 'tintAccent', secondary: 'tintSecondary' } as const;
  const paddingMap = { none: 'paddingNone', compact: 'paddingCompact', normal: 'paddingNormal', spacious: 'paddingSpacious' } as const;

  const classes = [
    styles.glassCard,
    styles[blurMap[blur]],
    styles[tintMap[tint]],
    styles[paddingMap[padding]],
    hoverable ? styles.hoverable : '',
    glow ? styles.glow : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
};

export default GlassCard;
