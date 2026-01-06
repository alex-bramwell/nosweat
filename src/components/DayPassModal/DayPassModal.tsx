import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Modal, Button } from '../common';
import { stripePromise } from '../../lib/stripe';
import { supabase } from '../../lib/supabase';
import { formatCurrency, handlePaymentError } from '../../utils/payment';
import { weeklySchedule } from '../../data/schedule';
import type { ClassSchedule } from '../../types';
import styles from './DayPassModal.module.scss';

interface DayPassModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'auth' | 'class-selection' | 'payment' | 'success';

interface PaymentFormProps {
  userId: string;
  clientSecret: string;
  onSuccess: (bookingId: string) => void;
  onError: (error: string) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  userId,
  onSuccess,
  onError,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        onError(handlePaymentError(submitError));
        setIsProcessing(false);
        return;
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/booking-confirmation`,
        },
        redirect: 'if_required',
      });

      if (error) {
        onError(handlePaymentError(error));
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded, poll for booking creation
        const bookingId = await pollForBooking(userId, paymentIntent.id);
        onSuccess(bookingId);
      }
    } catch (err) {
      onError(handlePaymentError(err));
      setIsProcessing(false);
    }
  };

  const pollForBooking = async (userId: string, paymentIntentId: string, maxAttempts = 10): Promise<string> => {
    for (let i = 0; i < maxAttempts; i++) {
      const { data: payment } = await supabase
        .from('payments')
        .select('id')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .eq('status', 'succeeded')
        .single();

      if (payment) {
        const { data: booking } = await supabase
          .from('bookings')
          .select('id')
          .eq('user_id', userId)
          .eq('payment_id', payment.id)
          .single();

        if (booking) {
          return booking.id;
        }
      }

      // Wait 1 second before next attempt
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error('Booking creation timeout');
  };

  return (
    <form onSubmit={handleSubmit} className={styles.paymentForm}>
      <div className={styles.paymentElementWrapper}>
        <PaymentElement />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="large"
        fullWidth
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? 'Processing...' : `Pay ${formatCurrency(1000, 'gbp')} and Book Class`}
      </Button>
    </form>
  );
};

const DayPassModal: React.FC<DayPassModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>('auth');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [selectedClass, setSelectedClass] = useState<ClassSchedule | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [hasAgreedToDisclaimer, setHasAgreedToDisclaimer] = useState(false);
  const [selectedClassType, setSelectedClassType] = useState<'crossfit' | 'opengym'>('crossfit');

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep('auth');
      setSelectedClass(null);
      setClientSecret(null);
      setError(null);
      setAuthError(null);
      setEmail('');
      setPassword('');
      setHasAgreedToDisclaimer(false);
      setSelectedClassType('crossfit');
    }
  }, [isOpen]);

  // Update step based on auth status
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      setCurrentStep('class-selection');
    }
  }, [isOpen, isAuthenticated]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setIsAuthenticated(true);
      setUser(session.user);
      setCurrentStep('class-selection');
    } else {
      setIsAuthenticated(false);
      setUser(null);
      setCurrentStep('auth');
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoading(true);

    try {
      if (authMode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setIsAuthenticated(true);
        setUser(data.user);
        setCurrentStep('class-selection');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setIsAuthenticated(true);
        setUser(data.user);
        setCurrentStep('class-selection');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClassSelection = (classInfo: ClassSchedule, selectedDate?: string, selectedType?: string) => {
    // Add the selected date and type to the class info
    const classWithDate = {
      ...classInfo,
      selectedDate: selectedDate || '',
      selectedType: selectedType || classInfo.className,
    };
    setSelectedClass(classWithDate as ClassSchedule);
    setCurrentStep('payment');
    createPaymentIntent(classWithDate as ClassSchedule);
  };

  const createPaymentIntent = async (classInfo: ClassSchedule) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/payments/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId: user?.id,
          classId: classInfo.id,
          classDetails: classInfo,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment intent');
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
    } catch (err) {
      setError(handlePaymentError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = (bookingId: string) => {
    setCurrentStep('success');
    setTimeout(() => {
      navigate(`/booking-confirmation?bookingId=${bookingId}`);
      onClose();
    }, 2000);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleBack = () => {
    if (currentStep === 'payment') {
      setCurrentStep('class-selection');
      setSelectedClass(null);
      setClientSecret(null);
    } else if (currentStep === 'class-selection') {
      setCurrentStep('auth');
    }
  };

  // Helper function to get next 7 days starting from today
  const getNext7Days = () => {
    const days = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const formattedDate = date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

      days.push({
        dayName,
        date: formattedDate,
        dateObj: date,
      });
    }

    return days;
  };

  const next7Days = getNext7Days();

  const getClassesByDay = (dayName: string) => {
    return weeklySchedule.filter(cls => cls.day === dayName);
  };

  // Helper to check if class includes CrossFit
  const isCrossFitClass = (className: string): boolean => {
    return className.toLowerCase().includes('crossfit');
  };

  // Helper to parse class types (when class has both)
  const getClassTypes = (className: string): string[] => {
    if (className.includes('|')) {
      const parts = className.split('|').map(p => p.trim());
      return parts;
    }
    return [className];
  };

  const getClassTypeStyle = (className: string): string => {
    const normalizedName = className.toLowerCase();
    if (normalizedName.includes('specialty')) {
      return styles.classSpecialty;
    }
    if (normalizedName.includes('crossfit') && normalizedName.includes('open gym')) {
      return styles.classBoth;
    }
    if (normalizedName.includes('open gym')) {
      return styles.classOpenGym;
    }
    return styles.classCrossFit;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={`${styles.modalContent} ${styles.dayPassModal}`}>
        {/* Progress Indicator */}
        <div className={styles.progressBar}>
          <div className={`${styles.progressStep} ${currentStep === 'auth' || currentStep === 'class-selection' || currentStep === 'payment' || currentStep === 'success' ? styles.active : ''}`}>
            <div className={styles.stepNumber}>1</div>
            <div className={styles.stepLabel}>Sign In</div>
          </div>
          <div className={styles.progressLine} />
          <div className={`${styles.progressStep} ${currentStep === 'class-selection' || currentStep === 'payment' || currentStep === 'success' ? styles.active : ''}`}>
            <div className={styles.stepNumber}>2</div>
            <div className={styles.stepLabel}>Select Class</div>
          </div>
          <div className={styles.progressLine} />
          <div className={`${styles.progressStep} ${currentStep === 'payment' || currentStep === 'success' ? styles.active : ''}`}>
            <div className={styles.stepNumber}>3</div>
            <div className={styles.stepLabel}>Payment</div>
          </div>
        </div>

        {/* Step: Authentication */}
        {currentStep === 'auth' && (
          <div className={styles.stepContent}>
            <h2 className={styles.title}>Sign In to Book Day Pass</h2>
            <p className={styles.subtitle}>Create an account or sign in to continue</p>

            <div className={styles.authToggle}>
              <button
                className={`${styles.toggleBtn} ${authMode === 'login' ? styles.active : ''}`}
                onClick={() => setAuthMode('login')}
                type="button"
              >
                Sign In
              </button>
              <button
                className={`${styles.toggleBtn} ${authMode === 'signup' ? styles.active : ''}`}
                onClick={() => setAuthMode('signup')}
                type="button"
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleAuth} className={styles.authForm}>
              <div className={styles.formGroup}>
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  minLength={8}
                />
              </div>

              {authError && (
                <div className={styles.error}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <p>{authError}</p>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="large"
                fullWidth
                disabled={isLoading}
              >
                {isLoading ? 'Please wait...' : authMode === 'login' ? 'Sign In' : 'Create Account'}
              </Button>
            </form>
          </div>
        )}

        {/* Step: Class Selection */}
        {currentStep === 'class-selection' && (
          <div className={styles.stepContent}>
            <h2 className={styles.title}>Select Your Class</h2>
            <p className={styles.subtitle}>Choose from the next 7 days (£10 per class)</p>

            {/* Class Type Toggle */}
            <div className={styles.classTypeToggle}>
              <button
                type="button"
                className={`${styles.toggleButton} ${selectedClassType === 'crossfit' ? styles.active : ''}`}
                onClick={() => setSelectedClassType('crossfit')}
              >
                CrossFit
              </button>
              <button
                type="button"
                className={`${styles.toggleButton} ${selectedClassType === 'opengym' ? styles.active : ''}`}
                onClick={() => setSelectedClassType('opengym')}
              >
                Open Gym
              </button>
            </div>

            {selectedClassType === 'crossfit' && (
              <div className={styles.disclaimer}>
                <label className={styles.disclaimerLabel}>
                  <input
                    type="checkbox"
                    checked={hasAgreedToDisclaimer}
                    onChange={(e) => setHasAgreedToDisclaimer(e.target.checked)}
                    className={styles.disclaimerCheckbox}
                  />
                  <span className={styles.disclaimerText}>
                    I confirm that I am competent in high-level CrossFit movements and understand the risks involved in participating in CrossFit classes.
                  </span>
                </label>
              </div>
            )}

            <div className={styles.classSchedule}>
              {next7Days.map(({ dayName, date }) => {
                const classes = getClassesByDay(dayName);
                if (classes.length === 0) return null;

                const dayLabel = dayName.charAt(0).toUpperCase() + dayName.slice(1);

                return (
                  <div key={dayName + date} className={styles.daySection}>
                    <h3 className={styles.dayHeader}>
                      {dayLabel} - {date}
                    </h3>
                    <div className={styles.classList}>
                      {classes.map(classInfo => {
                        const classTypes = getClassTypes(classInfo.className);
                        const hasBothTypes = classTypes.length > 1;

                        if (hasBothTypes) {
                          // Filter based on selected type
                          const matchingType = classTypes.find(type => {
                            if (selectedClassType === 'crossfit') {
                              return isCrossFitClass(type);
                            } else {
                              return !isCrossFitClass(type);
                            }
                          });

                          if (!matchingType) return null;

                          const isCrossFit = isCrossFitClass(matchingType);
                          const isDisabled = isCrossFit && !hasAgreedToDisclaimer;

                          return (
                            <button
                              key={`${classInfo.id}-${date}`}
                              className={`${styles.classCard} ${getClassTypeStyle(matchingType)}`}
                              onClick={() => handleClassSelection(classInfo, date, matchingType)}
                              type="button"
                              disabled={isDisabled}
                            >
                              <div className={styles.classTime}>{classInfo.time}</div>
                              <div className={styles.className}>{matchingType}</div>
                              {classInfo.coach && (
                                <div className={styles.classCoach}>Coach: {classInfo.coach}</div>
                              )}
                              {isCrossFit && !hasAgreedToDisclaimer && (
                                <div className={styles.requiresDisclaimer}>
                                  ⚠️ Requires disclaimer
                                </div>
                              )}
                            </button>
                          );
                        } else {
                          // Single class type - check if it matches filter
                          const isCrossFit = isCrossFitClass(classInfo.className);
                          const matchesFilter = selectedClassType === 'crossfit' ? isCrossFit : !isCrossFit;

                          if (!matchesFilter) return null;

                          const isDisabled = isCrossFit && !hasAgreedToDisclaimer;

                          return (
                            <button
                              key={classInfo.id + date}
                              className={`${styles.classCard} ${getClassTypeStyle(classInfo.className)}`}
                              onClick={() => handleClassSelection(classInfo, date, classInfo.className)}
                              type="button"
                              disabled={isDisabled}
                            >
                              <div className={styles.classTime}>{classInfo.time}</div>
                              <div className={styles.className}>{classInfo.className}</div>
                              {classInfo.coach && (
                                <div className={styles.classCoach}>Coach: {classInfo.coach}</div>
                              )}
                              {isCrossFit && !hasAgreedToDisclaimer && (
                                <div className={styles.requiresDisclaimer}>
                                  ⚠️ Requires disclaimer
                                </div>
                              )}
                            </button>
                          );
                        }
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step: Payment */}
        {currentStep === 'payment' && selectedClass && (
          <div className={styles.stepContent}>
            <h2 className={styles.title}>Complete Payment</h2>

            <div className={styles.classDetails}>
              <h3>Class Details</h3>
              {(selectedClass as any).selectedDate && (
                <div className={styles.detailRow}>
                  <span className={styles.label}>Date:</span>
                  <span className={styles.value}>{(selectedClass as any).selectedDate}</span>
                </div>
              )}
              <div className={styles.detailRow}>
                <span className={styles.label}>Time:</span>
                <span className={styles.value}>{selectedClass.time}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Class Type:</span>
                <span className={styles.value}>
                  {(selectedClass as any).selectedType || selectedClass.className}
                </span>
              </div>
              {selectedClass.coach && (
                <div className={styles.detailRow}>
                  <span className={styles.label}>Coach:</span>
                  <span className={styles.value}>{selectedClass.coach}</span>
                </div>
              )}
              <div className={styles.detailRow}>
                <span className={styles.label}>Price:</span>
                <span className={styles.priceValue}>{formatCurrency(1000, 'gbp')}</span>
              </div>
            </div>

            {isLoading && (
              <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Preparing secure payment...</p>
              </div>
            )}

            {error && (
              <div className={styles.error}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <p>{error}</p>
                <Button variant="secondary" size="medium" onClick={() => createPaymentIntent(selectedClass)}>
                  Try Again
                </Button>
              </div>
            )}

            {!isLoading && !error && clientSecret && (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                  },
                }}
              >
                <PaymentForm
                  userId={user?.id}
                  clientSecret={clientSecret}
                  onSuccess={handleSuccess}
                  onError={handleError}
                />
              </Elements>
            )}

            <Button
              variant="outline"
              size="medium"
              onClick={handleBack}
              disabled={isLoading}
            >
              Back to Class Selection
            </Button>
          </div>
        )}

        {/* Step: Success */}
        {currentStep === 'success' && (
          <div className={styles.stepContent}>
            <div className={styles.success}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <h3>Payment Successful!</h3>
              <p>Your day pass has been booked. Redirecting to confirmation...</p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DayPassModal;
