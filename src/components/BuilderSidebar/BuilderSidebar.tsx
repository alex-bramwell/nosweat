import { useState, useEffect } from 'react';
import BrandingEditor from '../GymAdmin/BrandingEditor';
import type { GymBranding } from '../../types/tenant';
import styles from './BuilderSidebar.module.scss';

interface BuilderSidebarProps {
  onDraftChange?: (data: Partial<GymBranding> | null) => void;
}

const BuilderSidebar: React.FC<BuilderSidebarProps> = ({ onDraftChange }) => {
  const [panelOpen, setPanelOpen] = useState(
    () => localStorage.getItem('builder-panel') !== 'collapsed'
  );

  useEffect(() => {
    localStorage.setItem('builder-panel', panelOpen ? 'open' : 'collapsed');
  }, [panelOpen]);

  return (
    <aside className={`${styles.builderPanel} ${panelOpen ? '' : styles.builderPanelCollapsed}`}>
      {/* Edge toggle handle */}
      <button
        className={styles.builderPanelEdgeToggle}
        onClick={() => setPanelOpen(!panelOpen)}
        aria-label={panelOpen ? 'Collapse panel' : 'Expand panel'}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {panelOpen
            ? <path d="M15 18l-6-6 6-6" />
            : <path d="M9 6l6 6-6 6" />
          }
        </svg>
      </button>

      <div className={styles.builderPanelContent}>
        <div className={styles.builderPanelHeader}>
          <span className={styles.builderPanelHeaderIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
          </span>
          <span className={styles.builderPanelHeaderTitle}>Branding</span>
        </div>

        <div className={styles.builderPanelBody}>
          <BrandingEditor onDraftChange={onDraftChange} />
        </div>
      </div>
    </aside>
  );
};

export default BuilderSidebar;
