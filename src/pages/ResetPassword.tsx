import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Section, Container, Button } from '../components/common';
import styles from './ResetPassword.module.scss';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password validation
  const validatePassword = (pwd: string) => {
    return {
      minLength: pwd.length >= 12,
      hasUppercase: /[A-Z]/.test(pwd),
      hasLowercase: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
    };
  };

  const passwordRequirements = validatePassword(password);
  const isPasswordValid = Object.values(passwordRequirements).every(Boolean);

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
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) strength += 15;
    if (pwd.length >= 20) strength += 5;

    if (strength < 40) return { strength, label: 'Weak', color: '#ff4444' };
    if (strength < 70) return { strength, label: 'Medium', color: '#ffaa00' };
    return { strength, label: 'Strong', color: '#22c55e' };
  };

  const passwordStrength = calculatePasswordStrength(password);
  const [isSessionReady, setIsSessionReady] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      console.log('ResetPassword: Starting token verification...');
      
      // Check for token in QUERY PARAMS first (new format from custom email template)
      const urlParams = new URLSearchParams(window.location.search);
      const tokenHash = urlParams.get('token_hash');
      const type = urlParams.get('type');
      
      // Also check hash params (old format from {{ .ConfirmationURL }})
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const hashType = hashParams.get('type');
      const errorParam = hashParams.get('error') || urlParams.get('error');
      const errorDescription = hashParams.get('error_description') || urlParams.get('error_description');

      console.log('ResetPassword: URL params', { 
        tokenHash: !!tokenHash, 
        type, 
        accessToken: !!accessToken,
        hashType,
        error: errorParam
      });

      // Check for error in URL
      if (errorParam) {
        console.error('ResetPassword: Error in URL', { errorParam, errorDescription });
        setError(errorDescription || 'Your password reset link has expired or is invalid. Please request a new one.');
        return;
      }

      // Method 1: Use token_hash from query params (new recommended way)
      if (tokenHash && type === 'recovery') {
        console.log('ResetPassword: Using token_hash from query params...');
        try {
          // Add timeout to prevent hanging
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timed out')), 10000);
          });

          const verifyPromise = supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery',
          });

          const { data, error: verifyError } = await Promise.race([verifyPromise, timeoutPromise]) as Awaited<typeof verifyPromise>;

          console.log('ResetPassword: verifyOtp result', { 
            hasSession: !!data.session, 
            hasUser: !!data.user,
            error: verifyError?.message 
          });

          if (verifyError) {
            setError('Your password reset link has expired or is invalid. Please request a new one.');
            return;
          }

          if (data.session) {
            console.log('ResetPassword: Session established via verifyOtp!');
            setIsSessionReady(true);
            // Clean up URL
            window.history.replaceState(null, '', window.location.pathname);
            return;
          }
        } catch (err) {
          console.error('ResetPassword: verifyOtp exception', err);
          setError('Unable to verify your reset link. Please request a new password reset.');
          return;
        }
      }

      // Method 2: Check for hash params (old format) - manually set session
      if (accessToken || hashType === 'recovery') {
        console.log('ResetPassword: Hash params found, attempting manual session setup...');
        
        const refreshToken = hashParams.get('refresh_token');
        
        if (!accessToken || !refreshToken) {
          console.error('ResetPassword: Missing tokens in hash', { 
            hasAccess: !!accessToken, 
            hasRefresh: !!refreshToken 
          });
          setError('Invalid reset link. Please request a new password reset.');
          return;
        }

        // Set up timeout FIRST before any async operations
        const timeoutId = setTimeout(() => {
          console.log('ResetPassword: Timeout reached');
          setError('Unable to verify your reset link. It may have expired. Please request a new one.');
        }, 10000);

        try {
          // Try to set session manually with the tokens from the URL
          console.log('ResetPassword: Calling setSession...');
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          clearTimeout(timeoutId);

          console.log('ResetPassword: setSession result', {
            hasSession: !!data.session,
            hasUser: !!data.user,
            error: sessionError?.message
          });

          if (sessionError) {
            console.error('ResetPassword: setSession error', sessionError);
            setError('Your password reset link has expired or is invalid. Please request a new one.');
            return;
          }

          if (data.session) {
            console.log('ResetPassword: Session established via setSession!');
            setIsSessionReady(true);
            window.history.replaceState(null, '', window.location.pathname);
            return;
          }

          // No session and no error - unexpected state
          setError('Unable to verify your reset link. Please request a new one.');
        } catch (err) {
          clearTimeout(timeoutId);
          console.error('ResetPassword: setSession exception', err);
          setError('An error occurred. Please try requesting a new password reset link.');
        }
        
        return;
      }

      // No valid token found
      console.log('ResetPassword: No valid token found in URL');
      setError('Please use the password reset link from your email to access this page.');
    };

    verifyToken();
  }, []);

  useEffect(() => {
    // Also listen for hash changes (in case of redirect)
    const handleHashChange = () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      if (hashParams.get('type') === 'recovery' && hashParams.get('access_token')) {
        // Re-run the check
        window.location.reload();
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (!isPasswordValid) {
      setError('Password does not meet security requirements');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/?signin=true');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  // Show helpful error page if accessed without valid reset token
  const urlParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const hasValidToken = 
    (urlParams.get('token_hash') && urlParams.get('type') === 'recovery') || 
    (hashParams.get('type') === 'recovery' && hashParams.get('access_token'));

  // Show loading state while waiting for session
  if ((hasValidToken || !error) && !isSessionReady && !error) {
    return (
      <Section spacing="large" background="default">
        <Container>
          <div className={styles.container}>
            <div className={styles.content}>
              <div className={styles.header}>
                <h1 className={styles.title}>Reset Your Password</h1>
                <p className={styles.subtitle}>
                  Verifying your reset link...
                </p>
              </div>
              <div className={styles.loadingSpinner}>
                <div className={styles.spinner}></div>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    );
  }

  if (!isSessionReady && error) {
    return (
      <Section spacing="large" background="default">
        <Container>
          <div className={styles.container}>
            <div className={styles.content}>
              <div className={styles.header}>
                <h1 className={styles.title}>Password Reset Required</h1>
                <p className={styles.subtitle}>
                  To reset your password, you need to use the reset link sent to your email
                </p>
              </div>

              <div className={styles.errorBox}>
                <svg className={styles.errorIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p>{error}</p>
              </div>

              <div className={styles.helpSection}>
                <h3>How to reset your password:</h3>
                <ol className={styles.stepsList}>
                  <li>Go to the sign-in page and click "Forgot password?"</li>
                  <li>Enter your email address</li>
                  <li>Check your email for the password reset link</li>
                  <li>Click the link in the email to return here</li>
                </ol>
              </div>

              <Button
                variant="primary"
                size="large"
                fullWidth
                onClick={() => navigate('/?signin=true')}
              >
                Go to Sign In
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    );
  }

  if (success) {
    return (
      <Section spacing="large" background="default">
        <Container>
          <div className={styles.container}>
            <div className={styles.content}>
              <div className={styles.successIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h1 className={styles.title}>Password Reset Successful!</h1>
              <p className={styles.message}>
                Your password has been successfully updated. You can now sign in with your new password.
              </p>
              <p className={styles.redirectMessage}>Redirecting you to sign in...</p>
            </div>
          </div>
        </Container>
      </Section>
    );
  }

  return (
    <Section spacing="large" background="default">
      <Container>
        <div className={styles.container}>
          <div className={styles.content}>
            <div className={styles.header}>
              <h1 className={styles.title}>Reset Your Password</h1>
              <p className={styles.subtitle}>
                Create a new secure password for your account
              </p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="password" className={styles.label}>New Password</label>
                <div className={styles.passwordInputWrapper}>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={styles.input}
                    placeholder="Enter your new password"
                    disabled={isLoading}
                    required
                    minLength={12}
                    autoComplete="new-password"
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
                {password && passwordStrength && (
                  <div className={styles.passwordStrength}>
                    <div className={styles.strengthBar}>
                      <div
                        className={styles.strengthFill}
                        style={{ width: `${passwordStrength.strength}%`, backgroundColor: passwordStrength.color }}
                      />
                    </div>
                    <span className={styles.strengthLabel} style={{ color: passwordStrength.color }}>
                      {passwordStrength.label}
                    </span>
                  </div>
                )}
                {password && (
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
              </div>

              <div className={styles.field}>
                <label htmlFor="confirmPassword" className={styles.label}>Confirm New Password</label>
                <div className={styles.passwordInputWrapper}>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={styles.input}
                    placeholder="Confirm your new password"
                    disabled={isLoading}
                    required
                    minLength={12}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={styles.passwordToggle}
                    disabled={isLoading}
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

              {error && <div className={styles.error}>{error}</div>}

              <Button
                type="submit"
                variant="primary"
                size="large"
                fullWidth
                disabled={isLoading || !isPasswordValid || password !== confirmPassword}
              >
                {isLoading ? 'Resetting Password...' : 'Reset Password'}
              </Button>
            </form>

            <div className={styles.footer}>
              <p className={styles.backToLogin}>
                Remember your password?{' '}
                <button
                  onClick={() => navigate('/?signin=true')}
                  className={styles.link}
                  disabled={isLoading}
                >
                  Sign In
                </button>
              </p>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
};

export default ResetPassword;
