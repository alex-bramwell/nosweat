import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../../lib/supabase';
import Logo from '../../components/common/Logo';
import styles from './PlatformLayout.module.scss';

interface PlatformLayoutProps {
  children: ReactNode;
}

const DropletIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 40 44" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="dropToggleGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#2563eb" />
        <stop offset="100%" stopColor="#7c3aed" />
      </linearGradient>
    </defs>
    <path
      d="M20,3 C20,3 8,18 8,27 A12,12 0 0 0 32,27 C32,18 20,3 20,3 Z"
      fill="url(#dropToggleGrad)"
      opacity="0.15"
    />
    <path
      d="M20,3 C20,3 8,18 8,27 A12,12 0 0 0 32,27 C32,18 20,3 20,3 Z"
      fill="none"
      stroke="url(#dropToggleGrad)"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <line
      x1="11" y1="12"
      x2="29" y2="36"
      stroke="url(#dropToggleGrad)"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);

const PlatformLayout = ({ children }: PlatformLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === '/';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Check auth session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsLoggedIn(true);
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    navigate('/');
  };

  return (
    <div className={styles.platformLayout}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.navContainer}>
          <Link to="/" className={styles.logo}>
            <Logo className={styles.logoMark} />
          </Link>

          {/* Desktop nav links */}
          <div className={styles.navLinks}>
            <Link to="/guide" className={styles.navLink}>
              Features
            </Link>
            <Link to="/docs" className={styles.navLink}>
              Docs
            </Link>
            <Link to="/payments" className={styles.navLink}>
              Payments
            </Link>
            <Link to="/roadmap" className={styles.navLink}>
              Roadmap
            </Link>
            {isLoggedIn ? (
              <>
                <Link to="/dashboard" className={styles.navLinkPrimary}>
                  Dashboard
                </Link>
                <button onClick={handleLogout} className={styles.navLogout}>
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className={styles.navLinkSecondary}>
                  Log in
                </Link>
                <Link to="/signup" className={styles.navLinkPrimary}>
                  {isHomePage ? 'Get Started' : 'Sign up'}
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className={`${styles.mobileToggle} ${mobileMenuOpen ? styles.mobileToggleOpen : ''}`}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            <span className={styles.mobileToggleLabel}>Menu</span>
            <DropletIcon className={styles.mobileToggleIcon} />
          </button>
        </div>

        {/* Mobile menu panel */}
        <div className={`${styles.mobileMenu} ${mobileMenuOpen ? styles.mobileMenuOpen : ''}`}>
          <Link to="/guide" className={styles.mobileLink}>
            Features
          </Link>
          <Link to="/docs" className={styles.mobileLink}>
            Docs
          </Link>
          <Link to="/payments" className={styles.mobileLink}>
            Payments
          </Link>
          <Link to="/roadmap" className={styles.mobileLink}>
            Roadmap
          </Link>
          {isLoggedIn ? (
            <>
              <Link to="/dashboard" className={styles.mobileLinkPrimary}>
                Dashboard
              </Link>
              <button onClick={handleLogout} className={styles.mobileLink}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={styles.mobileLink}>
                Log in
              </Link>
              <Link to="/signup" className={styles.mobileLinkPrimary}>
                {isHomePage ? 'Get Started' : 'Sign up'}
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Backdrop */}
      {mobileMenuOpen && (
        <div
          className={styles.mobileBackdrop}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className={styles.platformContent}>{children}</main>

      {/* Footer */}
      <footer className={styles.platformFooter}>
        <div className={styles.platformFooterContainer}>
          <div className={styles.platformFooterContent}>
            <div className={styles.platformFooterBrand}>
              <Logo className={styles.platformFooterLogoMark} />
              <p className={styles.platformFooterTagline}>
                Everything your gym needs, in one place
              </p>
            </div>

            <div className={styles.platformFooterLinks}>
              <div className={styles.platformFooterColumn}>
                <h4 className={styles.platformFooterColumnTitle}>Product</h4>
                <Link to="/guide" className={styles.platformFooterLink}>
                  Features
                </Link>
                <Link to="/docs" className={styles.platformFooterLink}>
                  Docs
                </Link>
                <Link to="/payments" className={styles.platformFooterLink}>
                  Payments
                </Link>
                <Link to="/roadmap" className={styles.platformFooterLink}>
                  Roadmap
                </Link>
                <Link to="/" className={styles.platformFooterLink}>
                  Pricing
                </Link>
              </div>

              <div className={styles.platformFooterColumn}>
                <h4 className={styles.platformFooterColumnTitle}>Account</h4>
                <Link to="/login" className={styles.platformFooterLink}>
                  Log in
                </Link>
                <Link to="/signup" className={styles.platformFooterLink}>
                  Sign up
                </Link>
              </div>
            </div>
          </div>

          <div className={styles.platformFooterBottom}>
            <p className={styles.platformFooterCopyright}>
              © {new Date().getFullYear()} No Sweat Fitness. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PlatformLayout;
