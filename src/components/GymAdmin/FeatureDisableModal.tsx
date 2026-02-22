import { Modal } from '../common';
import { ILLUSTRATIONS } from '../guide/GuideIllustrations';
import type { FeatureDefinition } from '../../config/features';
import styles from './FeatureDisableModal.module.scss';

interface FeatureDisableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  feature: FeatureDefinition;
  dependentFeatures: FeatureDefinition[];
  isLoading: boolean;
}

const FeatureDisableModal: React.FC<FeatureDisableModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  feature,
  dependentFeatures,
  isLoading,
}) => {
  const Illustration = ILLUSTRATIONS[feature.illustrationKey];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="medium">
      <div className={styles.content}>
        {Illustration && (
          <div className={styles.illustration}>
            <Illustration />
          </div>
        )}

        <h2 className={styles.heading}>Disable {feature.name}?</h2>
        <p className={styles.description}>{feature.description}</p>

        {dependentFeatures.length > 0 && (
          <div className={styles.warning}>
            <div className={styles.warningIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div className={styles.warningText}>
              <span className={styles.warningTitle}>This will also disable:</span>
              <p className={styles.warningList}>
                {dependentFeatures.map((f) => f.name).join(', ')}
              </p>
            </div>
          </div>
        )}

        <div className={styles.actions}>
          <button className={styles.cancelButton} onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button className={styles.disableButton} onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Disabling...' : 'Disable'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default FeatureDisableModal;
