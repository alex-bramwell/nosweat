import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'member' | 'coach' | 'admin';
  membershipType: 'trial' | 'crossfit' | 'comet-plus' | 'open-gym' | 'specialty';
  joinDate: string;
  avatarUrl?: string;
  phone?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  coachId?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  loginWithOAuth: (provider: 'google' | 'facebook') => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile from database using direct API
  const fetchUserProfile = async (userId: string, accessToken?: string): Promise<User | null> => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      // Get access token from localStorage if not provided
      if (!accessToken) {
        const storageKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
        const storedSession = localStorage.getItem(storageKey);
        if (storedSession) {
          const session = JSON.parse(storedSession);
          accessToken = session?.access_token;
        }
      }

      console.log('Fetching profile via direct API for user:', userId);
      
      const response = await fetch(
        `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=*`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${accessToken || supabaseKey}`,
          },
        }
      );

      if (!response.ok) {
        console.error('Profile fetch failed:', response.status);
        return null;
      }

      const data = await response.json();
      console.log('Profile data:', data);
      
      if (!data || data.length === 0) {
        console.log('No profile found for user');
        return null;
      }

      const profile = data[0];
      return {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role || 'member',
        membershipType: profile.membership_type,
        joinDate: profile.join_date,
        avatarUrl: profile.avatar_url || undefined,
        phone: profile.phone || undefined,
        emergencyContact: profile.emergency_contact || undefined,
        emergencyPhone: profile.emergency_phone || undefined,
        coachId: profile.coach_id || undefined,
      };
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  };

  useEffect(() => {
    // Check active session on mount
    const initializeAuth = async () => {
      try {
        // Check localStorage directly for session (SDK getSession hangs)
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const storageKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
        const storedSession = localStorage.getItem(storageKey);
        
        console.log('AuthContext: Checking localStorage, key:', storageKey);
        console.log('AuthContext: Found session:', !!storedSession);
        
        if (storedSession) {
          const session = JSON.parse(storedSession);
          console.log('AuthContext: Session user:', session?.user?.id, session?.user?.email);
          
          if (session?.user?.id) {
            // Try to fetch profile, but use session data as fallback
            let profile: User | null = null;
            
            try {
              profile = await fetchUserProfile(session.user.id, session.access_token);
              console.log('AuthContext: Fetched profile:', profile?.name);
            } catch (e) {
              console.error('AuthContext: Profile fetch failed:', e);
            }
            
            // If profile fetch fails, create user from session data
            if (!profile && session.user) {
              console.log('AuthContext: Using session data as fallback');
              profile = {
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                role: session.user.user_metadata?.role || 'member',
                membershipType: 'trial',
                joinDate: session.user.created_at || new Date().toISOString(),
                coachId: session.user.user_metadata?.coach_id,
              };
            }
            
            if (profile) {
              console.log('AuthContext: Setting user:', profile.name);
              setUser(profile);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          setUser(profile);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (data.user) {
      // Don't block on profile fetch - let onAuthStateChange handle it
      fetchUserProfile(data.user.id).then(profile => {
        if (profile) setUser(profile);
      }).catch(err => {
        console.error('Error fetching profile after login:', err);
      });
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    console.log('Signup attempt for:', email);
    console.log('Email redirect URL:', `${window.location.origin}/email-verified`);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
        emailRedirectTo: `${window.location.origin}/email-verified`,
      },
    });

    console.log('Signup response:', { 
      hasUser: !!data.user, 
      hasSession: !!data.session, 
      userId: data.user?.id,
      userEmail: data.user?.email,
      emailConfirmedAt: data.user?.email_confirmed_at,
      confirmationSentAt: data.user?.confirmation_sent_at,
      identities: data.user?.identities,
      identitiesLength: data.user?.identities?.length,
      error 
    });

    if (error) {
      throw new Error(error.message);
    }

    // Check if user already exists - Supabase returns a fake user with empty identities
    // to prevent email enumeration attacks
    if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
      console.log('Detected existing user - identities array is empty or missing');
      throw new Error('An account with this email already exists. Please sign in instead.');
    }

    // Additional check: if user exists but email is already confirmed, they're an existing user
    if (data.user && data.user.email_confirmed_at && !data.session) {
      console.log('Detected existing user - email already confirmed');
      throw new Error('An account with this email already exists. Please sign in instead.');
    }

    // Check if confirmation was actually sent (for new users)
    if (data.user && !data.session && !data.user.confirmation_sent_at) {
      console.log('WARNING: No confirmation email sent - user may already exist');
      throw new Error('An account with this email may already exist. Please try signing in, or use a different email.');
    }

    // If email confirmation is enabled, user won't have a session yet
    if (data.user && !data.session) {
      console.log('Email confirmation required - no session provided');
      throw new Error('Please check your email to verify your account before signing in.');
    }

    if (data.user && data.session) {
      // Profile is created automatically via database trigger
      // Wait a moment for the trigger to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      const profile = await fetchUserProfile(data.user.id);
      setUser(profile);
    }
  };

  const logout = async () => {
    // Clear the session from localStorage (used by direct API login)
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const storageKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
    localStorage.removeItem(storageKey);
    
    // Try to sign out via Supabase SDK (may fail if session was set manually)
    try {
      await supabase.auth.signOut();
    } catch (error) {
      // Ignore errors - we've already cleared localStorage
      console.log('Supabase signOut error (ignored):', error);
    }
    
    setUser(null);
    // Clear registration intent on logout to prevent stale redirects
    sessionStorage.removeItem('cf_comet_registration_intent');
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      // Provide better error message for rate limiting
      if (error.message.includes('429') || error.message.toLowerCase().includes('rate limit')) {
        throw new Error('Too many password reset requests. Please wait 1 hour before trying again.');
      }
      throw new Error(error.message);
    }
  };

  const changePassword = async (newPassword: string) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      // Provide better error message for rate limiting
      if (error.message.includes('429') || error.message.toLowerCase().includes('rate limit')) {
        throw new Error('Too many password change requests. Please wait a moment and try again.');
      }
      throw new Error(error.message);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        name: updates.name,
        phone: updates.phone,
        membership_type: updates.membershipType,
        emergency_contact: updates.emergencyContact,
        emergency_phone: updates.emergencyPhone,
      })
      .eq('id', user.id);

    if (error) {
      throw new Error(error.message);
    }

    // Update local state
    setUser({ ...user, ...updates });
  };

  const loginWithOAuth = async (provider: 'google' | 'facebook') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      throw new Error(error.message);
    }
    // OAuth will redirect, so no need to set user here
  };

  const resendVerificationEmail = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/email-verified`,
      },
    });

    if (error) {
      throw new Error(error.message);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
    resetPassword,
    changePassword,
    updateProfile,
    loginWithOAuth,
    resendVerificationEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
