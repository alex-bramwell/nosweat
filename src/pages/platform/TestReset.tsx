import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import styles from './PlatformAuth.module.scss';

const TestReset = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      setEmail(user.email ?? null);

      if (!user.email?.endsWith('@nosweattest.com')) {
        setStatus('error');
        setMessage('This page is only available for test accounts (@nosweattest.com).');
      }
    };
    checkAuth();
  }, [navigate]);

  const handleReset = async () => {
    setStatus('loading');
    setMessage('');

    try {
      const { error } = await supabase.rpc('reset_test_account');
      if (error) throw error;

      setStatus('success');
      setMessage('Test account reset. Redirecting to onboarding...');
      setTimeout(() => navigate('/onboarding'), 1500);
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Failed to reset. Check the console.');
      console.error('Reset error:', err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <h1 className={styles.authTitle}>Test Account</h1>
        <p className={styles.authSubtitle}>
          {email ? `Logged in as ${email}` : 'Checking auth...'}
        </p>

        {status === 'success' && <div className={styles.success}>{message}</div>}
        {status === 'error' && <div className={styles.error}>{message}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button
            onClick={handleReset}
            disabled={status === 'loading' || !email?.endsWith('@nosweattest.com')}
            className={styles.submitButton}
          >
            {status === 'loading' ? 'Resetting...' : 'Reset and Re-test Onboarding'}
          </button>

          <button
            onClick={() => navigate('/onboarding')}
            className={styles.submitButton}
            style={{ background: 'rgba(255,255,255,0.08)', boxShadow: 'none' }}
          >
            Go to Onboarding
          </button>

          <button
            onClick={handleLogout}
            className={styles.submitButton}
            style={{ background: 'rgba(255,255,255,0.08)', boxShadow: 'none' }}
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestReset;
