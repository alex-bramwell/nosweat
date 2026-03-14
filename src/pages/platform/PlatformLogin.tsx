import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button, CloseButton, modalStyles as m } from '../../components/common';
import styles from './PlatformAuth.module.scss';

const PlatformLogin = () => {
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
      // Sign in with email and password
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Login failed');
      }

      // Check if user owns a gym
      const { data: gyms, error: gymsError } = await supabase
        .from('gyms')
        .select('slug')
        .eq('owner_id', authData.user.id)
        .single();

      if (gymsError && gymsError.code !== 'PGRST116') {
        // PGRST116 is "no rows returned", which is fine
        console.error('Error checking gym ownership:', gymsError);
      }

      if (gyms && gyms.slug) {
        // User owns a gym, redirect to their platform dashboard
        navigate('/dashboard');
      } else {
        // User doesn't own a gym, redirect to onboarding
        navigate('/onboarding');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to log in. Please check your credentials.');
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
            <h1 className={m.modalTitle}>Log in to your account</h1>
            <p className={m.modalSubtitle}>Welcome back! Manage your gym.</p>
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
                className={m.modalInput}
                placeholder="Enter your password"
              />
            </div>

            <Button type="submit" disabled={loading} fullWidth>
              {loading ? 'Logging in...' : 'Log in'}
            </Button>
          </form>

          <div className={styles.authFooterNav}>
            Don't have an account?{' '}
            <Link to="/signup" className={styles.authInlineLink}>
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformLogin;
