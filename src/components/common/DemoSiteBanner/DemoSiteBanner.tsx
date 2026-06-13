import styles from './DemoSiteBanner.module.scss';

/**
 * A persistent banner shown on the demo/example gym site, making it clear this
 * is a preview with example data and offering a way back to the dashboard.
 */
const DemoSiteBanner: React.FC = () => {
  const handleBack = () => {
    // The example opens in a tab spawned from the dashboard, so closing it
    // returns there. If the browser blocks the close, fall back to navigating
    // to the owner dashboard.
    window.close();
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 200);
  };

  return (
    <div className={styles.banner}>
      <span className={styles.message}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span>
          <strong>Example site with example data.</strong> This is a preview of what your own gym
          could look like.
        </span>
      </span>
      <button type="button" className={styles.backButton} onClick={handleBack}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to dashboard
      </button>
    </div>
  );
};

export default DemoSiteBanner;
