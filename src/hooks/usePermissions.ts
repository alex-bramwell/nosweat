import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { UserPermissions } from '../types';

export const usePermissions = (): UserPermissions => {
  const { user } = useAuth();

  return useMemo(() => {
    const role = user?.role || 'member';
    const isAdmin = role === 'admin';
    const isCoach = role === 'coach' || isAdmin;

    return {
      canViewCoachDashboard: isCoach,
      canCreateWorkouts: isCoach,
      canEditWorkouts: isCoach,
      canDeleteWorkouts: isAdmin,
      canManageUsers: isAdmin,
      isAdmin,
      isCoach,
    };
  }, [user?.role]);
};