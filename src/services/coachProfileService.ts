import { supabase } from '../lib/supabase';
import type { ServiceType } from './coachServicesService';

export interface CoachProfile {
  id: string;
  email: string;
  fullName: string;
  title: string | null;
  bio: string | null;
  certifications: string[];
  specialties: string[];
  coachId: string | null;
  avatarUrl: string | null;
  // Joined services data
  services?: {
    serviceType: ServiceType;
    isActive: boolean;
  }[];
}

export interface CoachProfileUpdateData {
  title?: string;
  bio?: string;
  certifications?: string[];
  specialties?: string[];
  fullName?: string;
}

export const coachProfileService = {
  /**
   * Get a single coach profile by user ID
   */
  async getCoachProfile(userId: string): Promise<CoachProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        title,
        bio,
        certifications,
        specialties,
        coach_id,
        avatar_url,
        coach_services (
          service_type,
          is_active
        )
      `)
      .eq('id', userId)
      .eq('role', 'coach')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      console.error('Error fetching coach profile:', error);
      throw error;
    }

    return mapToCoachProfile(data);
  },

  /**
   * Get all coach profiles for the public coaches page
   */
  async getAllCoachProfiles(): Promise<CoachProfile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        title,
        bio,
        certifications,
        specialties,
        coach_id,
        avatar_url,
        coach_services (
          service_type,
          is_active
        )
      `)
      .eq('role', 'coach')
      .order('full_name');

    if (error) {
      console.error('Error fetching coach profiles:', error);
      throw error;
    }

    return (data || []).map(mapToCoachProfile);
  },

  /**
   * Update coach's own profile
   */
  async updateCoachProfile(
    userId: string,
    profileData: CoachProfileUpdateData
  ): Promise<void> {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (profileData.title !== undefined) {
      updateData.title = profileData.title;
    }
    if (profileData.bio !== undefined) {
      updateData.bio = profileData.bio;
    }
    if (profileData.certifications !== undefined) {
      updateData.certifications = profileData.certifications;
    }
    if (profileData.specialties !== undefined) {
      updateData.specialties = profileData.specialties;
    }
    if (profileData.fullName !== undefined) {
      updateData.full_name = profileData.fullName;
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    if (error) {
      console.error('Error updating coach profile:', error);
      throw error;
    }
  },

  /**
   * Get coaches with active services (for member booking)
   */
  async getCoachesWithServices(): Promise<CoachProfile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        title,
        bio,
        certifications,
        specialties,
        coach_id,
        avatar_url,
        coach_services!inner (
          service_type,
          is_active
        )
      `)
      .eq('role', 'coach')
      .eq('coach_services.is_active', true)
      .order('full_name');

    if (error) {
      console.error('Error fetching coaches with services:', error);
      throw error;
    }

    return (data || []).map(mapToCoachProfile);
  },
};

// Helper to map database row to CoachProfile
function mapToCoachProfile(row: any): CoachProfile {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name || '',
    title: row.title,
    bio: row.bio,
    certifications: row.certifications || [],
    specialties: row.specialties || [],
    coachId: row.coach_id,
    avatarUrl: row.avatar_url,
    services: (row.coach_services || []).map((s: any) => ({
      serviceType: s.service_type,
      isActive: s.is_active,
    })),
  };
}
