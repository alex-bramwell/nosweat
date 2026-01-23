import { useState, useEffect } from 'react';
import { Card, Button, Select } from '../common';
import { DeleteIcon } from '../common/Icons';
import Modal from '../common/Modal/Modal';
import { usePermissions } from '../../hooks/usePermissions';
import { userManagementService, type UserProfile, type InviteUserData, type UserRole } from '../../services/userManagementService';
import { coachServicesService, type ServiceType, type CoachService, SERVICE_LABELS } from '../../services/coachServicesService';
import styles from './UserManagement.module.scss';

interface UserManagementProps {
  /** Fixed role filter - when set, only shows users of this role. Use array for multiple roles. */
  fixedRoleFilter?: 'member' | 'staff' | 'coach' | 'admin' | ('member' | 'staff' | 'coach' | 'admin')[];
  /** Custom title for the header */
  title?: string;
  /** Hide the invite user button */
  hideInvite?: boolean;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  fixedRoleFilter,
  title = 'User Management',
  hideInvite = false
}) => {
  const permissions = usePermissions();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [roleFilter, setRoleFilter] = useState<'all' | 'member' | 'staff' | 'coach' | 'admin'>(
    Array.isArray(fixedRoleFilter) ? 'all' : (fixedRoleFilter || 'all')
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Invite form state
  const [inviteData, setInviteData] = useState<InviteUserData>({
    email: '',
    name: '',
    role: 'member',
    coachId: '',
    sendEmail: true,
  });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Coach services state
  const [coachServices, setCoachServices] = useState<Record<string, CoachService[]>>({});
  const [servicesModalCoach, setServicesModalCoach] = useState<UserProfile | null>(null);
  const [servicesLoading, setServicesLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Only admins can see the full user list
    if (permissions.canManageUsers) {
      loadUsers();
    } else {
      setIsLoading(false);
    }
  }, [permissions.canManageUsers]);

  useEffect(() => {
    filterUsers();
  }, [users, roleFilter, searchQuery, fixedRoleFilter]);

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const allUsers = await userManagementService.getAllUsers();
      setUsers(allUsers);

      // Load services for all coaches
      const coaches = allUsers.filter(u => u.role === 'coach');
      for (const coach of coaches) {
        loadCoachServices(coach.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filter by fixedRoleFilter first (if set)
    if (fixedRoleFilter) {
      if (Array.isArray(fixedRoleFilter)) {
        // Filter by multiple roles
        filtered = filtered.filter(user => fixedRoleFilter.includes(user.role));
      } else {
        // Filter by single role
        filtered = filtered.filter(user => user.role === fixedRoleFilter);
      }
    } else if (roleFilter !== 'all') {
      // Only apply roleFilter dropdown if fixedRoleFilter is not set
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        user =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          (user.coachId && user.coachId.toLowerCase().includes(query))
      );
    }

    setFilteredUsers(filtered);
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteError(null);
    setInviteSuccess(false);

    try {
      const result = await userManagementService.inviteUser(inviteData);

      if (result.success) {
        setInviteSuccess(true);
        setInviteData({
          email: '',
          name: '',
          role: 'member',
          coachId: '',
          sendEmail: true,
        });

        // Reload users list
        await loadUsers();

        // Close form after 2 seconds
        setTimeout(() => {
          setShowInviteForm(false);
          setInviteSuccess(false);
        }, 2000);
      } else {
        setInviteError(result.error || 'Failed to invite user');
      }
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Failed to invite user');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: UserRole, coachId?: string) => {
    try {
      await userManagementService.updateUserRole({
        userId,
        role: newRole,
        coachId,
      });
      await loadUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update user role');
    }
  };

  const openDeleteModal = (userId: string, userName: string) => {
    setUserToDelete({ id: userId, name: userName });
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    setDeleteLoading(true);
    try {
      await userManagementService.deleteUser(userToDelete.id);
      await loadUsers();
      closeDeleteModal();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Load services for a coach when expanded
  const loadCoachServices = async (coachId: string) => {
    if (coachServices[coachId]) return; // Already loaded

    setServicesLoading(prev => ({ ...prev, [coachId]: true }));
    try {
      const services = await coachServicesService.getCoachServices(coachId);
      setCoachServices(prev => ({ ...prev, [coachId]: services }));
    } catch (err) {
      console.error('Failed to load coach services:', err);
    } finally {
      setServicesLoading(prev => ({ ...prev, [coachId]: false }));
    }
  };

  // Toggle a service for a coach
  const handleToggleService = async (coachId: string, serviceType: ServiceType, currentlyActive: boolean) => {
    try {
      await coachServicesService.toggleService(coachId, serviceType, !currentlyActive);
      // Refresh the services for this coach
      const services = await coachServicesService.getCoachServices(coachId);
      setCoachServices(prev => ({ ...prev, [coachId]: services }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to toggle service');
    }
  };

  // Open services modal for a coach
  const openServicesModal = (coach: UserProfile) => {
    setServicesModalCoach(coach);
    loadCoachServices(coach.id);
  };

  // Close services modal
  const closeServicesModal = () => {
    setServicesModalCoach(null);
  };

  // Get active services for a coach
  const getActiveServices = (coachId: string): ServiceType[] => {
    const services = coachServices[coachId] || [];
    return services.filter(s => s.isActive).map(s => s.serviceType);
  };

  // Check if a service is active for a coach
  const isServiceActive = (coachId: string, serviceType: ServiceType): boolean => {
    const services = coachServices[coachId] || [];
    const service = services.find(s => s.serviceType === serviceType);
    return service?.isActive || false;
  };

  const ALL_SERVICE_TYPES: ServiceType[] = ['pt', 'specialty_class', 'sports_massage', 'nutrition', 'physio'];

  // Only admins can access user management
  if (!permissions.canManageUsers) {
    return (
      <Card variant="elevated">
        <p>You do not have permission to manage users.</p>
      </Card>
    );
  }

  const availableRoles: { value: UserRole; label: string }[] = [
    { value: 'member', label: 'Member' },
    { value: 'staff', label: 'Staff' },
    { value: 'coach', label: 'Coach' },
    { value: 'admin', label: 'Admin' },
  ];

  return (
    <div className={styles.userManagement}>
      <div className={styles.header}>
        <h2>{title}</h2>
        {!hideInvite && (
          <Button
            variant="primary"
            onClick={() => setShowInviteForm(!showInviteForm)}
          >
            {showInviteForm ? 'Cancel' : 'Invite User'}
          </Button>
        )}
      </div>

      {showInviteForm && (
        <Card variant="elevated" className={styles.inviteForm}>
          <h3>Invite New User</h3>
          <form onSubmit={handleInviteUser}>
            <div className={styles.formGroup}>
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                value={inviteData.email}
                onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                required
                placeholder="user@example.com"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="name">Name *</label>
              <input
                type="text"
                id="name"
                value={inviteData.name}
                onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
                required
                placeholder="John Doe"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="role">Role *</label>
              <select
                id="role"
                value={inviteData.role}
                onChange={(e) => setInviteData({ ...inviteData, role: e.target.value as UserRole })}
                required
              >
                {availableRoles.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </div>

            {inviteData.role === 'coach' && (
              <div className={styles.formGroup}>
                <label htmlFor="coachId">Coach ID</label>
                <input
                  type="text"
                  id="coachId"
                  value={inviteData.coachId}
                  onChange={(e) => setInviteData({ ...inviteData, coachId: e.target.value })}
                  placeholder="e.g., dan, lizzie, lewis"
                />
                <small>Used for linking to coach profiles on the website</small>
              </div>
            )}

            <div className={styles.formGroup}>
              <label className={styles.checkboxRow}>
                <div className={styles.checkboxWrapper}>
                  <input
                    type="checkbox"
                    className={styles.checkboxInput}
                    checked={inviteData.sendEmail}
                    onChange={(e) => setInviteData({ ...inviteData, sendEmail: e.target.checked })}
                  />
                  <span className={styles.checkboxVisual} />
                </div>
                Send password reset email to user
              </label>
              <small>User will receive an email to set their password</small>
            </div>

            {inviteError && (
              <div className={styles.error}>{inviteError}</div>
            )}

            {inviteSuccess && (
              <div className={styles.success}>
                User invited successfully! {inviteData.sendEmail && 'Password reset email sent.'}
              </div>
            )}

            <div className={styles.formActions}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowInviteForm(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={inviteLoading}
              >
                {inviteLoading ? 'Inviting...' : 'Invite User'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* User list and filters - admin only */}
      {permissions.canManageUsers && (
        <>
          <Card variant="elevated" className={styles.filtersCard}>
            <div className={styles.filters}>
              <div className={styles.filterGroup}>
                <label htmlFor="search">Search</label>
                <input
                  type="text"
                  id="search"
                  placeholder="Search by name, email, or coach ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {!fixedRoleFilter && (
                <div className={styles.filterGroup}>
                  <label htmlFor="roleFilter">Filter by Role</label>
                  <Select
                    options={[
                      { value: 'all', label: 'All Users' },
                      { value: 'admin', label: 'Admins' },
                      { value: 'coach', label: 'Coaches' },
                      { value: 'staff', label: 'Staff' },
                      { value: 'member', label: 'Members' },
                    ]}
                    value={roleFilter}
                    onChange={(value) => setRoleFilter(value as typeof roleFilter)}
                  />
                </div>
              )}
            </div>
          </Card>

          {isLoading ? (
        <Card variant="elevated">
          <p>Loading users...</p>
        </Card>
      ) : error ? (
        <Card variant="elevated">
          <p className={styles.error}>{error}</p>
          <Button onClick={loadUsers}>Retry</Button>
        </Card>
      ) : (
        <div className={styles.usersList}>
          <div className={styles.usersHeader}>
            <p>{filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} found</p>
          </div>

          {filteredUsers.map(user => (
            <Card key={user.id} variant="elevated" className={styles.userCard}>
              <div className={styles.userContent}>
                <div className={styles.userHeader}>
                  <h3>{user.name}</h3>
                  <div className={styles.badges}>
                    <span className={`${styles.roleBadge} ${styles[user.role]}`}>
                      {user.role}
                    </span>
                    {user.membershipType && (
                      <span className={styles.membershipBadge}>{user.membershipType}</span>
                    )}
                  </div>
                </div>
                <p className={styles.userEmail}>{user.email}</p>
                <div className={styles.userMeta}>
                  {user.coachId && (
                    <span className={styles.userCoachId}>Coach ID: {user.coachId}</span>
                  )}
                  <span className={styles.joinDate}>
                    Joined: {new Date(user.joinDate).toLocaleDateString()}
                  </span>
                </div>

                {/* Coach Active Services Display */}
                {user.role === 'coach' && getActiveServices(user.id).length > 0 && (
                  <div className={styles.activeServices}>
                    {getActiveServices(user.id).map(serviceType => (
                      <span key={serviceType} className={styles.serviceBadge}>
                        {SERVICE_LABELS[serviceType]}
                      </span>
                    ))}
                  </div>
                )}

                {/* Coach Services Button */}
                {user.role === 'coach' && (
                  <div className={styles.servicesButtonWrapper}>
                    <Button
                      variant="primary"
                      size="small"
                      onClick={() => openServicesModal(user)}
                    >
                      Manage Services
                    </Button>
                  </div>
                )}
              </div>

              <div className={styles.userActions}>
                <Select
                  options={[
                    { value: 'member', label: 'Member' },
                    { value: 'staff', label: 'Staff' },
                    { value: 'coach', label: 'Coach' },
                    { value: 'admin', label: 'Admin' },
                  ]}
                  value={user.role}
                  onChange={(value) => handleUpdateRole(user.id, value as UserRole, user.coachId)}
                  className={styles.roleSelect}
                />

                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => openDeleteModal(user.id, user.name)}
                  className={styles.deleteButton}
                  title="Delete user"
                >
                  <DeleteIcon size={18} />
                </Button>
              </div>

            </Card>
          ))}

          {filteredUsers.length === 0 && (
            <Card variant="elevated">
              <p>No users found matching your filters.</p>
            </Card>
          )}
        </div>
      )}
        </>
      )}

      {/* Delete Confirmation Modal - admin only */}
      {permissions.canManageUsers && (
      <Modal isOpen={deleteModalOpen} onClose={closeDeleteModal}>
        <div className={styles.deleteModal}>
          <h3>Delete User</h3>
          <p>
            Are you sure you want to delete <strong>{userToDelete?.name}</strong>?
          </p>
          <p className={styles.warningText}>
            This action cannot be undone. All user data and bookings will be permanently removed.
          </p>
          <div className={styles.modalActions}>
            <Button
              variant="secondary"
              onClick={closeDeleteModal}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={confirmDeleteUser}
              disabled={deleteLoading}
              className={styles.modalDeleteButton}
            >
              {deleteLoading ? 'Deleting...' : 'Delete User'}
            </Button>
          </div>
        </div>
      </Modal>
      )}

      {/* Coach Services Modal */}
      <Modal isOpen={!!servicesModalCoach} onClose={closeServicesModal}>
        <div className={styles.servicesModal}>
          <h3>Manage Services</h3>
          {servicesModalCoach && (
            <>
              <p className={styles.servicesModalSubtitle}>
                Configure services offered by <strong>{servicesModalCoach.name}</strong>
              </p>
              {servicesLoading[servicesModalCoach.id] ? (
                <p className={styles.servicesLoading}>Loading services...</p>
              ) : (
                <div className={styles.servicesList}>
                  {ALL_SERVICE_TYPES.map(serviceType => {
                    const isActive = isServiceActive(servicesModalCoach.id, serviceType);
                    return (
                      <div key={serviceType} className={styles.serviceItem}>
                        <div className={styles.serviceInfo}>
                          <span className={styles.serviceLabel}>{SERVICE_LABELS[serviceType]}</span>
                        </div>
                        <button
                          type="button"
                          className={`${styles.toggle} ${isActive ? styles.toggleActive : ''}`}
                          onClick={() => handleToggleService(
                            servicesModalCoach.id,
                            serviceType,
                            isActive
                          )}
                          aria-pressed={isActive}
                        >
                          <span className={styles.toggleTrack}>
                            <span className={styles.toggleThumb} />
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className={styles.modalActions}>
                <Button variant="primary" onClick={closeServicesModal}>
                  Done
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};