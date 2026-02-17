import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { Section, Container, Card, Button, Modal } from '../components/common';
import { EditIcon, DeleteIcon } from '../components/common/Icons';
import { WODEditorEnhanced } from '../components/WODEditor/WODEditorEnhanced';
import { CoachAnalytics } from '../components/CoachAnalytics/CoachAnalytics';
import { UserManagement } from '../components/UserManagement';
import { AccountingIntegrationCard } from '../components/AccountingIntegration/AccountingIntegrationCard';
import { workoutService } from '../services/workoutService';
import { analyticsService } from '../services/analyticsService';
import { accountingService } from '../services/accountingService';
import type { WorkoutDB, WorkoutFormData, MuscleGroup } from '../types';
import type { AccountingIntegration } from '../components/AccountingIntegration/AccountingIntegrationCard';
import styles from './CoachDashboard.module.scss';

// Calendar helper functions
const getMonthDays = (date: Date): (Date | null)[] => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Get the day of week for the first day (0 = Sunday, adjust for Monday start)
  let startPadding = firstDay.getDay() - 1;
  if (startPadding < 0) startPadding = 6; // Sunday becomes 6

  const days: (Date | null)[] = [];

  // Add padding for days before the first of the month
  for (let i = 0; i < startPadding; i++) {
    days.push(null);
  }

  // Add all days of the month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    days.push(new Date(year, month, day));
  }

  // Add padding to complete the last week
  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
};

const getWorkoutsForDate = (date: Date, workouts: WorkoutDB[]): WorkoutDB[] => {
  const dateStr = date.toISOString().split('T')[0];
  return workouts.filter(w => w.date === dateStr);
};

const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();
};

const CoachDashboard = () => {
  const { user, logout } = useAuth();
  const permissions = usePermissions();
  const [activeTab, setActiveTab] = useState<'overview' | 'create' | 'manage' | 'drafts' | 'analytics' | 'users' | 'staff' | 'accounting'>('overview');
  const [workouts, setWorkouts] = useState<WorkoutDB[]>([]);
  const [todaysWorkout, setTodaysWorkout] = useState<WorkoutDB | null>(null);
  const [editingWorkout, setEditingWorkout] = useState<WorkoutDB | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Adjust to Monday
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    return monday;
  });
  const [newWorkoutDate, setNewWorkoutDate] = useState<string | null>(null);
  const [workoutMuscleGroups, setWorkoutMuscleGroups] = useState<Record<string, MuscleGroup[]>>({});
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [modalEditingWorkout, setModalEditingWorkout] = useState<WorkoutDB | null>(null);
  const [modalNewDate, setModalNewDate] = useState<string | null>(null);
  const [accountingIntegrations, setAccountingIntegrations] = useState<AccountingIntegration[]>([]);
  const [accountingLoading, setAccountingLoading] = useState(false);

  useEffect(() => {
    loadWorkouts();
  }, []);

  useEffect(() => {
    // Handle OAuth callback on page load
    const callbackResult = accountingService.handleOAuthCallback();
    if (callbackResult.success && callbackResult.provider) {
      alert(`Successfully connected to ${callbackResult.provider === 'quickbooks' ? 'QuickBooks' : 'Xero'}!`);
      loadAccountingIntegrations();
      setActiveTab('accounting');
    } else if (!callbackResult.success && callbackResult.error) {
      alert(`Failed to connect: ${callbackResult.error}`);
      setActiveTab('accounting');
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'accounting') {
      loadAccountingIntegrations();
    }
  }, [activeTab]);

  const loadWorkouts = async () => {
    setIsLoading(true);
    try {
      const [today, all] = await Promise.all([
        workoutService.getTodaysWorkout(),
        workoutService.getAllWorkouts(90), // Fetch more workouts for calendar view
      ]);
      setTodaysWorkout(today);
      setWorkouts(all);

      // Load muscle group data for each workout
      const muscleGroupsMap: Record<string, MuscleGroup[]> = {};
      await Promise.all(
        all.map(async (workout) => {
          const topMuscles = await analyticsService.getTopMuscleGroupsForWorkout(workout, 3);
          muscleGroupsMap[workout.id] = topMuscles;
        })
      );
      setWorkoutMuscleGroups(muscleGroupsMap);
    } catch (error) {
      console.error('Error loading workouts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWorkout = async (workout: WorkoutFormData) => {
    try {
      await workoutService.createWorkout(workout);
      await loadWorkouts();
      setActiveTab('overview');
    } catch (error) {
      console.error('Failed to create workout:', error);
      alert('Failed to create workout. Please try again.');
    }
  };

  const handleUpdateWorkout = async (workout: WorkoutFormData) => {
    if (editingWorkout) {
      try {
        await workoutService.updateWorkout(editingWorkout.id, workout);
        await loadWorkouts();
        setEditingWorkout(null);
        setActiveTab('manage');
      } catch (error) {
        console.error('Failed to update workout:', error);
        alert('Failed to update workout. Please try again.');
      }
    }
  };

  const handleDeleteWorkout = async (id: string) => {
    if (!permissions.canDeleteWorkouts) {
      alert('Only admins can delete workouts');
      return;
    }
    if (confirm('Are you sure you want to delete this workout?')) {
      await workoutService.deleteWorkout(id);
      await loadWorkouts();
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const loadAccountingIntegrations = async () => {
    setAccountingLoading(true);
    try {
      const integrations = await accountingService.getIntegrations();
      setAccountingIntegrations(integrations);
    } catch (error) {
      console.error('Error loading accounting integrations:', error);
      alert('Failed to load accounting integrations');
    } finally {
      setAccountingLoading(false);
    }
  };

  const handleConnectAccounting = async (provider: 'quickbooks' | 'xero') => {
    try {
      // Get authorization URL from backend
      const authUrl = await accountingService.connectProvider(provider);

      // Redirect to OAuth authorization page
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error connecting to accounting provider:', error);
      throw error;
    }
  };

  const handleDisconnectAccounting = async (provider: 'quickbooks' | 'xero') => {
    try {
      await accountingService.disconnectProvider(provider);
      await loadAccountingIntegrations();
    } catch (error) {
      console.error('Error disconnecting from accounting provider:', error);
      throw error;
    }
  };

  // Calendar navigation
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeekStart(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + (direction === 'next' ? 7 : -7));
      return newDate;
    });
  };

  const getWeekDays = (): Date[] => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(currentWeekStart);
      day.setDate(currentWeekStart.getDate() + i);
      days.push(day);
    }
    return days;
  };

  // Modal handlers for editing from manage page
  const openEditModal = (workout: WorkoutDB) => {
    setModalEditingWorkout(workout);
    setModalNewDate(null);
    setIsEditorModalOpen(true);
  };

  const openCreateModal = (date: Date) => {
    setModalEditingWorkout(null);
    setModalNewDate(date.toISOString().split('T')[0]);
    setIsEditorModalOpen(true);
  };

  const closeEditorModal = () => {
    setIsEditorModalOpen(false);
    setModalEditingWorkout(null);
    setModalNewDate(null);
  };

  const handleModalSave = async (workout: WorkoutFormData) => {
    try {
      if (modalEditingWorkout) {
        await workoutService.updateWorkout(modalEditingWorkout.id, workout);
      } else {
        await workoutService.createWorkout(workout);
      }
      await loadWorkouts();
      closeEditorModal();
    } catch (error) {
      console.error('Failed to save workout:', error);
      alert('Failed to save workout. Please try again.');
    }
  };

  // Muscle group display helpers
  const getMuscleGroupColor = (mg: MuscleGroup): string => {
    const colors: Record<MuscleGroup, string> = {
      shoulders: '#f97316', // orange
      back: '#3b82f6',      // blue
      chest: '#ef4444',     // red
      arms: '#8b5cf6',      // purple
      legs: '#22c55e',      // green
      core: '#eab308',      // yellow
      'full body': '#607d8b'  // blue-grey
    };
    return colors[mg] || '#64748b';
  };

  const getMuscleGroupAbbr = (mg: MuscleGroup): string => {
    const abbrs: Record<MuscleGroup, string> = {
      shoulders: 'SH',
      back: 'BK',
      chest: 'CH',
      arms: 'AR',
      legs: 'LG',
      core: 'CO',
      'full body': 'FB'
    };
    return abbrs[mg] || mg.substring(0, 2).toUpperCase();
  };

  // Calculate weekly muscle group distribution
  const getWeeklyMuscleDistribution = (weekStart: Date): { muscle: MuscleGroup; count: number; percentage: number }[] => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const muscleCount: Record<MuscleGroup, number> = {
      shoulders: 0, back: 0, chest: 0, arms: 0, legs: 0, core: 0, 'full body': 0
    };

    workouts.forEach(workout => {
      const workoutDate = new Date(workout.date);
      if (workoutDate >= weekStart && workoutDate <= weekEnd) {
        const muscles = workoutMuscleGroups[workout.id] || [];
        muscles.forEach(mg => {
          if (muscleCount[mg] !== undefined) {
            muscleCount[mg]++;
          } else {
            // Handle potentially unknown muscle groups gracefully
            muscleCount[mg] = 1;
          }
        });
      }
    });

    const total = Object.values(muscleCount).reduce((a, b) => a + b, 0);

    return (Object.entries(muscleCount) as [MuscleGroup, number][])
      .map(([muscle, count]) => ({
        muscle,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count);
  };

  // Get week start for a given date (Monday)
  const getWeekStartForDate = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  if (!user) return null;

  return (
    <Section spacing="large" background="default">
      <Container>
        <div className={styles.dashboard}>
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Admin View</h1>
              <p className={styles.subtitle}>
                Welcome back, {user.name}!
              </p>
            </div>
            <Button variant="secondary" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>

          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'overview' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'create' ? styles.tabActive : ''}`}
              onClick={() => {
                setEditingWorkout(null);
                setActiveTab('create');
              }}
            >
              Create Workout
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'manage' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('manage')}
            >
              Manage Workouts
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'analytics' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              Analytics
            </button>
            {permissions.canManageUsers && (
              <>
                <button
                  className={`${styles.tab} ${activeTab === 'users' ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab('users')}
                >
                  Manage Members
                </button>
                <button
                  className={`${styles.tab} ${activeTab === 'staff' ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab('staff')}
                >
                  Manage Staff
                </button>
                <button
                  className={`${styles.tab} ${activeTab === 'accounting' ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab('accounting')}
                >
                  Accounting
                </button>
              </>
            )}
          </div>

          <div className={styles.content}>
            {activeTab === 'overview' && (
              <div className={styles.tabContent}>
                <h2 className={styles.sectionTitle}>Today&apos;s Workout</h2>
                {todaysWorkout ? (
                  <Card variant="elevated">
                    <div className={styles.workoutPreview}>
                      <h3>{todaysWorkout.title}</h3>
                      <p className={styles.workoutType}>{todaysWorkout.type.toUpperCase()}</p>
                      <p>{todaysWorkout.description}</p>
                      {todaysWorkout.metcon && todaysWorkout.metcon.length > 0 && (
                        <div className={styles.movements}>
                          {todaysWorkout.metcon.map((m, i) => (
                            <div key={i}>• {m}</div>
                          ))}
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="small"
                        onClick={() => {
                          setEditingWorkout(todaysWorkout);
                          setActiveTab('create');
                        }}
                      >
                        <EditIcon size={16} />
                        <span style={{ marginLeft: '0.5rem' }}>Edit</span>
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <Card variant="elevated">
                    <p>No workout scheduled for today.</p>
                    <Button
                      variant="primary"
                      onClick={() => setActiveTab('create')}
                    >
                      Create Today&apos;s Workout
                    </Button>
                  </Card>
                )}

                <h2 className={styles.sectionTitle}>Quick Stats</h2>
                <div className={styles.statsGrid}>
                  <Card variant="elevated" hoverable onClick={() => setActiveTab('manage')}>
                    <div className={styles.statCard}>
                      <div className={styles.statValue}>
                        {workouts.filter(w => w.status === 'published').length}
                      </div>
                      <div className={styles.statLabel}>Published</div>
                      <div className={styles.statCta}>View Calendar &rarr;</div>
                    </div>
                  </Card>
                  <Card variant="elevated" hoverable onClick={() => setActiveTab('drafts')}>
                    <div className={styles.statCard}>
                      <div className={styles.statValue}>
                        {workouts.filter(w => w.status === 'draft').length}
                      </div>
                      <div className={styles.statLabel}>Drafts</div>
                      <div className={styles.statCta}>Review Drafts &rarr;</div>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === 'create' && (
              <div className={styles.tabContent}>
                <WODEditorEnhanced
                  initialData={editingWorkout || (newWorkoutDate ? { date: newWorkoutDate } : undefined)}
                  onSave={editingWorkout ? handleUpdateWorkout : handleCreateWorkout}
                  onCancel={() => {
                    setNewWorkoutDate(null);
                    setActiveTab('overview');
                  }}
                  isEditing={!!editingWorkout}
                />
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className={styles.tabContent}>
                <CoachAnalytics />
              </div>
            )}

            {activeTab === 'manage' && (
              <div className={styles.tabContent}>
                {isLoading ? (
                  <p>Loading...</p>
                ) : (
                  <>
                    {/* Desktop: Monthly Calendar View */}
                    <div className={styles.calendarDesktop}>
                      <div className={styles.calendarHeader}>
                        <Button variant="ghost" size="small" onClick={() => navigateMonth('prev')}>
                          &larr; Prev
                        </Button>
                        <h2 className={styles.calendarTitle}>
                          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h2>
                        <Button variant="ghost" size="small" onClick={() => navigateMonth('next')}>
                          Next &rarr;
                        </Button>
                      </div>

                      <div className={styles.calendarWeekdays}>
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                          <div key={day} className={styles.calendarWeekday}>{day}</div>
                        ))}
                        <div className={styles.calendarWeekday}>Week Focus</div>
                      </div>

                      {/* Render calendar week by week with summary */}
                      {(() => {
                        const days = getMonthDays(currentMonth);
                        const weeks: (Date | null)[][] = [];
                        for (let i = 0; i < days.length; i += 7) {
                          weeks.push(days.slice(i, i + 7));
                        }

                        return weeks.map((week, weekIndex) => {
                          // Get the first valid day of the week to calculate distribution
                          const firstValidDay = week.find(d => d !== null);
                          const weekStart = firstValidDay ? getWeekStartForDate(firstValidDay) : null;
                          const weekDistribution = weekStart ? getWeeklyMuscleDistribution(weekStart) : [];

                          return (
                            <div key={weekIndex} className={styles.calendarWeekRow}>
                              <div className={styles.calendarWeekDays}>
                                {week.map((day, dayIndex) => {
                                  const today = new Date();
                                  const isToday = day && isSameDay(day, today);
                                  const dayWorkouts = day ? getWorkoutsForDate(day, workouts) : [];
                                  const isOutOfMonth = day && day.getMonth() !== currentMonth.getMonth();

                                  return (
                                    <div
                                      key={dayIndex}
                                      className={
                                        `${styles.calendarDay} ${!day ? styles.calendarDayEmpty : ''} ${isToday ? styles.calendarDayToday : ''} ${isOutOfMonth ? styles.calendarDayOutOfMonth : ''}`
                                      }
                                      onClick={() => day && !isOutOfMonth && dayWorkouts.length === 0 && openCreateModal(day)}
                                    >
                                      {day && (
                                        <>
                                          <div className={styles.calendarDayNumber}>{day.getDate()}</div>
                                          <div className={styles.calendarDayWorkouts}>
                                            {dayWorkouts.map(workout => (
                                              <div
                                                key={workout.id}
                                                className={`${styles.workoutCard} ${workout.status === 'draft' ? styles.workoutCardDraft : styles.workoutCardPublished}`}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  openEditModal(workout);
                                                }}
                                              >
                                                <span className={styles.workoutCardTitle}>{workout.title}</span>
                                                <div className={styles.workoutCardMeta}>
                                                  <span className={styles.workoutCardType}>{workout.type.toUpperCase()}</span>
                                                  {workoutMuscleGroups[workout.id] && workoutMuscleGroups[workout.id].length > 0 && (
                                                    <div className={styles.muscleGroupIndicators}>
                                                      {workoutMuscleGroups[workout.id].map(mg => (
                                                        <span
                                                          key={mg}
                                                          className={styles.muscleGroupDot}
                                                          style={{ backgroundColor: getMuscleGroupColor(mg) }}
                                                          title={mg}
                                                        />
                                                      ))}
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                          {dayWorkouts.length === 0 && (
                                            <div className={styles.calendarDayAdd}>+</div>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                              <div className={styles.weekSummary}>
                                {weekDistribution.length > 0 ? (
                                  <>
                                    {/* Primary Focus Highlight */}
                                    <div
                                      className={styles.weekFocusHighlight}
                                      style={{
                                        backgroundColor: getMuscleGroupColor(weekDistribution[0].muscle),
                                        boxShadow: `0 0 12px ${getMuscleGroupColor(weekDistribution[0].muscle)}40`
                                      }}
                                    >
                                      <span className={styles.weekFocusLabel}>
                                        {weekDistribution[0].muscle.toUpperCase()}
                                      </span>
                                      <span className={styles.weekFocusPercent}>
                                        {Math.round(weekDistribution[0].percentage)}%
                                      </span>
                                    </div>
                                    {/* Distribution Bar */}
                                    <div className={styles.weekSummaryBar}>
                                      {weekDistribution.map(({ muscle, percentage }) => (
                                        <div
                                          key={muscle}
                                          className={styles.weekSummarySegment}
                                          style={{
                                            backgroundColor: getMuscleGroupColor(muscle),
                                            width: `${percentage}%`
                                          }}
                                          title={`${muscle}: ${Math.round(percentage)}%`}
                                        />
                                      ))}
                                    </div>
                                    {/* Secondary muscles */}
                                    <div className={styles.weekSummaryLabels}>
                                      {weekDistribution.slice(1, 3).map(({ muscle, count }) => (
                                        <span
                                          key={muscle}
                                          className={styles.weekSummaryLabel}
                                          style={{ color: getMuscleGroupColor(muscle) }}
                                        >
                                          {muscle.slice(0, 3).toUpperCase()} {count}×
                                        </span>
                                      ))}
                                    </div>
                                  </>
                                ) : (
                                  <span className={styles.weekSummaryEmpty}>No data</span>
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>

                    {/* Mobile: Week View */}
                    <div className={styles.calendarMobile}>
                      <div className={styles.calendarHeader}>
                        <Button variant="ghost" size="small" onClick={() => navigateWeek('prev')}>
                          &larr;
                        </Button>
                        <h2 className={styles.calendarTitle}>
                          {currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {(() => {
                            const endDate = new Date(currentWeekStart);
                            endDate.setDate(currentWeekStart.getDate() + 6);
                            return endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                          })()}
                        </h2>
                        <Button variant="ghost" size="small" onClick={() => navigateWeek('next')}>
                          &rarr;
                        </Button>
                      </div>

                      {/* Mobile Weekly Summary */}
                      {(() => {
                        const weekDistribution = getWeeklyMuscleDistribution(currentWeekStart);
                        return weekDistribution.length > 0 && (
                          <div className={styles.mobileWeekSummary}>
                            <div className={styles.mobileWeekSummaryHeader}>Week Focus</div>
                            {/* Primary Focus Highlight */}
                            <div
                              className={styles.mobileWeekFocusHighlight}
                              style={{
                                backgroundColor: getMuscleGroupColor(weekDistribution[0].muscle),
                                boxShadow: `0 0 16px ${getMuscleGroupColor(weekDistribution[0].muscle)}50`
                              }}
                            >
                              <span className={styles.mobileWeekFocusLabel}>
                                {weekDistribution[0].muscle.toUpperCase()}
                              </span>
                              <span className={styles.mobileWeekFocusPercent}>
                                {Math.round(weekDistribution[0].percentage)}%
                              </span>
                            </div>
                            {/* Distribution Bar */}
                            <div className={styles.mobileWeekSummaryBar}>
                              {weekDistribution.map(({ muscle, percentage }) => (
                                <div
                                  key={muscle}
                                  className={styles.weekSummarySegment}
                                  style={{
                                    backgroundColor: getMuscleGroupColor(muscle),
                                    width: `${percentage}%`
                                  }}
                                />
                              ))}
                            </div>
                            {/* Secondary muscles */}
                            <div className={styles.mobileWeekSummaryLabels}>
                              {weekDistribution.slice(1).map(({ muscle, count }) => (
                                <span
                                  key={muscle}
                                  className={styles.mobileWeekSummaryLabel}
                                  style={{ backgroundColor: getMuscleGroupColor(muscle) }}
                                >
                                  {muscle.slice(0, 3).toUpperCase()} {count}×
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      <div className={styles.weekView}>
                        {getWeekDays().map((day, index) => {
                          const today = new Date();
                          const isToday = isSameDay(day, today);
                          const dayWorkouts = getWorkoutsForDate(day, workouts);

                          return (
                            <div
                              key={index}
                              className={`${styles.weekDay} ${isToday ? styles.weekDayToday : ''}`}
                            >
                              <div className={styles.weekDayHeader}>
                                <span className={styles.weekDayName}>
                                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                                </span>
                                <span className={styles.weekDayNumber}>{day.getDate()}</span>
                              </div>
                              <div className={styles.weekDayWorkouts}>
                                {dayWorkouts.map(workout => (
                                  <div
                                    key={workout.id}
                                    className={`${styles.workoutCard} ${workout.status === 'draft' ? styles.workoutCardDraft : styles.workoutCardPublished}`}
                                    onClick={() => openEditModal(workout)}
                                  >
                                    <span className={styles.workoutCardTitle}>{workout.title}</span>
                                    <div className={styles.workoutCardMeta}>
                                      <span className={styles.workoutCardType}>{workout.type.toUpperCase()}</span>
                                      {workoutMuscleGroups[workout.id] && workoutMuscleGroups[workout.id].length > 0 && (
                                        <div className={styles.muscleGroupIndicators}>
                                          {workoutMuscleGroups[workout.id].map(mg => (
                                            <span
                                              key={mg}
                                              className={styles.muscleGroupBadge}
                                              style={{ backgroundColor: getMuscleGroupColor(mg) }}
                                            >
                                              {getMuscleGroupAbbr(mg)}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                                {dayWorkouts.length === 0 && (
                                  <button
                                    className={styles.addWorkoutBtn}
                                    onClick={() => openCreateModal(day)}
                                  >
                                    + Add Workout
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'drafts' && (
              <div className={styles.tabContent}>
                <h2 className={styles.sectionTitle}>Draft Workouts</h2>
                {(() => {
                  const draftWorkouts = workouts.filter(w => w.status === 'draft');
                  if (draftWorkouts.length === 0) {
                    return (
                      <Card variant="elevated">
                        <p>No draft workouts found.</p>
                        <Button variant="primary" onClick={() => setActiveTab('create')}>
                          Create New Workout
                        </Button>
                      </Card>
                    );
                  }
                  return (
                    <div className={styles.draftsList}>
                      {draftWorkouts.map(workout => (
                        <Card key={workout.id} variant="elevated" hoverable>
                          <div className={styles.draftItem}>
                            <div className={styles.draftInfo}>
                              <h3>{workout.title}</h3>
                              <div className={styles.draftMeta}>
                                <span className={styles.draftDate}>
                                  {new Date(workout.date).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                                <span className={styles.draftType}>{workout.type.toUpperCase()}</span>
                              </div>
                              {workout.description && (
                                <p className={styles.draftDescription}>{workout.description}</p>
                              )}
                            </div>
                            <div className={styles.draftActions}>
                              <Button
                                variant="primary"
                                size="small"
                                onClick={() => {
                                  setEditingWorkout(workout);
                                  setActiveTab('create');
                                }}
                              >
                                <EditIcon size={16} />
                                Edit
                              </Button>
                              {permissions.canDeleteWorkouts && (
                                <Button
                                  variant="ghost"
                                  size="small"
                                  onClick={() => handleDeleteWorkout(workout.id)}
                                >
                                  <DeleteIcon size={16} />
                                  Delete
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {activeTab === 'users' && (
              <div className={styles.tabContent}>
                <UserManagement
                  fixedRoleFilter="member"
                  title="Member Management"
                />
              </div>
            )}

            {activeTab === 'staff' && (
              <div className={styles.tabContent}>
                <UserManagement
                  fixedRoleFilter={['staff', 'coach']}
                  title="Staff Management"
                  hideInvite
                />
              </div>
            )}

            {activeTab === 'accounting' && (
              <div className={styles.tabContent}>
                <div style={{ marginBottom: '2rem' }}>
                  <h2 className={styles.sectionTitle}>Accounting Software Integration</h2>
                  <p style={{ color: 'var(--color-text-secondary, #666)', marginTop: '0.5rem' }}>
                    Connect your accounting software to automatically sync payment transactions.
                    Currently supporting QuickBooks and Xero.
                  </p>
                </div>

                {accountingLoading && !accountingIntegrations.length ? (
                  <Card variant="elevated">
                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                      Loading integrations...
                    </div>
                  </Card>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                    <AccountingIntegrationCard
                      provider="quickbooks"
                      integration={accountingIntegrations.find(i => i.provider === 'quickbooks') || null}
                      onConnect={handleConnectAccounting}
                      onDisconnect={handleDisconnectAccounting}
                      loading={accountingLoading}
                    />
                    <AccountingIntegrationCard
                      provider="xero"
                      integration={accountingIntegrations.find(i => i.provider === 'xero') || null}
                      onConnect={handleConnectAccounting}
                      onDisconnect={handleDisconnectAccounting}
                      loading={accountingLoading}
                    />
                  </div>
                )}

                <Card variant="elevated" style={{ marginTop: '2rem' }}>
                  <div style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginTop: 0 }}>How It Works</h3>
                    <ol style={{ lineHeight: '1.8', color: 'var(--color-text-secondary, #666)' }}>
                      <li>Click "Connect to QuickBooks" or "Connect to Xero" above</li>
                      <li>Sign in to your accounting software and authorize the connection</li>
                      <li>Payment transactions will automatically sync to your accounting software</li>
                      <li>View sync history and manage settings in the Accounting dashboard</li>
                    </ol>
                    <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--color-text-tertiary, #999)' }}>
                      <strong>Note:</strong> Only administrators can connect and manage accounting integrations.
                      All OAuth tokens are encrypted using AES-256-GCM encryption for security.
                    </p>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Editor Modal for Manage Workouts page */}
        <Modal isOpen={isEditorModalOpen} onClose={closeEditorModal} size="large">
          <WODEditorEnhanced
            initialData={modalEditingWorkout || (modalNewDate ? { date: modalNewDate } : undefined)}
            onSave={handleModalSave}
            onCancel={closeEditorModal}
            isEditing={!!modalEditingWorkout}
          />
        </Modal>
      </Container>
    </Section>
  );
};

export default CoachDashboard;
