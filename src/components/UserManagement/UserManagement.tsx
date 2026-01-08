import { useState, useEffect } from 'react';
import { Card, Button } from '../common';
import { userManagementService, type UserProfile, type InviteUserData } from '../../services/userManagementService';
import styles from './UserManagement.module.scss';

interface UserManagementProps {
  isAdmin: boolean;
}

export const UserManagement: React.FC<UserManagementProps> = ({ isAdmin }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [roleFilter, setRoleFilter] = useState<'all' | 'member' | 'coach' | 'admin'>('all');
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

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  useEffect(() => {
    filterUsers();
  }, [users, roleFilter, searchQuery]);

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const allUsers = await userManagementService.getAllUsers();
      setUsers(allUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filter by role
    if (roleFilter !== 'all') {
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

  const handleUpdateRole = async (userId: string, newRole: 'member' | 'coach' | 'admin', coachId?: string) => {
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

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await userManagementService.deleteUser(userId);
      await loadUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  if (!isAdmin) {
    return (
      <Card variant="elevated">
        <p>You do not have permission to manage users.</p>
      </Card>
    );
  }

  return (
    <div className={styles.userManagement}>
      <div className={styles.header}>
        <h2>User Management</h2>
        <Button
          variant="primary"
          onClick={() => setShowInviteForm(!showInviteForm)}
        >
          {showInviteForm ? 'Cancel' : 'Invite User'}
        </Button>
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
                onChange={(e) => setInviteData({ ...inviteData, role: e.target.value as 'member' | 'coach' | 'admin' })}
                required
              >
                <option value="member">Member</option>
                <option value="coach">Coach</option>
                <option value="admin">Admin</option>
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
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={inviteData.sendEmail}
                  onChange={(e) => setInviteData({ ...inviteData, sendEmail: e.target.checked })}
                />
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

          <div className={styles.filterGroup}>
            <label htmlFor="roleFilter">Filter by Role</label>
            <select
              id="roleFilter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
            >
              <option value="all">All Users</option>
              <option value="admin">Admins</option>
              <option value="coach">Coaches</option>
              <option value="member">Members</option>
            </select>
          </div>
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
              <div className={styles.userInfo}>
                <div className={styles.userMain}>
                  <h3>{user.name}</h3>
                  <p className={styles.userEmail}>{user.email}</p>
                  {user.coachId && (
                    <p className={styles.userCoachId}>Coach ID: {user.coachId}</p>
                  )}
                </div>
                <div className={styles.userMeta}>
                  <span className={`${styles.roleBadge} ${styles[user.role]}`}>
                    {user.role}
                  </span>
                  {user.membershipType && (
                    <span className={styles.membershipBadge}>{user.membershipType}</span>
                  )}
                  <p className={styles.joinDate}>
                    Joined: {new Date(user.joinDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className={styles.userActions}>
                <select
                  value={user.role}
                  onChange={(e) => handleUpdateRole(user.id, e.target.value as typeof user.role, user.coachId)}
                  className={styles.roleSelect}
                >
                  <option value="member">Member</option>
                  <option value="coach">Coach</option>
                  <option value="admin">Admin</option>
                </select>

                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => handleDeleteUser(user.id, user.name)}
                >
                  Delete
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
    </div>
  );
};