import styles from './RouteFallback.module.scss';

/**
 * Suspense fallback shown while a lazily-loaded route chunk downloads. It is
 * deliberately minimal and theme-neutral (uses `--color-accent`) so it reads
 * correctly in both the gym and platform contexts, and it fills the content
 * area without disturbing the surrounding navbar/footer chrome.
 */
const RouteFallback = () => (
  <div className={styles.routeFallback} role="status" aria-live="polite">
    <div className={styles.spinner} />
    <span className={styles.srOnly}>Loading...</span>
  </div>
);

export default RouteFallback;
