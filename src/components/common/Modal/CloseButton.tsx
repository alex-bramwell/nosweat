import React from 'react';
import styles from './Modal.module.scss';

interface CloseButtonProps {
  onClick?: () => void;
  href?: string;
  'aria-label'?: string;
  className?: string;
}

/**
 * Reusable close button (×) used by Modal and any panel/page that needs a dismiss action.
 * Renders as a <button> when onClick is provided, or an <a> when href is provided.
 */
const CloseButton: React.FC<CloseButtonProps> = ({ onClick, href, className, ...rest }) => {
  const combinedClass = className ? `${styles.modalClose} ${className}` : styles.modalClose;
  const label = rest['aria-label'] || 'Close';

  if (href) {
    return (
      <a href={href} className={combinedClass} aria-label={label}>
        &times;
      </a>
    );
  }

  return (
    <button className={combinedClass} onClick={onClick} aria-label={label}>
      &times;
    </button>
  );
};

export default CloseButton;
