import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { TenantProvider } from '../../contexts/TenantContext';
import { AuthProvider } from '../../contexts/AuthContext';
import GymAdmin from '../GymAdmin';
import styles from './PlatformDashboard.module.scss';

const PlatformDashboard = () => {
  const navigate = useNavigate();
  const [slug, setSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const resolveGym = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: gym, error: gymError } = await supabase
        .from('gyms')
        .select('slug')
        .eq('owner_id', user.id)
        .single();

      if (gymError || !gym) {
        navigate('/onboarding');
        return;
      }

      setSlug(gym.slug);
      setLoading(false);
    };

    resolveGym();
  }, [navigate]);

  if (loading || !slug) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}>
          <div className={styles.spinner} />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <TenantProvider initialSlug={slug}>
      <AuthProvider>
        <div className={styles.dashboardWrapper}>
          <GymAdmin />
        </div>
      </AuthProvider>
    </TenantProvider>
  );
};

export default PlatformDashboard;
