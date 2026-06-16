// =============================================================================
// App.tsx - Application Root & Multi-Tenant Routing Architecture
//
// KEY ARCHITECTURE: This app serves two completely different audiences from one
// codebase using a "two-shell" pattern:
//
//   1. GymShell  (/gym/:slug/*) - White-label sites for individual gyms.
//      Each gym gets its own branded experience with tenant-specific data,
//      theming, features, and auth. Wrapped in TenantProvider + AuthProvider.
//
//   2. PlatformShell (/*) - The SaaS marketing/onboarding site for gym owners.
//      Completely separate layout, dark theme, and routes. No tenant context.
//
// CUSTOM DOMAINS: A third mode (CustomDomainApp) handles gyms with their own
// domain (e.g. www.mygym.com). It mounts all gym routes at "/" instead of
// "/gym/:slug", resolved via useDomainResolution() before React Router mounts.
//
// PROVIDER COMPOSITION: Context providers are nested deliberately -
// TenantProvider wraps everything (even platform, where it short-circuits),
// but AuthProvider and RegistrationProvider only wrap gym routes. This avoids
// loading auth/registration infrastructure on the platform marketing site.
// =============================================================================

import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { TenantProvider, useTenant } from './contexts/TenantContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RegistrationProvider } from './contexts/RegistrationContext';
import { useSessionTimeout } from './hooks/useSessionTimeout';
import { useTenantTheme } from './hooks/useTenantTheme';
import { useDomainResolution } from './hooks/useDomainResolution';
import Layout from './components/Layout';
import ScrollToHash from './components/ScrollToHash';
import { SessionWarning } from './components/SessionWarning';
import { FeatureGate } from './components/common';
import { FeatureNotEnabled } from './components/common/FeatureGate/FeatureNotEnabled';
import ProtectedRoute from './components/ProtectedRoute';
import PlatformLayout from './pages/platform/PlatformLayout';
import TrialBanner from './components/common/TrialBanner';
import { RouteFallback } from './components/common';

// Landing pages and the gym-not-found error stay eager - they are the most
// common first paint, so deferring them would just add a loading flash.
import Home from './pages/Home';
import GymNotFound from './pages/GymNotFound';
import PlatformHome from './pages/platform/PlatformHome';

// Everything else is route-split: each page becomes its own chunk that loads
// on demand, so a public visitor never downloads the admin/builder/coach code.
const Schedule = lazy(() => import('./pages/Schedule'));
const About = lazy(() => import('./pages/About'));
const Coaches = lazy(() => import('./pages/Coaches'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CoachDashboard = lazy(() => import('./pages/CoachDashboard'));
const CoachView = lazy(() => import('./pages/CoachView'));
const EmailVerified = lazy(() => import('./pages/EmailVerified'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const BookingConfirmation = lazy(() => import('./pages/BookingConfirmation'));
const GymAdmin = lazy(() => import('./pages/GymAdmin'));
const GymAdminBuilder = lazy(() => import('./pages/GymAdminBuilder'));
const PlatformLogin = lazy(() => import('./pages/platform/PlatformLogin'));
const PlatformSignup = lazy(() => import('./pages/platform/PlatformSignup'));
const Onboarding = lazy(() => import('./pages/platform/Onboarding'));
const Guide = lazy(() => import('./pages/platform/Guide'));
const Docs = lazy(() => import('./pages/platform/Docs'));
const Roadmap = lazy(() => import('./pages/platform/Roadmap'));
const Payments = lazy(() => import('./pages/platform/Payments'));
const PlatformSubscribe = lazy(() => import('./pages/platform/PlatformSubscribe'));
const SubscribeComplete = lazy(() =>
  import('./pages/platform/PlatformSubscribe').then((m) => ({ default: m.SubscribeComplete }))
);
const TestReset = lazy(() => import('./pages/platform/TestReset'));
const TermsOfService = lazy(() => import('./pages/platform/TermsOfService'));
const PlatformDashboard = lazy(() => import('./pages/platform/PlatformDashboard'));

// Supabase sends password recovery links with tokens in the URL hash fragment.
// This component intercepts those tokens on any page and redirects to the
// dedicated reset-password route, preserving the hash so Supabase can consume it.
// It also handles expired tokens gracefully by redirecting with a query param.
function PasswordRecoveryRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirected = useRef(false);
  const { tenantSlug, isCustomDomain } = useTenant();

  const basePath = isCustomDomain ? '' : (tenantSlug ? `/gym/${tenantSlug}` : '');

  useEffect(() => {
    if (hasRedirected.current) {
      return;
    }

    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    const accessToken = hashParams.get('access_token');
    const error = hashParams.get('error');
    const errorCode = hashParams.get('error_code');


    // Handle expired or invalid tokens
    if (error === 'access_denied' && errorCode === 'otp_expired') {
      if (!location.search.includes('reset-expired=true')) {
        hasRedirected.current = true;
        navigate(`${basePath}/?reset-expired=true`, { replace: true });
      }
      return;
    }

    const resetPath = `${basePath}/reset-password`;

    // If we have a recovery token and we're on the reset-password page, stay there
    if (type === 'recovery' && accessToken && location.pathname === resetPath) {
      return;
    }

    // If we have a recovery token on any other page, redirect to reset-password with the hash preserved
    if (type === 'recovery' && accessToken && location.pathname !== resetPath) {
      hasRedirected.current = true;
      window.location.href = resetPath + window.location.hash;
    }
  }, [navigate, location, basePath]);

  return null;
}

// ------------------------------------------------------------------
// GymShell - The tenant-facing app shell for individual gym sites.
//
// This is where multi-tenancy comes alive: useTenantTheme() injects
// the gym's branding (colors, fonts, favicon) as CSS custom properties
// on :root, so the entire component tree re-themes without prop drilling.
//
// ROUTE STRUCTURE: Uses nested <Routes> to separate the site-builder
// (full-screen, no chrome) from all other pages (wrapped in Layout with
// navbar + footer). The outer Routes matches /site-builder first, then
// the catch-all /* renders Layout around an inner Routes for page-level
// routing. This avoids duplicating the Layout wrapper on every route.
//
// SESSION MANAGEMENT: 30-minute timeout with a 5-minute warning modal.
// The session timer resets on user activity, and logout clears both the
// auth state and any in-progress registration intents (see AuthContext).
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
      <Routes>
        {/* Site Builder - full-screen, no Layout wrapper.
            Listed BEFORE the catch-all so it matches first and avoids
            rendering inside the navbar/footer chrome. */}
        <Route
          path="/site-builder"
          element={
            <ProtectedRoute requiredRole="admin">
              <Suspense fallback={<RouteFallback />}>
                <GymAdminBuilder />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* All other gym routes - wrapped in Layout (navbar + footer).
            FEATURE GATING: Routes like /schedule and /coaches are wrapped
            in <FeatureGate> - if the gym hasn't enabled that feature, users
            see a "feature not enabled" page instead of a broken route.
            This is the route-level complement to section-level gating in Home.tsx. */}
        <Route
          path="/*"
          element={
            <>
              <TrialBanner />
              <Layout>
                <Suspense fallback={<RouteFallback />}>
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
                    path="/gym-admin"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <GymAdmin />
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
                </Routes>
                </Suspense>
              </Layout>
            </>
          }
        />
      </Routes>

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
// Platform Shell - the SaaS marketing and onboarding site at the root domain.
// Completely separate from the gym tenant UI - has its own dark theme,
// layout, and routes (login, signup, onboarding, docs, pricing, etc.).
// This is what gym owners see when they sign up for the platform.
// ------------------------------------------------------------------
function PlatformShell() {
  return (
    <PlatformLayout>
      <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<PlatformHome />} />
        <Route path="/login" element={<PlatformLogin />} />
        <Route path="/signup" element={<PlatformSignup />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/dashboard" element={<PlatformDashboard />} />
        <Route path="/guide" element={<Guide />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/roadmap" element={<Roadmap />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/subscribe" element={<PlatformSubscribe />} />
        <Route path="/subscribe/complete" element={<SubscribeComplete />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/test-reset" element={<TestReset />} />
      </Routes>
      </Suspense>
    </PlatformLayout>
  );
}

// ------------------------------------------------------------------
// CustomDomainApp - Routes gym pages at "/" instead of "/gym/:slug".
//
// When a gym uses their own domain (e.g. www.mygym.com), the slug is
// resolved from the hostname via useDomainResolution() (API call to
// /api/domains/resolve, cached in sessionStorage). The `customDomain`
// flag flows through TenantContext to useGymPath(), which then generates
// root-relative links ("/schedule") instead of prefixed ones ("/gym/comet/schedule").
//
// This means every <Link> and navigation call in the app automatically
// adapts to whichever routing mode is active, without any component
// needing to know whether it's on a custom domain or not.
// ------------------------------------------------------------------
function CustomDomainApp({ slug }: { slug: string }) {
  return (
    <TenantProvider initialSlug={slug} customDomain>
      <AuthProvider>
        <RegistrationProvider>
          <Routes>
            {/* All gym routes at root — no /gym/:slug prefix */}
            <Route path="/*" element={<GymShell />} />
          </Routes>
        </RegistrationProvider>
      </AuthProvider>
    </TenantProvider>
  );
}

// ------------------------------------------------------------------
// StandardApp - Default routing mode using path-based multi-tenancy.
//
// CRITICAL DESIGN DECISION: The /gym/:slug/* route renders AuthProvider
// and RegistrationProvider, but the platform /* route does NOT. This means
// the platform marketing site never initializes Supabase auth listeners,
// never fetches gym data, and never sets up registration state. The
// platform has its own lightweight auth flow in PlatformLayout.
//
// The TenantProvider wraps both routes but short-circuits for platform
// pages (isPlatformSite = true skips all data fetching).
// ------------------------------------------------------------------
function StandardApp() {
  return (
    <TenantProvider>
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
    </TenantProvider>
  );
}

// Top-level App component - the FIRST decision point in the entire app.
//
// ROUTING DECISION TREE:
//   1. useDomainResolution() checks hostname (before React Router even mounts)
//   2. If custom domain detected -> CustomDomainApp (gym routes at "/")
//   3. If platform domain -> StandardApp (gym at "/gym/:slug", platform at "/")
//
// This two-phase approach (resolve domain THEN mount router) means the
// entire routing tree is determined by hostname, not just URL path. The
// BrowserRouter is created AFTER domain resolution to avoid flash of
// wrong content.
function App() {
  const domainResolution = useDomainResolution();

  // Show loading while resolving custom domain
  if (domainResolution.mode === 'loading') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8f9fa',
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#6b7280', fontFamily: "'Inter', sans-serif" }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {domainResolution.mode === 'custom-domain' ? (
        <CustomDomainApp slug={domainResolution.slug} />
      ) : (
        <StandardApp />
      )}
    </BrowserRouter>
  );
}

export default App;
