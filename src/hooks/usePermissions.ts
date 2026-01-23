import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { UserPermissions } from '../types';

export const usePermissions = (): UserPermissions => {
  const { user } = useAuth();

  return useMemo(() => {
    const role = user?.role || 'member';
    const isAdmin = role === 'admin';
    const isCoach = role === 'coach' || isAdmin;
    const isStaff = role === 'staff' || isCoach;

    return {
      // Staff can view coach dashboard (manage workouts tab) and edit workouts
      canViewCoachDashboard: isStaff,
      canCreateWorkouts: isCoach,
      canEditWorkouts: isStaff,
      canDeleteWorkouts: isAdmin,
      // Full user management (roles, delete, invite) is admin only
      canManageUsers: isAdmin,
      canInviteUsers: isAdmin,
      isAdmin,
      isCoach,
      isStaff,
    };
  }, [user?.role]);
};