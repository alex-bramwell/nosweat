import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTenant, useFeature } from '../contexts/TenantContext';
import { ViewAsProvider } from '../contexts/ViewAsContext';
import { BrandingOverrideProvider } from '../contexts/BrandingOverrideContext';
import { usePreviewTheme } from '../hooks/usePreviewTheme';
import type { GymBranding } from '../types/tenant';
import type { FeatureKey } from '../types/tenant';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BuilderSidebar from '../components/BuilderSidebar/BuilderSidebar';
import LockedFeatureOverlay from '../components/GymAdmin/LockedFeatureOverlay';
import Home from './Home';
import Schedule from './Schedule';
import About from './About';
import Coaches from './Coaches';
import styles from './GymAdminBuilder.module.scss';

type PreviewPage = 'home' | 'schedule' | 'coaches' | 'about';
type ViewRole = 'admin' | 'coach' | 'member' | 'public';

const PAGE_FEATURE_MAP: Partial<Record<PreviewPage, FeatureKey>> = {
  schedule: 'class_booking',
  coaches: 'coach_profiles',
};

const GymAdminBuilder: React.FC = () => {
  const { user } = useAuth();
  const { gym } = useTenant();
  const hasClassBooking = useFeature('class_booking');
  const hasCoachProfiles = useFeature('coach_profiles');

  const previewRef = useRef<HTMLDivElement>(null);
  const [draftBranding, setDraftBranding] = useState<Partial<GymBranding> | null>(null);
  const [previewPage, setPreviewPage] = useState<PreviewPage>('home');
  const [viewAsRole, setViewAsRole] = useState<ViewRole>('admin');

  usePreviewTheme(previewRef, draftBranding);

  // Authorization check
  const isAuthorized = user && gym && (user.id === gym.owner_id || user.role === 'admin');

  if (!isAuthorized) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#12121a',
        color: '#f0f0f5',
        fontFamily: "'Inter', sans-serif",
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '1rem', color: '#8b8b9e' }}>
            <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Access Denied</h1>
          <p style={{ color: '#8b8b9e' }}>Only gym owners and administrators can access the site builder.</p>
        </div>
      </div>
    );
  }

  const previewPages: { id: PreviewPage; label: string; locked: boolean }[] = [
    { id: 'home', label: 'Home', locked: false },
    { id: 'schedule', label: 'Schedule', locked: !hasClassBooking },
    { id: 'coaches', label: 'Coaches', locked: !hasCoachProfiles },
    { id: 'about', label: 'About', locked: false },
  ];

  const renderPreviewPage = () => {
    const requiredFeature = PAGE_FEATURE_MAP[previewPage];
    const currentPage = previewPages.find((p) => p.id === previewPage);
    if (currentPage?.locked && requiredFeature) {
      return <LockedFeatureOverlay feature={requiredFeature} />;
    }
    switch (previewPage) {
      case 'schedule': return <Schedule />;
      case 'coaches': return <Coaches />;
      case 'about': return <About />;
      default: return <Home />;
    }
  };

  return (
    <div className={styles.builder}>
      {/* ── Toolbar ── */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <Link to="/dashboard" className={styles.backLink}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <div className={styles.toolbarDivider} />
          <span className={styles.toolbarTitle}>Site Builder</span>
        </div>

        <div className={styles.toolbarCenter}>
          <div>
            <span className={styles.toolbarSelectLabel}>Page </span>
            <select
              className={styles.toolbarSelect}
              value={previewPage}
              onChange={(e) => setPreviewPage(e.target.value as PreviewPage)}
            >
              {previewPages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}{p.locked ? ' \ud83d\udd12' : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <span className={styles.toolbarSelectLabel}>View as </span>
            <select
              className={styles.toolbarSelect}
              value={viewAsRole}
              onChange={(e) => setViewAsRole(e.target.value as ViewRole)}
            >
              <option value="admin">Admin</option>
              <option value="coach">Coach</option>
              <option value="member">Member</option>
              <option value="public">Public</option>
            </select>
          </div>
        </div>

      </div>

      {/* ── Workspace ── */}
      <div className={styles.workspace}>
        <BuilderSidebar onDraftChange={setDraftBranding} />

        {/* Site Preview */}
        <div className={styles.preview} ref={previewRef}>
          <BrandingOverrideProvider overrides={draftBranding}>
            <ViewAsProvider role={viewAsRole}>
              <Navbar />
              <main style={{ flex: 1 }}>
                {renderPreviewPage()}
              </main>
              <Footer />
            </ViewAsProvider>
          </BrandingOverrideProvider>
        </div>
      </div>
    </div>
  );
};

export default GymAdminBuilder;
