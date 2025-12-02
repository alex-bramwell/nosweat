import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Container.module.scss';

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  size?: 'small' | 'medium' | 'large' | 'full';
  as?: 'div' | 'main' | 'article' | 'section';
}

const Container = ({
  children,
  size = 'medium',
  as: Component = 'div',
  className = '',
  ...rest
}: ContainerProps) => {
  const containerClasses = [
    styles.container,
    styles[size],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Component className={containerClasses} {...rest}>
      {children}
    </Component>
  );
};

export default Container;
