import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Modal, Button } from '../common';
import { stripePromise } from '../../lib/stripe';
import { supabase } from '../../lib/supabase';
import { formatCurrency, handlePaymentError } from '../../utils/payment';
import { useRegistrationIntent } from '../../contexts/RegistrationContext';
import styles from './DayPassPaymentModal.module.scss';

interface DayPassPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClass: {
    id: string;
    day: string;
    time: string;
    className: string;
    coach?: string;
  };
  userId: string;
}

interface PaymentFormProps {
  selectedClass: DayPassPaymentModalProps['selectedClass'];
  userId: string;
  clientSecret: string;
  onSuccess: (bookingId: string) => void;
  onError: (error: string) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  selectedClass,
  userId,
  clientSecret,
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
      <div className={styles.classDetails}>
        <h3>Class Details</h3>
        <div className={styles.detailRow}>
          <span className={styles.label}>Class:</span>
          <span className={styles.value}>{selectedClass.className}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.label}>Day:</span>
          <span className={styles.value}>{selectedClass.day}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.label}>Time:</span>
          <span className={styles.value}>{selectedClass.time}</span>
        </div>
        {selectedClass.coach && (
          <div className={styles.detailRow}>
            <span className={styles.label}>Coach:</span>
            <span className={styles.value}>{selectedClass.coach}</span>
          </div>
        )}
      </div>

      <div className={styles.priceSection}>
        <div className={styles.priceRow}>
          <span className={styles.priceLabel}>Day Pass:</span>
          <span className={styles.priceValue}>{formatCurrency(1000, 'gbp')}</span>
        </div>
      </div>

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

const DayPassPaymentModal: React.FC<DayPassPaymentModalProps> = ({
  isOpen,
  onClose,
  selectedClass,
  userId,
}) => {
  const navigate = useNavigate();
  const { clearIntent } = useRegistrationIntent();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      createPaymentIntent();
    }
  }, [isOpen, userId]);

  const createPaymentIntent = async () => {
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
          userId,
          classId: selectedClass.id,
          classDetails: selectedClass,
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
    setIsSuccess(true);
    setTimeout(() => {
      clearIntent();
      navigate(`/booking-confirmation?bookingId=${bookingId}`);
      onClose();
    }, 2000);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleClose = () => {
    if (!isSuccess && !isLoading) {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className={styles.content}>
        <h2 className={styles.title}>Complete Your Day Pass Purchase</h2>

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
            <Button variant="secondary" size="medium" onClick={createPaymentIntent}>
              Try Again
            </Button>
          </div>
        )}

        {isSuccess && (
          <div className={styles.success}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <h3>Payment Successful!</h3>
            <p>Your booking is confirmed. Redirecting...</p>
          </div>
        )}

        {!isLoading && !error && !isSuccess && clientSecret && (
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
              selectedClass={selectedClass}
              userId={userId}
              clientSecret={clientSecret}
              onSuccess={handleSuccess}
              onError={handleError}
            />
          </Elements>
        )}
      </div>
    </Modal>
  );
};

export default DayPassPaymentModal;
