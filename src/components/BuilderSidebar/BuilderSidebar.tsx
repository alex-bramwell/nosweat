import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGymPath, useFeature } from '../../contexts/TenantContext';
import BrandingEditor from '../GymAdmin/BrandingEditor';
import type { GymBranding } from '../../types/tenant';
import styles from './BuilderSidebar.module.scss';

type ViewRole = 'admin' | 'coach' | 'member' | 'public';

interface BuilderSidebarProps {
  onDraftChange?: (data: Partial<GymBranding> | null) => void;
  onNavigatePage?: (path: string) => void;
  activePage?: string;
  viewAsRole?: ViewRole;
}

const BuilderSidebar: React.FC<BuilderSidebarProps> = ({ onDraftChange, onNavigatePage, activePage, viewAsRole = 'admin' }) => {
  const [panelOpen, setPanelOpen] = useState(
    () => localStorage.getItem('builder-panel') !== 'collapsed'
  );
  const navigate = useNavigate();
  const location = useLocation();
  const gymPath = useGymPath();
  const hasClassBooking = useFeature('class_booking');
  const hasCoachProfiles = useFeature('coach_profiles');

  useEffect(() => {
    localStorage.setItem('builder-panel', panelOpen ? 'open' : 'collapsed');
  }, [panelOpen]);

  const allPages: { label: string; path: string; icon: React.ReactNode; visibleTo: ViewRole[] }[] = [
    { label: 'Home', path: gymPath('/'), icon: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>, visibleTo: ['admin', 'coach', 'member', 'public'] },
    ...(hasClassBooking ? [{ label: 'Schedule', path: gymPath('/schedule'), icon: <><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>, visibleTo: ['admin', 'coach', 'member', 'public'] as ViewRole[] }] : []),
    ...(hasCoachProfiles ? [{ label: 'Coaches', path: gymPath('/coaches'), icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>, visibleTo: ['admin', 'coach', 'member', 'public'] as ViewRole[] }] : []),
    { label: 'About', path: gymPath('/about'), icon: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></>, visibleTo: ['admin', 'coach', 'member', 'public'] },
    { label: 'Dashboard', path: gymPath('/dashboard'), icon: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></>, visibleTo: ['admin', 'member'] },
    { label: 'Coach Dashboard', path: gymPath('/coach-dashboard'), icon: <><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></>, visibleTo: ['admin', 'coach'] },
  ];

  const pages = allPages.filter((p) => p.visibleTo.includes(viewAsRole));

  const isActive = (path: string) => {
    if (activePage) {
      // In site-builder: match by last path segment
      const pageSuffix = path.split('/').pop() || '';
      return activePage === pageSuffix || (pageSuffix === '' && activePage === 'home');
    }
    return location.pathname === path || location.pathname === path + '/';
  };

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
          <span className={styles.builderPanelHeaderTitle}>Site Builder</span>
        </div>

        {/* Page navigator */}
        <nav className={styles.pageNav}>
          <span className={styles.pageNavLabel}>Pages <span className={styles.pageNavRoleHint}>viewed as {viewAsRole}</span></span>
          <div className={styles.pageNavList}>
            {pages.map((page) => (
              <button
                key={page.path}
                className={`${styles.pageNavItem} ${isActive(page.path) ? styles.pageNavItemActive : ''}`}
                onClick={() => onNavigatePage ? onNavigatePage(page.path) : navigate(page.path)}
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {page.icon}
                </svg>
                <span>{page.label}</span>
              </button>
            ))}
          </div>
        </nav>

        <div className={styles.builderPanelBody}>
          <BrandingEditor onDraftChange={onDraftChange} />
        </div>
      </div>
    </aside>
  );
};

export default BuilderSidebar;
