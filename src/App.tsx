import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RegistrationProvider } from './contexts/RegistrationContext';
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
import BookingConfirmation from './pages/BookingConfirmation';
import ProtectedRoute from './components/ProtectedRoute';

// Component to detect password recovery tokens and redirect to home with modal trigger
function PasswordRecoveryRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Only run once - if we've already redirected, don't do it again
    if (hasRedirected.current) {
      return;
    }

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
        hasRedirected.current = true;
        navigate('/?reset-expired=true', { replace: true });
      }
      return;
    }

    // If we have a recovery token and we're on the reset-password page, stay there
    // The ResetPassword page has its own form to handle the password update
    if (type === 'recovery' && accessToken && location.pathname === '/reset-password') {
      console.log('On reset-password page with valid token - staying here');
      return;
    }

    // If we have a recovery token on any other page, redirect to reset-password with the hash preserved
    if (type === 'recovery' && accessToken && location.pathname !== '/reset-password') {
      console.log('Detected recovery token on wrong page, redirecting to reset-password');
      hasRedirected.current = true;
      // Preserve the hash when redirecting
      window.location.href = '/reset-password' + window.location.hash;
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
            <Route path="/booking-confirmation" element={<BookingConfirmation />} />
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
      <RegistrationProvider>
        <AppContent />
      </RegistrationProvider>
    </AuthProvider>
  );
}

export default App;
