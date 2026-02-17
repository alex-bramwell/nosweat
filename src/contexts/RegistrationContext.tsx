import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useTenant } from './TenantContext';
import type { RegistrationIntent } from '../types';

interface RegistrationContextType {
  intent: RegistrationIntent | null;
  setIntent: (intent: Partial<RegistrationIntent>) => void;
  updateStep: (step: RegistrationIntent['step']) => void;
  clearIntent: () => void;
}

const RegistrationContext = createContext<RegistrationContextType | undefined>(undefined);

const INTENT_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

interface RegistrationProviderProps {
  children: ReactNode;
}

export const RegistrationProvider: React.FC<RegistrationProviderProps> = ({ children }) => {
  const { gym } = useTenant();
  const [intent, setIntentState] = useState<RegistrationIntent | null>(null);

  // Dynamic storage key based on gym slug
  const STORAGE_KEY = `${gym?.slug || 'gym'}_registration_intent`;

  // Load intent from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: RegistrationIntent = JSON.parse(stored);

        // Check if intent has expired
        const now = Date.now();
        if (parsed.timestamp && now - parsed.timestamp < INTENT_EXPIRY_MS) {
          setIntentState(parsed);
        } else {
          // Intent expired, clear it
          sessionStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Error loading registration intent:', error);
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [STORAGE_KEY]);

  // Listen for storage changes (e.g., when logout clears the intent)
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored && intent) {
        // Storage was cleared externally (e.g., by logout)
        setIntentState(null);
      }
    };

    // Check periodically since storage events don't fire for same-tab changes
    const intervalId = setInterval(handleStorageChange, 500);

    return () => clearInterval(intervalId);
  }, [intent, STORAGE_KEY]);

  // Save intent to sessionStorage whenever it changes
  useEffect(() => {
    if (intent) {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(intent));
      } catch (error) {
        console.error('Error saving registration intent:', error);
      }
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [intent, STORAGE_KEY]);

  const setIntent = (newIntent: Partial<RegistrationIntent>) => {
    setIntentState((prev) => ({
      type: newIntent.type ?? prev?.type ?? null,
      selectedClass: newIntent.selectedClass ?? prev?.selectedClass,
      timestamp: Date.now(),
      step: newIntent.step ?? prev?.step ?? 'intent',
    }));
  };

  const updateStep = (step: RegistrationIntent['step']) => {
    if (intent) {
      setIntentState({
        ...intent,
        step,
        timestamp: Date.now(),
      });
    }
  };

  const clearIntent = () => {
    setIntentState(null);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  return (
    <RegistrationContext.Provider value={{ intent, setIntent, updateStep, clearIntent }}>
      {children}
    </RegistrationContext.Provider>
  );
};

export const useRegistrationIntent = (): RegistrationContextType => {
  const context = useContext(RegistrationContext);
  if (!context) {
    throw new Error('useRegistrationIntent must be used within a RegistrationProvider');
  }
  return context;
};
