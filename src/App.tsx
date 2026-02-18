import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { TenantProvider, useTenant } from './contexts/TenantContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RegistrationProvider } from './contexts/RegistrationContext';
import { useSessionTimeout } from './hooks/useSessionTimeout';
import { useTenantTheme } from './hooks/useTenantTheme';
import Layout from './components/Layout';
import ScrollToHash from './components/ScrollToHash';
import { SessionWarning } from './components/SessionWarning';
import { FeatureGate } from './components/common';
import { FeatureNotEnabled } from './components/common/FeatureGate/FeatureNotEnabled';
import Home from './pages/Home';
import Schedule from './pages/Schedule';
import About from './pages/About';
import Coaches from './pages/Coaches';
import Dashboard from './pages/Dashboard';
import CoachDashboard from './pages/CoachDashboard';
import CoachView from './pages/CoachView';
import EmailVerified from './pages/EmailVerified';
import ResetPassword from './pages/ResetPassword';
import BookingConfirmation from './pages/BookingConfirmation';
import GymNotFound from './pages/GymNotFound';
import GymAdmin from './pages/GymAdmin';
import ProtectedRoute from './components/ProtectedRoute';
import PlatformLayout from './pages/platform/PlatformLayout';
import PlatformHome from './pages/platform/PlatformHome';
import PlatformLogin from './pages/platform/PlatformLogin';
import PlatformSignup from './pages/platform/PlatformSignup';
import Onboarding from './pages/platform/Onboarding';

// Component to detect password recovery tokens and redirect
function PasswordRecoveryRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirected = useRef(false);
  const { tenantSlug } = useTenant();

  const basePath = tenantSlug ? `/gym/${tenantSlug}` : '';

  useEffect(() => {
    if (hasRedirected.current) {
      return;
    }

    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    const accessToken = hashParams.get('access_token');
    const error = hashParams.get('error');
    const errorCode = hashParams.get('error_code');

    console.log('PasswordRecoveryRedirect:', { type, hasToken: !!accessToken, error, errorCode, pathname: location.pathname, search: location.search });

    // Handle expired or invalid tokens
    if (error === 'access_denied' && errorCode === 'otp_expired') {
      console.log('Detected expired token, redirecting to reset-expired');
      if (!location.search.includes('reset-expired=true')) {
        hasRedirected.current = true;
        navigate(`${basePath}/?reset-expired=true`, { replace: true });
      }
      return;
    }

    const resetPath = `${basePath}/reset-password`;

    // If we have a recovery token and we're on the reset-password page, stay there
    if (type === 'recovery' && accessToken && location.pathname === resetPath) {
      console.log('On reset-password page with valid token - staying here');
      return;
    }

    // If we have a recovery token on any other page, redirect to reset-password with the hash preserved
    if (type === 'recovery' && accessToken && location.pathname !== resetPath) {
      console.log('Detected recovery token on wrong page, redirecting to reset-password');
      hasRedirected.current = true;
      window.location.href = resetPath + window.location.hash;
    }
  }, [navigate, location, basePath]);

  return null;
}

// ------------------------------------------------------------------
// Gym Shell — rendered for /gym/:slug/* routes
// ------------------------------------------------------------------
function GymShell() {
  const { isLoading, error, gym, tenantSlug } = useTenant();
  const { logout } = useAuth();
  const [showSessionWarning, setShowSessionWarning] = useState(false);

  useTenantTheme();

  const sessionTimeout = useSessionTimeout({
    timeoutMinutes: 30,
    warningMinutes: 5,
    onWarning: () => setShowSessionWarning(true),
    onTimeout: () => setShowSessionWarning(false)
  });

  const handleExtendSession = () => {
    sessionTimeout.extendSession();
    setShowSessionWarning(false);
  };

  const handleLogout = async () => {
    setShowSessionWarning(false);
    await logout();
  };

  // Loading state
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8f9fa',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🏋️</div>
          <p style={{ color: '#6b7280', fontFamily: "'Inter', sans-serif" }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Gym not found
  if (error || !gym) {
    return <GymNotFound slug={tenantSlug} error={error} />;
  }

  return (
    <>
      <PasswordRecoveryRedirect />
      <ScrollToHash />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/schedule"
            element={
              <FeatureGate feature="class_booking" fallback={<FeatureNotEnabled feature="class_booking" />}>
                <Schedule />
              </FeatureGate>
            }
          />
          <Route
            path="/coaches"
            element={
              <FeatureGate feature="coach_profiles" fallback={<FeatureNotEnabled feature="coach_profiles" />}>
                <Coaches />
              </FeatureGate>
            }
          />
          <Route path="/about" element={<About />} />
          <Route path="/email-verified" element={<EmailVerified />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/booking-confirmation" element={<BookingConfirmation />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coach-dashboard"
            element={
              <ProtectedRoute requiredRole="admin">
                <CoachDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coach-view"
            element={
              <ProtectedRoute requiredRole="coach">
                <CoachView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gym-admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <GymAdmin />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Layout>

      <SessionWarning
        isOpen={showSessionWarning}
        remainingTime={sessionTimeout.remainingTimeFormatted}
        onExtend={handleExtendSession}
        onLogout={handleLogout}
      />
    </>
  );
}

// ------------------------------------------------------------------
// Platform Shell — rendered for root platform routes
// ------------------------------------------------------------------
function PlatformShell() {
  return (
    <PlatformLayout>
      <Routes>
        <Route path="/" element={<PlatformHome />} />
        <Route path="/login" element={<PlatformLogin />} />
        <Route path="/signup" element={<PlatformSignup />} />
        <Route path="/onboarding" element={<Onboarding />} />
      </Routes>
    </PlatformLayout>
  );
}

function App() {
  return (
    <TenantProvider>
      <BrowserRouter>
        <Routes>
          {/* Gym routes — path-based tenancy */}
          <Route path="/gym/:slug/*" element={
            <AuthProvider>
              <RegistrationProvider>
                <GymShell />
              </RegistrationProvider>
            </AuthProvider>
          } />

          {/* Platform routes — the SaaS company site */}
          <Route path="/*" element={<PlatformShell />} />
        </Routes>
      </BrowserRouter>
    </TenantProvider>
  );
}

export default App;
