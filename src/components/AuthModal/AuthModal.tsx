import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Modal, Button } from '../common';
import styles from './AuthModal.module.scss';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup' | 'reset';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const { login, signup, resetPassword } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
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
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          throw new Error('Please enter a valid email address');
        }

        await signup(email, password, name);
        setSuccess('Account created successfully!');
        setTimeout(() => {
          setEmail('');
          setPassword('');
          setName('');
          onClose();
        }, 1500);
      } else {
        // Login validation
        if (!email || !password) {
          throw new Error('Please fill in all required fields');
        }
        await login(email, password);
        setEmail('');
        setPassword('');
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (newMode: 'login' | 'signup' | 'reset') => {
    setMode(newMode);
    setError('');
    setSuccess('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
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
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                placeholder="Enter your password"
                disabled={isLoading}
                required
                minLength={6}
              />
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
        </form>

        <div className={styles.footer}>
          {mode === 'login' && (
            <>
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
            </>
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
    </Modal>
  );
};

export default AuthModal;
