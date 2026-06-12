import { useEffect, useState } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { supabase } from '../../lib/supabase';
import { SectionNav } from '../common';

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
        { id: 'logo', label: 'Upload your logo', completed: !!branding.logo_url, tab: 'branding' },
        { id: 'colors', label: 'Customise your brand colours', completed: branding.color_accent !== '#111111', tab: 'branding' },
        { id: 'schedule', label: 'Add your first class', completed: (scheduleResult.count ?? 0) > 0, tab: 'settings' },
        { id: 'coach', label: 'Invite a coach', completed: (coachResult.count ?? 0) > 0, tab: 'settings' },
        { id: 'member', label: 'Add your first member', completed: (memberResult.count ?? 0) > 0, tab: 'settings' },
      ]);
      setLoading(false);
    };

    checkProgress();
  }, [gym, branding]);

  const completedCount = items.filter((i) => i.completed).length;
  const allDone = completedCount === items.length;

  if (loading || allDone) return null;

  const handleSelect = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (item && !item.completed) onNavigateTab(item.tab);
  };

  return (
    <div style={{ marginBottom: '2rem' }}>
      <SectionNav
        variant="inline"
        title="Getting Started"
        meta={`${completedCount}/${items.length} complete`}
        items={items.map((i) => ({ id: i.id, label: i.label, done: i.completed }))}
        onSelect={handleSelect}
      />
    </div>
  );
};

export default GettingStarted;
