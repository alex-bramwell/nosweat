import { useState } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { getFeatureDefinition } from '../../config/features';
import { enableFeature } from '../../lib/enableFeature';
import type { FeatureKey } from '../../types/tenant';
import { Button } from '../common';
import styles from './LockedFeatureOverlay.module.scss';

interface LockedFeatureOverlayProps {
  feature: FeatureKey;
}

const LockedFeatureOverlay: React.FC<LockedFeatureOverlayProps> = ({ feature }) => {
  const { gym, refreshTenant } = useTenant();
  const definition = getFeatureDefinition(feature);
  const [isEnabling, setIsEnabling] = useState(false);

  const handleEnable = async () => {
    if (!gym) return;
    setIsEnabling(true);
    try {
      await enableFeature(gym.id, feature);
      await refreshTenant();
    } catch (err) {
      console.error('Failed to enable feature:', err);
    } finally {
      setIsEnabling(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.lockIcon}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h2 className={styles.title}>{definition?.name ?? feature}</h2>
        <p className={styles.description}>{definition?.description}</p>
        <Button onClick={handleEnable} disabled={isEnabling}>
          {isEnabling ? 'Enabling...' : `Enable ${definition?.name ?? feature}`}
        </Button>
      </div>
    </div>
  );
};

export default LockedFeatureOverlay;
