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

import { Fragment, type ReactNode } from 'react';
import Hero from '../components/sections/Hero';
import Programs from '../components/sections/Programs';
import WOD from '../components/sections/WOD';
import Stats from '../components/sections/Stats';
import Memberships from '../components/sections/Memberships';
import Gallery from '../components/sections/Gallery';
import CTA from '../components/sections/CTA';
import { FeatureGate } from '../components/common';
import { useBrandingWithOverrides } from '../hooks/useBrandingWithOverrides';
import { useIsBuilder } from '../contexts/BrandingOverrideContext';
import { DEFAULT_BRANDING } from '../contexts/TenantContext';
import LockedSectionPlaceholder from '../components/GymAdmin/LockedSectionPlaceholder';

// Canonical section keys - any not in a gym's stored order get appended, so
// new sections (e.g. memberships, gallery) show up for existing gyms without a backfill.
const CANONICAL_SECTIONS = ['hero', 'programs', 'wod', 'stats', 'memberships', 'gallery', 'cta'];

const Home = () => {
  const branding = useBrandingWithOverrides();
  const isBuilder = useIsBuilder();
  const vis = branding.visible_sections ?? {};
  const isVisible = (section: string) => vis[section] !== false;
  // Owner-defined order, with any missing canonical sections appended.
  const stored = branding.section_order ?? DEFAULT_BRANDING.section_order;
  const order = [...stored, ...CANONICAL_SECTIONS.filter((k) => !stored.includes(k))];

  // Each homepage section, keyed for ordering. WOD and CTA carry their own
  // feature gate (with a builder-only "locked" placeholder when the feature is
  // off); Stats, Memberships and Gallery self-handle their empty states.
  const sections: Record<string, ReactNode> = {
    hero: <Hero />,
    programs: <Programs />,
    wod: (
      <FeatureGate
        feature="wod_programming"
        fallback={isBuilder ? <LockedSectionPlaceholder feature="wod_programming" /> : null}
      >
        <WOD />
      </FeatureGate>
    ),
    stats: <Stats />,
    memberships: <Memberships />,
    gallery: <Gallery />,
    cta: (
      <FeatureGate
        feature="class_booking"
        fallback={isBuilder ? <LockedSectionPlaceholder feature="class_booking" /> : null}
      >
        <CTA />
      </FeatureGate>
    ),
  };

  // Gallery is opt-in: it only shows when explicitly enabled (not just "not hidden").
  const shouldShow = (key: string) => (key === 'gallery' ? vis[key] === true : isVisible(key));

  return (
    <>
      {order
        .filter((key) => sections[key] && shouldShow(key))
        .map((key) => (
          <Fragment key={key}>{sections[key]}</Fragment>
        ))}
    </>
  );
};

export default Home;
