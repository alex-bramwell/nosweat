import { useState, useEffect } from 'react';
import { Section, Container, Card, Button } from '../../common';
import { WeeklyVolume } from '../../WeeklyVolume';
import { workoutService } from '../../../services/workoutService';
import { wodBookingService, MAX_WORKOUT_CAPACITY } from '../../../services/wodBookingService';
import { useAuth } from '../../../contexts/AuthContext';
import { useTenant } from '../../../contexts/TenantContext';
import type { WorkoutDB } from '../../../types';
import styles from './WOD.module.scss';

const WOD = () => {
  const { user } = useAuth();
  const { gym, stats } = useTenant();
  const [workout, setWorkout] = useState<WorkoutDB | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bookingCount, setBookingCount] = useState(0);
  const [isUserBooked, setIsUserBooked] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    loadTodaysWorkout();
  }, []);

  useEffect(() => {
    if (workout) {
      loadBookingInfo(workout.id);
    }
  }, [workout, user]);

  const loadTodaysWorkout = async () => {
    try {
      const data = await workoutService.getTodaysWorkout();
      setWorkout(data);
    } catch (error) {
      console.error('Error loading workout:', error);
      setWorkout(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBookingInfo = async (workoutId: string) => {
    try {
      const count = await wodBookingService.getBookingCount(workoutId);
      setBookingCount(count);

      if (user) {
        const booked = await wodBookingService.isUserBooked(workoutId, user.id);
        setIsUserBooked(booked);
      }
    } catch (error) {
      console.error('Error loading booking info:', error);
    }
  };

  const handleBook = async () => {
    if (!workout || !user) return;

    setBookingLoading(true);
    try {
      await wodBookingService.bookWorkout(workout.id, user.id);
      setIsUserBooked(true);
      setBookingCount(prev => prev + 1);
    } catch (error) {
      console.error('Error booking workout:', error);
      alert(error instanceof Error ? error.message : 'Failed to book workout');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!workout || !user) return;

    setBookingLoading(true);
    try {
      await wodBookingService.cancelBooking(workout.id, user.id);
      setIsUserBooked(false);
      setBookingCount(prev => prev - 1);
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert(error instanceof Error ? error.message : 'Failed to cancel booking');
    } finally {
      setBookingLoading(false);
    }
  };

  const spotsRemaining = MAX_WORKOUT_CAPACITY - bookingCount;
  const isFull = spotsRemaining <= 0;

  const wodTypeLabels: Record<string, string> = {
    amrap: 'AMRAP',
    fortime: 'For Time',
    emom: 'EMOM',
    strength: 'Strength',
    endurance: 'Endurance',
    tabata: 'Tabata',
  };

  if (isLoading) {
    return (
      <Section spacing="large" background="surface" id="wod">
        <Container>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            Loading today&apos;s workout...
          </div>
        </Container>
      </Section>
    );
  }

  if (!workout) {
    return (
      <Section spacing="large" background="surface" id="wod">
        <Container>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            No workout scheduled for today. Check back later!
          </div>
        </Container>
      </Section>
    );
  }

  return (
    <Section spacing="large" background="surface" id="wod">
      <Container>
        <div className={styles.header}>
          <h2 className={styles.title}>Today at {gym?.name || 'the gym'}</h2>
          <p className={styles.subtitle}>
            {stats.length >= 2
              ? `Join one of our ${stats[0].value}${stats[0].suffix || ''} weekly classes with our team of ${stats[1].value} certified coaches`
              : 'Join our expert-led classes and start your fitness journey today'}
          </p>
        </div>

        <div className={styles.contentWrapper}>
          {/* WOD Section */}
          <div className={styles.wodWrapper}>
            <Card variant="elevated" padding="large">
          <div className={styles.wod}>
            <div className={styles.wodHeader}>
              <h3 className={styles.wodTitle}>{workout.title}</h3>
              <span className={styles.wodType}>{wodTypeLabels[workout.type]}</span>
            </div>

            <div className={styles.wodDate}>
              {new Date(workout.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>

            <p className={styles.description}>{workout.description}</p>

            <div className={styles.movements}>
              {workout.metcon && workout.metcon.length > 0 ? (
                workout.metcon.map((movement, index) => (
                  <div key={index} className={styles.movement}>
                    <span className={styles.bullet}>•</span>
                    <span>{movement}</span>
                  </div>
                ))
              ) : (
                workout.movements.map((movement, index) => (
                  <div key={index} className={styles.movement}>
                    <span className={styles.bullet}>•</span>
                    <span>{movement}</span>
                  </div>
                ))
              )}
            </div>

            {workout.duration && (
              <div className={styles.meta}>
                <span className={styles.metaLabel}>Time Cap:</span>
                <span className={styles.metaValue}>{workout.duration}</span>
              </div>
            )}

            <div className={styles.footer}>
              <p className={styles.note}>
                Scale as needed. All movements can be modified to match your fitness level.
                Ask your coach for scaling options!
              </p>
            </div>

            {/* Booking Section */}
            <div className={styles.bookingSection}>
              <div className={styles.bookingInfo}>
                <div className={styles.spotsInfo}>
                  <span className={`${styles.spotsCount} ${isFull ? styles.spotsFull : ''}`}>
                    {spotsRemaining}
                  </span>
                  <span className={styles.spotsLabel}>
                    {spotsRemaining === 1 ? 'spot' : 'spots'} remaining
                  </span>
                </div>
                <div className={styles.capacityBar}>
                  <div
                    className={styles.capacityFill}
                    style={{ width: `${(bookingCount / MAX_WORKOUT_CAPACITY) * 100}%` }}
                  />
                </div>
                <span className={styles.capacityText}>
                  {bookingCount} / {MAX_WORKOUT_CAPACITY} booked
                </span>
              </div>

              {user ? (
                isUserBooked ? (
                  <div className={styles.bookedState}>
                    <span className={styles.bookedBadge}>You&apos;re booked!</span>
                    <Button
                      variant="outline"
                      size="small"
                      onClick={handleCancelBooking}
                      disabled={bookingLoading}
                    >
                      {bookingLoading ? 'Cancelling...' : 'Cancel Booking'}
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    onClick={handleBook}
                    disabled={bookingLoading || isFull}
                    className={styles.bookButton}
                  >
                    {bookingLoading ? 'Booking...' : isFull ? 'Class Full' : 'Book This WOD'}
                  </Button>
                )
              ) : (
                <div className={styles.loginPrompt}>
                  <p>Log in to book your spot</p>
                  <Button variant="primary" as="a" href="/login">
                    Log In
                  </Button>
                </div>
              )}
            </div>
          </div>
          </Card>
          </div>

          {/* Stats Sidebar */}
          <div className={styles.sidebar}>
            {/* Weekly Volume */}
            <WeeklyVolume />

            <div className={styles.statsCard}>
              <h3 className={styles.sidebarTitle}>Why Train With Us</h3>

              {/* Stats */}
              {stats[0] && (
                <>
                  <div className={styles.statItem}>
                    <div className={`${styles.statValue} ${styles.statValueGradient}`}>
                      {stats[0].value}
                      {stats[0].suffix && <span className={styles.suffix}>{stats[0].suffix}</span>}
                    </div>
                    <div className={styles.statLabel}>{stats[0].label}</div>
                  </div>
                  <Button variant="outline" as="a" href="/schedule" className={styles.statCta}>
                    View Full Schedule
                  </Button>
                </>
              )}

              {stats[1] && (
                <div className={styles.statItem}>
                  <div className={styles.statValue}>
                    {stats[1].value}
                    {stats[1].suffix && <span className={styles.suffix}>{stats[1].suffix}</span>}
                  </div>
                  <div className={styles.statLabel}>{stats[1].label}</div>
                </div>
              )}

              {/* Learn Our Story CTA at bottom */}
              <Button variant="primary" as="a" href="/about" className={styles.sidebarCta}>
                Learn Our Story
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
};

export default WOD;
