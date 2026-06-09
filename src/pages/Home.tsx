// =============================================================================
// Home Page - Where All Multi-Tenant Patterns Converge
//
// This is intentionally the simplest page in the app (~30 lines), but it
// demonstrates how three independent systems compose cleanly together:
//
// 1. BRANDING OVERRIDES (useBrandingWithOverrides):
//    On the public site, returns saved branding from the database.
//    In the admin site builder, returns live-preview overrides so the admin
//    sees changes in real-time before saving. Same component, zero branching.
//
// 2. SECTION VISIBILITY (visible_sections map):
//    Admins can toggle homepage sections on/off via the builder. It's a simple
//    { hero: true, programs: false, ... } map in gym_branding. The isVisible()
//    helper defaults to true (vis[section] !== false), so all sections show
//    unless explicitly hidden.
//
// 3. FEATURE GATING (FeatureGate component):
//    Some sections require paid features (WOD needs wod_programming, CTA needs
//    class_booking). The fallback prop creates dual behavior:
//      - Public site: disabled features render nothing (null)
//      - Site builder: disabled features show a LockedSectionPlaceholder so
//        the admin knows the feature exists but needs to be enabled/upgraded
//
// =============================================================================

import Hero from '../components/sections/Hero';
import Programs from '../components/sections/Programs';
import WOD from '../components/sections/WOD';
import CTA from '../components/sections/CTA';
import { FeatureGate } from '../components/common';
import { useBrandingWithOverrides } from '../hooks/useBrandingWithOverrides';
import { useIsBuilder } from '../contexts/BrandingOverrideContext';
import LockedSectionPlaceholder from '../components/GymAdmin/LockedSectionPlaceholder';

const Home = () => {
  const branding = useBrandingWithOverrides();
  const isBuilder = useIsBuilder();
  const vis = branding.visible_sections ?? {};
  const isVisible = (section: string) => vis[section] !== false;

  return (
    <>
      {/* Hero and Programs are always available - no feature gate needed */}
      {isVisible('hero') && <Hero />}
      {isVisible('programs') && <Programs />}

      {/* WOD section - gated behind wod_programming feature flag */}
      <FeatureGate
        feature="wod_programming"
        fallback={isBuilder ? <LockedSectionPlaceholder feature="wod_programming" /> : null}
      >
        {isVisible('wod') && <WOD />}
      </FeatureGate>

      {/* CTA section - gated behind class_booking since the CTA drives bookings */}
      <FeatureGate
        feature="class_booking"
        fallback={isBuilder ? <LockedSectionPlaceholder feature="class_booking" /> : null}
      >
        {isVisible('cta') && <CTA />}
      </FeatureGate>
    </>
  );
};

export default Home;
