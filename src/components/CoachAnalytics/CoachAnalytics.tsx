import React, { useState, useEffect } from 'react';
import { analyticsService, type UpcomingWODAnalysis, type ProgrammingHealth, type WeekComparison } from '../../services/analyticsService';
import type { WorkoutAnalytics, AnalyticsPeriod, MuscleGroup } from '../../types';
import { InfoTooltip } from '../common/InfoTooltip';
import styles from './CoachAnalytics.module.scss';
import { ModalityChart } from './Charts/ModalityChart';
import { FunctionalRadarChart } from './Charts/FunctionalRadarChart';
import { HeavyDayTracker } from './Charts/HeavyDayTracker';
import { TimeDomainChart } from './Charts/TimeDomainChart';

// ... existing imports ...

// In return statement, before "Upcoming WODs" section:



{/* Upcoming WODs Preview */ }
type SelectedMuscleGroup = MuscleGroup | null;

interface ExerciseDetail {
  name: string;
  isPrimary: boolean;
  twoWeekUsage: number;
}

interface ClickedNode {
  muscleGroup: MuscleGroup;
  date: string;
  dayLabel: string;
  hitCount: number;
}

// Muscle group colors
const muscleGroupColors: Record<MuscleGroup, string> = {
  shoulders: '#f97316', // orange
  back: '#3b82f6',      // blue
  chest: '#ef4444',     // red
  arms: '#8b5cf6',      // purple
  legs: '#22c55e',      // green
  core: '#eab308',      // yellow
  'full body': '#607d8b'  // blue-grey
};

// Number of days to show in mobile chart view
const MOBILE_CHART_DAYS = 4;

export const CoachAnalytics: React.FC = () => {
  const [period, setPeriod] = useState<AnalyticsPeriod>('7days');
  const [dateOffset, setDateOffset] = useState(0);
  const [analytics, setAnalytics] = useState<WorkoutAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMuscle, setSelectedMuscle] = useState<SelectedMuscleGroup>(null);
  const [clickedNode, setClickedNode] = useState<ClickedNode | null>(null);
  const [exerciseDetails, setExerciseDetails] = useState<ExerciseDetail[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [upcomingWODs, setUpcomingWODs] = useState<UpcomingWODAnalysis[]>([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(false);
  const [expandedSuggestions, setExpandedSuggestions] = useState<string | null>(null);
  const [programmingHealth, setProgrammingHealth] = useState<ProgrammingHealth | null>(null);
  const [weekComparison, setWeekComparison] = useState<WeekComparison | null>(null);
  const [volumeView, setVolumeView] = useState<'thisWeek' | 'lastWeek'>('thisWeek');

  // Mobile chart viewport state
  const [chartViewStart, setChartViewStart] = useState(0);
  const [isMobileView, setIsMobileView] = useState(false);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset chart view when period changes
  useEffect(() => {
    setChartViewStart(0);
  }, [period, dateOffset]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await analyticsService.getWorkoutAnalytics(period, undefined, dateOffset);
      setAnalytics(data);
      setError(null);
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [period, dateOffset]);

  useEffect(() => {
    setDateOffset(0);
    // These do not depend on the offset, so they are in a separate effect
    loadUpcomingWODs();
    loadProgrammingHealth();
    loadWeekComparison();
  }, [period]);

  const loadUpcomingWODs = async () => {
    setLoadingUpcoming(true);
    try {
      const data = await analyticsService.getUpcomingWODsWithAnalysis(2);
      setUpcomingWODs(data);
    } catch (err) {
      console.error('Error loading upcoming WODs:', err);
    } finally {
      setLoadingUpcoming(false);
    }
  };

  const loadProgrammingHealth = async () => {
    try {
      const data = await analyticsService.getProgrammingHealth();
      setProgrammingHealth(data);
    } catch (err) {
      console.error('Error loading programming health:', err);
    }
  };

  const loadWeekComparison = async () => {
    try {
      const data = await analyticsService.getWeekComparison();
      setWeekComparison(data);
    } catch (err) {
      console.error('Error loading week comparison:', err);
    }
  };

  const handlePrevPeriod = () => setDateOffset(prev => prev - 1);
  const handleNextPeriod = () => setDateOffset(prev => (prev < 0 ? prev + 1 : 0));

  const toggleSuggestions = (movementName: string) => {
    setExpandedSuggestions(prev => prev === movementName ? null : movementName);
  };

  const handleNodeClick = async (
    muscleGroup: MuscleGroup,
    date: string,
    dayLabel: string,
    hitCount: number
  ) => {
    setClickedNode({ muscleGroup, date, dayLabel, hitCount });
    setLoadingExercises(true);
    setSelectedMuscle(muscleGroup);

    try {
      const details = await analyticsService.getExercisesWithUsageForDateAndMuscle(date, muscleGroup);
      setExerciseDetails(details);
    } catch (err) {
      console.error('Error loading exercise details:', err);
      setExerciseDetails([]);
    } finally {
      setLoadingExercises(false);
    }
  };

  const closeNodeModal = () => {
    setClickedNode(null);
    setExerciseDetails([]);
  };

  const getPeriodButtonLabel = (p: AnalyticsPeriod): string => {
    switch (p) {
      case '7days': return 'Week';
      case '30days': return 'Month';
      case '1year': return 'Year';
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

  const formatDateRange = (start: string, end: string, period: AnalyticsPeriod) => {
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (period === '1year') {
      return startDate.getFullYear();
    }

    if (period === '30days') {
      return startDate.toLocaleString('en-GB', { month: 'long', year: 'numeric' });
    }

    // 7days
    const startFormat: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    const endFormat: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };

    if (startDate.getFullYear() !== endDate.getFullYear()) {
      startFormat.year = 'numeric';
    }

    return `${startDate.toLocaleDateString('en-GB', startFormat)} - ${endDate.toLocaleDateString('en-GB', endFormat)}`;
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
              {getPeriodButtonLabel(p)}
            </button>
          ))}
        </div>
      </div>

      {/* Date Navigator & Summary Stats */}
      <div className={styles.navigationAndStats}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{analytics.totalWorkouts}</div>
          <div className={styles.statLabel}>Total Workouts</div>
        </div>

        <div className={styles.dateNavigator}>
          <button onClick={handlePrevPeriod} className={styles.navButton} aria-label="Previous period">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <div className={styles.dateDisplay}>
            <div className={styles.dateValue}>
              {formatDateRange(analytics.dateRange.start, analytics.dateRange.end, period)}
            </div>
            <div className={styles.dateLabel}>
              {dateOffset === 0 ? 'Current Period' : `${-dateOffset} ${getPeriodButtonLabel(period)}${-dateOffset > 1 ? 's' : ''} ago`}
            </div>
          </div>
          <button onClick={handleNextPeriod} className={styles.navButton} disabled={dateOffset === 0} aria-label="Next period">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>

      {analytics.totalWorkouts === 0 ? (
        <div className={styles.noData}>
          <p>No workouts found in this time period.</p>
          <p>Create some workouts to see analytics!</p>
        </div>
      ) : (
        <>
          {/* Main Analytics Grid - Graph + Insights on left, Bar chart on right */}
          <div className={styles.mainAnalyticsGrid}>
            {/* Left Column: Graph + Insights */}
            <div className={styles.leftColumn}>
              {/* Muscle Group Line Graph */}
              <div className={`${styles.section} ${styles.graphSection}`}>
                <div className={styles.sectionHeader}>
                  <h3>Muscle Group Activity</h3>
                  <InfoTooltip content="Shows how often each muscle group was targeted over time. Click on any dot to see which movements were programmed that day. Higher dots = more movements targeting that muscle group." />
                </div>
                <div className={styles.lineGraphContainer}>
                  {(() => {
                    const fullDailyData = analytics.dailyMuscleData || [];
                    const muscleGroups: MuscleGroup[] = ['legs', 'shoulders', 'core', 'back', 'chest', 'arms'];

                    // For mobile, slice the data to show only visible days
                    const shouldPaginate = isMobileView && fullDailyData.length > MOBILE_CHART_DAYS;
                    const maxViewStart = shouldPaginate ? fullDailyData.length - MOBILE_CHART_DAYS : 0;
                    const viewStart = shouldPaginate ? Math.min(chartViewStart, maxViewStart) : 0;
                    const dailyData = shouldPaginate
                      ? fullDailyData.slice(viewStart, viewStart + MOBILE_CHART_DAYS)
                      : fullDailyData;

                    // Find max hit count across ALL days (not just visible) for consistent scale
                    // Add 15% headroom so dots at max don't get clipped at the top
                    const rawMaxHits = Math.max(
                      ...fullDailyData.flatMap(day =>
                        day.muscleGroups.map(mg => mg.hitCount)
                      ),
                      1
                    );
                    const maxHits = rawMaxHits * 1.15;

                    const canGoBack = shouldPaginate && viewStart > 0;
                    const canGoForward = shouldPaginate && viewStart < maxViewStart;

                    return (
                      <>
                        {/* Mobile pagination controls */}
                        {shouldPaginate && (
                          <div className={styles.chartPagination}>
                            <button
                              className={styles.chartPaginationBtn}
                              onClick={() => setChartViewStart(Math.max(0, viewStart - MOBILE_CHART_DAYS))}
                              disabled={!canGoBack}
                              aria-label="View earlier days"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="15 18 9 12 15 6" />
                              </svg>
                            </button>
                            <span className={styles.chartPaginationLabel}>
                              {fullDailyData[viewStart]?.dayLabel} {new Date(fullDailyData[viewStart]?.date).getDate()} – {fullDailyData[viewStart + MOBILE_CHART_DAYS - 1]?.dayLabel} {new Date(fullDailyData[viewStart + MOBILE_CHART_DAYS - 1]?.date).getDate()}
                            </span>
                            <button
                              className={styles.chartPaginationBtn}
                              onClick={() => setChartViewStart(Math.min(maxViewStart, viewStart + MOBILE_CHART_DAYS))}
                              disabled={!canGoForward}
                              aria-label="View later days"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                            </button>
                          </div>
                        )}

                        {/* Graph area with CSS Grid */}
                        <div className={styles.graphGrid}>
                          {/* Y-axis labels - use raw max for display, scaled max for positioning */}
                          <div className={styles.yAxis}>
                            <span>{rawMaxHits.toFixed(0)}</span>
                            <span>{(rawMaxHits * 0.5).toFixed(0)}</span>
                            <span>0</span>
                          </div>

                          {/* Main chart area */}
                          <div className={styles.chartArea}>
                            {/* Horizontal grid lines */}
                            <div className={styles.gridLines}>
                              <div className={styles.gridLine} />
                              <div className={styles.gridLine} />
                              <div className={styles.gridLine} />
                            </div>

                            {/* Data columns for each day */}
                            <div className={styles.dataColumns}>
                              {dailyData.map((day, dayIdx) => (
                                <div key={dayIdx} className={styles.dataColumn}>
                                  {/* Vertical line at this day */}
                                  <div className={styles.columnLine} />

                                  {/* Data points stacked */}
                                  {muscleGroups.map(muscleGroup => {
                                    const mgData = day.muscleGroups.find(mg => mg.muscleGroup === muscleGroup);
                                    const hitCount = mgData?.hitCount || 0;
                                    const heightPercent = (hitCount / maxHits) * 100;

                                    const isSelected = selectedMuscle === muscleGroup;
                                    const isOtherSelected = selectedMuscle && selectedMuscle !== muscleGroup;

                                    return hitCount > 0 ? (
                                      <div
                                        key={muscleGroup}
                                        className={`${styles.dataPoint} ${isSelected ? styles.dataPointSelected : ''}`}
                                        style={{
                                          bottom: `${heightPercent}%`,
                                          backgroundColor: muscleGroupColors[muscleGroup],
                                          boxShadow: isSelected
                                            ? `0 0 12px ${muscleGroupColors[muscleGroup]}, 0 0 24px ${muscleGroupColors[muscleGroup]}`
                                            : `0 0 8px ${muscleGroupColors[muscleGroup]}, 0 0 16px ${muscleGroupColors[muscleGroup]}60`,
                                          opacity: isOtherSelected ? 0.3 : 1,
                                          cursor: 'pointer'
                                        }}
                                        title={`${muscleGroup}: ${hitCount.toFixed(1)} movements`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleNodeClick(muscleGroup, day.date, day.dayLabel, hitCount);
                                        }}
                                      />
                                    ) : null;
                                  })}
                                </div>
                              ))}
                            </div>

                            {/* Connecting lines (SVG overlay) */}
                            <svg
                              className={styles.linesOverlay}
                              viewBox="0 0 100 100"
                              preserveAspectRatio="none"
                              onClick={() => setSelectedMuscle(null)}
                            >
                              {/* Area fill for selected muscle group */}
                              {selectedMuscle && (() => {
                                const areaPoints = dailyData.map((day, idx) => {
                                  const mgData = day.muscleGroups.find(mg => mg.muscleGroup === selectedMuscle);
                                  const hitCount = mgData?.hitCount || 0;
                                  const x = dailyData.length > 1
                                    ? (idx / (dailyData.length - 1)) * 100
                                    : 50;
                                  const y = 100 - (hitCount / maxHits) * 100;
                                  return `${x},${y}`;
                                });
                                // Close the polygon by going to bottom right, bottom left
                                const polygonPoints = [
                                  ...areaPoints,
                                  `100,100`,
                                  `0,100`
                                ].join(' ');

                                return (
                                  <polygon
                                    points={polygonPoints}
                                    fill={muscleGroupColors[selectedMuscle]}
                                    fillOpacity="0.2"
                                  />
                                );
                              })()}

                              {muscleGroups.map(muscleGroup => {
                                const points = dailyData.map((day, idx) => {
                                  const mgData = day.muscleGroups.find(mg => mg.muscleGroup === muscleGroup);
                                  const hitCount = mgData?.hitCount || 0;
                                  const x = dailyData.length > 1
                                    ? (idx / (dailyData.length - 1)) * 100
                                    : 50;
                                  const y = 100 - (hitCount / maxHits) * 100;
                                  return `${x},${y}`;
                                }).join(' ');

                                const isSelected = selectedMuscle === muscleGroup;
                                const isOtherSelected = selectedMuscle && selectedMuscle !== muscleGroup;

                                return (
                                  <polyline
                                    key={muscleGroup}
                                    points={points}
                                    fill="none"
                                    stroke={muscleGroupColors[muscleGroup]}
                                    strokeWidth={isSelected ? "2" : "1"}
                                    strokeOpacity={isOtherSelected ? 0.15 : isSelected ? 0.9 : 0.4}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    vectorEffect="non-scaling-stroke"
                                  />
                                );
                              })}
                            </svg>
                          </div>
                        </div>

                        {/* X-axis day labels */}
                        <div className={styles.xAxis}>
                          {dailyData.map((day, idx) => (
                            <div key={idx} className={styles.xLabel}>
                              <span className={styles.dayName}>{day.dayLabel}</span>
                              <span className={styles.dayNum}>{new Date(day.date).getDate()}</span>
                            </div>
                          ))}
                        </div>

                        {/* Legend */}
                        <div className={styles.lineGraphLegend}>
                          {muscleGroups.map(mg => {
                            const isSelected = selectedMuscle === mg;
                            const isOtherSelected = selectedMuscle && selectedMuscle !== mg;

                            return (
                              <div
                                key={mg}
                                className={`${styles.legendItem} ${isSelected ? styles.legendItemSelected : ''}`}
                                style={{
                                  opacity: isOtherSelected ? 0.4 : 1,
                                  cursor: 'pointer'
                                }}
                                onClick={() => setSelectedMuscle(isSelected ? null : mg)}
                              >
                                <span
                                  className={styles.legendColor}
                                  style={{ backgroundColor: muscleGroupColors[mg] }}
                                />
                                <span className={styles.legendText}>{mg}</span>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Programming Health & Week Comparison - Below Graph */}
              <div className={styles.insightsRow}>
                {/* Programming Health */}
                <div className={`${styles.section} ${styles.insightSection}`}>
                  <div className={styles.sectionHeaderCompact}>
                    <h3>Programming Health</h3>
                    <InfoTooltip content="Balance measures how evenly you're targeting all muscle groups. Variety shows how many different movements you're using. Aim for 70%+ in both for well-rounded programming." />
                  </div>
                  {programmingHealth ? (
                    <div className={styles.healthContent}>
                      {/* Balance Score */}
                      <div className={styles.scoreCard}>
                        <div className={styles.scoreHeader}>
                          <span className={styles.scoreLabel}>Balance</span>
                          <span className={`${styles.scoreBadge} ${styles[`score${programmingHealth.balanceLabel.replace(' ', '')}`]}`}>
                            {programmingHealth.balanceLabel}
                          </span>
                        </div>
                        <div className={styles.scoreBar}>
                          <div
                            className={`${styles.scoreBarFill} ${styles.balanceBar}`}
                            style={{ width: `${programmingHealth.balanceScore}%` }}
                          />
                        </div>
                        <span className={styles.scoreValue}>{programmingHealth.balanceScore}%</span>
                      </div>

                      {/* Variety Score */}
                      <div className={styles.scoreCard}>
                        <div className={styles.scoreHeader}>
                          <span className={styles.scoreLabel}>Variety</span>
                          <span className={styles.scoreSubtext}>{programmingHealth.uniqueMovements} unique</span>
                        </div>
                        <div className={styles.scoreBar}>
                          <div
                            className={`${styles.scoreBarFill} ${styles.varietyBar}`}
                            style={{ width: `${programmingHealth.varietyScore}%` }}
                          />
                        </div>
                        <span className={styles.scoreValue}>{programmingHealth.varietyScore}%</span>
                      </div>

                      {/* Neglected Movements */}
                      {programmingHealth.neglectedMovements.length > 0 && (
                        <div className={styles.movementList}>
                          <span className={styles.movementListLabel}>Consider adding:</span>
                          <div className={styles.movementTags}>
                            {programmingHealth.neglectedMovements.slice(0, 3).map((name, idx) => (
                              <span key={idx} className={styles.neglectedTag}>{name}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={styles.loading}>Loading...</div>
                  )}
                </div>

                {/* Week Comparison */}
                <div className={`${styles.section} ${styles.insightSection}`}>
                  <div className={styles.sectionHeaderCompact}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h3>Weekly Volume</h3>
                      <InfoTooltip content="Compares total movement volume by muscle group between this week and last week. Each bar shows how many times that muscle group was targeted. Consistent volume week-to-week helps with recovery and progress." />
                    </div>
                    {/* View Toggle */}
                    <div className={styles.volumeToggle}>
                      <button
                        className={`${styles.volumeToggleBtn} ${volumeView === 'thisWeek' ? styles.active : ''}`}
                        onClick={() => setVolumeView('thisWeek')}
                      >
                        This Week
                      </button>
                      <button
                        className={`${styles.volumeToggleBtn} ${volumeView === 'lastWeek' ? styles.active : ''}`}
                        onClick={() => setVolumeView('lastWeek')}
                      >
                        Last Week
                      </button>
                    </div>
                  </div>
                  {weekComparison ? (
                    <div className={styles.weeklyVolumeContent}>
                      {/* Workout Count Header */}
                      <div className={styles.workoutCountHeader}>
                        <div className={styles.workoutCountMain}>
                          <span className={styles.workoutCountTitle}>Workouts</span>
                          {volumeView === 'thisWeek' ? (
                            <div className={styles.workoutCountComparison}>
                              <span className={styles.workoutCountValue}>{weekComparison.thisWeek.workouts}</span>
                              <span className={styles.workoutCountVs}>vs</span>
                              <span className={styles.workoutCountValueLast}>{weekComparison.lastWeek.workouts}</span>
                              <span className={styles.workoutCountLastLabel}>last week</span>
                            </div>
                          ) : (
                            <div className={styles.workoutCountComparison}>
                              <span className={styles.workoutCountValue}>{weekComparison.lastWeek.workouts}</span>
                              <span className={styles.workoutCountLastLabel}>recorded</span>
                            </div>
                          )}
                        </div>

                        {/* Body Part Focus Highlight */}
                        {(() => {
                          const currentData = volumeView === 'thisWeek' ? weekComparison.thisWeek : weekComparison.lastWeek;
                          const sortedMuscles = [...currentData.muscleDistribution].sort((a, b) => b.hitCount - a.hitCount);
                          const topMuscle = sortedMuscles[0];

                          if (topMuscle && topMuscle.hitCount > 0) {
                            return (
                              <div className={styles.focusContainer}>
                                <span className={styles.focusLabel}>Focus:</span>
                                <div
                                  className={styles.focusBadge}
                                  style={{
                                    backgroundColor: `${muscleGroupColors[topMuscle.muscleGroup]}15`,
                                    color: muscleGroupColors[topMuscle.muscleGroup],
                                    borderColor: `${muscleGroupColors[topMuscle.muscleGroup]}30`
                                  }}
                                >
                                  {topMuscle.muscleGroup}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>

                      {/* Muscle Group Volume Bars */}
                      <div className={styles.volumeBarsContainer}>
                        {(() => {
                          // Get all muscle groups from both weeks
                          const allMuscleGroups = Array.from(new Set([
                            ...weekComparison.thisWeek.muscleDistribution.map(m => m.muscleGroup),
                            ...weekComparison.lastWeek.muscleDistribution.map(m => m.muscleGroup)
                          ]));

                          // Find max hit count for scaling
                          const maxHits = Math.max(
                            ...weekComparison.thisWeek.muscleDistribution.map(m => m.hitCount),
                            ...weekComparison.lastWeek.muscleDistribution.map(m => m.hitCount),
                            1
                          );

                          return allMuscleGroups.map(muscleGroup => {
                            const thisWeekData = weekComparison.thisWeek.muscleDistribution.find(m => m.muscleGroup === muscleGroup);
                            const lastWeekData = weekComparison.lastWeek.muscleDistribution.find(m => m.muscleGroup === muscleGroup);

                            // Determine which data to show based on view mode
                            const isComparisonMode = volumeView === 'thisWeek';

                            const primaryHits = isComparisonMode
                              ? (thisWeekData?.hitCount || 0)
                              : (lastWeekData?.hitCount || 0);

                            const comparisonHits = isComparisonMode
                              ? (lastWeekData?.hitCount || 0)
                              : 0; // No comparison for last week view

                            const change = isComparisonMode
                              ? primaryHits - comparisonHits
                              : 0;

                            return (
                              <div key={muscleGroup} className={styles.volumeBarRow}>
                                <div className={styles.volumeBarLabel}>
                                  <span
                                    className={styles.volumeBarDot}
                                    style={{ backgroundColor: muscleGroupColors[muscleGroup] }}
                                  />
                                  <span className={styles.volumeBarName}>
                                    {muscleGroup.charAt(0).toUpperCase() + muscleGroup.slice(1)}
                                  </span>
                                </div>
                                <div className={styles.volumeBarTrack}>
                                  {/* Comparison bar (background/ghost bar) - Only visible in This Week mode */}
                                  {isComparisonMode && (
                                    <div
                                      className={styles.volumeBarLast}
                                      style={{ width: `${(comparisonHits / maxHits) * 100}%` }}
                                    />
                                  )}
                                  {/* Primary bar (foreground bar) */}
                                  <div
                                    className={styles.volumeBarThis}
                                    style={{
                                      width: `${(primaryHits / maxHits) * 100}%`,
                                      backgroundColor: muscleGroupColors[muscleGroup]
                                    }}
                                  />
                                </div>
                                <div className={styles.volumeBarValues}>
                                  <span className={styles.volumeBarCurrent}>{primaryHits.toFixed(0)}</span>
                                  {isComparisonMode && change !== 0 && (
                                    <span className={`${styles.volumeBarChange} ${change > 0 ? styles.positive : styles.negative}`}>
                                      {change > 0 ? '+' : ''}{change.toFixed(0)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>

                      {/* Legend removed as requested */}
                    </div>
                  ) : (
                    <div className={styles.loading}>Loading...</div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Muscle Group Summary */}
            <div className={`${styles.section} ${styles.barSection}`}>
              <div className={styles.sectionHeader}>
                <h3>Muscle Group Totals</h3>
                <InfoTooltip content="Shows percentage of total movements targeting each muscle group. Ideal balance is 15-20% per group. Green = balanced, yellow = underused, red = overused." />
              </div>
              <div className={styles.chartContainer}>
                {analytics.muscleGroupDistribution.map(stat => {
                  const bias = analytics.detectedBiases.find(b => b.muscleGroup === stat.muscleGroup);
                  const status = bias?.status || 'balanced';

                  const statusColors = {
                    balanced: 'rgba(34, 197, 94, 0.8)', // Green
                    underused: 'rgba(251, 191, 36, 0.8)', // Yellow
                    overused: 'rgba(239, 68, 68, 0.8)'  // Red
                  };

                  const pillBgColor = statusColors[status];
                  const pillTextColor = status === 'underused' ? '#1f2937' : '#ffffff';

                  return (
                    <div key={stat.muscleGroup} className={styles.barItem}>
                      <div className={styles.barLabel}>
                        <span
                          className={styles.muscleGroupName}
                          style={{
                            backgroundColor: pillBgColor,
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            color: pillTextColor,
                            fontSize: '0.75rem',
                            textTransform: 'uppercase',
                            fontWeight: '700',
                            backdropFilter: 'blur(5px)'
                          }}
                        >
                          {stat.muscleGroup}
                        </span>
                        <span className={styles.percentage}>
                          {stat.percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className={styles.barTrack}>
                        <div
                          className={`${styles.barFill} ${bias ? getStatusColor(bias.status) : styles.balanced}`}
                          style={{
                            width: `${Math.min(stat.percentage, 100)}%`,
                          }}
                        />
                      </div>
                      <div className={styles.barMeta}>
                        <span className={styles.hitCount}>
                          {stat.hitCount.toFixed(1)} movements
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* CrossFit Programming Insights */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>Programming Insights</h3>
              <InfoTooltip content="Deep dive into your programming balance across modalities (M/G/W), functional patterns (Push/Pull/Squat/Hinge), and intensity loading." />
            </div>
            <div className={styles.chartsGrid}>
              {analytics.modalityDistribution && (
                <ModalityChart data={analytics.modalityDistribution} />
              )}
              {analytics.functionalPatternBreakdown && (
                <FunctionalRadarChart data={analytics.functionalPatternBreakdown} />
              )}
              {analytics.heavyDaysCount !== undefined && (
                <HeavyDayTracker
                  count={analytics.heavyDaysCount}
                  periodLabel={period === '7days' ? 'this week' : period === '30days' ? 'this month' : 'this year'}
                />
              )}
            </div>
            {analytics.timeDomainBreakdown && (
              <div style={{ marginTop: '1rem' }}>
                <TimeDomainChart data={analytics.timeDomainBreakdown} />
              </div>
            )}
          </div>

          {/* Upcoming WODs Preview */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>Upcoming WODs</h3>
              <InfoTooltip content="Shows scheduled workouts and analyzes their movements. Yellow highlighted movements have been used 3+ times in the last 2 weeks - tap to see alternative movements from different muscle groups." />
            </div>
            {loadingUpcoming ? (
              <div className={styles.loading}>Loading upcoming workouts...</div>
            ) : upcomingWODs.length === 0 ? (
              <div className={styles.noData}>No upcoming workouts scheduled</div>
            ) : (
              <div className={styles.upcomingWODsGrid}>
                {upcomingWODs.map(({ workout, movementAnalysis }) => (
                  <div key={workout.id} className={styles.upcomingWODCard}>
                    <div className={styles.upcomingWODHeader}>
                      <span className={styles.upcomingWODDate}>
                        {new Date(workout.date).toLocaleDateString('en-GB', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short'
                        })}
                      </span>
                      <span className={styles.upcomingWODType}>{workout.type?.toUpperCase()}</span>
                    </div>
                    <h4 className={styles.upcomingWODTitle}>{workout.title || 'Untitled Workout'}</h4>

                    <div className={styles.upcomingMovementsList}>
                      <p className={styles.upcomingMovementsLabel}>Movements</p>
                      {movementAnalysis.length === 0 ? (
                        <p className={styles.noMovements}>No movements detected</p>
                      ) : (
                        movementAnalysis.map((movement, idx) => (
                          <div key={idx} className={styles.upcomingMovementItem}>
                            {movement.isHighUsage ? (
                              <div className={styles.movementAccordion}>
                                <button
                                  className={`${styles.accordionHeader} ${expandedSuggestions === `${workout.id}-${movement.name}` ? styles.accordionOpen : ''}`}
                                  onClick={() => toggleSuggestions(`${workout.id}-${movement.name}`)}
                                >
                                  <div className={styles.accordionTitle}>
                                    <span className={styles.movementNameText}>{movement.name}</span>
                                    <span className={styles.usageBadge}>{movement.twoWeekUsage}× used</span>
                                  </div>
                                  <span className={styles.accordionIcon}>
                                    {expandedSuggestions === `${workout.id}-${movement.name}` ? '−' : '+'}
                                  </span>
                                </button>
                                {expandedSuggestions === `${workout.id}-${movement.name}` && (
                                  <div className={styles.accordionContent}>
                                    <p className={styles.suggestionsLabel}>
                                      Swap with a different muscle group:
                                    </p>
                                    {movement.suggestions.length > 0 ? (
                                      <div className={styles.suggestionsList}>
                                        {movement.suggestions.slice(0, 3).map((suggestion, sIdx) => (
                                          <button
                                            key={sIdx}
                                            className={styles.suggestionOption}
                                            onClick={() => {
                                              // TODO: Implement swap functionality
                                              console.log('Swap to:', suggestion.name);
                                            }}
                                          >
                                            <div className={styles.suggestionDetails}>
                                              <span className={styles.suggestionName}>{suggestion.name}</span>
                                              <span className={styles.suggestionMuscles}>
                                                {suggestion.primary_muscle_groups.join(', ')}
                                              </span>
                                            </div>
                                            <span className={styles.selectIndicator}>Select</span>
                                          </button>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className={styles.noSuggestions}>No alternatives found</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className={styles.movementStatic}>
                                <span className={styles.movementNameText}>{movement.name}</span>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Workout Type Breakdown */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>Workout Type Breakdown</h3>
              <div className={styles.sectionHeaderRight}>
                <InfoTooltip content="Shows the mix of workout types you've programmed. A good variety includes AMRAP, EMOM, For Time, and strength work to develop different energy systems." />
                <span className={styles.periodLabel}>{getPeriodButtonLabel(period)}</span>
              </div>
            </div>
            <div className={styles.typeGrid}>
              {analytics.workoutTypeBreakdown.map(stat => (
                <div key={stat.type} className={styles.typeCard}>
                  <div className={styles.typeName}>{stat.type.toUpperCase()}</div>
                  <div className={styles.typeCount}>{stat.count}</div>
                  <div className={styles.typePercentage}>{stat.percentage.toFixed(0)}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Top 10 Movements */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>Top 10 Most Used Movements</h3>
              <InfoTooltip content="Your most frequently programmed movements. If a movement appears too often, consider substituting with similar movements to prevent overuse and add variety." />
            </div>
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
              <div className={styles.sectionHeader}>
                <h3>Detected Biases</h3>
                <InfoTooltip content="Highlights muscle groups that are significantly over or under-represented in your programming. Yellow = not enough focus, Red = too much focus. Aim for balance across all groups." />
              </div>
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
                        <span>({bias.hitCount.toFixed(1)} movements)</span>
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
            <div className={styles.sectionHeader}>
              <h3>Recommendations</h3>
              <InfoTooltip content="AI-generated suggestions based on your programming patterns. Green = positive feedback, yellow = areas to improve, blue = actionable suggestions." />
            </div>
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

      {/* Exercise Detail Modal */}
      {clickedNode && (
        <div className={styles.nodeModalOverlay} onClick={closeNodeModal}>
          <div
            className={styles.nodeModal}
            onClick={(e) => e.stopPropagation()}
            style={{
              borderColor: muscleGroupColors[clickedNode.muscleGroup]
            }}
          >
            <button className={styles.nodeModalClose} onClick={closeNodeModal}>
              ×
            </button>

            <div className={styles.nodeModalHeader}>
              <div
                className={styles.nodeModalIcon}
                style={{ backgroundColor: muscleGroupColors[clickedNode.muscleGroup] }}
              />
              <div>
                <h4 className={styles.nodeModalTitle}>
                  {clickedNode.muscleGroup.charAt(0).toUpperCase() + clickedNode.muscleGroup.slice(1)}
                </h4>
                <p className={styles.nodeModalSubtitle}>
                  {clickedNode.dayLabel} {new Date(clickedNode.date).getDate()} • {clickedNode.hitCount.toFixed(1)} movements
                </p>
              </div>
            </div>

            <div className={styles.nodeModalContent}>
              {loadingExercises ? (
                <div className={styles.nodeModalLoading}>Loading exercises...</div>
              ) : exerciseDetails.length === 0 ? (
                <div className={styles.nodeModalEmpty}>No exercises found</div>
              ) : (
                <>
                  <p className={styles.nodeModalSectionLabel}>Movements for this day</p>
                  <ul className={styles.exerciseList}>
                    {exerciseDetails.map((exercise, idx) => (
                      <li key={idx} className={styles.exerciseItem}>
                        <div className={styles.exerciseMain}>
                          <span className={styles.exerciseName}>{exercise.name}</span>
                          <span className={`${styles.exerciseType} ${exercise.isPrimary ? styles.primary : styles.secondary}`}>
                            {exercise.isPrimary ? 'Primary' : 'Secondary'}
                          </span>
                        </div>
                        {exercise.twoWeekUsage >= 3 && (
                          <div className={styles.highUsageIndicator}>
                            <span className={styles.highUsageText}>{exercise.twoWeekUsage}× in 2 weeks</span>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
