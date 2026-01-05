import { useState, useEffect } from 'react';
import { Section, Container, Button } from '../components/common';
import { AuthModal } from '../components/AuthModal';
import { TrialModal } from '../components/TrialModal';
import { DayPassPaymentModal } from '../components/DayPassPaymentModal';
import { useAuth } from '../contexts/AuthContext';
import { useRegistrationIntent } from '../contexts/RegistrationContext';
import { weeklySchedule } from '../data/schedule';
import type { ClassSchedule } from '../types';
import styles from './Schedule.module.scss';

const Schedule = () => {
  const { isAuthenticated, user } = useAuth();
  const { intent, updateStep } = useRegistrationIntent();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassSchedule | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isDayPassMode, setIsDayPassMode] = useState(false);

  // Check for day-pass intent on mount
  useEffect(() => {
    if (intent && intent.type === 'day-pass') {
      setIsDayPassMode(true);
      if (intent.step === 'class-selection') {
        // User needs to select a class
        if (!isAuthenticated) {
          // Show auth modal
          setIsAuthModalOpen(true);
        }
      }
    } else {
      setIsDayPassMode(false);
      setSelectedClass(null);
    }
  }, [intent, isAuthenticated]);
  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels = {
    monday: 'MON',
    tuesday: 'TUES',
    wednesday: 'WEDS',
    thursday: 'THURS',
    friday: 'FRI',
    saturday: 'SAT',
    sunday: 'SUN',
  };

  // Get unique time slots and sort them
  const timeSlots = Array.from(new Set(weeklySchedule.map(cls => cls.time))).sort((a, b) => {
    const timeToMinutes = (time: string) => {
      const [timePart, period] = time.split(' ');
      let [hours, minutes] = timePart.split(':').map(Number);
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };
    return timeToMinutes(a) - timeToMinutes(b);
  });

  const getClassForTimeAndDay = (time: string, day: string): ClassSchedule | undefined => {
    return weeklySchedule.find(cls => cls.time === time && cls.day === day);
  };

  const getClassTypeStyle = (className: string): string => {
    const normalizedName = className.toLowerCase();
    if (normalizedName.includes('specialty')) {
      return styles.cellSpecialty;
    }
    if (normalizedName.includes('crossfit') && normalizedName.includes('open gym')) {
      return styles.cellBoth;
    }
    if (normalizedName.includes('open gym')) {
      return styles.cellOpenGym;
    }
    return styles.cellCrossFit;
  };

  const getBadgeForClassType = (classType: string): { badge: string; label: string } => {
    const normalizedType = classType.toLowerCase().trim();
    if (normalizedType.includes('crossfit')) {
      return { badge: styles.badgeCF, label: 'CF' };
    }
    if (normalizedType.includes('open gym')) {
      return { badge: styles.badgeOG, label: 'OG' };
    }
    if (normalizedType.includes('specialty')) {
      return { badge: styles.badgeSpecialty, label: 'SP' };
    }
    return { badge: styles.badgeSpecialty, label: 'SP' };
  };

  const handleClassClick = (classInfo: ClassSchedule) => {
    if (isDayPassMode && isAuthenticated) {
      setSelectedClass(classInfo);
      updateStep('payment');
    }
  };

  const handleContinueToPayment = () => {
    if (selectedClass && user) {
      setShowPaymentModal(true);
    }
  };

  const handlePaymentModalClose = () => {
    setShowPaymentModal(false);
    setSelectedClass(null);
  };

  return (
    <>
      <Section spacing="xlarge" background="dark" className={styles.scheduleHero}>
        <Container>
          <div className={styles.heroContent}>
            <h1 className={styles.title}>Weekly Schedule</h1>
            <p className={styles.subtitle}>
              Choose from our variety of classes throughout the week. All fitness levels welcome!
            </p>
            {isDayPassMode && isAuthenticated && !selectedClass && (
              <div className={styles.infoCard}>
                <span className={styles.infoContent}>
                  <svg className={styles.infoIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                  <span className={styles.infoText}>Select a class to book your day pass (£10)</span>
                </span>
              </div>
            )}
            {isDayPassMode && isAuthenticated && selectedClass && (
              <div className={`${styles.infoCard} ${styles.infoCardSuccess}`}>
                <span className={styles.infoContent}>
                  <svg className={styles.infoIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <span className={styles.infoText}>
                    {selectedClass.className} - {selectedClass.day} at {selectedClass.time}
                  </span>
                </span>
                <Button variant="primary" size="small" onClick={handleContinueToPayment}>
                  Continue to Payment (£10)
                </Button>
              </div>
            )}
            {!isDayPassMode && !isAuthenticated && (
              <div className={styles.infoCard}>
                <span className={styles.infoContent}>
                  <svg className={styles.infoIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                  <span className={styles.infoText}>Please sign in to book a class</span>
                </span>
                <Button variant="outline" size="small" onClick={() => setIsAuthModalOpen(true)}>
                  Sign In
                </Button>
              </div>
            )}
            {isDayPassMode && !isAuthenticated && (
              <div className={styles.infoCard}>
                <span className={styles.infoContent}>
                  <span className={styles.infoIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="16" x2="12" y2="12"/>
                      <line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                  </span>
                  <span className={styles.infoText}>Create an account to continue booking your day pass</span>
                </span>
                <Button variant="outline" size="small" onClick={() => setIsAuthModalOpen(true)}>
                  Create Account
                </Button>
              </div>
            )}
            <div className={styles.legend}>
              <div className={styles.legendItem}>
                <span className={`${styles.legendColor} ${styles.legendCrossFit}`}></span>
                <span>CrossFit</span>
              </div>
              <div className={styles.legendItem}>
                <span className={`${styles.legendColor} ${styles.legendOpenGym}`}></span>
                <span>Open Gym</span>
              </div>
              <div className={styles.legendItem}>
                <span className={`${styles.legendColor} ${styles.legendSpecialty}`}></span>
                <span>Specialty</span>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section spacing="large">
        <Container size="large">
          {/* Desktop/Tablet Grid View */}
          <div className={styles.scheduleGrid}>
            <div className={styles.scheduleHeader}>
              <div className={styles.timeHeaderCell}></div>
              {daysOfWeek.map(day => (
                <div key={day} className={styles.dayHeaderCell}>
                  {dayLabels[day as keyof typeof dayLabels]}
                </div>
              ))}
            </div>

            {timeSlots.map(time => (
              <div key={time} className={styles.scheduleRow}>
                <div className={styles.timeCell}>{time}</div>
                {daysOfWeek.map(day => {
                  const classInfo = getClassForTimeAndDay(time, day);
                  const isSelected = isDayPassMode && selectedClass?.id === classInfo?.id;
                  const isClickable = isDayPassMode && isAuthenticated && classInfo;
                  return (
                    <div
                      key={`${time}-${day}`}
                      className={`${styles.classCell} ${
                        classInfo ? getClassTypeStyle(classInfo.className) : styles.cellEmpty
                      } ${isClickable ? styles.classCellClickable : ''} ${isSelected ? styles.classCellSelected : ''}`}
                      onClick={() => classInfo && handleClassClick(classInfo)}
                      style={{ cursor: isClickable ? 'pointer' : 'default' }}
                    >
                      {classInfo ? (
                        <div className={styles.cellContent}>
                          <div className={styles.cellClassName}>
                            {classInfo.className.includes('|') ? (
                              <div className={styles.desktopSplitClass}>
                                {classInfo.className.split('|').map((part, idx) => {
                                  const badgeInfo = getBadgeForClassType(part);
                                  return (
                                    <div key={idx} className={styles.desktopClassPart}>
                                      <span className={badgeInfo.badge}>{badgeInfo.label}</span>
                                      <span>{part.trim()}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className={styles.desktopSingleClass}>
                                <span className={getBadgeForClassType(classInfo.className).badge}>
                                  {getBadgeForClassType(classInfo.className).label}
                                </span>
                                <span>{classInfo.className}</span>
                              </div>
                            )}
                          </div>
                          {classInfo.coach && (
                            <span className={styles.cellCoach}>{classInfo.coach}</span>
                          )}
                        </div>
                      ) : (
                        <span className={styles.emptyCellContent}>—</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Mobile Card View */}
          <div className={styles.scheduleMobile}>
            {daysOfWeek.map(day => {
              const dayClasses = timeSlots
                .map(time => ({ time, classInfo: getClassForTimeAndDay(time, day) }))
                .filter(item => item.classInfo);

              return (
                <div key={day} className={styles.dayCard}>
                  <h3 className={styles.dayCardHeader}>
                    {dayLabels[day as keyof typeof dayLabels]}
                  </h3>
                  <div className={styles.dayCardClasses}>
                    {dayClasses.length > 0 ? (
                      dayClasses.map(({ time, classInfo }) => {
                        const isSelected = isDayPassMode && selectedClass?.id === classInfo?.id;
                        const isClickable = isDayPassMode && isAuthenticated && classInfo;
                        return (
                          <div
                            key={`${time}-${day}`}
                            className={`${styles.mobileClassItem} ${
                              classInfo ? getClassTypeStyle(classInfo.className) : ''
                            } ${isClickable ? styles.classCellClickable : ''} ${isSelected ? styles.classCellSelected : ''}`}
                            onClick={() => classInfo && handleClassClick(classInfo)}
                            style={{ cursor: isClickable ? 'pointer' : 'default' }}
                          >
                            <div className={styles.mobileClassTime}>{time}</div>
                          <div className={styles.mobileClassName}>
                            {classInfo?.className.includes('|') ? (
                              <div className={styles.splitClassName}>
                                {classInfo.className.split('|').map((part, idx) => {
                                  const badgeInfo = getBadgeForClassType(part);
                                  return (
                                    <div key={idx} className={styles.classNamePart}>
                                      <span className={badgeInfo.badge}>{badgeInfo.label}</span>
                                      <span>{part.trim()}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className={styles.singleClassName}>
                                <span className={getBadgeForClassType(classInfo?.className || '').badge}>
                                  {getBadgeForClassType(classInfo?.className || '').label}
                                </span>
                                <span>{classInfo?.className}</span>
                              </div>
                            )}
                          </div>
                          {classInfo?.coach && (
                            <div className={styles.mobileClassCoach}>{classInfo.coach}</div>
                          )}
                          </div>
                        );
                      })
                    ) : (
                      <div className={styles.noClasses}>No classes scheduled</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.scheduleFooter}>
            <div className={styles.footerContent}>
              <h3>Ready to Join a Class?</h3>
              <p>Book your spot or start with a free trial class today!</p>
              <div className={styles.footerActions}>
                <Button variant="primary" size="large" onClick={() => setIsAuthModalOpen(true)}>
                  Book a Class
                </Button>
                <Button variant="outline" size="large" onClick={() => setIsTrialModalOpen(true)}>
                  Free Trial
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={isDayPassMode ? "signup" : "login"}
      />

      <TrialModal
        isOpen={isTrialModalOpen}
        onClose={() => setIsTrialModalOpen(false)}
      />

      {selectedClass && user && (
        <DayPassPaymentModal
          isOpen={showPaymentModal}
          onClose={handlePaymentModalClose}
          selectedClass={{
            id: selectedClass.id,
            day: selectedClass.day,
            time: selectedClass.time,
            className: selectedClass.className,
            coach: selectedClass.coach,
          }}
          userId={user.id}
        />
      )}
    </>
  );
};

export default Schedule;
