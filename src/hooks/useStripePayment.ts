import { useState } from 'react';
import type { FormEvent } from 'react';
import { CardNumberElement, useStripe, useElements } from '@stripe/react-stripe-js';
import type { PaymentIntent, SetupIntent, StripeError } from '@stripe/stripe-js';
import { handlePaymentError } from '../utils/payment';

interface UseStripePaymentOptions {
  /** 'payment' confirms a PaymentIntent (a charge); 'setup' confirms a SetupIntent (save a card). */
  mode: 'payment' | 'setup';
  clientSecret: string;
  /** Called once the intent succeeds. Do any post-success work here (poll for the
   *  booking, navigate, etc.). The processing state stays on so the form does not
   *  flicker before the caller transitions away. */
  onSuccess: (intent: PaymentIntent | SetupIntent) => void | Promise<void>;
  onError: (message: string) => void;
}

/**
 * Shared Stripe card-confirmation flow for the payment/setup forms (day pass,
 * trial, service booking). Reads the CardNumberElement, confirms with Stripe,
 * maps errors via handlePaymentError, and tracks the processing state - the
 * behaviour the four forms previously duplicated.
 */
export function useStripePayment({ mode, clientSecret, onSuccess, onError }: UseStripePaymentOptions) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const cardNumber = elements.getElement(CardNumberElement);
      if (!cardNumber) {
        onError('Card details not ready. Please try again.');
        setIsProcessing(false);
        return;
      }

      const result =
        mode === 'setup'
          ? await stripe.confirmCardSetup(clientSecret, { payment_method: { card: cardNumber } })
          : await stripe.confirmCardPayment(clientSecret, { payment_method: { card: cardNumber } });

      const { error, paymentIntent, setupIntent } = result as {
        error?: StripeError;
        paymentIntent?: PaymentIntent;
        setupIntent?: SetupIntent;
      };
      const intent = paymentIntent ?? setupIntent;

      if (error) {
        onError(handlePaymentError(error));
        setIsProcessing(false);
      } else if (intent && intent.status === 'succeeded') {
        await onSuccess(intent);
      }
    } catch (err) {
      onError(handlePaymentError(err));
      setIsProcessing(false);
    }
  };

  return { submit, isProcessing, stripe };
}
