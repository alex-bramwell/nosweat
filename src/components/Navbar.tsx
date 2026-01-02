import React, { useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from './AuthModal';
import styles from './Navbar.module.scss';

const Navbar: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | 'reset' | 'changePassword'>('login');
  const [authModalInitialError, setAuthModalInitialError] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isNavDropdownOpen, setIsNavDropdownOpen] = useState(false);

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
    const passwordReset = searchParams.get('password-reset');
    const resetExpired = searchParams.get('reset-expired');
    console.log('Navbar useEffect:', { passwordReset, resetExpired });

    if (passwordReset === 'true') {
      console.log('Opening changePassword modal');
      setAuthModalMode('changePassword');
      setAuthModalInitialError('');
      setIsAuthModalOpen(true);
      // Remove the query parameter from URL
      searchParams.delete('password-reset');
      setSearchParams(searchParams, { replace: true });
    } else if (resetExpired === 'true') {
      console.log('Opening reset modal with expired error');
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

  const toggleUserDropdown = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
  };

  const closeUserDropdown = () => {
    setIsUserDropdownOpen(false);
  };

  const toggleNavDropdown = () => {
    setIsNavDropdownOpen(!isNavDropdownOpen);
  };

  const closeNavDropdown = () => {
    setIsNavDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isUserDropdownOpen && !target.closest(`.${styles.userMenu}`)) {
        closeUserDropdown();
      }
      if (isNavDropdownOpen && !target.closest(`.${styles.navDropdown}`)) {
        closeNavDropdown();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserDropdownOpen, isNavDropdownOpen]);

  // Get user's first name
  const getFirstName = () => {
    if (!user?.name) return 'User';
    return user.name.split(' ')[0];
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

        {/* Navigation Dropdown */}
        <div className={styles.navDropdown}>
          <button
            className={styles.navDropdownButton}
            onClick={toggleNavDropdown}
            aria-label="Navigation menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
            <span>Menu</span>
          </button>
          {isNavDropdownOpen && (
            <div className={styles.navDropdownContent}>
              <Link
                to="/"
                className={location.pathname === '/' ? styles.navDropdownItem_active : styles.navDropdownItem}
                onClick={() => {
                  closeNavDropdown();
                  closeMenu();
                }}
              >
                <span>Home</span>
              </Link>
              <Link
                to="/about"
                className={location.pathname === '/about' ? styles.navDropdownItem_active : styles.navDropdownItem}
                onClick={() => {
                  closeNavDropdown();
                  closeMenu();
                }}
              >
                <span>About</span>
              </Link>
              <Link
                to="/coaches"
                className={location.pathname === '/coaches' ? styles.navDropdownItem_active : styles.navDropdownItem}
                onClick={() => {
                  closeNavDropdown();
                  closeMenu();
                }}
              >
                <span>Coaches</span>
              </Link>
              <Link
                to="/schedule"
                className={location.pathname === '/schedule' ? styles.navDropdownItem_active : styles.navDropdownItem}
                onClick={() => {
                  closeNavDropdown();
                  closeMenu();
                }}
              >
                <span>Schedule</span>
              </Link>
              <a
                href="/#wod"
                className={`${styles.navDropdownItem} ${activeSection === 'wod' ? styles.navDropdownWodActive : ''}`}
                onClick={() => {
                  closeNavDropdown();
                  closeMenu();
                }}
              >
                <span>Today's WOD</span>
              </a>
            </div>
          )}
        </div>

        {/* Navigation Links - Hidden, using dropdown instead */}
        <div className={`${styles.links} ${isMenuOpen ? styles.linksOpen : ''}`}></div>

        {/* Action Buttons - Sign In / User Menu */}
        <div className={`${styles.actions} ${isMenuOpen ? styles.actionsOpen : ''}`}>
            {isAuthenticated ? (
              <div className={styles.userMenu}>
                <button
                  className={`${styles.userButton} ${location.pathname === '/dashboard' ? styles.activeLink : ''}`}
                  onClick={toggleUserDropdown}
                  aria-label="User menu"
                >
                  <span className={styles.userName}>{getFirstName()}</span>
                  <svg className={styles.dropdownIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                {isUserDropdownOpen && (
                  <div className={styles.userDropdown}>
                    <Link
                      to="/dashboard"
                      className={styles.dropdownItem}
                      onClick={() => {
                        closeUserDropdown();
                        closeMenu();
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="9" y1="3" x2="9" y2="21"></line>
                      </svg>
                      Dashboard
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <button className={styles.signInButton} onClick={openAuthModal}>Sign In</button>
            )}
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
