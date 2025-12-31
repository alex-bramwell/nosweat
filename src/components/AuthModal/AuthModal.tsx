import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Modal, Button } from '../common';
import { checkPasswordCompromised, sanitizeInput, isValidEmail } from '../../utils/security';
import styles from './AuthModal.module.scss';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup' | 'reset';
  embedded?: boolean;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login', embedded = false }) => {
  const { login, signup, resetPassword, loginWithOAuth } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [isCheckingPassword, setIsCheckingPassword] = useState(false);
  const [passwordCompromised, setPasswordCompromised] = useState<{ compromised: boolean; count?: number } | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);

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

  const passwordRequirements = mode === 'signup' ? validatePassword(password) : null;
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
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) strength += 15;
    if (pwd.length >= 20) strength += 5;

    if (strength < 40) return { strength, label: 'Weak', color: '#ff4444' };
    if (strength < 70) return { strength, label: 'Medium', color: '#ffaa00' };
    return { strength, label: 'Strong', color: '#22c55e' };
  };

  const passwordStrength = mode === 'signup' ? calculatePasswordStrength(password) : null;

  // Check password against Have I Been Pwned database (debounced)
  useEffect(() => {
    if (mode === 'signup' && password && isPasswordValid) {
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
    if (honeypot) {
      // Silently fail to not alert the bot
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setError('An error occurred. Please try again.');
      }, 2000);
      return;
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
        setSuccess('Password reset email sent! Check your inbox.');
        setTimeout(() => {
          setMode('login');
          setSuccess('');
          setEmail('');
        }, 3000);
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
        setShowCompletion(true);
      } else {
        // Login validation
        if (!email || !password) {
          throw new Error('Please fill in all required fields');
        }
        await login(email, password);
        setEmail('');
        setPassword('');
        setFailedAttempts(0); // Reset on success
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');

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
              <div className={styles.stepCircle}>1</div>
              <div className={styles.stepText}>
                <h4>Check your email</h4>
                <p>Look for an email from CrossFit Comet</p>
              </div>
            </div>
            <div className={styles.completionStep}>
              <div className={styles.stepCircle}>2</div>
              <div className={styles.stepText}>
                <h4>Verify your account</h4>
                <p>Click the verification link in the email</p>
              </div>
            </div>
            <div className={styles.completionStep}>
              <div className={styles.stepCircle}>3</div>
              <div className={styles.stepText}>
                <h4>Sign in and start training</h4>
                <p>Access your dashboard and begin your journey</p>
              </div>
            </div>
          </div>
          <div className={styles.completionNote}>
            <svg className={styles.infoIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
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

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Honeypot field - hidden from users, visible to bots */}
          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            className={styles.honeypot}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
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
              <p className={styles.switchText}>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className={styles.switchButton}
                  disabled={isLoading}
                >
                  Sign Up
                </button>
              </p>
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
          {mode === 'login' && (
            <></>
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
