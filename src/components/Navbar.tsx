import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from './AuthModal';
import styles from './Navbar.module.scss';

const Navbar: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

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

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const openAuthModal = () => {
    setIsAuthModalOpen(true);
    closeMenu();
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const toggleUserDropdown = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
  };

  const closeUserDropdown = () => {
    setIsUserDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isUserDropdownOpen && !target.closest(`.${styles.userMenu}`)) {
        closeUserDropdown();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserDropdownOpen]);

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
        </div>
      </nav>

      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} initialMode="login" />
    </div>
  );
};

export default Navbar;
