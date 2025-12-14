import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database types for TypeScript
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          membership_type: 'trial' | 'crossfit' | 'comet-plus' | 'open-gym' | 'specialty';
          join_date: string;
          avatar_url: string | null;
          phone: string | null;
          emergency_contact: string | null;
          emergency_phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          membership_type?: 'trial' | 'crossfit' | 'comet-plus' | 'open-gym' | 'specialty';
          join_date?: string;
          avatar_url?: string | null;
          phone?: string | null;
          emergency_contact?: string | null;
          emergency_phone?: string | null;
        };
        Update: {
          name?: string;
          membership_type?: 'trial' | 'crossfit' | 'comet-plus' | 'open-gym' | 'specialty';
          avatar_url?: string | null;
          phone?: string | null;
          emergency_contact?: string | null;
          emergency_phone?: string | null;
        };
      };
    };
  };
}
