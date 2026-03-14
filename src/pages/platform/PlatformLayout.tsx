import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
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

const ChevronIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 12 12" width="12" height="12" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 5l3 3 3-3" />
  </svg>
);

// ── Nav Icons ──
const StarIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2Z" />
  </svg>
);

const CreditCardIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const CompassIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);

const BookIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

interface NavItem {
  label: string;
  to: string;
  description?: string;
  icon?: React.ReactNode;
}

interface NavDropdownProps {
  label: string;
  items: NavItem[];
  activeDropdown: string | null;
  onToggle: (label: string) => void;
  onClose: () => void;
}

const NavDropdown = ({ label, items, activeDropdown, onToggle, onClose }: NavDropdownProps) => {
  const isOpen = activeDropdown === label;
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Check if any child route is active
  const hasActiveChild = items.some((item) => location.pathname === item.to);

  return (
    <div className={styles.navDropdownWrapper} ref={dropdownRef}>
      <button
        className={`${styles.navLink} ${styles.navDropdownTrigger} ${hasActiveChild ? styles.navLinkActive : ''}`}
        onClick={() => onToggle(label)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {label}
        <ChevronIcon className={`${styles.navDropdownChevron} ${isOpen ? styles.navDropdownChevronOpen : ''}`} />
      </button>

      {isOpen && (
        <div className={styles.navDropdownMenu}>
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`${styles.navDropdownItem} ${location.pathname === item.to ? styles.navDropdownItemActive : ''}`}
              onClick={onClose}
            >
              {item.icon && <span className={styles.navDropdownItemIcon}>{item.icon}</span>}
              <div className={styles.navDropdownItemText}>
                <span className={styles.navDropdownItemLabel}>{item.label}</span>
                {item.description && (
                  <span className={styles.navDropdownItemDesc}>{item.description}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const PlatformLayout = ({ children }: PlatformLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === '/';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  // Dropdown menu items
  const productItems: NavItem[] = [
    { label: 'Features', to: '/guide', description: 'What you can build with noSweat', icon: <StarIcon /> },
    { label: 'Payments', to: '/payments', description: 'Stripe-powered billing and subscriptions', icon: <CreditCardIcon /> },
    { label: 'Roadmap', to: '/roadmap', description: 'What we are working on next', icon: <CompassIcon /> },
  ];

  const resourceItems: NavItem[] = [
    { label: 'Documentation', to: '/docs', description: 'Guides and setup instructions', icon: <BookIcon /> },
  ];

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
    setMobileExpanded(null);
  }, [location.pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!activeDropdown) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);

  // Close dropdown on Escape
  useEffect(() => {
    if (!activeDropdown) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveDropdown(null);
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [activeDropdown]);

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

  const handleDropdownToggle = useCallback((label: string) => {
    setActiveDropdown((prev) => (prev === label ? null : label));
  }, []);

  const handleDropdownClose = useCallback(() => {
    setActiveDropdown(null);
  }, []);

  const toggleMobileSection = (label: string) => {
    setMobileExpanded((prev) => (prev === label ? null : label));
  };

  return (
    <div className={styles.platformLayout}>
      {/* Navbar */}
      <nav className={styles.navbar} ref={navRef}>
        <div className={styles.navContainer}>
          <Link to="/" className={styles.logo}>
            <Logo className={styles.logoMark} />
          </Link>

          {/* Desktop nav links */}
          <div className={styles.navLinks}>
            <NavDropdown
              label="Product"
              items={productItems}
              activeDropdown={activeDropdown}
              onToggle={handleDropdownToggle}
              onClose={handleDropdownClose}
            />
            <NavDropdown
              label="Resources"
              items={resourceItems}
              activeDropdown={activeDropdown}
              onToggle={handleDropdownToggle}
              onClose={handleDropdownClose}
            />
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
          {/* Product section */}
          <button
            className={styles.mobileSectionToggle}
            onClick={() => toggleMobileSection('product')}
          >
            Product
            <ChevronIcon className={`${styles.mobileSectionChevron} ${mobileExpanded === 'product' ? styles.mobileSectionChevronOpen : ''}`} />
          </button>
          {mobileExpanded === 'product' && (
            <div className={styles.mobileSectionItems}>
              {productItems.map((item) => (
                <Link key={item.to} to={item.to} className={styles.mobileLink}>
                  {item.label}
                </Link>
              ))}
            </div>
          )}

          {/* Resources section */}
          <button
            className={styles.mobileSectionToggle}
            onClick={() => toggleMobileSection('resources')}
          >
            Resources
            <ChevronIcon className={`${styles.mobileSectionChevron} ${mobileExpanded === 'resources' ? styles.mobileSectionChevronOpen : ''}`} />
          </button>
          {mobileExpanded === 'resources' && (
            <div className={styles.mobileSectionItems}>
              {resourceItems.map((item) => (
                <Link key={item.to} to={item.to} className={styles.mobileLink}>
                  {item.label}
                </Link>
              ))}
            </div>
          )}

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

              <div className={styles.platformFooterColumn}>
                <h4 className={styles.platformFooterColumnTitle}>Legal</h4>
                <Link to="/terms" className={styles.platformFooterLink}>
                  Terms of Service
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
