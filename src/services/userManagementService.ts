import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'member' | 'coach' | 'admin';
  membershipType?: string;
  joinDate: string;
  phone?: string;
  coachId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InviteUserData {
  email: string;
  name: string;
  role: 'member' | 'coach' | 'admin';
  coachId?: string;
  sendEmail?: boolean;
}

export interface UpdateUserRoleData {
  userId: string;
  role: 'member' | 'coach' | 'admin';
  coachId?: string;
}

class UserManagementService {
  /**
   * Get all users (admin only)
   */
  async getAllUsers(): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    return (data || []).map(profile => ({
      id: profile.id,
      email: profile.email,
      name: profile.full_name,
      role: profile.role || 'member',
      membershipType: profile.membership_type,
      joinDate: profile.join_date || profile.created_at,
      phone: profile.phone,
      coachId: profile.coach_id,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    }));
  }

  /**
   * Get users by role (admin only)
   */
  async getUsersByRole(role: 'member' | 'coach' | 'admin'): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', role)
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error fetching users by role:', error);
      throw new Error(`Failed to fetch ${role}s: ${error.message}`);
    }

    return (data || []).map(profile => ({
      id: profile.id,
      email: profile.email,
      name: profile.full_name,
      role: profile.role || 'member',
      membershipType: profile.membership_type,
      joinDate: profile.join_date || profile.created_at,
      phone: profile.phone,
      coachId: profile.coach_id,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    }));
  }

  /**
   * Invite a new user and create their account (admin only)
   * This uses Supabase Admin API to create the user
   */
  async inviteUser(userData: InviteUserData): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      // Generate a temporary password (user will be prompted to reset)
      const tempPassword = this.generateTempPassword();

      // Create the auth user using Supabase Admin API
      // Note: This requires the anon key to have admin privileges or use a service role key
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: tempPassword,
        email_confirm: true, // Auto-confirm email for invited users
        user_metadata: {
          name: userData.name,
          role: userData.role,
          coach_id: userData.coachId,
        },
      });

      if (authError) {
        console.error('Error creating auth user:', authError);
        return {
          success: false,
          error: authError.message,
        };
      }

      if (!authData.user) {
        return {
          success: false,
          error: 'Failed to create user',
        };
      }

      // Update the profile with role and coach_id
      // The profile is created automatically by the trigger, we just need to update it
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          role: userData.role,
          coach_id: userData.coachId,
        })
        .eq('id', authData.user.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        // User is created but profile update failed
        // We could delete the user here, but leaving it for now
      }

      // Send password reset email if requested
      if (userData.sendEmail) {
        await supabase.auth.resetPasswordForEmail(userData.email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
      }

      return {
        success: true,
        userId: authData.user.id,
      };
    } catch (error) {
      console.error('Error inviting user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update a user's role (admin only)
   */
  async updateUserRole(updateData: UpdateUserRoleData): Promise<void> {
    const { error } = await supabase.rpc('update_user_role', {
      target_user_id: updateData.userId,
      new_role: updateData.role,
      new_coach_id: updateData.coachId || null,
    });

    if (error) {
      console.error('Error updating user role:', error);
      throw new Error(`Failed to update user role: ${error.message}`);
    }
  }

  /**
   * Delete a user (admin only)
   * Note: This requires admin API access
   */
  async deleteUser(userId: string): Promise<void> {
    // Delete auth user (this will cascade to profile via trigger)
    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      console.error('Error deleting user:', error);
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  /**
   * Generate a temporary password for new users
   */
  private generateTempPassword(): string {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  /**
   * Get user details by ID (admin only)
   */
  async getUserById(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      email: data.email,
      name: data.full_name,
      role: data.role || 'member',
      membershipType: data.membership_type,
      joinDate: data.join_date || data.created_at,
      phone: data.phone,
      coachId: data.coach_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

export const userManagementService = new UserManagementService();
