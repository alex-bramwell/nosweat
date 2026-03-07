import type { ReactNode } from 'react';
import styles from './EmptyStatePreview.module.scss';

interface EmptyStatePreviewProps {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}

const EmptyStatePreview: React.FC<EmptyStatePreviewProps> = ({ title, description, action, children }) => {
  return (
    <div className={styles.emptyStateRoot}>
      <div className={styles.banner}>
        <div className={styles.bannerIcon}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </div>
        <div className={styles.bannerText}>
          <span className={styles.bannerTitle}>{title}</span>
          <span className={styles.bannerDescription}>{description}</span>
        </div>
        {action ? (
          <div className={styles.bannerAction}>{action}</div>
        ) : (
          <span className={styles.bannerLabel}>Preview</span>
        )}
      </div>
      <div className={styles.emptyStateContent}>
        {children}
      </div>
    </div>
  );
};

export default EmptyStatePreview;
