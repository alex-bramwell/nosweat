import { createContext, useContext, type ReactNode } from 'react';
import type { GymBranding } from '../types/tenant';

type BrandingOverrides = Partial<GymBranding>;

interface BuilderState {
  isBuilder: boolean;
  navigatePage?: (page: string) => void;
}

const BrandingOverrideContext = createContext<BrandingOverrides | null>(null);
const BuilderContext = createContext<BuilderState>({ isBuilder: false });

interface BrandingOverrideProviderProps {
  overrides: BrandingOverrides | null;
  onNavigatePage?: (page: string) => void;
  children: ReactNode;
}

export const BrandingOverrideProvider: React.FC<BrandingOverrideProviderProps> = ({
  overrides,
  onNavigatePage,
  children,
}) => (
  <BuilderContext.Provider value={{ isBuilder: true, navigatePage: onNavigatePage }}>
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
export const useIsBuilder = (): boolean => useContext(BuilderContext).isBuilder;

/** Returns a callback to navigate to a page within the site builder, or null if not in the builder */
export const useBuilderNavigate = (): ((page: string) => void) | null => {
  const ctx = useContext(BuilderContext);
  return ctx.isBuilder ? (ctx.navigatePage ?? null) : null;
};
