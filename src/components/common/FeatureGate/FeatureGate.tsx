import React, { type ReactNode } from 'react';
import { useFeature } from '../../../contexts/TenantContext';
import type { FeatureKey } from '../../../types/tenant';

interface FeatureGateProps {
  feature: FeatureKey;
  children: ReactNode;
  /** Optional content to show when the feature is disabled */
  fallback?: ReactNode;
}

/**
 * Conditionally renders children only when the specified feature is enabled
 * for the current gym tenant.
 *
 * Usage:
 *   <FeatureGate feature="wod_programming">
 *     <WODSection />
 *   </FeatureGate>
 *
 *   <FeatureGate feature="class_booking" fallback={<FeatureNotEnabled />}>
 *     <Schedule />
 *   </FeatureGate>
 */
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
