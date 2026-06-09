import React, { useEffect } from 'react';
import CloseButton from './CloseButton';
import styles from './Modal.module.scss';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'compact' | 'default' | 'wide' | 'fullscreen';
}

const sizeClassMap: Record<string, string> = {
  compact: styles.sizeCompact,
  default: styles.sizeDefault,
  wide: styles.sizeWide,
  fullscreen: styles.sizeFullscreen,
};

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, size = 'default' }) => {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClass = sizeClassMap[size] || '';

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modalContent} ${sizeClass}`} onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose} aria-label="Close modal" />
        {children}
      </div>
    </div>
  );
};

export default Modal;
