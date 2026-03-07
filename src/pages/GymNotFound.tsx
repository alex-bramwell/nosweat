import styles from './GymNotFound.module.scss';

interface GymNotFoundProps {
  slug?: string | null;
  error?: string | null;
}

const GymNotFound: React.FC<GymNotFoundProps> = ({ slug, error }) => {
  return (
    <div className={styles.gymNotFoundOuter}>
      <div className={styles.gymNotFoundInner}>
        <div className={styles.gymNotFoundIcon}>🏋️</div>
        <h1 className={styles.gymNotFoundTitle}>Gym Not Found</h1>
        <p className={styles.gymNotFoundMessage}>
          {slug
            ? `We couldn't find a gym with the address "${slug}". It may have been moved or is no longer active.`
            : error || 'The gym you are looking for could not be found.'}
        </p>
        <div className={styles.gymNotFoundActions}>
          <a href="/" className={styles.gymNotFoundLink}>
            Visit our platform
          </a>
        </div>
      </div>
    </div>
  );
};

export default GymNotFound;
