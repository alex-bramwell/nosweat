import { useState, useEffect } from 'react';
import { Section, Container, Card, Button } from '../../common';
import { workoutService } from '../../../services/workoutService';
import { todaysWOD } from '../../../data/wod';
import { stats } from '../../../data/stats';
import type { WorkoutDB } from '../../../types';
import styles from './WOD.module.scss';

const WOD = () => {
  const [workout, setWorkout] = useState<WorkoutDB | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTodaysWorkout();
  }, []);

  const loadTodaysWorkout = async () => {
    try {
      const data = await workoutService.getTodaysWorkout();
      setWorkout(data || { ...todaysWOD, status: 'published' as const }); // Fallback to static if no DB workout
    } catch (error) {
      console.error('Error loading workout:', error);
      setWorkout({ ...todaysWOD, status: 'published' as const }); // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  const wodTypeLabels = {
    amrap: 'AMRAP',
    fortime: 'For Time',
    emom: 'EMOM',
    strength: 'Strength',
    endurance: 'Endurance',
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
          <h2 className={styles.title}>Today at CrossFit Comet</h2>
          <p className={styles.subtitle}>
            Join one of our {stats[0].value}{stats[0].suffix} weekly classes with our team of {stats[1].value} certified coaches
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
          </div>
          </Card>
          </div>

          {/* Stats Sidebar */}
          <div className={styles.sidebar}>
            <div className={styles.statsCard}>
              <h3 className={styles.sidebarTitle}>Why Train With Us</h3>

              {/* First Stat with Schedule CTA */}
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

              {/* Second Stat */}
              <div className={styles.statItem}>
                <div className={styles.statValue}>
                  {stats[1].value}
                  {stats[1].suffix && <span className={styles.suffix}>{stats[1].suffix}</span>}
                </div>
                <div className={styles.statLabel}>{stats[1].label}</div>
              </div>

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
