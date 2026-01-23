import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Section, Container, Button, Card } from '../components/common';
import { WorkoutViewDrawer } from '../components/WODEditor/WorkoutViewDrawer';
import { CoachProfileEditor } from '../components/CoachProfileEditor';
import { workoutService } from '../services/workoutService';
import { analyticsService } from '../services/analyticsService';
import { wodBookingService, type BookingWithUser, MAX_WORKOUT_CAPACITY } from '../services/wodBookingService';
import { coachServicesService, type CoachService, type ServiceBooking, SERVICE_LABELS, SERVICE_DESCRIPTIONS } from '../services/coachServicesService';
import type { WorkoutDB, MuscleGroup } from '../types';
import styles from './CoachDashboard.module.scss';

// Calendar helper functions
const getMonthDays = (date: Date): (Date | null)[] => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  let startPadding = firstDay.getDay() - 1;
  if (startPadding < 0) startPadding = 6;

  const days: (Date | null)[] = [];

  for (let i = 0; i < startPadding; i++) {
    days.push(null);
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    days.push(new Date(year, month, day));
  }

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
};

const getWorkoutsForDate = (date: Date, workouts: WorkoutDB[]): WorkoutDB[] => {
  const dateStr = date.toISOString().split('T')[0];
  return workouts.filter(w => w.date === dateStr);
};

const getServiceBookingsForDate = (date: Date, bookings: ServiceBooking[]): ServiceBooking[] => {
  const dateStr = date.toISOString().split('T')[0];
  return bookings.filter(b => b.bookingDate === dateStr && b.status !== 'cancelled');
};

const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();
};

type TabType = 'today' | 'calendar' | 'services' | 'profile';

const CoachView = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [workouts, setWorkouts] = useState<WorkoutDB[]>([]);
  const [todaysWorkout, setTodaysWorkout] = useState<WorkoutDB | null>(null);
  const [todaysBookings, setTodaysBookings] = useState<BookingWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutDB | null>(null);
  const [selectedWorkoutBookings, setSelectedWorkoutBookings] = useState<BookingWithUser[]>([]);
  const [workoutMuscleGroups, setWorkoutMuscleGroups] = useState<Record<string, MuscleGroup[]>>({});
  const [myServices, setMyServices] = useState<CoachService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [serviceBookings, setServiceBookings] = useState<ServiceBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [editingRateValue, setEditingRateValue] = useState<string>('');
  const [savingRate, setSavingRate] = useState(false);
  const [allServiceBookings, setAllServiceBookings] = useState<ServiceBooking[]>([]);
  const [selectedServiceBooking, setSelectedServiceBooking] = useState<ServiceBooking | null>(null);

  useEffect(() => {
    loadWorkouts();
  }, []);

  // Load coach services and bookings when user is available
  useEffect(() => {
    if (user?.id) {
      loadMyServices();
      loadServiceBookings();
    }
  }, [user?.id]);

  const loadMyServices = async () => {
    if (!user?.id) return;
    setServicesLoading(true);
    try {
      const services = await coachServicesService.getCoachServices(user.id);
      setMyServices(services.filter(s => s.isActive));
    } catch (error) {
      console.error('Error loading coach services:', error);
    } finally {
      setServicesLoading(false);
    }
  };

  const loadServiceBookings = async () => {
    if (!user?.id) return;
    setBookingsLoading(true);
    try {
      const bookings = await coachServicesService.getCoachBookings(user.id);
      // Store all bookings for the calendar
      setAllServiceBookings(bookings);
      // Filter to only show upcoming/active bookings for the services tab
      const today = new Date().toISOString().split('T')[0];
      const upcomingBookings = bookings.filter(
        b => b.bookingDate >= today && b.status !== 'cancelled' && b.status !== 'completed'
      );
      setServiceBookings(upcomingBookings);
    } catch (error) {
      console.error('Error loading service bookings:', error);
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleConfirmBooking = async (bookingId: string) => {
    try {
      await coachServicesService.updateBookingStatus(bookingId, 'confirmed');
      loadServiceBookings();
    } catch (error) {
      console.error('Error confirming booking:', error);
      alert('Failed to confirm booking. Please try again.');
    }
  };

  const handleDeclineBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to decline this booking?')) return;
    try {
      await coachServicesService.updateBookingStatus(bookingId, 'cancelled');
      loadServiceBookings();
    } catch (error) {
      console.error('Error declining booking:', error);
      alert('Failed to decline booking. Please try again.');
    }
  };

  const handleCompleteBooking = async (bookingId: string) => {
    try {
      await coachServicesService.updateBookingStatus(bookingId, 'completed');
      loadServiceBookings();
    } catch (error) {
      console.error('Error completing booking:', error);
      alert('Failed to mark booking as complete. Please try again.');
    }
  };

  const handleStartEditRate = (service: CoachService) => {
    setEditingRateId(service.id);
    setEditingRateValue(service.hourlyRate?.toString() || '');
  };

  const handleCancelEditRate = () => {
    setEditingRateId(null);
    setEditingRateValue('');
  };

  const handleSaveRate = async (serviceId: string) => {
    const rate = parseFloat(editingRateValue);
    if (isNaN(rate) || rate < 0) {
      alert('Please enter a valid rate (0 or greater)');
      return;
    }

    setSavingRate(true);
    try {
      await coachServicesService.updateServiceRate(serviceId, rate);
      // Update local state
      setMyServices(prev => prev.map(s =>
        s.id === serviceId ? { ...s, hourlyRate: rate } : s
      ));
      setEditingRateId(null);
      setEditingRateValue('');
    } catch (error) {
      console.error('Error saving rate:', error);
      alert('Failed to save rate. Please try again.');
    } finally {
      setSavingRate(false);
    }
  };

  // Load bookings when today's workout changes
  useEffect(() => {
    if (todaysWorkout) {
      loadTodaysBookings(todaysWorkout.id);
    }
  }, [todaysWorkout]);

  // Load bookings when selected workout changes
  useEffect(() => {
    if (selectedWorkout) {
      loadSelectedWorkoutBookings(selectedWorkout.id);
    }
  }, [selectedWorkout]);

  const loadWorkouts = async () => {
    setIsLoading(true);
    try {
      const [today, all] = await Promise.all([
        workoutService.getTodaysWorkout(),
        workoutService.getAllWorkouts(90),
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

  const loadTodaysBookings = async (workoutId: string) => {
    try {
      const bookings = await wodBookingService.getWorkoutBookings(workoutId);
      setTodaysBookings(bookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  };

  const loadSelectedWorkoutBookings = async (workoutId: string) => {
    try {
      const bookings = await wodBookingService.getWorkoutBookings(workoutId);
      setSelectedWorkoutBookings(bookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  // Muscle group display helpers
  const getMuscleGroupColor = (mg: MuscleGroup): string => {
    const colors: Record<MuscleGroup, string> = {
      shoulders: '#f97316',
      back: '#3b82f6',
      chest: '#ef4444',
      arms: '#8b5cf6',
      legs: '#22c55e',
      core: '#eab308',
      'full body': '#607d8b'
    };
    return colors[mg] || '#64748b';
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

  if (!user) {
    return null;
  }

  const today = new Date();

  return (
    <Section spacing="large" background="default">
      <Container>
        <div className={styles.dashboard}>
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Coach View</h1>
              <p className={styles.subtitle}>
                Welcome back, {user.name}!
              </p>
            </div>
            <Button variant="secondary" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>

          {/* Tabs */}
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === 'today' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('today')}
            >
              Today's Class
            </button>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === 'calendar' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('calendar')}
            >
              Calendar
            </button>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === 'services' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('services')}
            >
              My Services
            </button>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === 'profile' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              My Profile
            </button>
          </div>

          <div className={styles.content}>
            {isLoading ? (
              <p>Loading...</p>
            ) : (
              <>
                {/* Today's Class Tab */}
                {activeTab === 'today' && (
                  <div className={styles.tabContent}>
                    {todaysWorkout ? (
                      <div className={styles.todayGrid}>
                        {/* Workout Details */}
                        <Card variant="elevated">
                          <div className={styles.todayWorkout}>
                            <div className={styles.todayWorkoutHeader}>
                              <span className={styles.todayWorkoutType}>{todaysWorkout.type.toUpperCase()}</span>
                              <h2 className={styles.todayWorkoutTitle}>{todaysWorkout.title}</h2>
                              <p className={styles.todayWorkoutDate}>
                                {new Date(todaysWorkout.date).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>

                            {todaysWorkout.description && (
                              <p className={styles.todayWorkoutDescription}>{todaysWorkout.description}</p>
                            )}

                            {todaysWorkout.warmup && todaysWorkout.warmup.length > 0 && (
                              <div className={styles.todaySection}>
                                <h4>Warmup</h4>
                                <ul>
                                  {todaysWorkout.warmup.map((item, i) => (
                                    <li key={i}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {todaysWorkout.strength && todaysWorkout.strength.length > 0 && (
                              <div className={styles.todaySection}>
                                <h4>Strength</h4>
                                <ul>
                                  {todaysWorkout.strength.map((item, i) => (
                                    <li key={i}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {todaysWorkout.metcon && todaysWorkout.metcon.length > 0 && (
                              <div className={styles.todaySection}>
                                <h4>MetCon</h4>
                                <ul>
                                  {todaysWorkout.metcon.map((item, i) => (
                                    <li key={i}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {todaysWorkout.cooldown && todaysWorkout.cooldown.length > 0 && (
                              <div className={styles.todaySection}>
                                <h4>Cooldown</h4>
                                <ul>
                                  {todaysWorkout.cooldown.map((item, i) => (
                                    <li key={i}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </Card>

                        {/* Bookings List */}
                        <Card variant="elevated">
                          <div className={styles.todayBookings}>
                            <div className={styles.todayBookingsHeader}>
                              <h3>Class Roster</h3>
                              <span className={styles.todayBookingsCount}>
                                {todaysBookings.length} / {MAX_WORKOUT_CAPACITY}
                              </span>
                            </div>

                            <div className={styles.todayCapacityBar}>
                              <div
                                className={styles.todayCapacityFill}
                                style={{ width: `${(todaysBookings.length / MAX_WORKOUT_CAPACITY) * 100}%` }}
                              />
                            </div>

                            {todaysBookings.length === 0 ? (
                              <p className={styles.noBookings}>No bookings yet for today's class.</p>
                            ) : (
                              <ul className={styles.todayBookingList}>
                                {todaysBookings.map((booking, index) => (
                                  <li key={booking.id} className={styles.todayBookingItem}>
                                    <span className={styles.todayBookingNumber}>{index + 1}</span>
                                    <div className={styles.todayBookingInfo}>
                                      <span className={styles.todayBookingName}>{booking.userName}</span>
                                      <span className={styles.todayBookingEmail}>{booking.userEmail}</span>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </Card>
                      </div>
                    ) : (
                      <Card variant="elevated">
                        <div className={styles.noWorkout}>
                          <h3>No Workout Scheduled</h3>
                          <p>There's no workout published for today.</p>
                        </div>
                      </Card>
                    )}
                  </div>
                )}

                {/* Calendar Tab */}
                {activeTab === 'calendar' && (
                  <div className={styles.tabContent}>
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
                          const firstValidDay = week.find(d => d !== null);
                          const weekStart = firstValidDay ? getWeekStartForDate(firstValidDay) : null;
                          const weekDistribution = weekStart ? getWeeklyMuscleDistribution(weekStart) : [];

                          return (
                            <div key={weekIndex} className={styles.calendarWeekRow}>
                              <div className={styles.calendarWeekDays}>
                                {week.map((day, dayIndex) => {
                                  const isToday = day && isSameDay(day, today);
                                  const dayWorkouts = day ? getWorkoutsForDate(day, workouts) : [];
                                  const dayServiceBookings = day ? getServiceBookingsForDate(day, allServiceBookings) : [];
                                  const isOutOfMonth = day && day.getMonth() !== currentMonth.getMonth();

                                  return (
                                    <div
                                      key={dayIndex}
                                      className={
                                        `${styles.calendarDay} ${!day ? styles.calendarDayEmpty : ''} ${isToday ? styles.calendarDayToday : ''} ${isOutOfMonth ? styles.calendarDayOutOfMonth : ''}`
                                      }
                                    >
                                      {day && (
                                        <>
                                          <div className={styles.calendarDayNumber}>{day.getDate()}</div>
                                          <div className={styles.calendarDayWorkouts}>
                                            {/* WOD Workouts */}
                                            {dayWorkouts.map(workout => (
                                              <div
                                                key={workout.id}
                                                className={`${styles.workoutCard} ${workout.status === 'draft' ? styles.workoutCardDraft : styles.workoutCardPublished}`}
                                                onClick={() => setSelectedWorkout(workout)}
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
                                            {/* Service Bookings */}
                                            {dayServiceBookings.map(booking => (
                                              <div
                                                key={booking.id}
                                                className={`${styles.serviceBookingCard} ${styles[`serviceBooking${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}`]}`}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setSelectedServiceBooking(booking);
                                                }}
                                              >
                                                <span className={styles.serviceBookingTitle}>
                                                  {booking.serviceType && SERVICE_LABELS[booking.serviceType]}
                                                </span>
                                                <div className={styles.serviceBookingMeta}>
                                                  <span className={styles.serviceBookingTime}>
                                                    {booking.startTime.slice(0, 5)}
                                                  </span>
                                                  <span className={styles.serviceBookingMember}>
                                                    {booking.memberName?.split(' ')[0]}
                                                  </span>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                              <div className={styles.weekSummary}>
                                {weekDistribution.length > 0 ? (
                                  <>
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

                    {/* Workout Summary Drawer - appears when workout is selected */}
                    {selectedWorkout && (
                      <WorkoutViewDrawer
                        workout={selectedWorkout}
                        bookings={selectedWorkoutBookings}
                        maxCapacity={MAX_WORKOUT_CAPACITY}
                        onClose={() => setSelectedWorkout(null)}
                      />
                    )}

                    {/* Service Booking Detail Drawer */}
                    {selectedServiceBooking && (
                      <div className={styles.serviceBookingDrawer}>
                        <div className={styles.drawerHandle}>
                          <div className={styles.drawerHandleContent}>
                            <div className={styles.drawerIcon}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                              </svg>
                            </div>
                            <h3 className={styles.drawerTitle}>Service Booking</h3>
                            <span className={`${styles.drawerBadge} ${styles[selectedServiceBooking.status]}`}>
                              {selectedServiceBooking.status}
                            </span>
                            <button
                              className={styles.drawerClose}
                              onClick={() => setSelectedServiceBooking(null)}
                            >
                              &times;
                            </button>
                          </div>
                        </div>
                        <div className={styles.drawerContent}>
                          <div className={styles.serviceBookingDetails}>
                            <h2 className={styles.serviceBookingDetailTitle}>
                              {selectedServiceBooking.serviceType && SERVICE_LABELS[selectedServiceBooking.serviceType]}
                            </h2>
                            <div className={styles.serviceBookingDetailRow}>
                              <span className={styles.serviceBookingDetailLabel}>Client</span>
                              <span className={styles.serviceBookingDetailValue}>
                                {selectedServiceBooking.memberName}
                              </span>
                            </div>
                            <div className={styles.serviceBookingDetailRow}>
                              <span className={styles.serviceBookingDetailLabel}>Date</span>
                              <span className={styles.serviceBookingDetailValue}>
                                {new Date(selectedServiceBooking.bookingDate).toLocaleDateString('en-GB', {
                                  weekday: 'long',
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                            <div className={styles.serviceBookingDetailRow}>
                              <span className={styles.serviceBookingDetailLabel}>Time</span>
                              <span className={styles.serviceBookingDetailValue}>
                                {selectedServiceBooking.startTime.slice(0, 5)} - {selectedServiceBooking.endTime.slice(0, 5)}
                              </span>
                            </div>
                            {selectedServiceBooking.notes && (
                              <div className={styles.serviceBookingDetailRow}>
                                <span className={styles.serviceBookingDetailLabel}>Notes</span>
                                <span className={styles.serviceBookingDetailValue}>
                                  {selectedServiceBooking.notes}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className={styles.serviceBookingDrawerActions}>
                            {selectedServiceBooking.status === 'pending' && (
                              <>
                                <Button
                                  variant="primary"
                                  size="medium"
                                  onClick={() => {
                                    handleConfirmBooking(selectedServiceBooking.id);
                                    setSelectedServiceBooking(null);
                                  }}
                                >
                                  Confirm Booking
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="medium"
                                  onClick={() => {
                                    handleDeclineBooking(selectedServiceBooking.id);
                                    setSelectedServiceBooking(null);
                                  }}
                                >
                                  Decline
                                </Button>
                              </>
                            )}
                            {selectedServiceBooking.status === 'confirmed' && (
                              <Button
                                variant="primary"
                                size="medium"
                                onClick={() => {
                                  handleCompleteBooking(selectedServiceBooking.id);
                                  setSelectedServiceBooking(null);
                                }}
                              >
                                Mark as Complete
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* My Services Tab */}
                {activeTab === 'services' && (
                  <div className={styles.tabContent}>
                    <div className={styles.servicesHeader}>
                      <h2>My Services</h2>
                      <p className={styles.servicesSubtitle}>
                        Services enabled for you by the admin. Members can book these services with you.
                      </p>
                    </div>

                    {servicesLoading ? (
                      <p>Loading services...</p>
                    ) : myServices.length === 0 ? (
                      <Card variant="elevated">
                        <div className={styles.noServices}>
                          <h3>No Services Enabled</h3>
                          <p>You don't have any services enabled yet. Contact an admin to enable services for your profile.</p>
                        </div>
                      </Card>
                    ) : (
                      <div className={styles.servicesGrid}>
                        {myServices.map(service => (
                          <Card key={service.id} variant="elevated">
                            <div className={styles.serviceCard}>
                              <h3 className={styles.serviceName}>{SERVICE_LABELS[service.serviceType]}</h3>
                              <p className={styles.serviceDescription}>
                                {service.description || SERVICE_DESCRIPTIONS[service.serviceType]}
                              </p>
                              <div className={styles.serviceRateSection}>
                                {editingRateId === service.id ? (
                                  <div className={styles.rateEditForm}>
                                    <div className={styles.rateInputWrapper}>
                                      <span className={styles.currencySymbol}>£</span>
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={editingRateValue}
                                        onChange={(e) => setEditingRateValue(e.target.value)}
                                        className={styles.rateInput}
                                        placeholder="0.00"
                                        autoFocus
                                      />
                                      <span className={styles.rateUnit}>/hour</span>
                                    </div>
                                    <div className={styles.rateEditActions}>
                                      <Button
                                        variant="primary"
                                        size="small"
                                        onClick={() => handleSaveRate(service.id)}
                                        disabled={savingRate}
                                      >
                                        {savingRate ? 'Saving...' : 'Save'}
                                      </Button>
                                      <Button
                                        variant="secondary"
                                        size="small"
                                        onClick={handleCancelEditRate}
                                        disabled={savingRate}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className={styles.rateDisplay}>
                                    <p className={styles.serviceRate}>
                                      {service.hourlyRate ? `£${service.hourlyRate}/hour` : 'No rate set'}
                                    </p>
                                    <button
                                      type="button"
                                      className={styles.editRateButton}
                                      onClick={() => handleStartEditRate(service)}
                                    >
                                      Edit Rate
                                    </button>
                                  </div>
                                )}
                              </div>
                              <span className={styles.serviceStatus}>Active</span>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* Upcoming Bookings Section */}
                    <div className={styles.coachBookingsSection}>
                      <h2 className={styles.coachBookingsTitle}>Upcoming Bookings</h2>
                      {bookingsLoading ? (
                        <p>Loading bookings...</p>
                      ) : serviceBookings.length === 0 ? (
                        <Card variant="default">
                          <div className={styles.noCoachBookings}>
                            <p>You don&apos;t have any upcoming service bookings.</p>
                          </div>
                        </Card>
                      ) : (
                        <div className={styles.coachBookingsList}>
                          {serviceBookings.map(booking => (
                            <Card key={booking.id} variant="elevated">
                              <div className={styles.coachBookingCard}>
                                <div className={styles.coachBookingMain}>
                                  <div className={styles.coachBookingDetails}>
                                    <h4 className={styles.coachBookingServiceType}>
                                      {booking.serviceType && SERVICE_LABELS[booking.serviceType]}
                                    </h4>
                                    <p className={styles.coachBookingMember}>
                                      {booking.memberName}
                                    </p>
                                    <p className={styles.coachBookingDateTime}>
                                      {new Date(booking.bookingDate).toLocaleDateString('en-US', {
                                        weekday: 'short',
                                        month: 'short',
                                        day: 'numeric',
                                      })} at {booking.startTime.slice(0, 5)}
                                    </p>
                                    {booking.notes && (
                                      <p className={styles.coachBookingNotes}>
                                        <strong>Notes:</strong> {booking.notes}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className={styles.coachBookingActions}>
                                  <span className={`${styles.coachBookingStatus} ${styles[booking.status]}`}>
                                    {booking.status}
                                  </span>
                                  <div className={styles.coachBookingButtons}>
                                    {booking.status === 'pending' && (
                                      <>
                                        <Button
                                          variant="primary"
                                          size="small"
                                          onClick={() => handleConfirmBooking(booking.id)}
                                        >
                                          Confirm
                                        </Button>
                                        <Button
                                          variant="secondary"
                                          size="small"
                                          onClick={() => handleDeclineBooking(booking.id)}
                                        >
                                          Decline
                                        </Button>
                                      </>
                                    )}
                                    {booking.status === 'confirmed' && (
                                      <Button
                                        variant="primary"
                                        size="small"
                                        onClick={() => handleCompleteBooking(booking.id)}
                                      >
                                        Mark Complete
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* My Profile Tab */}
                {activeTab === 'profile' && (
                  <div className={styles.tabContent}>
                    <CoachProfileEditor />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Container>
    </Section>
  );
};

export default CoachView;
