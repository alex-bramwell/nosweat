import { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';
import type { MuscleGroup } from '../../types';
import styles from './WeeklyVolume.module.scss';

const muscleGroupColors: Record<MuscleGroup, string> = {
  shoulders: '#f97316',
  back: '#3b82f6',
  chest: '#ef4444',
  arms: '#8b5cf6',
  legs: '#22c55e',
  core: '#eab308',
  'full body': '#607d8b'
};

export const WeeklyVolume: React.FC = () => {
  const [weeklyData, setWeeklyData] = useState<{
    muscleGroups: { muscleGroup: MuscleGroup; hitCount: number; percentage: number }[];
    totalWorkouts: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeeklyVolume();
  }, []);

  const loadWeeklyVolume = async () => {
    try {
      const analytics = await analyticsService.getWorkoutAnalytics('7days');

      // Transform muscle group distribution data
      const muscleGroups = analytics.muscleGroupDistribution
        .map(stat => ({
          muscleGroup: stat.muscleGroup,
          hitCount: stat.hitCount,
          percentage: stat.percentage
        }))
        .filter(mg => mg.hitCount > 0) // Only show muscle groups being worked
        .sort((a, b) => b.hitCount - a.hitCount);

      setWeeklyData({
        muscleGroups,
        totalWorkouts: analytics.totalWorkouts
      });
    } catch (error) {
      console.error('Error loading weekly volume:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (!weeklyData || weeklyData.totalWorkouts === 0) {
    return null;
  }

  const maxHits = Math.max(...weeklyData.muscleGroups.map(mg => mg.hitCount), 1);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h3 className={styles.title}>This Week's Focus</h3>
          <div className={styles.workoutBadge}>
            {weeklyData.totalWorkouts} workout{weeklyData.totalWorkouts !== 1 ? 's' : ''}
          </div>
        </div>
        <p className={styles.subtitle}>
          Targeting your whole body with balanced programming
        </p>
      </div>

      <div className={styles.barsContainer}>
        {weeklyData.muscleGroups.map(({ muscleGroup, hitCount, percentage }) => (
          <div key={muscleGroup} className={styles.barRow}>
            <div className={styles.barLabel}>
              <span
                className={styles.barDot}
                style={{ backgroundColor: muscleGroupColors[muscleGroup] }}
              />
              <span className={styles.barName}>
                {muscleGroup.charAt(0).toUpperCase() + muscleGroup.slice(1)}
              </span>
            </div>
            <div className={styles.barTrack}>
              <div
                className={styles.barFill}
                style={{
                  width: `${(hitCount / maxHits) * 100}%`,
                  backgroundColor: muscleGroupColors[muscleGroup]
                }}
              />
            </div>
            <div className={styles.barStats}>
              <span className={styles.barValue}>{hitCount}</span>
              <span className={styles.barPercentage}>{Math.round(percentage)}%</span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <p className={styles.footerText}>
          Our coaches design balanced programming to develop all muscle groups and movement patterns for complete fitness.
        </p>
      </div>
    </div>
  );
};
