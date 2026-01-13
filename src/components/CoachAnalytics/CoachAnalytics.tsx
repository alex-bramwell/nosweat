import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';
import type { WorkoutAnalytics, AnalyticsPeriod } from '../../types';
import styles from './CoachAnalytics.module.scss';

export const CoachAnalytics: React.FC = () => {
  const [period, setPeriod] = useState<AnalyticsPeriod>('30days');
  const [analytics, setAnalytics] = useState<WorkoutAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await analyticsService.getWorkoutAnalytics(period);
      setAnalytics(data);
      setError(null);
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const getPeriodLabel = (p: AnalyticsPeriod): string => {
    switch (p) {
      case '7days': return 'Last 7 Days';
      case '30days': return 'Last 30 Days';
      case '1year': return 'Last Year';
    }
  };

  const getStatusIcon = (status: 'balanced' | 'underused' | 'overused'): string => {
    switch (status) {
      case 'balanced': return '🟢';
      case 'underused': return '🟡';
      case 'overused': return '🔴';
    }
  };

  const getStatusColor = (status: 'balanced' | 'underused' | 'overused'): string => {
    switch (status) {
      case 'balanced': return styles.balanced;
      case 'underused': return styles.underused;
      case 'overused': return styles.overused;
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading analytics...</div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>{error || 'Failed to load analytics'}</p>
          <button onClick={loadAnalytics} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h2>Workout Analytics</h2>
        <div className={styles.periodSelector}>
          {(['7days', '30days', '1year'] as AnalyticsPeriod[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`${styles.periodButton} ${period === p ? styles.active : ''}`}
            >
              {getPeriodLabel(p)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className={styles.summaryStats}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{analytics.totalWorkouts}</div>
          <div className={styles.statLabel}>Total Workouts</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {new Date(analytics.dateRange.start).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short'
            })}
          </div>
          <div className={styles.statLabel}>From</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {new Date(analytics.dateRange.end).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short'
            })}
          </div>
          <div className={styles.statLabel}>To</div>
        </div>
      </div>

      {analytics.totalWorkouts === 0 ? (
        <div className={styles.noData}>
          <p>No workouts found in this time period.</p>
          <p>Create some workouts to see analytics!</p>
        </div>
      ) : (
        <>
          {/* Muscle Group Distribution */}
          <div className={styles.section}>
            <h3>Muscle Group Distribution</h3>
            <div className={styles.chartContainer}>
              {analytics.muscleGroupDistribution.map(stat => {
                const bias = analytics.detectedBiases.find(b => b.muscleGroup === stat.muscleGroup);
                return (
                  <div key={stat.muscleGroup} className={styles.barItem}>
                    <div className={styles.barLabel}>
                      <span className={styles.muscleGroupName}>
                        {stat.muscleGroup.charAt(0).toUpperCase() + stat.muscleGroup.slice(1)}
                      </span>
                      <span className={styles.percentage}>
                        {stat.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className={styles.barTrack}>
                      <div
                        className={`${styles.barFill} ${bias ? getStatusColor(bias.status) : ''}`}
                        style={{ width: `${Math.min(stat.percentage, 100)}%` }}
                      />
                    </div>
                    <div className={styles.barMeta}>
                      {bias && (
                        <span className={styles.statusIcon}>
                          {getStatusIcon(bias.status)}
                        </span>
                      )}
                      <span className={styles.hitCount}>
                        {stat.hitCount.toFixed(1)} hits
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Workout Type Breakdown */}
          <div className={styles.section}>
            <h3>Workout Type Breakdown</h3>
            <div className={styles.typeGrid}>
              {analytics.workoutTypeBreakdown.map(stat => (
                <div key={stat.type} className={styles.typeCard}>
                  <div className={styles.typeIcon}>
                    {stat.type === 'amrap' && '⏱️'}
                    {stat.type === 'fortime' && '🏃'}
                    {stat.type === 'emom' && '⏰'}
                    {stat.type === 'strength' && '💪'}
                    {stat.type === 'endurance' && '🏃‍♂️'}
                  </div>
                  <div className={styles.typeName}>{stat.type.toUpperCase()}</div>
                  <div className={styles.typeCount}>{stat.count}</div>
                  <div className={styles.typePercentage}>{stat.percentage.toFixed(0)}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Top 10 Movements */}
          <div className={styles.section}>
            <h3>Top 10 Most Used Movements</h3>
            {analytics.topMovements.length === 0 ? (
              <p className={styles.noData}>No movements tracked yet.</p>
            ) : (
              <div className={styles.topMovementsList}>
                {analytics.topMovements.map(stat => (
                  <div key={stat.movementName} className={styles.topMovementItem}>
                    <div className={styles.rank}>#{stat.rank}</div>
                    <div className={styles.movementName}>{stat.movementName}</div>
                    <div className={styles.count}>{stat.count}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detected Biases */}
          {analytics.detectedBiases.some(b => b.status !== 'balanced') && (
            <div className={styles.section}>
              <h3>Detected Biases</h3>
              <div className={styles.biasGrid}>
                {analytics.detectedBiases
                  .filter(bias => bias.status !== 'balanced')
                  .map(bias => (
                    <div
                      key={bias.muscleGroup}
                      className={`${styles.biasCard} ${getStatusColor(bias.status)}`}
                    >
                      <div className={styles.biasHeader}>
                        <span className={styles.biasIcon}>{getStatusIcon(bias.status)}</span>
                        <span className={styles.biasLabel}>
                          {bias.muscleGroup.charAt(0).toUpperCase() + bias.muscleGroup.slice(1)}
                        </span>
                      </div>
                      <div className={styles.biasStats}>
                        <span>{bias.percentage.toFixed(1)}%</span>
                        <span>({bias.hitCount.toFixed(1)} hits)</span>
                      </div>
                      <div className={styles.biasAction}>
                        {bias.status === 'overused' ? 'Consider reducing' : 'Consider increasing'}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className={styles.section}>
            <h3>Recommendations</h3>
            {analytics.recommendations.length === 0 ? (
              <p className={styles.noData}>No recommendations at this time. Keep up the great work!</p>
            ) : (
              <ul className={styles.recommendationsList}>
                {analytics.recommendations.map((rec, idx) => (
                  <li key={idx} className={styles.recommendationItem}>
                    {rec.includes('Excellent') || rec.includes('well-balanced') ? (
                      <span className={styles.positive}>✓ {rec}</span>
                    ) : rec.includes('Reduce') || rec.includes('overused') ? (
                      <span className={styles.warning}>⚠️ {rec}</span>
                    ) : (
                      <span className={styles.suggestion}>💡 {rec}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
};
