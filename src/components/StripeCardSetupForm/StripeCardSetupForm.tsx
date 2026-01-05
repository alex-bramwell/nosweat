import React, { useState, useEffect } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '../common';
import { stripePromise } from '../../lib/stripe';
import { supabase } from '../../lib/supabase';
import { handlePaymentError } from '../../utils/payment';
import styles from './StripeCardSetupForm.module.scss';

interface StripeCardSetupFormProps {
  userId: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

interface SetupFormProps {
  userId: string;
  clientSecret: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const SetupForm: React.FC<SetupFormProps> = ({ userId, clientSecret, onSuccess, onError }) => {
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

      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/schedule`,
        },
        redirect: 'if_required',
      });

      if (error) {
        onError(handlePaymentError(error));
        setIsProcessing(false);
      } else if (setupIntent && setupIntent.status === 'succeeded') {
        // Setup succeeded, wait for webhook to process
        await pollForTrialSetup(userId);
        onSuccess();
      }
    } catch (err) {
      onError(handlePaymentError(err));
      setIsProcessing(false);
    }
  };

  const pollForTrialSetup = async (userId: string, maxAttempts = 10): Promise<void> => {
    for (let i = 0; i < maxAttempts; i++) {
      const { data: trialMembership } = await supabase
        .from('trial_memberships')
        .select('status, stripe_payment_method_id')
        .eq('user_id', userId)
        .single();

      if (trialMembership && trialMembership.stripe_payment_method_id) {
        return;
      }

      // Wait 1 second before next attempt
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error('Trial setup timeout');
  };

  return (
    <form onSubmit={handleSubmit} className={styles.setupForm}>
      <div className={styles.infoSection}>
        <div className={styles.infoIcon}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        </div>
        <div className={styles.infoText}>
          <h4>Your card won't be charged</h4>
          <p>
            We'll authorize your payment method but won't charge you during your 7-day trial.
            Cancel anytime before the trial ends to avoid being charged.
          </p>
        </div>
      </div>

      <div className={styles.paymentElementWrapper}>
        <PaymentElement />
      </div>

      <div className={styles.trialInfo}>
        <p>
          <strong>What happens next:</strong>
        </p>
        <ul>
          <li>Your 7-day trial starts immediately</li>
          <li>Book and attend classes during your trial</li>
          <li>Cancel anytime before the trial ends</li>
          <li>After 7 days, you'll be charged for a full membership</li>
        </ul>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="large"
        fullWidth
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? 'Setting up...' : 'Complete Trial Setup'}
      </Button>

      <p className={styles.secureNote}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        Your payment information is securely processed by Stripe
      </p>
    </form>
  );
};

const StripeCardSetupForm: React.FC<StripeCardSetupFormProps> = ({
  userId,
  onSuccess,
  onError,
}) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      createSetupIntent();
    }
  }, [userId]);

  const createSetupIntent = async () => {
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/payments/create-setup-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create setup intent');
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
    } catch (err) {
      onError(handlePaymentError(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Initializing secure setup...</p>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className={styles.error}>
        <p>Failed to initialize payment setup</p>
        <Button variant="secondary" size="medium" onClick={createSetupIntent}>
          Try Again
        </Button>
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
      <SetupForm
        userId={userId}
        clientSecret={clientSecret}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
};

export default StripeCardSetupForm;
