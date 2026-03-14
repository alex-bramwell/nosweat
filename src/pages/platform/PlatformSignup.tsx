import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button, CloseButton, modalStyles as m } from '../../components/common';
import styles from './PlatformAuth.module.scss';

const PlatformSignup = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'admin',
          },
        },
      });

      if (signupError) throw signupError;

      if (!data.user) {
        throw new Error('Signup failed');
      }

      navigate('/onboarding');
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <CloseButton href="/" aria-label="Back to home" />
        <div className={m.modalBody}>
          <div className={m.modalHeader}>
            <h1 className={m.modalTitle}>Create your account</h1>
            <p className={m.modalSubtitle}>Start your 14-day free trial.</p>
          </div>

          <form onSubmit={handleSubmit} className={m.modalForm}>
            {error && <div className={m.modalError}>{error}</div>}

            <div className={m.modalFieldGroup}>
              <label htmlFor="email" className={m.modalFieldLabel}>
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={m.modalInput}
                placeholder="you@example.com"
              />
            </div>

            <div className={m.modalFieldGroup}>
              <label htmlFor="password" className={m.modalFieldLabel}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className={m.modalInput}
                placeholder="Enter your password"
              />
            </div>

            <Button type="submit" disabled={loading} fullWidth>
              {loading ? 'Creating account...' : 'Start Free Trial'}
            </Button>
          </form>

          <div className={styles.authFooterNav}>
            Already have an account?{' '}
            <Link to="/login" className={styles.authInlineLink}>
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformSignup;
