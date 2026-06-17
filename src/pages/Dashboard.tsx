import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { formatPriceShort } from '../utils/payment';
import { Section, Container, Card, Button, EmptyStatePreview } from '../components/common';
import { ProfileSettings } from '../components/ProfileSettings';
import { WeeklyVolume } from '../components/WeeklyVolume';
import { ServiceBookingModal } from '../components/ServiceBookingModal';
import { workoutService } from '../services/workoutService';
import { classBookingService } from '../services/classBookingService';
import { subscriptionService, type MemberSubscription } from '../services/subscriptionService';
import { coachServicesService, type CoachService, type ServiceBooking, SERVICE_LABELS, SERVICE_DESCRIPTIONS } from '../services/coachServicesService';
import { useMessage } from '../hooks/useMessage';
import { SAMPLE_WORKOUT } from '../data/sampleContent';
import type { WorkoutDB } from '../types';
import type { GymScheduleEntry } from '../types/tenant';
import styles from './Dashboard.module.scss';

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

// Convert a 'HH:MM:SS' time string into a friendly '6:00 AM' label.
const formatClassTime = (time: string): string => {
  const [hourStr, minuteStr] = time.split(':');
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${String(minute).padStart(2, '0')} ${period}`;
};

interface ClassInstance {
  classId: string; // unique per schedule slot per date
  dayIndex: number;
  dayName: string;
  dateLabel: string;
  time: string;
  className: string;
  maxCapacity: number;
  classDateISO: string;
}

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { gym, schedule, memberships } = useTenant();
  const { message, showSuccess, showError } = useMessage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'wod' | 'booking' | 'services' | 'profile'>('wod');
  const [subscribingId, setSubscribingId] = useState<string | null>(null);
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set());
  const [bookedClassIds, setBookedClassIds] = useState<Set<string>>(new Set());
  const [classCounts, setClassCounts] = useState<Record<string, number>>({});
  const [isBooking, setIsBooking] = useState(false);
  const [todaysWorkout, setTodaysWorkout] = useState<WorkoutDB | null>(null);
  const [isWorkoutLoading, setIsWorkoutLoading] = useState(true);
  const [availableServices, setAvailableServices] = useState<CoachService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [selectedServiceForBooking, setSelectedServiceForBooking] = useState<CoachService | null>(null);
  const [myBookings, setMyBookings] = useState<ServiceBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [subscription, setSubscription] = useState<MemberSubscription | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Build bookable class instances for the next 7 days from the gym's real
  // schedule. Each schedule slot becomes a dated instance with a stable id.
  const next7Days = useMemo(() => {
    const days: Date[] = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    return days;
  }, []);

  const classInstances = useMemo<ClassInstance[]>(() => {
    const activeSchedule = (schedule || []).filter((s: GymScheduleEntry) => s.is_active);
    const instances: ClassInstance[] = [];
    const today = new Date();

    next7Days.forEach((date, dayIndex) => {
      const dayOfWeek = DAY_NAMES[date.getDay()];
      const slots = activeSchedule
        .filter((s) => s.day_of_week === dayOfWeek)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));

      slots.forEach((slot) => {
        const [hour, minute] = slot.start_time.split(':').map(Number);
        const classDate = new Date(date);
        classDate.setHours(hour, minute, 0, 0);
        const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

        instances.push({
          classId: `${slot.id}__${dateKey}`,
          dayIndex,
          dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
          dateLabel:
            date.toDateString() === today.toDateString()
              ? 'Today'
              : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          time: formatClassTime(slot.start_time),
          className: slot.class_name,
          maxCapacity: slot.max_capacity,
          classDateISO: classDate.toISOString(),
        });
      });
    });

    return instances;
  }, [schedule, next7Days]);

  // Group instances by day for the booking grid.
  const instancesByDay = useMemo(() => {
    const grouped = new Map<number, ClassInstance[]>();
    classInstances.forEach((instance) => {
      const list = grouped.get(instance.dayIndex) || [];
      list.push(instance);
      grouped.set(instance.dayIndex, list);
    });
    return grouped;
  }, [classInstances]);

  const loadClassBookings = useCallback(async () => {
    if (!user?.id || classInstances.length === 0) {
      setBookedClassIds(new Set());
      setClassCounts({});
      return;
    }
    try {
      const classIds = classInstances.map((c) => c.classId);
      const summaries = await classBookingService.getClassSummaries(classIds);

      const counts: Record<string, number> = {};
      const mine = new Set<string>();
      summaries.forEach((s) => {
        counts[s.classId] = s.bookingCount;
        if (s.userBooked) mine.add(s.classId);
      });

      setClassCounts(counts);
      setBookedClassIds(mine);
    } catch (error) {
      console.error('Error loading class bookings:', error);
    }
  }, [user?.id, classInstances]);

  const loadSubscription = useCallback(async () => {
    if (!user?.id || !gym?.id) return;
    try {
      const sub = await subscriptionService.getActiveSubscription(user.id, gym.id);
      setSubscription(sub);
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  }, [user?.id, gym?.id]);

  useEffect(() => {
    loadTodaysWorkout();
    loadAvailableServices();
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadMyBookings();
      loadSubscription();
    }
  }, [user?.id, loadSubscription]);

  // Handle returns from the membership flow: a "Join" link from the public site
  // (?plan=) lands on the Membership panel; a Stripe Checkout return (?subscription=)
  // shows the outcome and refreshes. We then strip the params so a refresh is clean.
  useEffect(() => {
    const plan = searchParams.get('plan');
    const sub = searchParams.get('subscription');
    if (!plan && !sub) return;

    if (plan || sub) setActiveTab('profile');
    if (sub === 'success') {
      showSuccess('Welcome aboard! Your membership is now active.');
      loadSubscription();
    } else if (sub === 'cancelled') {
      showError('Checkout was cancelled - you have not been charged.');
    }

    if (sub) {
      const next = new URLSearchParams(searchParams);
      next.delete('subscription');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, showSuccess, showError, loadSubscription]);

  // Plans a member can join: active and priced. highlightedPlan is the one they
  // clicked "Join" on from the public site (?plan=).
  const activeMemberships = useMemo(
    () => memberships.filter((m) => m.is_active && (m.price_pence ?? 0) > 0),
    [memberships]
  );
  const highlightedPlan = searchParams.get('plan');

  useEffect(() => {
    loadClassBookings();
  }, [loadClassBookings]);

  const loadAvailableServices = async () => {
    setServicesLoading(true);
    try {
      const services = await coachServicesService.getAllActiveServices();
      setAvailableServices(services);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setServicesLoading(false);
    }
  };

  const loadMyBookings = async () => {
    if (!user?.id) return;
    setBookingsLoading(true);
    try {
      const bookings = await coachServicesService.getMemberBookings(user.id);
      // Filter to only show upcoming/active bookings
      const today = new Date().toISOString().split('T')[0];
      const upcomingBookings = bookings.filter(
        b => b.bookingDate >= today && b.status !== 'cancelled'
      );
      setMyBookings(upcomingBookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleBookingSuccess = () => {
    setSelectedServiceForBooking(null);
    loadMyBookings();
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await coachServicesService.cancelBooking(bookingId);
      loadMyBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      showError('Failed to cancel booking. Please try again.');
    }
  };

  const loadTodaysWorkout = async () => {
    try {
      const workout = await workoutService.getTodaysWorkout();
      setTodaysWorkout(workout);
    } catch (error) {
      console.error('Error loading workout:', error);
    } finally {
      setIsWorkoutLoading(false);
    }
  };

  if (!user) return null;

  const toggleClassSelection = (classId: string) => {
    if (bookedClassIds.has(classId)) return; // already booked - not selectable
    setSelectedClasses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(classId)) {
        newSet.delete(classId);
      } else {
        newSet.add(classId);
      }
      return newSet;
    });
  };

  const handleBlockBook = async () => {
    if (selectedClasses.size === 0) {
      showError('Please select at least one class to book');
      return;
    }

    if (!gym?.id) {
      showError('Unable to book - gym not loaded');
      return;
    }

    const toBook = classInstances.filter(
      (c) => selectedClasses.has(c.classId) && !bookedClassIds.has(c.classId)
    );

    if (toBook.length === 0) {
      showError('Those classes are already booked');
      return;
    }

    setIsBooking(true);
    try {
      await classBookingService.bookClasses(
        user.id,
        gym.id,
        toBook.map((c) => ({
          classId: c.classId,
          classDay: c.dayName,
          classTime: c.time,
          className: c.className,
          classDate: c.classDateISO,
        }))
      );
      showSuccess(`Booked ${toBook.length} class${toBook.length !== 1 ? 'es' : ''}`);
      setSelectedClasses(new Set());
      await loadClassBookings();
    } catch (error) {
      console.error('Error booking classes:', error);
      showError('Failed to book classes. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const handleCancelClass = async (classId: string) => {
    try {
      await classBookingService.cancelClassBooking(user.id, classId);
      showSuccess('Class booking cancelled');
      await loadClassBookings();
    } catch (error) {
      console.error('Error cancelling class:', error);
      showError('Failed to cancel booking. Please try again.');
    }
  };

  const clearSelection = () => {
    setSelectedClasses(new Set());
  };

  const handleSubscribe = async (membershipId: string) => {
    if (!gym || !user) return;
    setSubscribingId(membershipId);
    try {
      // Redirect to Stripe Checkout; the member returns to ?subscription=success.
      const url = await subscriptionService.startCheckout(gym.id, membershipId, user.id);
      window.location.href = url;
    } catch (error) {
      console.error('Error starting checkout:', error);
      showError(error instanceof Error ? error.message : 'Could not start checkout. Please try again.');
      setSubscribingId(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription?.stripeSubscriptionId) return;
    if (!confirm('Cancel your membership? You will keep access until the end of your current billing period.')) return;

    setIsCancelling(true);
    try {
      await subscriptionService.cancelSubscription(subscription.stripeSubscriptionId);
      showSuccess('Your membership will end at the close of the current billing period');
      await loadSubscription();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      showError(error instanceof Error ? error.message : 'Failed to cancel membership');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <Section spacing="relaxed" background="default">
      <Container>
        <div className={styles.dashboard}>
          <div className={styles.dashboardHeader}>
            <div>
              <h1 className={styles.dashboardTitle}>Welcome back, {user.name}!</h1>
              <p className={styles.dashboardSubtitle}>Manage your membership, view workouts, and book classes</p>
            </div>
            <Button variant="secondary" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>

          {message && (
            <div className={`${styles.feedbackMessage} ${message.type === 'success' ? styles.feedbackSuccess : styles.feedbackError}`}>
              {message.text}
            </div>
          )}

          <div className={styles.navigationTabs}>
            <button
              className={`${styles.navigationTab} ${activeTab === 'wod' ? styles.navigationTabActive : ''}`}
              onClick={() => setActiveTab('wod')}
            >
              Daily WOD
            </button>
            <button
              className={`${styles.navigationTab} ${activeTab === 'booking' ? styles.navigationTabActive : ''}`}
              onClick={() => setActiveTab('booking')}
            >
              Book Classes
            </button>
            <button
              className={`${styles.navigationTab} ${activeTab === 'services' ? styles.navigationTabActive : ''}`}
              onClick={() => setActiveTab('services')}
            >
              Services
            </button>
            <button
              className={`${styles.navigationTab} ${activeTab === 'profile' ? styles.navigationTabActive : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              Profile Settings
            </button>
          </div>

          <div className={styles.tabPanelContainer}>
            {activeTab === 'wod' && (
              <div className={styles.tabPanel}>
                {/* Weekly Volume at the top */}
                <div className={styles.weeklyVolumeContainer}>
                  <WeeklyVolume />
                </div>

                <h2 className={styles.sectionTitle}>Today&apos;s Workout</h2>

                {isWorkoutLoading ? (
                  <Card variant="raised">
                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                      Loading workout...
                    </div>
                  </Card>
                ) : todaysWorkout ? (
                  <Card variant="raised">
                    <div className={styles.wodCard}>
                      <div className={styles.wodHeader}>
                        <h3 className={styles.wodTitle}>
                          {new Date(todaysWorkout.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </h3>
                        <span className={styles.wodType}>{todaysWorkout.type.toUpperCase()}</span>
                      </div>

                      {todaysWorkout.warmup && todaysWorkout.warmup.length > 0 && (
                        <div className={styles.wodSection}>
                          <h4 className={styles.wodSectionTitle}>Warm-Up</h4>
                          <ul className={styles.wodList}>
                            {todaysWorkout.warmup.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {todaysWorkout.strength && todaysWorkout.strength.length > 0 && (
                        <div className={styles.wodSection}>
                          <h4 className={styles.wodSectionTitle}>Strength</h4>
                          <ul className={styles.wodList}>
                            {todaysWorkout.strength.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {todaysWorkout.metcon && todaysWorkout.metcon.length > 0 && (
                        <div className={styles.wodSection}>
                          <h4 className={styles.wodSectionTitle}>
                            MetCon {todaysWorkout.duration && `(${todaysWorkout.duration})`}
                          </h4>
                          <ul className={styles.wodList}>
                            {todaysWorkout.metcon.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {todaysWorkout.cooldown && todaysWorkout.cooldown.length > 0 && (
                        <div className={styles.wodSection}>
                          <h4 className={styles.wodSectionTitle}>Cool-Down</h4>
                          <ul className={styles.wodList}>
                            {todaysWorkout.cooldown.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {todaysWorkout.coachNotes && (
                        <div className={styles.wodNotes}>
                          <strong>Coach&apos;s Notes:</strong> {todaysWorkout.coachNotes}
                        </div>
                      )}

                      {todaysWorkout.scalingNotes && (
                        <div className={styles.wodNotes}>
                          <strong>Scaling:</strong> {todaysWorkout.scalingNotes}
                        </div>
                      )}
                    </div>
                  </Card>
                ) : (
                  <EmptyStatePreview
                    title="Today's Workout"
                    description="Your daily workout will appear here once your coach publishes it. Check back soon!"
                  >
                    <Card variant="raised">
                      <div className={styles.wodCard}>
                        <div className={styles.wodHeader}>
                          <h3 className={styles.wodTitle}>
                            {new Date().toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </h3>
                          <span className={styles.wodType}>{SAMPLE_WORKOUT.type.toUpperCase()}</span>
                        </div>

                        {SAMPLE_WORKOUT.warmup && SAMPLE_WORKOUT.warmup.length > 0 && (
                          <div className={styles.wodSection}>
                            <h4 className={styles.wodSectionTitle}>Warm-Up</h4>
                            <ul className={styles.wodList}>
                              {SAMPLE_WORKOUT.warmup.map((item, idx) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {SAMPLE_WORKOUT.metcon && SAMPLE_WORKOUT.metcon.length > 0 && (
                          <div className={styles.wodSection}>
                            <h4 className={styles.wodSectionTitle}>
                              MetCon {SAMPLE_WORKOUT.duration && `(${SAMPLE_WORKOUT.duration})`}
                            </h4>
                            <ul className={styles.wodList}>
                              {SAMPLE_WORKOUT.metcon.map((item, idx) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </Card>
                  </EmptyStatePreview>
                )}
              </div>
            )}

            {activeTab === 'booking' && (
              <div className={styles.tabPanel}>
                <div className={styles.bookingTopBar}>
                  <div className={styles.bookingHeader}>
                    <h2 className={styles.sectionTitle}>Book Your Classes</h2>
                    {selectedClasses.size > 0 && (
                      <div className={styles.blockBookActions}>
                        <span className={styles.selectedCount}>
                          {selectedClasses.size} class{selectedClasses.size !== 1 ? 'es' : ''} selected
                        </span>
                        <Button variant="secondary" size="compact" onClick={clearSelection} disabled={isBooking}>
                          Clear
                        </Button>
                        <Button variant="primary" size="compact" onClick={handleBlockBook} disabled={isBooking}>
                          {isBooking ? 'Booking...' : `Book Selected (${selectedClasses.size})`}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.bookingSection}>
                  {classInstances.length === 0 ? (
                    <EmptyStatePreview
                      title="No classes scheduled"
                      description="Your gym hasn't published a class schedule yet. Check back soon!"
                    >
                      <Card variant="raised">
                        <div style={{ padding: '2rem', textAlign: 'center' }}>
                          Class timetable coming soon.
                        </div>
                      </Card>
                    </EmptyStatePreview>
                  ) : (
                    <div className={styles.bookingDaysGrid}>
                      {next7Days.map((date, dayIndex) => {
                        const dayClasses = instancesByDay.get(dayIndex) || [];
                        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                        const dateString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        const isToday = date.toDateString() === new Date().toDateString();

                        return (
                          <Card key={dayIndex} variant="raised">
                            <div className={styles.bookingDayCard}>
                              <div className={styles.bookingDayHeader}>
                                <h4 className={styles.bookingDayTitle}>{dayName}</h4>
                                <span className={styles.dateLabel}>
                                  {isToday ? 'Today' : dateString}
                                </span>
                              </div>
                              <div className={styles.bookingClassList}>
                                {dayClasses.length === 0 ? (
                                  <div className={styles.classSpots}>No classes</div>
                                ) : (
                                  dayClasses.map((classInfo) => {
                                    const isSelected = selectedClasses.has(classInfo.classId);
                                    const isBooked = bookedClassIds.has(classInfo.classId);
                                    const booked = classCounts[classInfo.classId] || 0;
                                    const spotsLeft = Math.max(0, classInfo.maxCapacity - booked);
                                    const isFull = spotsLeft === 0 && !isBooked;

                                    return (
                                      <div
                                        key={classInfo.classId}
                                        className={`${styles.bookingClassItem} ${isSelected ? styles.bookingClassSelected : ''}`}
                                        onClick={() => !isFull && toggleClassSelection(classInfo.classId)}
                                        style={isFull ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                                      >
                                        <div className={styles.bookingClassHeader}>
                                          <div className={styles.classTime}>{classInfo.time}</div>
                                          {isBooked ? (
                                            <button
                                              type="button"
                                              className={styles.selectedCount}
                                              onClick={(e) => { e.stopPropagation(); handleCancelClass(classInfo.classId); }}
                                            >
                                              Booked &times;
                                            </button>
                                          ) : (
                                            <div className={styles.checkboxWrapper}>
                                              <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleClassSelection(classInfo.classId)}
                                                className={styles.classCheckbox}
                                                onClick={(e) => e.stopPropagation()}
                                                id={`class-${classInfo.classId}`}
                                                disabled={isFull}
                                              />
                                              <label htmlFor={`class-${classInfo.classId}`} className={styles.checkboxLabel}></label>
                                            </div>
                                          )}
                                        </div>
                                        <div className={styles.bookingClassName}>{classInfo.className}</div>
                                        <div className={styles.classSpots}>
                                          {isBooked ? 'You’re booked' : isFull ? 'Full' : `${spotsLeft} spots left`}
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}

                  <div className={styles.bookingNote}>
                    <strong>Tip:</strong> Select classes then use "Book Selected" to book several at once. Classes are included with your membership. Tap a booked class to cancel it.
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'services' && (
              <div className={styles.tabPanel}>
                <div className={styles.servicesHeader}>
                  <h2 className={styles.sectionTitle}>Available Services</h2>
                  <p className={styles.servicesSubtitle}>
                    Book 1-on-1 sessions and specialized services with our coaches
                  </p>
                </div>

                {servicesLoading ? (
                  <Card variant="raised">
                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                      Loading services...
                    </div>
                  </Card>
                ) : availableServices.length === 0 ? (
                  <Card variant="raised">
                    <div className={styles.noServicesMessage}>
                      <h3>No Services Available</h3>
                      <p>There are currently no coach services available. Check back soon!</p>
                    </div>
                  </Card>
                ) : (
                  <div className={styles.servicesList}>
                    {/* Group services by type */}
                    {Object.entries(
                      availableServices.reduce((acc, service) => {
                        if (!acc[service.serviceType]) {
                          acc[service.serviceType] = [];
                        }
                        acc[service.serviceType].push(service);
                        return acc;
                      }, {} as Record<string, CoachService[]>)
                    ).map(([serviceType, services]) => (
                      <div key={serviceType} className={styles.serviceTypeGroup}>
                        <div className={styles.serviceTypeHeader}>
                          <div>
                            <h3 className={styles.serviceTypeName}>
                              {SERVICE_LABELS[serviceType as keyof typeof SERVICE_LABELS]}
                            </h3>
                            <p className={styles.serviceTypeDescription}>
                              {SERVICE_DESCRIPTIONS[serviceType as keyof typeof SERVICE_DESCRIPTIONS]}
                            </p>
                          </div>
                        </div>

                        <div className={styles.coachesGrid}>
                          {services.map(service => (
                            <Card key={service.id} variant="flat">
                              <div className={styles.coachServiceCard}>
                                <div className={styles.coachAvatar}>
                                  {service.coachName?.charAt(0).toUpperCase() || 'C'}
                                </div>
                                <div className={styles.coachInfo}>
                                  <h4 className={styles.coachName}>{service.coachName}</h4>
                                  {service.description && (
                                    <p className={styles.coachServiceDescription}>{service.description}</p>
                                  )}
                                  {service.hourlyRate && (
                                    <p className={styles.coachRate}>£{service.hourlyRate}/hour</p>
                                  )}
                                </div>
                                <Button
                                  variant="primary"
                                  size="compact"
                                  onClick={() => setSelectedServiceForBooking(service)}
                                >
                                  Book
                                </Button>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* My Bookings Section */}
                <div className={styles.myBookingsSection}>
                  <h2 className={styles.sectionTitle}>My Bookings</h2>
                  {bookingsLoading ? (
                    <p>Loading your bookings...</p>
                  ) : myBookings.length === 0 ? (
                    <Card variant="flat">
                      <div className={styles.noBookingsMessage}>
                        <p>You don&apos;t have any upcoming service bookings.</p>
                      </div>
                    </Card>
                  ) : (
                    <div className={styles.bookingsList}>
                      {myBookings.map(booking => (
                        <Card key={booking.id} variant="flat">
                          <div className={styles.bookingCard}>
                            <div className={styles.bookingInfo}>
                              <div className={styles.bookingServiceType}>
                                {booking.serviceType && SERVICE_LABELS[booking.serviceType]}
                              </div>
                              <div className={styles.bookingCoach}>
                                with {booking.coachName}
                              </div>
                              <div className={styles.bookingDateTime}>
                                {new Date(booking.bookingDate).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                })} at {booking.startTime.slice(0, 5)}
                              </div>
                            </div>
                            <div className={styles.bookingActions}>
                              <span className={`${styles.bookingStatus} ${styles[booking.status]}`}>
                                {booking.status}
                              </span>
                              {booking.status !== 'completed' && (
                                <Button
                                  variant="secondary"
                                  size="compact"
                                  onClick={() => handleCancelBooking(booking.id)}
                                >
                                  Cancel
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Booking Modal */}
                {selectedServiceForBooking && user && (
                  <ServiceBookingModal
                    service={selectedServiceForBooking}
                    memberId={user.id}
                    onClose={() => setSelectedServiceForBooking(null)}
                    onSuccess={handleBookingSuccess}
                  />
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <div className={styles.tabPanel}>
                <h2 className={styles.sectionTitle}>Membership</h2>
                <Card variant="raised">
                  <div className={styles.infoCard}>
                    {subscription ? (
                      <>
                        <div className={styles.infoLabel}>Current plan</div>
                        <div className={styles.infoValueActive}>
                          {subscription.planName || 'Gym membership'}
                          {subscription.pricePence ? ` — £${(subscription.pricePence / 100).toFixed(2)}/${subscription.billingPeriod === 'yearly' ? 'year' : 'month'}` : ''}
                        </div>
                        {subscription.cancelAtPeriodEnd ? (
                          <p className={styles.bookingNote}>
                            Your membership is set to end
                            {subscription.currentPeriodEnd
                              ? ` on ${new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                              : ' at the end of the current period'}.
                          </p>
                        ) : (
                          <div className={styles.membershipActions}>
                            <Button
                              variant="secondary"
                              size="compact"
                              onClick={handleCancelSubscription}
                              disabled={isCancelling}
                            >
                              {isCancelling ? 'Cancelling...' : 'Cancel membership'}
                            </Button>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className={styles.infoLabel}>Current plan</div>
                        <div className={styles.infoValue}>You don't have a membership yet.</div>
                      </>
                    )}
                  </div>
                </Card>

                {!subscription && (
                  <div className={styles.planChoiceWrap}>
                    {activeMemberships.length === 0 ? (
                      <p className={styles.bookingNote}>This gym hasn't published any membership plans yet.</p>
                    ) : (
                      <>
                        <h3 className={styles.sectionTitle}>Choose a membership</h3>
                        <div className={styles.planChoiceGrid}>
                          {activeMemberships.map((plan) => (
                            <Card
                              key={plan.id}
                              variant={plan.id === highlightedPlan ? 'raised' : 'outlined'}
                              className={styles.planChoiceCard}
                            >
                              <div className={styles.planChoiceHead}>
                                <span className={styles.planChoiceName}>{plan.display_name}</span>
                                <span className={styles.planChoicePrice}>
                                  {formatPriceShort(plan.price_pence ?? 0)}
                                  <span className={styles.planChoicePeriod}>/{plan.billing_period === 'yearly' ? 'year' : 'month'}</span>
                                </span>
                              </div>
                              {plan.description && <p className={styles.planChoiceDesc}>{plan.description}</p>}
                              <Button
                                variant="primary"
                                fullWidth
                                size="compact"
                                onClick={() => handleSubscribe(plan.id)}
                                disabled={subscribingId !== null}
                              >
                                {subscribingId === plan.id ? 'Redirecting...' : `Join ${plan.display_name}`}
                              </Button>
                            </Card>
                          ))}
                        </div>
                        <p className={styles.bookingNote}>
                          Secure checkout is handled by Stripe. You can cancel anytime and keep access until the end of the period you've paid for.
                        </p>
                      </>
                    )}
                  </div>
                )}

                <ProfileSettings />
              </div>
            )}
          </div>
        </div>
      </Container>
    </Section>
  );
};

export default Dashboard;
