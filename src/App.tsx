import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
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
