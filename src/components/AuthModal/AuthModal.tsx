import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useRegistrationIntent } from '../../contexts/RegistrationContext';
import { supabase } from '../../lib/supabase';
import { Modal, Button } from '../common';
import { checkPasswordCompromised, sanitizeInput, isValidEmail } from '../../utils/security';
import styles from './AuthModal.module.scss';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup' | 'reset' | 'changePassword';
  initialError?: string;
  embedded?: boolean;
  isCoachLogin?: boolean;
  onCoachLoginClick?: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login', initialError = '', embedded = false, isCoachLogin = false, onCoachLoginClick }) => {
  const { signup, resetPassword, loginWithOAuth, isAuthenticated, user } = useAuth();
  const { intent, updateStep } = useRegistrationIntent();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup' | 'reset' | 'changePassword'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState(initialError);
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [isCheckingPassword, setIsCheckingPassword] = useState(false);
  const [passwordCompromised, setPasswordCompromised] = useState<{ compromised: boolean; count?: number } | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showResetCompletion, setShowResetCompletion] = useState(false);
  const [changePasswordStep, setChangePasswordStep] = useState(1);
  const [isSessionReady, setIsSessionReady] = useState(false);

  // Password strength validation
  const validatePassword = (pwd: string) => {
    return {
      minLength: pwd.length >= 12,
      hasUppercase: /[A-Z]/.test(pwd),
      hasLowercase: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecial: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd),
    };
  };

  // Sync mode state with initialMode prop when it changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      // Reset form state when modal opens
      setError('');
      setSuccess('');
      setPassword('');
      setConfirmPassword('');
      setShowCompletion(false);
      setShowResetCompletion(false);
    }
    // Reset changePasswordStep to 1 when entering changePassword mode
    if (initialMode === 'changePassword') {
      setChangePasswordStep(1);
      setIsSessionReady(false);
    }
  }, [initialMode, isOpen]);

  // Check if user is authenticated from AuthContext for password recovery
  useEffect(() => {
    if (mode === 'changePassword') {
      console.log('Checking auth status for password recovery:', { isAuthenticated, hasUser: !!user });
      if (isAuthenticated && user) {
        console.log('User is authenticated - session ready');
        setIsSessionReady(true);
      } else {
        console.log('Waiting for authentication...');
      }
    }
  }, [mode, isAuthenticated, user]);

  // Sync error state with initialError prop when it changes
  useEffect(() => {
    if (initialError) {
      setError(initialError);
    }
  }, [initialError]);

  const passwordRequirements = (mode === 'signup' || mode === 'changePassword') ? validatePassword(password) : null;
  const isPasswordValid = passwordRequirements
    ? Object.values(passwordRequirements).every(Boolean)
    : true;

  // Password strength calculator
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

  const passwordStrength = (mode === 'signup' || mode === 'changePassword') ? calculatePasswordStrength(password) : null;

  // Check password against Have I Been Pwned database (debounced)
  useEffect(() => {
    if ((mode === 'signup' || mode === 'changePassword') && password && isPasswordValid) {
      const timer = setTimeout(async () => {
        setIsCheckingPassword(true);
        const result = await checkPasswordCompromised(password);
        setPasswordCompromised(result);
        setIsCheckingPassword(false);
      }, 1000); // Debounce for 1 second

      return () => clearTimeout(timer);
    } else {
      setPasswordCompromised(null);
    }
  }, [password, mode, isPasswordValid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Honeypot check - if filled, it's likely a bot
    // However, password managers often auto-fill this field with the email
    // So we check if it matches the email field (likely auto-fill) vs actual bot behavior
    if (honeypot && honeypot !== email) {
      // Silently fail to not alert the bot
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setError('An error occurred. Please try again.');
      }, 2000);
      return;
    }

    // Clear honeypot if it was auto-filled with email (password manager behavior)
    if (honeypot === email) {
      setHoneypot('');
    }

    // Rate limiting check
    if (isRateLimited) {
      setError('Too many attempts. Please wait before trying again.');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'reset') {
        // Password reset
        if (!email) {
          throw new Error('Please enter your email address');
        }
        await resetPassword(email);
        setShowResetCompletion(true);
      } else if (mode === 'changePassword') {
        // Change password (password recovery)
        if (changePasswordStep === 1) {
          // Step 1: Just move to step 2
          setChangePasswordStep(2);
          setIsLoading(false);
          return;
        }

        // Step 2: Update the password
        if (!password || !confirmPassword) {
          throw new Error('Please fill in all fields');
        }

        if (!isPasswordValid) {
          throw new Error('Password does not meet security requirements');
        }

        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }

        // Check if password has been compromised
        if (passwordCompromised?.compromised) {
          throw new Error(
            `This password has been found in ${passwordCompromised.count?.toLocaleString()} data breaches. Please choose a different password.`
          );
        }

        console.log('Attempting to update password...');

        // First verify we have a valid session
        const { data: sessionData } = await supabase.auth.getSession();
        console.log('Current session before update:', { 
          hasSession: !!sessionData.session,
          userId: sessionData.session?.user?.id,
          expiresAt: sessionData.session?.expires_at
        });

        if (!sessionData.session) {
          throw new Error('Your session has expired. Please request a new password reset link.');
        }

        // Try to update the password with a timeout
        const updatePromise = supabase.auth.updateUser({
          password: password,
        });

        // Add a 15 second timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Password update timed out. Please try again.')), 15000)
        );

        const { data, error: updateError } = await Promise.race([updatePromise, timeoutPromise]) as Awaited<typeof updatePromise>;

        console.log('Update result:', { error: updateError, hasUser: !!data?.user, user: data?.user });

        if (updateError) {
          console.error('Password update error:', updateError);
          // Provide better error message for rate limiting
          if (updateError.message.includes('429') || updateError.message.toLowerCase().includes('rate limit')) {
            throw new Error('Too many password update requests. Please wait a moment and try again.');
          }
          // Check for same password error
          if (updateError.message.toLowerCase().includes('same') || updateError.message.toLowerCase().includes('different')) {
            throw new Error('New password must be different from your current password.');
          }
          throw updateError;
        }

        // Check if the update actually returned a user (some edge cases may not)
        if (!data?.user) {
          console.warn('No user returned from updateUser - but no error either');
        }

        // Success - show completion message and redirect
        console.log('Password updated successfully!');
        setSuccess('Password updated successfully! Redirecting to sign in...');
        setIsLoading(false); // Reset loading state immediately
        
        // Sign out the user so they can log in fresh with new password
        await supabase.auth.signOut();
        
        setTimeout(() => {
          console.log('Redirecting to sign in...');
          onClose();
          setMode('login');
          setPassword('');
          setConfirmPassword('');
          setChangePasswordStep(1);
          navigate('/', { replace: true });
        }, 2000);
      } else if (mode === 'signup') {
        // Signup validation
        if (!email || !password || !name) {
          throw new Error('Please fill in all required fields');
        }

        // Sanitize inputs
        const sanitizedName = sanitizeInput(name);
        const sanitizedEmail = email.trim().toLowerCase();

        // Email validation
        if (!isValidEmail(sanitizedEmail)) {
          throw new Error('Please enter a valid email address');
        }

        // Strict password validation
        if (!isPasswordValid) {
          throw new Error('Password does not meet security requirements');
        }

        // Check if password has been compromised
        if (passwordCompromised?.compromised) {
          throw new Error(
            `This password has been found in ${passwordCompromised.count?.toLocaleString()} data breaches. Please choose a different password.`
          );
        }

        await signup(sanitizedEmail, password, sanitizedName);

        // Check if there's a registration intent
        if (intent && intent.type === 'trial' && !embedded) {
          // For trial flow, close this modal and let TrialModal handle next step
          updateStep('payment');
          onClose();
        } else {
          setShowCompletion(true);
        }
      } else {
        // Login validation
        if (!email || !password) {
          throw new Error('Please fill in all required fields');
        }
        
        // Use direct API call to avoid SDK hanging
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
          },
          body: JSON.stringify({
            email,
            password,
          }),
        });

        const result = await response.json();

        console.log('Login API response:', { status: response.status, result });

        if (!response.ok || result.error) {
          const errorMsg = result.error_description || result.error || 'Invalid email or password';
          console.error('Login failed:', errorMsg, result);
          throw new Error(errorMsg);
        }

        // Set session using the tokens we got
        if (result.access_token && result.refresh_token) {
          // Store in localStorage for Supabase to pick up
          const storageKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
          localStorage.setItem(storageKey, JSON.stringify({
            access_token: result.access_token,
            refresh_token: result.refresh_token,
            expires_at: result.expires_at,
            expires_in: result.expires_in,
            token_type: result.token_type,
            user: result.user,
          }));
          
          setEmail('');
          setPassword('');
          setFailedAttempts(0);

          // Check if there's a registration intent before closing/reloading
          if (intent) {
            if (intent.type === 'day-pass') {
              updateStep('class-selection');
              onClose();
              // Reload to pick up session, then redirect to schedule
              window.location.href = '/schedule';
              return;
            } else if (intent.type === 'trial' && !embedded) {
              updateStep('payment');
              onClose();
              window.location.reload();
              return;
            }
          }

          onClose();
          // Redirect to dashboard after login
          window.location.href = '/dashboard';
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);

      // Auto-switch to login mode if account already exists
      if (mode === 'signup' && errorMessage.includes('already exists')) {
        // Keep the email but switch to login mode after a short delay
        setTimeout(() => {
          setMode('login');
          setPassword('');
          setConfirmPassword('');
          setName('');
          // Keep the email so user doesn't have to retype it
        }, 3000);
      }

      // Rate limiting logic for failed login attempts
      if (mode === 'login') {
        const newFailedAttempts = failedAttempts + 1;
        setFailedAttempts(newFailedAttempts);

        if (newFailedAttempts >= 5) {
          setIsRateLimited(true);
          setError('Too many failed attempts. Please wait 5 minutes before trying again.');
          setTimeout(() => {
            setIsRateLimited(false);
            setFailedAttempts(0);
          }, 300000); // 5 minutes
        } else if (newFailedAttempts >= 3) {
          setError(`${err instanceof Error ? err.message : 'An error occurred'}. ${5 - newFailedAttempts} attempts remaining.`);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (newMode: 'login' | 'signup' | 'reset') => {
    setMode(newMode);
    setError('');
    setSuccess('');
  };

  const handleOAuthLogin = async (provider: 'google' | 'facebook') => {
    setError('');
    setIsLoading(true);
    try {
      await loginWithOAuth(provider);
      // OAuth will redirect, so modal stays open during redirect
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OAuth login failed');
      setIsLoading(false);
    }
  };

  // Show change password modal (2-step flow for password recovery)
  if (mode === 'changePassword') {
    const changePasswordContent = (
      <div className={styles.content}>
        <h2 className={styles.title}>
          {changePasswordStep === 1 ? 'Reset Your Password' : 'Create New Password'}
        </h2>

        {/* Step indicators - always visible */}
        <div className={styles.completionSteps}>
          <div className={styles.completionStep}>
            <div className={styles.stepText}>
              <h4>
                <span className={`${styles.stepNumber} ${styles.completed}`}>
                  ✓
                </span>
                Check your email
              </h4>
              <p>Look for a password reset email from CrossFit Comet</p>
            </div>
          </div>
          <div className={styles.completionStep}>
            <div className={styles.stepText}>
              <h4>
                <span className={`${styles.stepNumber} ${styles.completed}`}>
                  ✓
                </span>
                Click the reset link
              </h4>
              <p>Follow the secure link to create a new password</p>
            </div>
          </div>
          <div className={styles.completionStep}>
            <div className={styles.stepText}>
              <h4>
                <span className={changePasswordStep === 1 ? styles.stepNumber : `${styles.stepNumber} ${styles.completed}`}>
                  {changePasswordStep === 1 ? '3' : '✓'}
                </span>
                Verify your identity
              </h4>
              <p>Confirm your email has been verified</p>
            </div>
          </div>
          <div className={styles.completionStep}>
            <div className={styles.stepText}>
              <h4>
                <span className={changePasswordStep === 2 ? styles.stepNumber : `${styles.stepNumber} ${styles.inactive}`}>
                  4
                </span>
                Create new password
              </h4>
              <p>Set a strong, secure password for your account</p>
            </div>
          </div>
        </div>

        {changePasswordStep === 1 ? (
          // Step 1: Confirmation content
          <div className={styles.completionContainer}>
            <div className={styles.completionIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <p className={styles.completionMessage}>
              You've successfully verified your email. Let's create a new secure password for your account.
            </p>
            <Button
              variant="primary"
              size="large"
              fullWidth
              onClick={() => setChangePasswordStep(2)}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Continue'}
            </Button>
          </div>
        ) : (
          // Step 2: Password form
          <form onSubmit={handleSubmit} className={styles.form}>
              {error && <div className={styles.error}>{error}</div>}
              {success && <div className={styles.success}>{success}</div>}

              <div className={styles.field}>
              <label htmlFor="new-password" className={styles.label}>New Password</label>
              <div className={styles.passwordInputWrapper}>
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your new password"
                  disabled={isLoading}
                  autoComplete="new-password"
                  className={styles.input}
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
                  <span style={{ color: passwordStrength.color }}>
                    {passwordStrength.label}
                  </span>
                </div>
              )}

              {passwordRequirements && (
                <div className={styles.passwordRequirements}>
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
                <div className={styles.passwordWarning}>
                  ⚠️ This password has been found in {passwordCompromised.count?.toLocaleString()} data breaches.
                  Please choose a different password.
                </div>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="confirm-password" className={styles.label}>Confirm Password</label>
              <div className={styles.passwordInputWrapper}>
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  disabled={isLoading}
                  autoComplete="new-password"
                  className={styles.input}
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
              {showConfirmPassword && (
                <div className={styles.securityWarning}>
                  <svg className={styles.warningIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <span>Password is visible</span>
                </div>
              )}
            </div>

            {!isSessionReady && (
              <div className={styles.info}>
                Initializing secure session...
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="large"
              fullWidth
              disabled={!isSessionReady || isLoading || !isPasswordValid || isCheckingPassword || (passwordCompromised?.compromised ?? false)}
            >
              {!isSessionReady ? 'Initializing...' : isLoading ? 'Updating...' : isCheckingPassword ? 'Checking password...' : 'Update Password'}
            </Button>
          </form>
        )}
      </div>
    );

    if (embedded) {
      return changePasswordContent;
    }

    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        {changePasswordContent}
      </Modal>
    );
  }

  // Show completion screen after password reset request
  if (showResetCompletion) {
    const resetCompletionContent = (
      <div className={styles.content}>
        <div className={styles.completionContainer}>
          <div className={styles.completionIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
          </div>
          <h2 className={styles.completionTitle}>Reset Email Sent!</h2>
          <p className={styles.completionMessage}>
            We've sent password reset instructions to <strong>{email}</strong>
          </p>
          <div className={styles.completionSteps}>
            <div className={styles.completionStep}>
              <div className={styles.stepText}>
                <h4><span className={styles.stepNumber}>1</span> Check your email</h4>
                <p>Look for a password reset email from CrossFit Comet</p>
              </div>
            </div>
            <div className={styles.completionStep}>
              <div className={styles.stepText}>
                <h4><span className={styles.stepNumber}>2</span> Click the reset link</h4>
                <p>Follow the secure link to create a new password</p>
              </div>
            </div>
            <div className={styles.completionStep}>
              <div className={styles.stepText}>
                <h4><span className={styles.stepNumber}>3</span> Create a new password</h4>
                <p>Set a strong, secure password for your account</p>
              </div>
            </div>
            <div className={styles.completionStep}>
              <div className={styles.stepText}>
                <h4><span className={styles.stepNumber}>4</span> Sign in with new password</h4>
                <p>Return here and log in with your new credentials</p>
              </div>
            </div>
          </div>
          <div className={styles.completionNote}>
            <span className={styles.iconWrapper}>
              <svg className={styles.infoIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </span>
            <p>Didn't receive the email? Check your spam folder or wait a few minutes and try again.</p>
          </div>
          <Button
            variant="primary"
            size="large"
            fullWidth
            onClick={() => {
              setShowResetCompletion(false);
              setEmail('');
              setMode('login');
              onClose();
            }}
          >
            Got It
          </Button>
        </div>
      </div>
    );

    if (embedded) {
      return resetCompletionContent;
    }

    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        {resetCompletionContent}
      </Modal>
    );
  }

  // Show completion screen after signup
  if (showCompletion) {
    const completionContent = (
      <div className={styles.content}>
        <div className={styles.completionContainer}>
          <div className={styles.completionIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h2 className={styles.completionTitle}>Account Created Successfully!</h2>
          <p className={styles.completionMessage}>
            We've sent a verification email to <strong>{email}</strong>
          </p>
          <div className={styles.completionSteps}>
            <div className={styles.completionStep}>
              <div className={styles.stepText}>
                <h4><span className={styles.stepNumber}>1</span> Check your email</h4>
                <p>Look for an email from CrossFit Comet</p>
              </div>
            </div>
            <div className={styles.completionStep}>
              <div className={styles.stepText}>
                <h4><span className={styles.stepNumber}>2</span> Verify your account</h4>
                <p>Click the verification link in the email</p>
              </div>
            </div>
            <div className={styles.completionStep}>
              <div className={styles.stepText}>
                <h4><span className={styles.stepNumber}>3</span> Sign in and start training</h4>
                <p>Access your dashboard and begin your journey</p>
              </div>
            </div>
          </div>
          <div className={styles.completionNote}>
            <span className={styles.iconWrapper}>
              <svg className={styles.infoIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </span>
            <p>Didn't receive the email? Check your spam folder or contact us for help.</p>
          </div>
          <Button
            variant="primary"
            size="large"
            fullWidth
            onClick={() => {
              setShowCompletion(false);
              setEmail('');
              setPassword('');
              setName('');
              setMode('login');
              onClose();
            }}
          >
            Got It
          </Button>
        </div>
      </div>
    );

    if (embedded) {
      return completionContent;
    }

    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        {completionContent}
      </Modal>
    );
  }

  const content = (
    <div className={styles.content}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {mode === 'login' && 'Welcome Back'}
            {mode === 'signup' && 'Create Account'}
            {mode === 'reset' && 'Reset Password'}
          </h2>
          <p className={styles.subtitle}>
            {mode === 'login' && 'Sign in to access your member dashboard'}
            {mode === 'signup' && 'Join CrossFit Comet and start your fitness journey'}
            {mode === 'reset' && 'Enter your email to receive a password reset link'}
          </p>
        </div>

        {isCoachLogin && (
          <div className={styles.coachBanner}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>Coach Login</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Honeypot field - hidden from users, visible to bots */}
          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            className={styles.honeypot}
            tabIndex={-1}
            autoComplete="new-password"
            aria-hidden="true"
            style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }}
          />

          {mode === 'signup' && (
            <div className={styles.field}>
              <label htmlFor="name" className={styles.label}>Full Name</label>
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
          )}

          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              placeholder="Enter your email"
              disabled={isLoading}
              required
            />
          </div>

          {mode !== 'reset' && (
            <div className={styles.field}>
              <label htmlFor="password" className={styles.label}>Password</label>
              <div className={styles.passwordInputWrapper}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.input}
                  placeholder="Enter your password"
                  disabled={isLoading}
                  required
                  minLength={mode === 'signup' ? 12 : 6}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.passwordToggle}
                  disabled={isLoading}
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
              {mode === 'signup' && password && passwordStrength && (
                <div className={styles.passwordStrength}>
                  <div className={styles.strengthBar}>
                    <div
                      className={styles.strengthFill}
                      style={{ width: `${passwordStrength.strength}%`, backgroundColor: passwordStrength.color }}
                    />
                  </div>
                  <span className={styles.strengthLabel} style={{ color: passwordStrength.color }}>
                    {isCheckingPassword ? 'Checking...' : passwordStrength.label}
                  </span>
                </div>
              )}
              {mode === 'signup' && passwordCompromised?.compromised && (
                <div className={styles.compromisedWarning}>
                  <svg className={styles.warningIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <div>
                    <div className={styles.compromisedTitle}>Password Compromised</div>
                    <div className={styles.compromisedText}>
                      This password appeared in {passwordCompromised.count?.toLocaleString()} data breaches. Please choose a different password.
                    </div>
                  </div>
                </div>
              )}
              {mode === 'signup' && password && (
                <div className={styles.passwordRequirements}>
                  <div className={styles.requirementsList}>
                    <div className={`${styles.requirement} ${passwordRequirements?.minLength ? styles.met : ''}`}>
                      <span className={styles.checkmark}>{passwordRequirements?.minLength ? '✓' : '✗'}</span>
                      <span>At least 12 characters</span>
                    </div>
                    <div className={`${styles.requirement} ${passwordRequirements?.hasUppercase ? styles.met : ''}`}>
                      <span className={styles.checkmark}>{passwordRequirements?.hasUppercase ? '✓' : '✗'}</span>
                      <span>One uppercase letter</span>
                    </div>
                    <div className={`${styles.requirement} ${passwordRequirements?.hasLowercase ? styles.met : ''}`}>
                      <span className={styles.checkmark}>{passwordRequirements?.hasLowercase ? '✓' : '✗'}</span>
                      <span>One lowercase letter</span>
                    </div>
                    <div className={`${styles.requirement} ${passwordRequirements?.hasNumber ? styles.met : ''}`}>
                      <span className={styles.checkmark}>{passwordRequirements?.hasNumber ? '✓' : '✗'}</span>
                      <span>One number</span>
                    </div>
                    <div className={`${styles.requirement} ${passwordRequirements?.hasSpecial ? styles.met : ''}`}>
                      <span className={styles.checkmark}>{passwordRequirements?.hasSpecial ? '✓' : '✗'}</span>
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
            </div>
          )}

          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}

          <Button
            type="submit"
            variant="primary"
            size="large"
            fullWidth
            disabled={isLoading}
          >
            {isLoading && 'Loading...'}
            {!isLoading && mode === 'login' && 'Sign In'}
            {!isLoading && mode === 'signup' && 'Create Account'}
            {!isLoading && mode === 'reset' && 'Send Reset Link'}
          </Button>

          {mode === 'login' && (
            <div className={styles.loginFooter}>
              <button
                type="button"
                onClick={() => switchMode('reset')}
                className={styles.linkButton}
                disabled={isLoading}
              >
                Forgot password?
              </button>
              <div className={styles.signupPrompt}>
                <p className={styles.switchText}>New to CrossFit Comet?</p>
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className={styles.signupButton}
                  disabled={isLoading}
                >
                  Create an Account
                </button>
              </div>
            </div>
          )}
        </form>

        {mode !== 'reset' && (
          <div className={styles.divider}>
            <span className={styles.dividerText}>Or continue with</span>
          </div>
        )}

        {mode !== 'reset' && (
          <div className={styles.oauthButtons}>
            <button
              type="button"
              onClick={() => handleOAuthLogin('google')}
              className={styles.oauthButton}
              disabled={isLoading}
            >
              <svg className={styles.oauthIcon} viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
          </div>
        )}

        <div className={styles.footer}>
          {mode === 'login' && !isCoachLogin && onCoachLoginClick && (
            <button
              type="button"
              onClick={onCoachLoginClick}
              className={styles.coachLoginLink}
              disabled={isLoading}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Coach Login
            </button>
          )}
          {mode === 'signup' && (
            <p className={styles.switchText}>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={styles.switchButton}
                disabled={isLoading}
              >
                Sign In
              </button>
            </p>
          )}
          {mode === 'reset' && (
            <p className={styles.switchText}>
              Remember your password?{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={styles.switchButton}
                disabled={isLoading}
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {content}
    </Modal>
  );
};

export default AuthModal;
