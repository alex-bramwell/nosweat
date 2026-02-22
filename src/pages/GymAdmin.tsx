import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTenant, useGymPath } from '../contexts/TenantContext';
import { Container } from '../components/common';
import FeatureTogglePanel from '../components/GymAdmin/FeatureTogglePanel';
import GymSettings from '../components/GymAdmin/GymSettings';
import DataManagement from '../components/GymAdmin/DataManagement';
import GettingStarted from '../components/GymAdmin/GettingStarted';
import styles from './GymAdmin.module.scss';

type Tab = 'features' | 'settings' | 'data';

const GymAdmin: React.FC = () => {
  const { user } = useAuth();
  const { gym } = useTenant();
  const gymPath = useGymPath();
  const [activeTab, setActiveTab] = useState<Tab>('features');

  const isAuthorized = user && gym && (user.id === gym.owner_id || user.role === 'admin');

  if (!isAuthorized) {
    return (
      <div className={styles.accessDenied}>
        <Container>
          <div className={styles.accessDeniedContent}>
            <div className={styles.accessDeniedIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h1>Access Denied</h1>
            <p>You do not have permission to access the Gym Admin dashboard.</p>
            <p>Only gym owners and administrators can manage gym settings.</p>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className={styles.gymAdmin}>
      <Container>
        <div className={styles.header}>
          <h1>Dashboard</h1>
          <p>Manage your gym's features, settings, and data</p>
        </div>

        {/* Site Builder Launch Card */}
        <Link to={gymPath('/site-builder')} className={styles.builderCard}>
          <div className={styles.builderCardIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18" />
              <path d="M9 21V9" />
            </svg>
          </div>
          <div className={styles.builderCardContent}>
            <h2>Site Builder</h2>
            <p>Customise your gym's branding, colours, typography, and content with a live preview</p>
          </div>
          <div className={styles.builderCardArrow}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        <GettingStarted onNavigateTab={(tab) => {
          if (tab === 'branding') {
            window.location.href = gymPath('/site-builder');
          } else {
            setActiveTab(tab as Tab);
          }
        }} />

        <div className={styles.tabBar}>
          <button
            className={`${styles.tab} ${activeTab === 'features' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('features')}
          >
            <span className={styles.tabIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </span>
            <span>Features</span>
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'settings' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <span className={styles.tabIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </span>
            <span>Settings</span>
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'data' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('data')}
          >
            <span className={styles.tabIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
              </svg>
            </span>
            <span>Data</span>
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'features' && <FeatureTogglePanel />}
          {activeTab === 'settings' && <GymSettings />}
          {activeTab === 'data' && <DataManagement />}
        </div>
      </Container>
    </div>
  );
};

export default GymAdmin;
