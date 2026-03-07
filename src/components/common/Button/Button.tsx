import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.scss';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'compact' | 'default' | 'prominent';
  fullWidth?: boolean;
  as?: 'button' | 'a';
  href?: string;
}

const sizeClassMap: Record<NonNullable<ButtonProps['size']>, string> = {
  compact: styles.sizeCompact,
  default: styles.sizeDefault,
  prominent: styles.sizeProminent,
};

const Button = ({
  children,
  variant = 'primary',
  size = 'default',
  fullWidth = false,
  className = '',
  as = 'button',
  href,
  ...rest
}: ButtonProps) => {
  const buttonClasses = [
    styles.button,
    styles[variant],
    sizeClassMap[size],
    fullWidth ? styles.fullWidth : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (as === 'a' && href) {
    const anchorProps = rest as AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <a href={href} className={buttonClasses} {...anchorProps}>
        {children}
      </a>
    );
  }

  return (
    <button className={buttonClasses} {...rest}>
      {children}
    </button>
  );
};

export default Button;
