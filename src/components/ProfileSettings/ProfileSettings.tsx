import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Card } from '../common';
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  // Password strength calculator (matching AuthModal)
  const calculatePasswordStrength = (pwd: string): { strength: number; label: string; color: string } => {
    if (!pwd) return { strength: 0, label: '', color: '' };

    let strength = 0;
    if (pwd.length >= 8) strength += 20;
    if (pwd.length >= 12) strength += 20;
    if (pwd.length >= 16) strength += 10;
    if (/[a-z]/.test(pwd)) strength += 10;
    if (/[A-Z]/.test(pwd)) strength += 10;
    if (/[0-9]/.test(pwd)) strength += 10;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd)) strength += 15;
    if (pwd.length >= 20) strength += 5;

    if (strength < 40) return { strength, label: 'Weak', color: '#ff4444' };
    if (strength < 70) return { strength, label: 'Medium', color: '#ffaa00' };
    return { strength, label: 'Strong', color: '#22c55e' };
  };

  const passwordRequirements = validatePassword(newPassword);
  const passwordStrength = newPassword ? calculatePasswordStrength(newPassword) : null;
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

  const getMembershipTypeName = (type: string) => {
    const names: Record<string, string> = {
      'trial': 'Free Trial',
      'crossfit': 'CrossFit',
      'comet-plus': 'Comet Plus',
      'open-gym': 'Open Gym',
      'specialty': 'Specialty Program'
    };
    if (!type) return 'Unknown';
    return names[type] || type;
  };

  if (!user) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Profile Settings</h2>
        <p className={styles.subtitle}>Manage your membership, personal information and security</p>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Membership Overview</h3>

        <div className={styles.membershipActions}>
          <h4 className={styles.actionsTitle}>Membership Actions</h4>
          <div className={styles.actionButtons}>
            <Button variant="primary">Upgrade Membership</Button>
            <Button variant="secondary">Update Payment Method</Button>
            <Button variant="secondary">Freeze Membership</Button>
          </div>
        </div>

        <div className={styles.membershipGrid}>
          <Card variant="elevated">
            <div className={styles.infoCard}>
              <div className={styles.infoLabel}>Membership Type</div>
              <div className={styles.infoValue}>{getMembershipTypeName(user.membershipType)}</div>
            </div>
          </Card>

          <Card variant="elevated">
            <div className={styles.infoCard}>
              <div className={styles.infoLabel}>Member Since</div>
              <div className={styles.infoValue}>
                {new Date(user.joinDate).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
            </div>
          </Card>

          <Card variant="elevated">
            <div className={styles.infoCard}>
              <div className={styles.infoLabel}>Email</div>
              <div className={styles.infoValue}>{user.email}</div>
            </div>
          </Card>

          <Card variant="elevated">
            <div className={styles.infoCard}>
              <div className={styles.infoLabel}>Status</div>
              <div className={styles.infoValueActive}>Active</div>
            </div>
          </Card>
        </div>
      </div>

      {/* Divider removed above personal info section */}

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
              {(user.membershipType ? user.membershipType.replace('-', ' ').toUpperCase() : 'Unknown')}
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
            <div className={styles.passwordInputWrapper}>
              <input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={styles.input}
                placeholder="Enter your new password"
                disabled={isPasswordLoading}
                autoComplete="new-password"
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
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

            {showPassword && (
              <div className={styles.securityWarning}>
                <svg className={styles.warningIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span>Password is visible</span>
              </div>
            )}

            {passwordStrength && (
              <div className={styles.passwordStrength}>
                <div className={styles.strengthBar}>
                  <div
                    className={styles.strengthFill}
                    style={{
                      width: `${passwordStrength.strength}%`,
                      backgroundColor: passwordStrength.color,
                    }}
                  />
                </div>
                <span className={styles.strengthLabel} style={{ color: passwordStrength.color }}>
                  {passwordStrength.label}
                </span>
              </div>
            )}

            {newPassword && (
              <div className={styles.passwordRequirementsBox}>
                <div className={styles.requirementsList}>
                  <div className={`${styles.requirement} ${passwordRequirements.minLength ? styles.met : ''}`}>
                    <span className={styles.checkmark}>{passwordRequirements.minLength ? '✓' : '✗'}</span>
                    <span>At least 12 characters</span>
                  </div>
                  <div className={`${styles.requirement} ${passwordRequirements.hasUppercase ? styles.met : ''}`}>
                    <span className={styles.checkmark}>{passwordRequirements.hasUppercase ? '✓' : '✗'}</span>
                    <span>One uppercase letter</span>
                  </div>
                  <div className={`${styles.requirement} ${passwordRequirements.hasLowercase ? styles.met : ''}`}>
                    <span className={styles.checkmark}>{passwordRequirements.hasLowercase ? '✓' : '✗'}</span>
                    <span>One lowercase letter</span>
                  </div>
                  <div className={`${styles.requirement} ${passwordRequirements.hasNumber ? styles.met : ''}`}>
                    <span className={styles.checkmark}>{passwordRequirements.hasNumber ? '✓' : '✗'}</span>
                    <span>One number</span>
                  </div>
                  <div className={`${styles.requirement} ${passwordRequirements.hasSpecial ? styles.met : ''}`}>
                    <span className={styles.checkmark}>{passwordRequirements.hasSpecial ? '✓' : '✗'}</span>
                    <span>One special character</span>
                  </div>
                </div>
                <div className={styles.passwordTip}>
                  <svg className={styles.tipIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18h6" />
                    <path d="M10 22h4" />
                    <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
                  </svg>
                  <span>Tip: Use your browser's password manager to generate a strong password for easier sign in</span>
                </div>
              </div>
            )}

            {isCheckingPassword && (
              <div className={styles.checkingPassword}>Checking password security...</div>
            )}

            {passwordCompromised && passwordCompromised.compromised && (
              <div className={styles.compromisedWarning}>
                <svg className={styles.warningIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <div>
                  <div className={styles.compromisedTitle}>Password Found in Data Breach</div>
                  <div className={styles.compromisedText}>
                    This password has been found in {passwordCompromised.count?.toLocaleString()} data breaches.
                    Please choose a different password.
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="confirmPassword" className={styles.label}>Confirm New Password *</label>
            <div className={styles.passwordInputWrapper}>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={styles.input}
                placeholder="Confirm your new password"
                disabled={isPasswordLoading}
                autoComplete="new-password"
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? (
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
            {confirmPassword && newPassword !== confirmPassword && (
              <div className={styles.mismatchWarning}>Passwords do not match</div>
            )}
            {confirmPassword && newPassword === confirmPassword && newPassword && (
              <div className={styles.matchSuccess}>Passwords match</div>
            )}
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
