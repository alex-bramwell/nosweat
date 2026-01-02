import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../common';
import { checkPasswordCompromised } from '../../utils/security';
import styles from './ProfileSettings.module.scss';

const ProfileSettings: React.FC = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [emergencyContact, setEmergencyContact] = useState(user?.emergencyContact || '');
  const [emergencyPhone, setEmergencyPhone] = useState(user?.emergencyPhone || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isCheckingPassword, setIsCheckingPassword] = useState(false);
  const [passwordCompromised, setPasswordCompromised] = useState<{ compromised: boolean; count?: number } | null>(null);

  // Password strength validation
  const validatePassword = (pwd: string) => {
    return {
      minLength: pwd.length >= 12,
      hasUppercase: /[A-Z]/.test(pwd),
      hasLowercase: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
    };
  };

  const passwordRequirements = validatePassword(newPassword);
  const isPasswordValid = newPassword
    ? Object.values(passwordRequirements).every(Boolean)
    : false;

  // Check password against Have I Been Pwned database
  React.useEffect(() => {
    if (newPassword && isPasswordValid) {
      const timer = setTimeout(async () => {
        setIsCheckingPassword(true);
        const result = await checkPasswordCompromised(newPassword);
        setPasswordCompromised(result);
        setIsCheckingPassword(false);
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setPasswordCompromised(null);
    }
  }, [newPassword, isPasswordValid]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields');
      return;
    }

    if (!isPasswordValid) {
      setPasswordError('Password does not meet security requirements');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (passwordCompromised?.compromised) {
      setPasswordError(
        `This password has been found in ${passwordCompromised.count?.toLocaleString()} data breaches. Please choose a different password.`
      );
      return;
    }

    setIsPasswordLoading(true);

    try {
      await changePassword(newPassword);
      setPasswordSuccess('Password changed successfully!');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (!name) {
        throw new Error('Name is required');
      }

      await updateProfile({
        name,
        phone: phone || undefined,
        emergencyContact: emergencyContact || undefined,
        emergencyPhone: emergencyPhone || undefined,
      });

      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Profile Settings</h2>
        <p className={styles.subtitle}>Manage your personal information and emergency contacts</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Personal Information</h3>

          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input
              id="email"
              type="email"
              value={user.email}
              className={styles.input}
              disabled
            />
            <p className={styles.helpText}>Email cannot be changed</p>
          </div>

          <div className={styles.field}>
            <label htmlFor="name" className={styles.label}>Full Name *</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
              placeholder="Enter your full name"
              disabled={isLoading}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="phone" className={styles.label}>Phone Number</label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={styles.input}
              placeholder="(555) 123-4567"
              disabled={isLoading}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Membership Type</label>
            <div className={styles.badge}>
              {user.membershipType.replace('-', ' ').toUpperCase()}
            </div>
            <p className={styles.helpText}>Contact us to change your membership</p>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Emergency Contact</h3>

          <div className={styles.field}>
            <label htmlFor="emergencyContact" className={styles.label}>Emergency Contact Name</label>
            <input
              id="emergencyContact"
              type="text"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              className={styles.input}
              placeholder="Contact name"
              disabled={isLoading}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="emergencyPhone" className={styles.label}>Emergency Contact Phone</label>
            <input
              id="emergencyPhone"
              type="tel"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
              className={styles.input}
              placeholder="(555) 123-4567"
              disabled={isLoading}
            />
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        <div className={styles.actions}>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>

      <div className={styles.divider} />

      <form onSubmit={handlePasswordChange} className={styles.form}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Change Password</h3>
          <p className={styles.subtitle}>Update your account password</p>

          <div className={styles.field}>
            <label htmlFor="newPassword" className={styles.label}>New Password *</label>
            <div className={styles.passwordField}>
              <input
                id="newPassword"
                type={showPasswords ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={styles.input}
                placeholder="Enter your new password"
                disabled={isPasswordLoading}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPasswords(!showPasswords)}
                aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'}
              >
                {showPasswords ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            {newPassword && (
              <div className={styles.passwordRequirements}>
                <div className={passwordRequirements.minLength ? styles.valid : styles.invalid}>
                  {passwordRequirements.minLength ? '✓' : '✗'} At least 12 characters
                </div>
                <div className={passwordRequirements.hasUppercase ? styles.valid : styles.invalid}>
                  {passwordRequirements.hasUppercase ? '✓' : '✗'} One uppercase letter
                </div>
                <div className={passwordRequirements.hasLowercase ? styles.valid : styles.invalid}>
                  {passwordRequirements.hasLowercase ? '✓' : '✗'} One lowercase letter
                </div>
                <div className={passwordRequirements.hasNumber ? styles.valid : styles.invalid}>
                  {passwordRequirements.hasNumber ? '✓' : '✗'} One number
                </div>
                <div className={passwordRequirements.hasSpecial ? styles.valid : styles.invalid}>
                  {passwordRequirements.hasSpecial ? '✓' : '✗'} One special character
                </div>
              </div>
            )}

            {isCheckingPassword && (
              <div className={styles.checkingPassword}>Checking password security...</div>
            )}

            {passwordCompromised && passwordCompromised.compromised && (
              <div className={styles.passwordWarning}>
                ⚠️ This password has been found in {passwordCompromised.count?.toLocaleString()} data breaches.
                Please choose a different password.
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="confirmPassword" className={styles.label}>Confirm New Password *</label>
            <input
              id="confirmPassword"
              type={showPasswords ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={styles.input}
              placeholder="Confirm your new password"
              disabled={isPasswordLoading}
            />
          </div>
        </div>

        {passwordError && <div className={styles.error}>{passwordError}</div>}
        {passwordSuccess && <div className={styles.success}>{passwordSuccess}</div>}

        <div className={styles.actions}>
          <Button
            type="submit"
            variant="primary"
            disabled={isPasswordLoading || !isPasswordValid || (passwordCompromised?.compromised ?? false)}
          >
            {isPasswordLoading ? 'Changing Password...' : 'Change Password'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProfileSettings;
