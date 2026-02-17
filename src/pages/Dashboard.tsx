import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Section, Container, Card, Button } from '../components/common';
import { ProfileSettings } from '../components/ProfileSettings';
import { WeeklyVolume } from '../components/WeeklyVolume';
import { ServiceBookingModal } from '../components/ServiceBookingModal';
import { workoutService } from '../services/workoutService';
import { coachServicesService, type CoachService, type ServiceBooking, SERVICE_LABELS, SERVICE_DESCRIPTIONS } from '../services/coachServicesService';
import type { WorkoutDB } from '../types';
import styles from './Dashboard.module.scss';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'wod' | 'booking' | 'services' | 'profile'>('wod');
  const [classType, setClassType] = useState<'crossfit' | 'opengym'>('crossfit');
  const [bookingClassType, setBookingClassType] = useState<'crossfit' | 'opengym'>('crossfit');
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set());
  const [todaysWorkout, setTodaysWorkout] = useState<WorkoutDB | null>(null);
  const [isWorkoutLoading, setIsWorkoutLoading] = useState(true);
  const [availableServices, setAvailableServices] = useState<CoachService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [selectedServiceForBooking, setSelectedServiceForBooking] = useState<CoachService | null>(null);
  const [myBookings, setMyBookings] = useState<ServiceBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  useEffect(() => {
    loadTodaysWorkout();
    loadAvailableServices();
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadMyBookings();
    }
  }, [user?.id]);

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
      alert('Failed to cancel booking. Please try again.');
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

  // Removed unused: getMembershipTypeName

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
              className={`${styles.tab} ${activeTab === 'services' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('services')}
            >
              Services
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
                {/* Weekly Volume at the top */}
                <div className={styles.weeklyVolumeContainer}>
                  <WeeklyVolume />
                </div>

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

                <h2 className={styles.sectionTitle}>Today&apos;s Workout</h2>

                {isWorkoutLoading ? (
                  <Card variant="elevated">
                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                      Loading workout...
                    </div>
                  </Card>
                ) : todaysWorkout ? (
                  <Card variant="elevated">
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
                  <Card variant="elevated">
                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                      No workout scheduled for today. Check back later!
                    </div>
                  </Card>
                )}
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

            {activeTab === 'services' && (
              <div className={styles.tabContent}>
                <div className={styles.servicesHeader}>
                  <h2 className={styles.sectionTitle}>Available Services</h2>
                  <p className={styles.servicesSubtitle}>
                    Book 1-on-1 sessions and specialized services with our coaches
                  </p>
                </div>

                {servicesLoading ? (
                  <Card variant="elevated">
                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                      Loading services...
                    </div>
                  </Card>
                ) : availableServices.length === 0 ? (
                  <Card variant="elevated">
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
                            <Card key={service.id} variant="default">
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
                                  size="small"
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
                    <Card variant="default">
                      <div className={styles.noBookingsMessage}>
                        <p>You don&apos;t have any upcoming service bookings.</p>
                      </div>
                    </Card>
                  ) : (
                    <div className={styles.bookingsList}>
                      {myBookings.map(booking => (
                        <Card key={booking.id} variant="default">
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
                                  size="small"
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
