import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { Modal, Button, CardFields } from '../common';
import { useStripePayment } from '../../hooks/useStripePayment';
import { stripePromise } from '../../lib/stripe';
import { createDayPassPaymentIntent, pollForBooking } from '../../services/dayPassService';
import { formatCurrency, handlePaymentError, DAY_PASS_PRICE_PENCE } from '../../utils/payment';
import { useRegistrationIntent } from '../../contexts/RegistrationContext';
import { useTenant, useGymPath } from '../../contexts/TenantContext';
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
  const { gym } = useTenant();
  const pricePence = gym?.day_pass_price_pence ?? DAY_PASS_PRICE_PENCE;
  const { submit, isProcessing, stripe } = useStripePayment({
    mode: 'payment',
    clientSecret,
    onError,
    onSuccess: async (intent) => {
      // Payment succeeded, poll for booking creation
      const bookingId = await pollForBooking(userId, intent.id);
      onSuccess(bookingId);
    },
  });

  return (
    <form onSubmit={submit} className={styles.paymentForm}>
      <div className={styles.classDetails}>
        <h3>Class Details</h3>
        <div className={styles.detailRow}>
          <span className={styles.paymentDetailLabel}>Class:</span>
          <span className={styles.paymentDetailValue}>{selectedClass.className}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.paymentDetailLabel}>Day:</span>
          <span className={styles.paymentDetailValue}>{selectedClass.day}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.paymentDetailLabel}>Time:</span>
          <span className={styles.paymentDetailValue}>{selectedClass.time}</span>
        </div>
        {selectedClass.coach && (
          <div className={styles.detailRow}>
            <span className={styles.paymentDetailLabel}>Coach:</span>
            <span className={styles.paymentDetailValue}>{selectedClass.coach}</span>
          </div>
        )}
      </div>

      <div className={styles.priceSection}>
        <div className={styles.priceRow}>
          <span className={styles.priceLabel}>Day Pass:</span>
          <span className={styles.priceValue}>{formatCurrency(pricePence, 'gbp')}</span>
        </div>
      </div>

      <CardFields />

      <Button
        type="submit"
        variant="primary"
        size="prominent"
        fullWidth
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? 'Processing...' : `Pay ${formatCurrency(pricePence, 'gbp')} and Book Class`}
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
  const gymPath = useGymPath();
  const { clearIntent } = useRegistrationIntent();
  const { gym } = useTenant();
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
      const clientSecret = await createDayPassPaymentIntent({
        userId,
        classId: selectedClass.id,
        classDetails: selectedClass,
        gymId: gym?.id,
      });
      setClientSecret(clientSecret);
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
      navigate(gymPath(`/booking-confirmation?bookingId=${bookingId}`));
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
      <div className={styles.paymentBody}>
        <h2 className={styles.paymentTitle}>Complete Your Day Pass Purchase</h2>

        {isLoading && (
          <div className={styles.paymentLoading}>
            <div className={styles.paymentSpinner}></div>
            <p>Preparing secure payment...</p>
          </div>
        )}

        {error && (
          <div className={styles.paymentError}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p>{error}</p>
            <Button variant="secondary" size="default" onClick={createPaymentIntent}>
              Try Again
            </Button>
          </div>
        )}

        {isSuccess && (
          <div className={styles.paymentConfirmation}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <h3>Payment Successful!</h3>
            <p>Your booking is confirmed. Redirecting...</p>
          </div>
        )}

        {!isLoading && !error && !isSuccess && clientSecret && (
          <Elements stripe={stripePromise}>
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
