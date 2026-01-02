import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useSessionTimeout } from './hooks/useSessionTimeout';
import Layout from './components/Layout';
import ScrollToHash from './components/ScrollToHash';
import { SessionWarning } from './components/SessionWarning';
import Home from './pages/Home';
import Schedule from './pages/Schedule';
import About from './pages/About';
import Coaches from './pages/Coaches';
import Dashboard from './pages/Dashboard';
import EmailVerified from './pages/EmailVerified';
import ResetPassword from './pages/ResetPassword';
import ProtectedRoute from './components/ProtectedRoute';

// Component to detect password recovery tokens and redirect to home with modal trigger
function PasswordRecoveryRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if there's a password recovery token in the URL hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    const accessToken = hashParams.get('access_token');
    const error = hashParams.get('error');
    const errorCode = hashParams.get('error_code');

    console.log('PasswordRecoveryRedirect:', { type, hasToken: !!accessToken, error, errorCode, pathname: location.pathname, search: location.search });

    // Handle expired or invalid tokens
    if (error === 'access_denied' && errorCode === 'otp_expired') {
      console.log('Detected expired token, redirecting to reset-expired');
      // Redirect to home with error flag
      if (!location.search.includes('reset-expired=true')) {
        navigate('/?reset-expired=true', { replace: true });
      }
      return;
    }

    // If we have a recovery token, redirect to home with a flag to open the password change modal
    if (type === 'recovery' && accessToken) {
      console.log('Detected recovery token, redirecting to password-reset=true');
      // Navigate to home with password-reset query param and preserve the hash
      const currentPath = location.pathname + location.search;
      if (!currentPath.includes('password-reset=true')) {
        const newUrl = '/?password-reset=true' + window.location.hash;
        console.log('Navigating to:', newUrl);
        navigate(newUrl, { replace: true });
      }
    }
  }, [navigate, location]);

  return null;
}

function AppContent() {
  const { logout } = useAuth();
  const [showSessionWarning, setShowSessionWarning] = useState(false);

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

  return (
    <>
      <BrowserRouter>
        <PasswordRecoveryRedirect />
        <ScrollToHash />
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/coaches" element={<Coaches />} />
            <Route path="/about" element={<About />} />
            <Route path="/email-verified" element={<EmailVerified />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Layout>
      </BrowserRouter>

      <SessionWarning
        isOpen={showSessionWarning}
        remainingTime={sessionTimeout.remainingTimeFormatted}
        onExtend={handleExtendSession}
        onLogout={handleLogout}
      />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
