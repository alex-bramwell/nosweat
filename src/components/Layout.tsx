import { useState, useEffect, type ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { BrandingOverrideOnly } from '../contexts/BrandingOverrideContext';
import { COLOR_MAP, hexToRgb, loadGoogleFont } from '../hooks/useTenantTheme';
import type { GymBranding } from '../types/tenant';
import Navbar from './Navbar';
import Footer from './Footer';
import BuilderSidebar from './BuilderSidebar/BuilderSidebar';
import DemoSiteBanner from './common/DemoSiteBanner/DemoSiteBanner';
import styles from './Layout.module.scss';

interface LayoutProps {
  children: ReactNode;
}

/**
 * Applies draft branding CSS variables directly to :root so they
 * override the saved values from useTenantTheme in real time.
 */
function useRootPreviewTheme(draftBranding: Partial<GymBranding> | null) {
  useEffect(() => {
    const root = document.documentElement;

    if (!draftBranding) return;

    // Apply color CSS variables
    for (const { field, cssVar } of COLOR_MAP) {
      const value = draftBranding[field] as string | undefined;
      if (value) {
        root.style.setProperty(cssVar, value);
        try {
          root.style.setProperty(`${cssVar}-rgb`, hexToRgb(value));
        } catch {
          // skip invalid hex
        }
      }
    }

    // Apply typography
    if (draftBranding.font_header) {
      root.style.setProperty('--font-header', `'${draftBranding.font_header}', sans-serif`);
      loadGoogleFont(draftBranding.font_header);
    }
    if (draftBranding.font_body) {
      root.style.setProperty('--font-body', `'${draftBranding.font_body}', sans-serif`);
      loadGoogleFont(draftBranding.font_body);
    }

    // Apply border radius
    if (draftBranding.border_radius) {
      root.style.setProperty('--border-radius', draftBranding.border_radius);
    }

    // Apply theme mode
    if (draftBranding.theme_mode) {
      root.setAttribute('data-theme', draftBranding.theme_mode);
    }
  }, [draftBranding]);
}

const Layout = ({ children }: LayoutProps) => {
  const { user } = useAuth();
  const { isDemoGym } = useTenant();
  // On the demo/example gym, show the clean visitor experience (with the demo
  // banner) rather than the owner's editing sidebar.
  const showBuilder = user?.role === 'admin' && !isDemoGym;
  const [draftBranding, setDraftBranding] = useState<Partial<GymBranding> | null>(null);

  useRootPreviewTheme(showBuilder ? draftBranding : null);

  return (
    <div className={`${styles.layout} ${showBuilder ? styles.withSidebar : ''}`}>
      {showBuilder && <BuilderSidebar onDraftChange={setDraftBranding} />}
      <div className={styles.pageArea}>
        {isDemoGym && <DemoSiteBanner />}
        <BrandingOverrideOnly overrides={showBuilder ? draftBranding : null}>
          <Navbar />
          <main className={styles.layoutContent}>
            {children}
          </main>
          <Footer />
        </BrandingOverrideOnly>
      </div>
    </div>
  );
};

export default Layout;
