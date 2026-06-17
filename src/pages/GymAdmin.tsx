import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTenant, useGymPath } from '../contexts/TenantContext';
import { Container } from '../components/common';
import FeatureTogglePanel from '../components/GymAdmin/FeatureTogglePanel';
import MembershipsPanel from '../components/GymAdmin/MembershipsPanel';
import GymSettings from '../components/GymAdmin/GymSettings';
import DataManagement from '../components/GymAdmin/DataManagement';
import GettingStarted from '../components/GymAdmin/GettingStarted';
import PlatformBillingPanel from '../components/GymAdmin/PlatformBillingPanel';
import StripeConnectPanel from '../components/GymAdmin/StripeConnectPanel';
import { DEMO_GYM_SLUG } from '../config/demo';
import styles from './GymAdmin.module.scss';

const TABS = ['features', 'memberships', 'payments', 'settings', 'billing', 'data'] as const;
type Tab = (typeof TABS)[number];

const GymAdmin: React.FC = () => {
  const { user } = useAuth();
  const { gym, isDemoGym } = useTenant();
  const gymPath = useGymPath();
  // Stripe Connect onboarding returns the owner here with ?tab=payments, so
  // honour a valid tab from the URL on first render.
  const urlTab = new URLSearchParams(window.location.search).get('tab');
  const [activeTab, setActiveTab] = useState<Tab>(
    TABS.includes(urlTab as Tab) ? (urlTab as Tab) : 'features'
  );

  const paymentsConnected = gym?.stripe_account_status === 'active';

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
        <div className={styles.adminPageHeader}>
          <div className={styles.adminPageHeaderText}>
            <h1>Dashboard</h1>
            <p>Manage your gym's features, settings, and data</p>
          </div>
          <button
            type="button"
            onClick={() => window.open(`/gym/${DEMO_GYM_SLUG}`, '_blank')}
            className={styles.exampleSiteButton}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span>
              See an example gym
              <small>Explore a fully built site to see what's possible</small>
            </span>
          </button>
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

        {!paymentsConnected && !isDemoGym && (
          <button
            type="button"
            className={styles.paymentsAlert}
            onClick={() => setActiveTab('payments')}
          >
            <span className={styles.paymentsAlertIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <path d="M2 10h20" />
              </svg>
            </span>
            <span className={styles.paymentsAlertText}>
              <strong>Set up payments to get paid</strong>
              <span>Members cannot pay you yet. Connect Stripe to take memberships, day passes, trials and bookings.</span>
            </span>
            <span className={styles.paymentsAlertCta}>Set up payments</span>
          </button>
        )}

        <div className={styles.adminTabBar}>
          <button
            className={`${styles.adminTab} ${activeTab === 'features' ? styles.adminTabActive : ''}`}
            onClick={() => setActiveTab('features')}
          >
            <span className={styles.adminTabIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </span>
            <span>Features</span>
          </button>
          <button
            className={`${styles.adminTab} ${activeTab === 'memberships' ? styles.adminTabActive : ''}`}
            onClick={() => setActiveTab('memberships')}
          >
            <span className={styles.adminTabIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9h18M3 15h18M7 4v16M17 4v16" />
              </svg>
            </span>
            <span>Memberships</span>
          </button>
          <button
            className={`${styles.adminTab} ${activeTab === 'payments' ? styles.adminTabActive : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            <span className={styles.adminTabIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <path d="M2 10h20" />
                <path d="M6 15h4" />
              </svg>
            </span>
            <span>Payments</span>
          </button>
          <button
            className={`${styles.adminTab} ${activeTab === 'settings' ? styles.adminTabActive : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <span className={styles.adminTabIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </span>
            <span>Settings</span>
          </button>
          <button
            className={`${styles.adminTab} ${activeTab === 'billing' ? styles.adminTabActive : ''}`}
            onClick={() => setActiveTab('billing')}
          >
            <span className={styles.adminTabIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <path d="M2 10h20" />
              </svg>
            </span>
            <span>Billing</span>
          </button>
          <button
            className={`${styles.adminTab} ${activeTab === 'data' ? styles.adminTabActive : ''}`}
            onClick={() => setActiveTab('data')}
          >
            <span className={styles.adminTabIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
              </svg>
            </span>
            <span>Data</span>
          </button>
        </div>

        <div className={styles.adminTabContent}>
          {activeTab === 'features' && <FeatureTogglePanel />}
          {activeTab === 'memberships' && <MembershipsPanel />}
          {activeTab === 'payments' && <StripeConnectPanel />}
          {activeTab === 'settings' && <GymSettings />}
          {activeTab === 'billing' && <PlatformBillingPanel />}
          {activeTab === 'data' && <DataManagement />}
        </div>
      </Container>
    </div>
  );
};

export default GymAdmin;
