import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { Section, Container, Card, Button } from '../components/common';
import { WODEditor } from '../components/WODEditor';
import { UserManagement } from '../components/UserManagement';
import { workoutService } from '../services/workoutService';
import type { WorkoutDB, WorkoutFormData } from '../types';
import styles from './CoachDashboard.module.scss';

const CoachDashboard = () => {
  const { user, logout } = useAuth();
  const permissions = usePermissions();
  const [activeTab, setActiveTab] = useState<'overview' | 'create' | 'manage' | 'users'>('overview');
  const [workouts, setWorkouts] = useState<WorkoutDB[]>([]);
  const [todaysWorkout, setTodaysWorkout] = useState<WorkoutDB | null>(null);
  const [editingWorkout, setEditingWorkout] = useState<WorkoutDB | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    setIsLoading(true);
    try {
      const [today, all] = await Promise.all([
        workoutService.getTodaysWorkout(),
        workoutService.getAllWorkouts(30),
      ]);
      setTodaysWorkout(today);
      setWorkouts(all);
    } catch (error) {
      console.error('Error loading workouts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWorkout = async (workout: WorkoutFormData) => {
    await workoutService.createWorkout(workout);
    await loadWorkouts();
    setActiveTab('overview');
  };

  const handleUpdateWorkout = async (workout: WorkoutFormData) => {
    if (editingWorkout) {
      await workoutService.updateWorkout(editingWorkout.id, workout);
      await loadWorkouts();
      setEditingWorkout(null);
      setActiveTab('manage');
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

  if (!user) return null;

  return (
    <Section spacing="large" background="default">
      <Container>
        <div className={styles.dashboard}>
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Coach Dashboard</h1>
              <p className={styles.subtitle}>
                Welcome back, {user.name}! {permissions.isAdmin && '(Admin)'}
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
            {permissions.canManageUsers && (
              <button
                className={`${styles.tab} ${activeTab === 'users' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('users')}
              >
                Manage Users
              </button>
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
                        Edit
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
                  <Card variant="elevated">
                    <div className={styles.statCard}>
                      <div className={styles.statValue}>{workouts.length}</div>
                      <div className={styles.statLabel}>Total Workouts</div>
                    </div>
                  </Card>
                  <Card variant="elevated">
                    <div className={styles.statCard}>
                      <div className={styles.statValue}>
                        {workouts.filter(w => w.status === 'published').length}
                      </div>
                      <div className={styles.statLabel}>Published</div>
                    </div>
                  </Card>
                  <Card variant="elevated">
                    <div className={styles.statCard}>
                      <div className={styles.statValue}>
                        {workouts.filter(w => w.status === 'draft').length}
                      </div>
                      <div className={styles.statLabel}>Drafts</div>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === 'create' && (
              <div className={styles.tabContent}>
                <WODEditor
                  initialData={editingWorkout || undefined}
                  onSave={editingWorkout ? handleUpdateWorkout : handleCreateWorkout}
                  onCancel={() => setActiveTab('overview')}
                  isEditing={!!editingWorkout}
                />
              </div>
            )}

            {activeTab === 'manage' && (
              <div className={styles.tabContent}>
                <h2 className={styles.sectionTitle}>All Workouts</h2>
                {isLoading ? (
                  <p>Loading...</p>
                ) : (
                  <div className={styles.workoutsList}>
                    {workouts.map(workout => (
                      <Card key={workout.id} variant="elevated">
                        <div className={styles.workoutItem}>
                          <div className={styles.workoutInfo}>
                            <h3>{workout.title}</h3>
                            <p className={styles.workoutDate}>
                              {new Date(workout.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                            <p className={styles.workoutMeta}>
                              {workout.type.toUpperCase()} • {workout.status}
                            </p>
                          </div>
                          <div className={styles.workoutActions}>
                            <Button
                              variant="outline"
                              size="small"
                              onClick={() => {
                                setEditingWorkout(workout);
                                setActiveTab('create');
                              }}
                            >
                              Edit
                            </Button>
                            {permissions.canDeleteWorkouts && (
                              <Button
                                variant="secondary"
                                size="small"
                                onClick={() => handleDeleteWorkout(workout.id)}
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'users' && (
              <div className={styles.tabContent}>
                <UserManagement isAdmin={permissions.isAdmin} />
              </div>
            )}
          </div>
        </div>
      </Container>
    </Section>
  );
};

export default CoachDashboard;
