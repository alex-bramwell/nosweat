import React, { useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from './AuthModal';
import styles from './Navbar.module.scss';

const Navbar: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | 'reset' | 'changePassword'>('login');
  const [authModalInitialError, setAuthModalInitialError] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 50);

      // Check if WOD section is in view
      const wodSection = document.getElementById('wod');
      if (wodSection) {
        const rect = wodSection.getBoundingClientRect();
        const isInView = rect.top <= 100 && rect.bottom >= 100;
        setActiveSection(isInView ? 'wod' : '');
      }
    };

    window.addEventListener('scroll', handleScroll);

    // Check hash on mount and location change
    if (location.hash === '#wod') {
      setActiveSection('wod');
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, [location]);

  // Check for password reset parameter and open modal
  useEffect(() => {
    if (searchParams.get('password-reset') === 'true') {
      setAuthModalMode('changePassword');
      setAuthModalInitialError('');
      setIsAuthModalOpen(true);
      // Remove the query parameter from URL
      searchParams.delete('password-reset');
      setSearchParams(searchParams, { replace: true });
    } else if (searchParams.get('reset-expired') === 'true') {
      // Open modal in reset mode with error message about expired link
      setAuthModalMode('reset');
      setAuthModalInitialError('Your password reset link has expired or been used already. Please request a new one.');
      setIsAuthModalOpen(true);
      // Remove the query parameter from URL
      searchParams.delete('reset-expired');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const openAuthModal = () => {
    setAuthModalMode('login');
    setAuthModalInitialError('');
    setIsAuthModalOpen(true);
    closeMenu();
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthModalMode('login');
    setAuthModalInitialError('');
  };

  return (
    <div className={styles.navbarContainer}>
      <nav className={`${styles.navbar} ${isScrolled ? styles.scrolled : ''}`}>
        <Link to="/" className={styles.logo} onClick={closeMenu}>
          <div className={styles.logoText}>CrossFit Comet</div>
          <div className={styles.logoAffiliate}>Affiliate</div>
        </Link>

        {/* Hamburger Button */}
        <button
          className={`${styles.hamburger} ${isMenuOpen ? styles.hamburgerOpen : ''}`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Navigation Links */}
        <div className={`${styles.links} ${isMenuOpen ? styles.linksOpen : ''}`}>
          <Link
            to="/"
            className={location.pathname === '/' ? styles.activeLink : ''}
            onClick={closeMenu}
          >
            Home
          </Link>
          <Link
            to="/about"
            className={location.pathname === '/about' ? styles.activeLink : ''}
            onClick={closeMenu}
          >
            About
          </Link>
          <Link
            to="/coaches"
            className={location.pathname === '/coaches' ? styles.activeLink : ''}
            onClick={closeMenu}
          >
            Coaches
          </Link>
          <Link
            to="/schedule"
            className={location.pathname === '/schedule' ? styles.activeLink : ''}
            onClick={closeMenu}
          >
            Schedule
          </Link>
          <a
            href="/#wod"
            className={`${styles.wodLink} ${activeSection === 'wod' ? styles.activeWod : ''}`}
            onClick={closeMenu}
          >
            Today's WOD
          </a>

          {/* Action Buttons - shown in mobile menu */}
          <div className={`${styles.actions} ${isMenuOpen ? styles.actionsOpen : ''}`}>
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className={`${styles.dashboardLink} ${location.pathname === '/dashboard' ? styles.activeLink : ''}`}
                onClick={closeMenu}
                title="Dashboard"
              >
                <span className={styles.dashboardIcon}>⚡</span>
              </Link>
            ) : (
              <button className={styles.signInButton} onClick={openAuthModal}>Sign In</button>
            )}
          </div>
        </div>
      </nav>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        initialMode={authModalMode}
        initialError={authModalInitialError}
      />
    </div>
  );
};

export default Navbar;
