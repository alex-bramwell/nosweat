import { createContext, useContext, type ReactNode } from 'react';

type ViewAsRole = 'admin' | 'coach' | 'member' | 'public' | null;

const ViewAsContext = createContext<ViewAsRole>(null);

interface ViewAsProviderProps {
  role: ViewAsRole;
  children: ReactNode;
}

export const ViewAsProvider = ({ role, children }: ViewAsProviderProps) => (
  <ViewAsContext.Provider value={role}>{children}</ViewAsContext.Provider>
);

export const useViewAs = (): ViewAsRole => useContext(ViewAsContext);
