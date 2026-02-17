import styles from './GymNotFound.module.scss';

interface GymNotFoundProps {
  slug?: string | null;
  error?: string | null;
}

const GymNotFound: React.FC<GymNotFoundProps> = ({ slug, error }) => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.icon}>🏋️</div>
        <h1 className={styles.title}>Gym Not Found</h1>
        <p className={styles.message}>
          {slug
            ? `We couldn't find a gym with the address "${slug}". It may have been moved or is no longer active.`
            : error || 'The gym you are looking for could not be found.'}
        </p>
        <div className={styles.actions}>
          <a href="/" className={styles.link}>
            Visit our platform
          </a>
        </div>
      </div>
    </div>
  );
};

export default GymNotFound;
