import React, { useState } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '../common';
import { stripePromise } from '../../lib/stripe';
import { handlePaymentError } from '../../utils/payment';
import { SERVICE_LABELS, type ServiceType } from '../../services/coachServicesService';
import styles from './ServicePaymentForm.module.scss';

interface BookingDetails {
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
}

interface ServicePaymentFormProps {
  clientSecret: string;
  paymentIntentId: string;
  bookingDetails: BookingDetails;
  amount: number; // in pence
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

interface PaymentFormInnerProps {
  bookingDetails: BookingDetails;
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
  paymentIntentId: string;
}

const PaymentFormInner: React.FC<PaymentFormInnerProps> = ({
  bookingDetails,
  amount,
  onSuccess,
  onError,
  onCancel,
  paymentIntentId,
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
          return_url: `${window.location.origin}/dashboard`,
        },
        redirect: 'if_required',
      });

      if (error) {
        onError(handlePaymentError(error));
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntentId);
      }
    } catch (err) {
      onError(handlePaymentError(err));
      setIsProcessing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours, 10);
    if (hour === 0) return '12:00 AM';
    if (hour === 12) return '12:00 PM';
    if (hour < 12) return `${hour}:${minutes} AM`;
    return `${hour - 12}:${minutes} PM`;
  };

  return (
    <form onSubmit={handleSubmit} className={styles.paymentForm}>
      <div className={styles.bookingSummary}>
        <h3>Booking Summary</h3>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>Service</span>
          <span className={styles.summaryValue}>
            {SERVICE_LABELS[bookingDetails.serviceType]}
          </span>
        </div>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>Coach</span>
          <span className={styles.summaryValue}>{bookingDetails.coachName}</span>
        </div>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>Date</span>
          <span className={styles.summaryValue}>
            {formatDate(bookingDetails.bookingDate)}
          </span>
        </div>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>Time</span>
          <span className={styles.summaryValue}>
            {formatTime(bookingDetails.startTime)} - {formatTime(bookingDetails.endTime)}
          </span>
        </div>
        <div className={`${styles.summaryRow} ${styles.totalRow}`}>
          <span className={styles.summaryLabel}>Total</span>
          <span className={styles.summaryValue}>
            <span className={styles.amount}>
              £{(amount / 100).toFixed(2)}
            </span>
          </span>
        </div>
      </div>

      <div className={styles.paymentElementWrapper}>
        <PaymentElement />
      </div>

      <div className={styles.refundPolicy}>
        <p>
          <strong>Cancellation Policy:</strong> Full refund available if cancelled 24+ hours before
          your booking. No refund for cancellations within 24 hours of the session.
        </p>
      </div>

      <div className={styles.actions}>
        <Button
          type="button"
          variant="secondary"
          size="medium"
          onClick={onCancel}
          disabled={isProcessing}
        >
          Back
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="medium"
          disabled={!stripe || isProcessing}
        >
          {isProcessing ? 'Processing...' : `Pay £${(amount / 100).toFixed(2)}`}
        </Button>
      </div>

      <p className={styles.secureNote}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        Your payment is securely processed by Stripe
      </p>
    </form>
  );
};

export const ServicePaymentForm: React.FC<ServicePaymentFormProps> = ({
  clientSecret,
  paymentIntentId,
  bookingDetails,
  amount,
  onSuccess,
  onError,
  onCancel,
}) => {
  if (!stripePromise) {
    return (
      <div className={styles.error}>
        <p>Payment processing is not available. Please contact support.</p>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
        },
      }}
    >
      <PaymentFormInner
        bookingDetails={bookingDetails}
        amount={amount}
        onSuccess={onSuccess}
        onError={onError}
        onCancel={onCancel}
        paymentIntentId={paymentIntentId}
      />
    </Elements>
  );
};

export default ServicePaymentForm;
