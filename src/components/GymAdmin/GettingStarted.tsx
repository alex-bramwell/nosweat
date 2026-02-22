import { useEffect, useState } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { supabase } from '../../lib/supabase';

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  tab: string;
}

interface GettingStartedProps {
  onNavigateTab: (tab: string) => void;
}

const GettingStarted: React.FC<GettingStartedProps> = ({ onNavigateTab }) => {
  const { gym, branding } = useTenant();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gym) return;

    const checkProgress = async () => {
      const [scheduleResult, coachResult, memberResult] = await Promise.all([
        supabase.from('gym_schedule').select('id', { count: 'exact', head: true }).eq('gym_id', gym.id),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('gym_id', gym.id).eq('role', 'coach'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('gym_id', gym.id).eq('role', 'member'),
      ]);

      setItems([
        {
          id: 'logo',
          label: 'Upload your logo',
          completed: !!branding.logo_url,
          tab: 'branding',
        },
        {
          id: 'colors',
          label: 'Customise your brand colours',
          completed: branding.color_accent !== '#111111',
          tab: 'branding',
        },
        {
          id: 'schedule',
          label: 'Add your first class',
          completed: (scheduleResult.count ?? 0) > 0,
          tab: 'settings',
        },
        {
          id: 'coach',
          label: 'Invite a coach',
          completed: (coachResult.count ?? 0) > 0,
          tab: 'settings',
        },
        {
          id: 'member',
          label: 'Add your first member',
          completed: (memberResult.count ?? 0) > 0,
          tab: 'settings',
        },
      ]);
      setLoading(false);
    };

    checkProgress();
  }, [gym, branding]);

  const completedCount = items.filter((i) => i.completed).length;
  const allDone = completedCount === items.length;

  if (loading || allDone) return null;

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '16px',
      padding: '1.5rem',
      marginBottom: '2rem',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
      }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Getting Started</h2>
        <span style={{
          fontSize: '0.85rem',
          color: '#8b8b9e',
          fontWeight: 500,
        }}>
          {completedCount}/{items.length} complete
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigateTab(item.tab)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem',
              background: item.completed ? 'rgba(16, 185, 129, 0.06)' : 'rgba(255, 255, 255, 0.02)',
              border: '1px solid',
              borderColor: item.completed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.06)',
              borderRadius: '10px',
              cursor: item.completed ? 'default' : 'pointer',
              textAlign: 'left',
              color: 'inherit',
              font: 'inherit',
              width: '100%',
              transition: 'all 150ms ease',
            }}
          >
            <span style={{
              width: '1.5rem',
              height: '1.5rem',
              borderRadius: '50%',
              border: item.completed ? 'none' : '2px solid rgba(255, 255, 255, 0.15)',
              background: item.completed ? '#10b981' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              color: '#ffffff',
              flexShrink: 0,
            }}>
              {item.completed && '✓'}
            </span>
            <span style={{
              fontSize: '0.9rem',
              fontWeight: 500,
              color: item.completed ? '#8b8b9e' : '#f0f0f5',
              textDecoration: item.completed ? 'line-through' : 'none',
            }}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default GettingStarted;
