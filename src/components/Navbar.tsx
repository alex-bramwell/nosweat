import React, { useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { AuthModal } from './AuthModal';
import styles from './Navbar.module.scss';

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
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
  const [isCoachLogin, setIsCoachLogin] = useState(false);

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

  // Listen for Supabase PASSWORD_RECOVERY event to open modal
  // But NOT when we're on the /reset-password page (it handles itself)
  useEffect(() => {
    // Skip setting up the listener if we're on the reset-password page
    if (location.pathname === '/reset-password') {
      console.log('On reset-password page - skipping PASSWORD_RECOVERY listener in Navbar');
      return;
    }

    console.log('Setting up PASSWORD_RECOVERY listener in Navbar');

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Navbar auth state change:', { event, hasSession: !!session });

      // Don't handle PASSWORD_RECOVERY if on reset-password page
      if (event === 'PASSWORD_RECOVERY' && location.pathname !== '/reset-password') {
        console.log('PASSWORD_RECOVERY event detected - opening modal');
        setAuthModalMode('changePassword');
        setAuthModalInitialError('');
        setIsAuthModalOpen(true);
      }
    });

    // Also check for expired token in query params
    const resetExpired = searchParams.get('reset-expired');
    if (resetExpired === 'true') {
      console.log('Opening reset modal with expired error');
      setAuthModalMode('reset');
      setAuthModalInitialError('Your password reset link has expired or been used already. Please request a new one.');
      setIsAuthModalOpen(true);
      searchParams.delete('reset-expired');
      setSearchParams(searchParams, { replace: true });
    }

    return () => {
      console.log('Cleaning up PASSWORD_RECOVERY listener in Navbar');
      subscription.unsubscribe();
    };
  }, [location.pathname]); // Re-run when pathname changes

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

        {/* Hamburger Button - Mobile Only */}
        <button
          className={`${styles.hamburger} ${isMenuOpen ? styles.hamburgerOpen : ''}`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Navigation Dropdown - Desktop Only */}
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

        {/* Desktop User Menu / Sign In */}
        <div className={styles.desktopActions}>
          {isAuthenticated ? (
            <div className={styles.userMenu}>
              <button
                className={`${styles.userButton} ${(location.pathname === '/dashboard' || location.pathname === '/coach-dashboard') ? styles.activeLink : ''}`}
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
                  {/* Show appropriate dashboard based on role */}
                  {user?.role === 'coach' || user?.role === 'admin' ? (
                    <Link
                      to="/coach-dashboard"
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
                      Coach Dashboard
                    </Link>
                  ) : (
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
                  )}

                  {/* If admin, show both dashboards */}
                  {user?.role === 'admin' && (
                    <Link
                      to="/dashboard"
                      className={styles.dropdownItem}
                      onClick={() => {
                        closeUserDropdown();
                        closeMenu();
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 16v-4"></path>
                        <path d="M12 8h.01"></path>
                      </svg>
                      Member View
                    </Link>
                  )}

                  <button
                    className={styles.dropdownItem}
                    onClick={async () => {
                      closeUserDropdown();
                      closeMenu();
                      try {
                        await logout();
                        window.location.href = '/';
                      } catch (error) {
                        console.error('Logout failed:', error);
                      }
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.authButtons}>
              <button className={styles.signInButton} onClick={() => {
                setIsCoachLogin(false);
                openAuthModal();
              }}>
                Sign In
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Full Screen Mobile Menu */}
      <div className={`${styles.mobileMenu} ${isMenuOpen ? styles.mobileMenuOpen : ''}`}>
        <div className={styles.mobileMenuHeader}>
          <Link to="/" className={styles.mobileMenuLogo} onClick={closeMenu}>
            <div className={styles.logoText}>CrossFit Comet</div>
            <div className={styles.logoAffiliate}>Affiliate</div>
          </Link>
          <button
            className={styles.mobileMenuClose}
            onClick={closeMenu}
            aria-label="Close menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className={styles.mobileMenuContent}>
          {/* Navigation Links */}
          <nav className={styles.mobileNav}>
            <Link
              to="/"
              className={`${styles.mobileNavLink} ${location.pathname === '/' ? styles.active : ''}`}
              onClick={closeMenu}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              Home
            </Link>
            <Link
              to="/about"
              className={`${styles.mobileNavLink} ${location.pathname === '/about' ? styles.active : ''}`}
              onClick={closeMenu}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              About
            </Link>
            <Link
              to="/coaches"
              className={`${styles.mobileNavLink} ${location.pathname === '/coaches' ? styles.active : ''}`}
              onClick={closeMenu}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              Coaches
            </Link>
            <Link
              to="/schedule"
              className={`${styles.mobileNavLink} ${location.pathname === '/schedule' ? styles.active : ''}`}
              onClick={closeMenu}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Schedule
            </Link>
            <a
              href="/#wod"
              className={`${styles.mobileNavLink} ${styles.wodLink} ${activeSection === 'wod' ? styles.active : ''}`}
              onClick={closeMenu}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
              Today's WOD
            </a>
          </nav>

          {/* Divider */}
          <div className={styles.mobileMenuDivider} />

          {/* User Section */}
          <div className={styles.mobileUserSection}>
            {isAuthenticated ? (
              <>
                <div className={styles.mobileUserInfo}>
                  <div className={styles.mobileUserAvatar}>
                    {getFirstName().charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.mobileUserDetails}>
                    <span className={styles.mobileUserName}>{user?.name || 'User'}</span>
                    <span className={styles.mobileUserEmail}>{user?.email}</span>
                  </div>
                </div>
                <Link
                  to="/dashboard"
                  className={styles.mobileUserLink}
                  onClick={closeMenu}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="9" y1="3" x2="9" y2="21"></line>
                  </svg>
                  Dashboard
                </Link>
                <button
                  className={styles.mobileSignOutButton}
                  onClick={async () => {
                    closeMenu();
                    try {
                      await logout();
                      window.location.href = '/';
                    } catch (error) {
                      console.error('Logout failed:', error);
                    }
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <div className={styles.mobileGuestInfo}>
                  <div className={styles.mobileGuestIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <div className={styles.mobileGuestDetails}>
                    <span className={styles.mobileGuestTitle}>Welcome to CrossFit Comet</span>
                    <span className={styles.mobileGuestSubtitle}>Sign in to access your account</span>
                  </div>
                </div>
                <button className={styles.mobileSignInButton} onClick={openAuthModal}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                    <polyline points="10 17 15 12 10 7"></polyline>
                    <line x1="15" y1="12" x2="3" y2="12"></line>
                  </svg>
                  Sign In
                </button>
                <button className={styles.mobileSignUpButton} onClick={() => {
                  setAuthModalMode('signup');
                  setAuthModalInitialError('');
                  setIsAuthModalOpen(true);
                  closeMenu();
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <line x1="20" y1="8" x2="20" y2="14"></line>
                    <line x1="23" y1="11" x2="17" y2="11"></line>
                  </svg>
                  Create Account
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        initialMode={authModalMode}
        initialError={authModalInitialError}
        isCoachLogin={isCoachLogin}
        onCoachLoginClick={() => {
          setIsCoachLogin(true);
          setIsAuthModalOpen(false);
          // Reopen modal with coach login flag
          setTimeout(() => setIsAuthModalOpen(true), 100);
        }}
      />
    </div>
  );
};

export default Navbar;
