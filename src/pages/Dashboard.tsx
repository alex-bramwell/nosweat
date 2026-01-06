import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Section, Container, Card, Button } from '../components/common';
import { ProfileSettings } from '../components/ProfileSettings';
import styles from './Dashboard.module.scss';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'wod' | 'booking' | 'profile'>('wod');
  const [classType, setClassType] = useState<'crossfit' | 'opengym'>('crossfit');
  const [bookingClassType, setBookingClassType] = useState<'crossfit' | 'opengym'>('crossfit');
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set());

  if (!user) return null;

  // Generate next 7 days starting from today
  const getNext7Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const next7Days = getNext7Days();

  const toggleClassSelection = (classId: string) => {
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

  const handleBlockBook = () => {
    if (selectedClasses.size === 0) {
      alert('Please select at least one class to book');
      return;
    }
    // TODO: Implement actual booking logic
    alert(`Booking ${selectedClasses.size} class(es)`);
    setSelectedClasses(new Set());
  };

  const clearSelection = () => {
    setSelectedClasses(new Set());
  };

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
            <button
              className={`${styles.tab} ${activeTab === 'profile' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              Profile Settings
            </button>
          </div>

          <div className={styles.content}>
            {activeTab === 'wod' && (
              <div className={styles.tabContent}>
                <div className={styles.bookingSection}>
                  <div className={styles.bookingHeader}>
                    <h3 className={styles.bookingSectionTitle}>Book Today's Class</h3>

                    <div className={styles.classTypeToggle}>
                      <button
                        type="button"
                        className={`${styles.toggleButton} ${classType === 'crossfit' ? styles.active : ''}`}
                        onClick={() => setClassType('crossfit')}
                      >
                        CrossFit
                      </button>
                      <button
                        type="button"
                        className={`${styles.toggleButton} ${classType === 'opengym' ? styles.active : ''}`}
                        onClick={() => setClassType('opengym')}
                      >
                        Open Gym
                      </button>
                    </div>
                  </div>

                  <div className={styles.todayClasses}>
                    {classType === 'crossfit' ? (
                      <>
                        <div className={styles.classSlot}>
                          <div className={styles.classTime}>6:00 AM</div>
                          <div className={styles.classSpots}>8 spots left</div>
                          <Button variant="primary" size="small">Book</Button>
                        </div>
                        <div className={styles.classSlot}>
                          <div className={styles.classTime}>9:00 AM</div>
                          <div className={styles.classSpots}>5 spots left</div>
                          <Button variant="primary" size="small">Book</Button>
                        </div>
                        <div className={styles.classSlot}>
                          <div className={styles.classTime}>12:00 PM</div>
                          <div className={styles.classSpots}>6 spots left</div>
                          <Button variant="primary" size="small">Book</Button>
                        </div>
                        <div className={styles.classSlot}>
                          <div className={styles.classTime}>4:30 PM</div>
                          <div className={styles.classSpots}>4 spots left</div>
                          <Button variant="primary" size="small">Book</Button>
                        </div>
                        <div className={styles.classSlot}>
                          <div className={styles.classTime}>5:30 PM</div>
                          <div className={styles.classSpots}>3 spots left</div>
                          <Button variant="primary" size="small">Book</Button>
                        </div>
                        <div className={styles.classSlot}>
                          <div className={styles.classTime}>6:30 PM</div>
                          <div className={styles.classSpots}>7 spots left</div>
                          <Button variant="primary" size="small">Book</Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={styles.classSlot}>
                          <div className={styles.classTime}>6:00 AM</div>
                          <div className={styles.classSpots}>12 spots left</div>
                          <Button variant="primary" size="small">Book</Button>
                        </div>
                        <div className={styles.classSlot}>
                          <div className={styles.classTime}>10:00 AM</div>
                          <div className={styles.classSpots}>10 spots left</div>
                          <Button variant="primary" size="small">Book</Button>
                        </div>
                        <div className={styles.classSlot}>
                          <div className={styles.classTime}>2:00 PM</div>
                          <div className={styles.classSpots}>15 spots left</div>
                          <Button variant="primary" size="small">Book</Button>
                        </div>
                        <div className={styles.classSlot}>
                          <div className={styles.classTime}>6:00 PM</div>
                          <div className={styles.classSpots}>8 spots left</div>
                          <Button variant="primary" size="small">Book</Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

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
                <div className={styles.bookingTopBar}>
                  <div className={styles.bookingHeader}>
                    <h2 className={styles.sectionTitle}>Book Your Classes</h2>
                    {selectedClasses.size > 0 && (
                      <div className={styles.blockBookActions}>
                        <span className={styles.selectedCount}>
                          {selectedClasses.size} class{selectedClasses.size !== 1 ? 'es' : ''} selected
                        </span>
                        <Button variant="secondary" size="small" onClick={clearSelection}>
                          Clear
                        </Button>
                        <Button variant="primary" size="small" onClick={handleBlockBook}>
                          Book Selected ({selectedClasses.size})
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className={styles.classTypeToggle}>
                    <button
                      type="button"
                      className={`${styles.toggleButton} ${bookingClassType === 'crossfit' ? styles.active : ''}`}
                      onClick={() => setBookingClassType('crossfit')}
                    >
                      CrossFit
                    </button>
                    <button
                      type="button"
                      className={`${styles.toggleButton} ${bookingClassType === 'opengym' ? styles.active : ''}`}
                      onClick={() => setBookingClassType('opengym')}
                    >
                      Open Gym
                    </button>
                  </div>
                </div>

                <div className={styles.bookingSection}>
                  <div className={styles.classGrid}>
                    {next7Days.map((date, dayIndex) => {
                      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                      const dateString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      const isToday = date.toDateString() === new Date().toDateString();

                      // Sample classes for each day based on selected type
                      let classes = [];

                      if (bookingClassType === 'crossfit') {
                        classes = [
                          { time: '6:00 AM', name: 'CrossFit', spots: 8, type: 'crossfit' },
                          { time: '9:00 AM', name: 'CrossFit', spots: 5, type: 'crossfit' },
                          { time: '5:30 PM', name: 'CrossFit', spots: 3, type: 'crossfit' },
                        ];
                        // Add Saturday special class
                        if (date.getDay() === 6) {
                          classes.push({ time: '10:30 AM', name: 'Gymnastics', spots: 6, type: 'crossfit' });
                        }
                      } else {
                        classes = [
                          { time: '6:00 AM', name: 'Open Gym', spots: 12, type: 'opengym' },
                          { time: '10:00 AM', name: 'Open Gym', spots: 10, type: 'opengym' },
                          { time: '2:00 PM', name: 'Open Gym', spots: 15, type: 'opengym' },
                          { time: '6:00 PM', name: 'Open Gym', spots: 8, type: 'opengym' },
                        ];
                      }

                      return (
                        <Card key={dayIndex} variant="elevated">
                          <div className={styles.dayCard}>
                            <div className={styles.dayHeader}>
                              <h4 className={styles.dayTitle}>{dayName}</h4>
                              <span className={styles.dateLabel}>
                                {isToday ? 'Today' : dateString}
                              </span>
                            </div>
                            <div className={styles.classList}>
                              {classes.map((classInfo, classIndex) => {
                                const classId = `${dayIndex}-${classIndex}`;
                                const isSelected = selectedClasses.has(classId);

                                return (
                                  <div
                                    key={classIndex}
                                    className={`${styles.classItem} ${isSelected ? styles.selected : ''} ${styles[classInfo.type]}`}
                                    onClick={() => toggleClassSelection(classId)}
                                  >
                                    <div className={styles.classItemHeader}>
                                      <div className={styles.classTime}>{classInfo.time}</div>
                                      <div className={styles.checkboxWrapper}>
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => toggleClassSelection(classId)}
                                          className={styles.classCheckbox}
                                          onClick={(e) => e.stopPropagation()}
                                          id={`class-${classId}`}
                                        />
                                        <label htmlFor={`class-${classId}`} className={styles.checkboxLabel}></label>
                                      </div>
                                    </div>
                                    <div className={styles.className}>{classInfo.name}</div>
                                    <div className={styles.classSpots}>{classInfo.spots} spots left</div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>

                  <div className={styles.bookingNote}>
                    <strong>Tip:</strong> Click on classes to select them, then use "Book Selected" to book multiple classes at once. Cancel at least 2 hours before class to avoid charges.
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className={styles.tabContent}>
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
