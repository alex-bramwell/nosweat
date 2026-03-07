import { createContext, useContext, type ReactNode } from 'react';
import type { GymBranding } from '../types/tenant';

type BrandingOverrides = Partial<GymBranding>;

const BrandingOverrideContext = createContext<BrandingOverrides | null>(null);
const BuilderContext = createContext(false);

interface BrandingOverrideProviderProps {
  overrides: BrandingOverrides | null;
  children: ReactNode;
}

export const BrandingOverrideProvider: React.FC<BrandingOverrideProviderProps> = ({
  overrides,
  children,
}) => (
  <BuilderContext.Provider value={true}>
    <BrandingOverrideContext.Provider value={overrides}>
      {children}
    </BrandingOverrideContext.Provider>
  </BuilderContext.Provider>
);

/**
 * Lightweight provider that only supplies branding overrides for live preview
 * WITHOUT setting the builder context flag. Use this in Layout so admin pages
 * get live CSS preview without triggering builder-specific UI (empty states).
 */
export const BrandingOverrideOnly: React.FC<{
  overrides: BrandingOverrides | null;
  children: ReactNode;
}> = ({ overrides, children }) => (
  <BrandingOverrideContext.Provider value={overrides}>
    {children}
  </BrandingOverrideContext.Provider>
);

export const useBrandingOverrides = (): BrandingOverrides | null =>
  useContext(BrandingOverrideContext);

/** Returns true when rendering inside the site builder preview */
export const useIsBuilder = (): boolean => useContext(BuilderContext);
