import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Section, Container, Card, Button } from '../components/common';
import styles from './Dashboard.module.scss';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'membership' | 'wod' | 'booking'>('membership');

  if (!user) return null;

  const getMembershipTypeName = (type: string) => {
    const names: Record<string, string> = {
      'trial': 'Free Trial',
      'crossfit': 'CrossFit',
      'comet-plus': 'Comet Plus',
      'open-gym': 'Open Gym',
      'specialty': 'Specialty Program'
    };
    return names[type] || type;
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <Section spacing="large" background="default">
      <Container>
        <div className={styles.dashboard}>
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Welcome back, {user.name}!</h1>
              <p className={styles.subtitle}>Manage your membership, view workouts, and book classes</p>
            </div>
            <Button variant="secondary" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>

          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'membership' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('membership')}
            >
              Membership
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'wod' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('wod')}
            >
              Daily WOD
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'booking' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('booking')}
            >
              Book Classes
            </button>
          </div>

          <div className={styles.content}>
            {activeTab === 'membership' && (
              <div className={styles.tabContent}>
                <h2 className={styles.sectionTitle}>Your Membership</h2>

                <div className={styles.membershipGrid}>
                  <Card variant="elevated">
                    <div className={styles.infoCard}>
                      <div className={styles.infoLabel}>Membership Type</div>
                      <div className={styles.infoValue}>{getMembershipTypeName(user.membershipType)}</div>
                    </div>
                  </Card>

                  <Card variant="elevated">
                    <div className={styles.infoCard}>
                      <div className={styles.infoLabel}>Member Since</div>
                      <div className={styles.infoValue}>
                        {new Date(user.joinDate).toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  </Card>

                  <Card variant="elevated">
                    <div className={styles.infoCard}>
                      <div className={styles.infoLabel}>Email</div>
                      <div className={styles.infoValue}>{user.email}</div>
                    </div>
                  </Card>

                  <Card variant="elevated">
                    <div className={styles.infoCard}>
                      <div className={styles.infoLabel}>Status</div>
                      <div className={styles.infoValueActive}>Active</div>
                    </div>
                  </Card>
                </div>

                <div className={styles.membershipActions}>
                  <h3 className={styles.actionsTitle}>Membership Actions</h3>
                  <div className={styles.actionButtons}>
                    <Button variant="primary">Upgrade Membership</Button>
                    <Button variant="secondary">Update Payment Method</Button>
                    <Button variant="secondary">Freeze Membership</Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'wod' && (
              <div className={styles.tabContent}>
                <h2 className={styles.sectionTitle}>Today's Workout</h2>

                <Card variant="elevated">
                  <div className={styles.wodCard}>
                    <div className={styles.wodHeader}>
                      <h3 className={styles.wodTitle}>
                        {new Date().toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </h3>
                      <span className={styles.wodType}>CrossFit</span>
                    </div>

                    <div className={styles.wodSection}>
                      <h4 className={styles.wodSectionTitle}>Warm-Up</h4>
                      <ul className={styles.wodList}>
                        <li>3 Rounds:</li>
                        <li>10 Air Squats</li>
                        <li>10 Push-Ups</li>
                        <li>10 Sit-Ups</li>
                        <li>200m Run</li>
                      </ul>
                    </div>

                    <div className={styles.wodSection}>
                      <h4 className={styles.wodSectionTitle}>Strength</h4>
                      <ul className={styles.wodList}>
                        <li>Back Squat</li>
                        <li>5-5-5-5-5 @ 75% 1RM</li>
                        <li>Rest 2-3 minutes between sets</li>
                      </ul>
                    </div>

                    <div className={styles.wodSection}>
                      <h4 className={styles.wodSectionTitle}>MetCon (15 min AMRAP)</h4>
                      <ul className={styles.wodList}>
                        <li>15 Wall Balls (20/14 lbs)</li>
                        <li>12 Box Jumps (24/20 in)</li>
                        <li>9 Burpees</li>
                      </ul>
                    </div>

                    <div className={styles.wodNotes}>
                      <strong>Coach's Notes:</strong> Scale the movements as needed. Focus on maintaining consistent pace throughout the AMRAP. The goal is to complete 6+ rounds.
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'booking' && (
              <div className={styles.tabContent}>
                <h2 className={styles.sectionTitle}>Book Your Classes</h2>

                <div className={styles.bookingSection}>
                  <div className={styles.dateSelector}>
                    <Button variant="secondary" size="small">← Previous Week</Button>
                    <h3 className={styles.weekTitle}>
                      Week of {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                    </h3>
                    <Button variant="secondary" size="small">Next Week →</Button>
                  </div>

                  <div className={styles.classGrid}>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
                      <Card key={day} variant="elevated">
                        <div className={styles.dayCard}>
                          <h4 className={styles.dayTitle}>{day}</h4>
                          <div className={styles.classList}>
                            <div className={styles.classItem}>
                              <div className={styles.classTime}>6:00 AM</div>
                              <div className={styles.className}>CrossFit</div>
                              <div className={styles.classSpots}>8 spots left</div>
                              <Button variant="primary" size="small" fullWidth>
                                Book
                              </Button>
                            </div>
                            <div className={styles.classItem}>
                              <div className={styles.classTime}>9:00 AM</div>
                              <div className={styles.className}>CrossFit</div>
                              <div className={styles.classSpots}>5 spots left</div>
                              <Button variant="primary" size="small" fullWidth>
                                Book
                              </Button>
                            </div>
                            <div className={styles.classItem}>
                              <div className={styles.classTime}>5:30 PM</div>
                              <div className={styles.className}>CrossFit</div>
                              <div className={styles.classSpots}>3 spots left</div>
                              <Button variant="primary" size="small" fullWidth>
                                Book
                              </Button>
                            </div>
                            {index === 5 && (
                              <div className={styles.classItem}>
                                <div className={styles.classTime}>10:30 AM</div>
                                <div className={styles.className}>Gymnastics</div>
                                <div className={styles.classSpots}>6 spots left</div>
                                <Button variant="primary" size="small" fullWidth>
                                  Book
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  <div className={styles.bookingNote}>
                    <strong>Note:</strong> You can book up to 7 days in advance. Cancel at least 2 hours before class to avoid charges.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>
    </Section>
  );
};

export default Dashboard;
