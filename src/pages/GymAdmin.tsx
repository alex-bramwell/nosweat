import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { Container } from '../components/common';
import BrandingEditor from '../components/GymAdmin/BrandingEditor';
import FeatureTogglePanel from '../components/GymAdmin/FeatureTogglePanel';
import GymSettings from '../components/GymAdmin/GymSettings';
import DataManagement from '../components/GymAdmin/DataManagement';
import styles from './GymAdmin.module.scss';

type Tab = 'branding' | 'features' | 'settings' | 'data';

const GymAdmin: React.FC = () => {
  const { user } = useAuth();
  const { gym } = useTenant();
  const [activeTab, setActiveTab] = useState<Tab>('branding');

  // Check authorization
  const isAuthorized = user && gym && (user.id === gym.owner_id || user.role === 'admin');

  if (!isAuthorized) {
    return (
      <div className={styles.accessDenied}>
        <Container>
          <div className={styles.accessDeniedContent}>
            <div className={styles.accessDeniedIcon}>🔒</div>
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
          <h1>Gym Admin</h1>
          <p>Manage your gym's branding, features, and settings</p>
        </div>

        <div className={styles.tabBar}>
          <button
            className={`${styles.tab} ${activeTab === 'branding' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('branding')}
          >
            <span className={styles.tabIcon}>🎨</span>
            <span>Branding</span>
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'features' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('features')}
          >
            <span className={styles.tabIcon}>⚡</span>
            <span>Features</span>
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'settings' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <span className={styles.tabIcon}>⚙️</span>
            <span>Settings</span>
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'data' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('data')}
          >
            <span className={styles.tabIcon}>📋</span>
            <span>Data</span>
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'branding' && <BrandingEditor />}
          {activeTab === 'features' && <FeatureTogglePanel />}
          {activeTab === 'settings' && <GymSettings />}
          {activeTab === 'data' && <DataManagement />}
        </div>
      </Container>
    </div>
  );
};

export default GymAdmin;
