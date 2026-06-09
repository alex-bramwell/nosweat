// =============================================================================
// FeatureGate - Declarative Feature Flag Component
//
// PATTERN: Instead of scattering `if (useFeature('x'))` checks throughout the
// codebase, this component provides a declarative wrapper. The benefit is
// composability - you can gate an entire route, a page section, or a single
// button with the same consistent pattern.
//
// DUAL-CONTEXT DESIGN: The `fallback` prop is the key design decision here.
// It allows the SAME component to behave differently in two contexts:
//   - Public site:  fallback={null} - disabled features simply don't render
//   - Site builder:  fallback={<LockedSectionPlaceholder>} - admin sees a
//     "this feature is locked" overlay, so they know the feature exists but
//     isn't enabled for their plan
//
// USAGE: Two levels of gating work together:
//   1. Route-level (App.tsx):  /schedule and /coaches wrapped in FeatureGate
//   2. Section-level (Home.tsx): WOD and CTA sections conditionally rendered
//
// The feature flags themselves are stored per-gym in the gym_features table
// and loaded by TenantContext into a Record<FeatureKey, boolean> map.
// =============================================================================

import React, { type ReactNode } from 'react';
import { useFeature } from '../../../contexts/TenantContext';
import type { FeatureKey } from '../../../types/tenant';

interface FeatureGateProps {
  feature: FeatureKey;  // Type-safe - FeatureKey is a union type, prevents typos at compile time
  children: ReactNode;
  /** Content to show when feature is disabled - null on public site, placeholder in builder */
  fallback?: ReactNode;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  children,
  fallback = null,
}) => {
  const isEnabled = useFeature(feature);

  if (!isEnabled) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default FeatureGate;
