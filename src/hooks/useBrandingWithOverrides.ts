import { useMemo } from 'react';
import { useTenant } from '../contexts/TenantContext';
import { useBrandingOverrides } from '../contexts/BrandingOverrideContext';
import type { GymBranding } from '../types/tenant';

export function useBrandingWithOverrides(): GymBranding {
  const { branding } = useTenant();
  const overrides = useBrandingOverrides();

  return useMemo(() => {
    if (!overrides) return branding;
    return { ...branding, ...overrides };
  }, [branding, overrides]);
}
