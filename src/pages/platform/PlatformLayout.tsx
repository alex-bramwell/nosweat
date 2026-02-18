import { Link, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import styles from './PlatformLayout.module.scss';

interface PlatformLayoutProps {
  children: ReactNode;
}

const PlatformLayout = ({ children }: PlatformLayoutProps) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className={styles.platformLayout}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.navContainer}>
          <Link to="/" className={styles.logo}>
            <span className={styles.logoIcon}>🏋️</span>
            <span className={styles.logoText}>No Sweat</span>
          </Link>

          <div className={styles.navLinks}>
            {!isHomePage && (
              <>
                <Link to="/login" className={styles.navLink}>
                  Log in
                </Link>
                <Link to="/signup" className={styles.navLinkPrimary}>
                  Sign up
                </Link>
              </>
            )}
            {isHomePage && (
              <>
                <Link to="/login" className={styles.navLink}>
                  Log in
                </Link>
                <Link to="/signup" className={styles.navLinkPrimary}>
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className={styles.main}>{children}</main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <div className={styles.footerContent}>
            <div className={styles.footerBrand}>
              <span className={styles.footerLogo}>🏋️ No Sweat</span>
              <p className={styles.footerTagline}>
                The all-in-one platform for gyms & fitness studios
              </p>
            </div>

            <div className={styles.footerLinks}>
              <div className={styles.footerColumn}>
                <h4 className={styles.footerColumnTitle}>Product</h4>
                <Link to="/" className={styles.footerLink}>
                  Features
                </Link>
                <Link to="/" className={styles.footerLink}>
                  Pricing
                </Link>
              </div>

              <div className={styles.footerColumn}>
                <h4 className={styles.footerColumnTitle}>Account</h4>
                <Link to="/login" className={styles.footerLink}>
                  Log in
                </Link>
                <Link to="/signup" className={styles.footerLink}>
                  Sign up
                </Link>
              </div>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <p className={styles.footerCopyright}>
              © {new Date().getFullYear()} No Sweat. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PlatformLayout;
