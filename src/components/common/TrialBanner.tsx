import { useEffect, useState } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const TrialBanner: React.FC = () => {
  const { gym, refreshTenant } = useTenant();
  const { user } = useAuth();
  const [memberCount, setMemberCount] = useState(0);
  const [resetting, setResetting] = useState(false);

  // Only platform owner (gym.owner_id) can reset trials — not regular gym admins
  const isPlatformOwner = gym && user?.id === gym.owner_id;

  useEffect(() => {
    if (!gym || gym.trial_status !== 'active') return;

    const fetchMemberCount = async () => {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('gym_id', gym.id)
        .eq('role', 'member');

      if (count !== null) setMemberCount(count);
    };

    fetchMemberCount();
  }, [gym]);

  if (!gym || !gym.trial_end_date) return null;
  if (gym.trial_status !== 'active' && gym.trial_status !== 'expired') return null;

  const now = new Date();
  const endDate = new Date(gym.trial_end_date);
  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const isExpired = daysLeft === 0 || gym.trial_status === 'expired';

  const handleResetTrial = async () => {
    if (!gym) return;
    setResetting(true);
    try {
      await supabase
        .from('gyms')
        .update({
          trial_status: 'active',
          trial_start_date: new Date().toISOString(),
          trial_end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('id', gym.id);
      await refreshTenant();
    } finally {
      setResetting(false);
    }
  };

  const bannerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    padding: '0.5rem 1rem',
    background: isExpired
      ? 'linear-gradient(90deg, #dc2626 0%, #ef4444 100%)'
      : 'linear-gradient(90deg, #2563eb 0%, #7c3aed 100%)',
    color: '#ffffff',
    fontSize: '0.875rem',
    fontWeight: 500,
    textAlign: 'center',
    zIndex: 100,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  };

  const linkStyle: React.CSSProperties = {
    color: '#ffffff',
    fontWeight: 700,
    textDecoration: 'underline',
    textUnderlineOffset: '2px',
  };

  const resetBtnStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    color: '#ffffff',
    padding: '0.2rem 0.6rem',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: resetting ? 'wait' : 'pointer',
    opacity: resetting ? 0.6 : 1,
    fontFamily: 'inherit',
  };

  if (isExpired) {
    return (
      <div style={bannerStyle}>
        <span>Your free trial has ended.</span>
        <a href="/subscribe" style={linkStyle}>Upgrade now</a>
        {isPlatformOwner && (
          <button style={resetBtnStyle} onClick={handleResetTrial} disabled={resetting}>
            {resetting ? 'Resetting...' : 'Reset trial'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={bannerStyle}>
      <span>
        Free trial: <strong>{daysLeft} day{daysLeft !== 1 ? 's' : ''} left</strong>
        {' '}&middot;{' '}
        <strong>{memberCount}/{gym.trial_member_limit}</strong> members
      </span>
      <a href="/subscribe" style={linkStyle}>Upgrade</a>
      {isPlatformOwner && (
        <button style={resetBtnStyle} onClick={handleResetTrial} disabled={resetting}>
          {resetting ? 'Resetting...' : 'Reset trial'}
        </button>
      )}
    </div>
  );
};

export default TrialBanner;
