import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import styles from './PlatformAuth.module.scss';

const TestReset = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'checking' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [gymInfo, setGymInfo] = useState<{ name: string; slug: string } | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (text: string) => {
    setLogs(prev => [...prev, text]);
  };

  useEffect(() => {
    const checkAuth = async () => {
      setStatus('checking');
      addLog('Checking authentication...');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        addLog('Not authenticated. Redirecting to login.');
        navigate('/login');
        return;
      }

      setEmail(user.email ?? null);
      addLog(`Authenticated as ${user.email}`);

      if (!user.email?.endsWith('@nosweattest.com')) {
        setStatus('error');
        setMessage('This page is only available for test accounts (@nosweattest.com).');
        addLog('Account is not a test account. Access denied.');
        return;
      }

      // Check if there's an existing gym
      addLog('Checking for existing gym data...');
      const { data: profile } = await supabase
        .from('profiles')
        .select('gym_id')
        .eq('id', user.id)
        .single();

      if (profile?.gym_id) {
        const { data: gym } = await supabase
          .from('gyms')
          .select('name, slug')
          .eq('id', profile.gym_id)
          .single();

        if (gym) {
          setGymInfo(gym);
          addLog(`Found existing gym: "${gym.name}" (${gym.slug})`);
        } else {
          addLog('Profile has gym_id but gym record not found (orphaned reference).');
        }
      } else {
        addLog('No gym linked to this account. Ready for onboarding.');
      }

      setStatus('idle');
    };
    checkAuth();
  }, [navigate]);

  const handleReset = async () => {
    setStatus('loading');
    setMessage('');
    setLogs(prev => [...prev, '---', 'Starting reset...']);

    try {
      addLog('Calling reset_test_account()...');
      const { error } = await supabase.rpc('reset_test_account');

      if (error) {
        addLog(`Error from database: ${error.message}`);
        throw error;
      }

      addLog('All gym data deleted successfully.');
      addLog('Profile gym_id cleared.');
      setGymInfo(null);
      setStatus('success');
      setMessage('Test account reset complete. Redirecting to onboarding...');
      addLog('Redirecting to /onboarding in 2 seconds...');
      setTimeout(() => navigate('/onboarding'), 2000);
    } catch (err: any) {
      setStatus('error');
      const errorMsg = err.message || 'Unknown error';
      setMessage(`Reset failed: ${errorMsg}`);
      addLog(`Reset failed: ${errorMsg}`);
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

        {gymInfo && (
          <div style={{
            padding: '0.75rem 1rem',
            background: 'rgba(255, 255, 255, 0.06)',
            borderRadius: '8px',
            marginTop: '1rem',
            fontSize: '0.9rem',
            color: '#8b8b9e',
          }}>
            <strong style={{ color: '#f0f0f5' }}>Current gym:</strong> {gymInfo.name} <span style={{ opacity: 0.6 }}>({gymInfo.slug})</span>
          </div>
        )}

        {status === 'success' && <div className={styles.success}>{message}</div>}
        {status === 'error' && <div className={styles.error}>{message}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button
            onClick={handleReset}
            disabled={status === 'loading' || status === 'checking' || !email?.endsWith('@nosweattest.com')}
            className={styles.submitButton}
          >
            {status === 'loading' ? 'Resetting...' : status === 'checking' ? 'Loading...' : 'Reset and Re-test Onboarding'}
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

        {/* Activity log */}
        {logs.length > 0 && (
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            lineHeight: 1.8,
            color: '#8b8b9e',
            maxHeight: '200px',
            overflowY: 'auto',
          }}>
            {logs.map((log, i) => (
              <div key={i} style={{
                color: log.startsWith('Error') || log.startsWith('Reset failed')
                  ? '#ef4444'
                  : log.includes('successfully') || log.includes('complete')
                    ? '#10b981'
                    : log === '---'
                      ? 'transparent'
                      : '#8b8b9e',
                borderTop: log === '---' ? '1px solid rgba(255,255,255,0.06)' : undefined,
                paddingTop: log === '---' ? '0.5rem' : undefined,
                marginTop: log === '---' ? '0.5rem' : undefined,
              }}>
                {log !== '---' && log}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestReset;
