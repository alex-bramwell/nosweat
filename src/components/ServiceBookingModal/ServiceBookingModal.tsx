import { useState } from 'react';
import { Button } from '../common';
import { ServicePaymentForm } from '../ServicePaymentForm';
import { coachServicesService, type CoachService, SERVICE_LABELS, type ServiceType } from '../../services/coachServicesService';
import { supabase } from '../../lib/supabase';
import styles from './ServiceBookingModal.module.scss';

interface ServiceBookingModalProps {
  service: CoachService;
  memberId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface PaymentData {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  refundEligibleUntil: string;
  bookingDetails: {
    serviceId: string;
    coachId: string;
    memberId: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    notes?: string;
    coachName: string;
    serviceType: ServiceType;
    hourlyRate: number;
  };
}

// Generate time slots from 6am to 8pm
const TIME_SLOTS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00'
];

const formatTimeSlot = (time: string): string => {
  const [hours] = time.split(':');
  const hour = parseInt(hours, 10);
  if (hour === 0) return '12:00 AM';
  if (hour === 12) return '12:00 PM';
  if (hour < 12) return `${hour}:00 AM`;
  return `${hour - 12}:00 PM`;
};

const getNextSevenDays = (): Date[] => {
  const days: Date[] = [];
  const today = new Date();
  // Start from tomorrow
  for (let i = 1; i <= 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    days.push(date);
  }
  return days;
};

export const ServiceBookingModal = ({
  service,
  memberId,
  onClose,
  onSuccess,
}: ServiceBookingModalProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'select' | 'payment' | 'success'>('select');
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);

  const availableDays = getNextSevenDays();
  const hasRate = service.hourlyRate && service.hourlyRate > 0;

  const handleContinueToPayment = async () => {
    if (!selectedDate || !selectedTime) return;

    // If no rate set, skip payment and create booking directly
    if (!hasRate) {
      await handleCreateBookingWithoutPayment();
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const bookingDate = selectedDate.toISOString().split('T')[0];
      const startTime = selectedTime;
      const [hours] = selectedTime.split(':');
      const endHour = (parseInt(hours, 10) + 1).toString().padStart(2, '0');
      const endTime = `${endHour}:00`;

      // Get session for auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please log in to book a service');
      }

      // Create payment intent
      const response = await fetch('/api/payments/create-service-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          serviceId: service.id,
          coachId: service.coachId,
          memberId,
          bookingDate,
          startTime,
          endTime,
          notes: notes || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initialize payment');
      }

      const data = await response.json();
      setPaymentData(data);
      setStep('payment');
    } catch (err) {
      console.error('Error initializing payment:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateBookingWithoutPayment = async () => {
    if (!selectedDate || !selectedTime) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const bookingDate = selectedDate.toISOString().split('T')[0];
      const startTime = selectedTime;
      const [hours] = selectedTime.split(':');
      const endHour = (parseInt(hours, 10) + 1).toString().padStart(2, '0');
      const endTime = `${endHour}:00`;

      await coachServicesService.createBooking(
        service.id,
        service.coachId,
        memberId,
        bookingDate,
        startTime,
        endTime,
        notes || undefined
      );

      onSuccess();
    } catch (err) {
      console.error('Error creating booking:', err);
      setError('Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    if (!paymentData) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Create the booking with payment details
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Session expired');
      }

      // Create booking via service (with payment info)
      const booking = await coachServicesService.createBooking(
        paymentData.bookingDetails.serviceId,
        paymentData.bookingDetails.coachId,
        paymentData.bookingDetails.memberId,
        paymentData.bookingDetails.bookingDate,
        paymentData.bookingDetails.startTime,
        paymentData.bookingDetails.endTime,
        paymentData.bookingDetails.notes
      );

      // Update booking with payment information
      const { error: updateError } = await supabase
        .from('service_bookings')
        .update({
          payment_status: 'paid',
          payment_intent_id: paymentIntentId,
          amount_paid: paymentData.amount,
          refund_eligible_until: paymentData.refundEligibleUntil,
        })
        .eq('id', booking.id);

      if (updateError) {
        console.error('Error updating booking with payment info:', updateError);
        // Payment was successful, so still consider this a success
      }

      setStep('success');
      // Brief delay to show success message
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      console.error('Error creating booking after payment:', err);
      setError('Payment successful but booking creation failed. Please contact support.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const canProceed = selectedDate && selectedTime;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Book {SERVICE_LABELS[service.serviceType]}</h2>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            &times;
          </button>
        </div>

        <div className={styles.coachInfo}>
          <div className={styles.coachAvatar}>
            {service.coachName?.charAt(0).toUpperCase() || 'C'}
          </div>
          <div>
            <p className={styles.coachName}>{service.coachName}</p>
            {service.hourlyRate && (
              <p className={styles.rate}>£{service.hourlyRate}/hour</p>
            )}
          </div>
        </div>

        {step === 'select' && (
          <>
            <div className={styles.section}>
              <h3>Select a Date</h3>
              <div className={styles.dateGrid}>
                {availableDays.map((date) => {
                  const isSelected = selectedDate?.toDateString() === date.toDateString();
                  return (
                    <button
                      key={date.toISOString()}
                      type="button"
                      className={`${styles.dateButton} ${isSelected ? styles.selected : ''}`}
                      onClick={() => setSelectedDate(date)}
                    >
                      <span className={styles.dayName}>
                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                      <span className={styles.dayNumber}>{date.getDate()}</span>
                      <span className={styles.monthName}>
                        {date.toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={styles.section}>
              <h3>Select a Time</h3>
              <div className={styles.timeGrid}>
                {TIME_SLOTS.map((time) => {
                  const isSelected = selectedTime === time;
                  return (
                    <button
                      key={time}
                      type="button"
                      className={`${styles.timeButton} ${isSelected ? styles.selected : ''}`}
                      onClick={() => setSelectedTime(time)}
                    >
                      {formatTimeSlot(time)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={styles.section}>
              <h3>Notes (Optional)</h3>
              <textarea
                className={styles.notesInput}
                placeholder="Any specific requirements or goals for this session..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.actions}>
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleContinueToPayment}
                disabled={!canProceed || isSubmitting}
              >
                {isSubmitting
                  ? 'Loading...'
                  : hasRate
                    ? `Continue to Payment (£${service.hourlyRate})`
                    : 'Confirm Booking'}
              </Button>
            </div>
          </>
        )}

        {step === 'payment' && paymentData && (
          <>
            {error && <p className={styles.error}>{error}</p>}
            <ServicePaymentForm
              clientSecret={paymentData.clientSecret}
              paymentIntentId={paymentData.paymentIntentId}
              bookingDetails={paymentData.bookingDetails}
              amount={paymentData.amount}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              onCancel={() => {
                setStep('select');
                setPaymentData(null);
                setError(null);
              }}
            />
          </>
        )}

        {step === 'success' && (
          <div className={styles.successSection}>
            <div className={styles.successIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h3>Booking Confirmed!</h3>
            <p>Your booking has been created successfully. The coach will confirm your appointment shortly.</p>
          </div>
        )}
      </div>
    </div>
  );
};
