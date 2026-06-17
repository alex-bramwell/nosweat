import type { StripeError } from '@stripe/stripe-js';

// Day-pass price fallback. The real price is owner-configured per gym
// (gyms.day_pass_price_pence) and read from TenantContext; these constants are
// only used when tenant data isn't available yet.
export const DAY_PASS_PRICE_PENCE = 1000;
export const DAY_PASS_PRICE_LABEL = '£10';

// Short price label for marketing/info copy: drops the ".00" on whole pounds
// (e.g. 1000 -> "£10", 1050 -> "£10.50").
export function formatPriceShort(pence: number, currency: string = 'gbp'): string {
  const whole = pence % 100 === 0;
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(pence / 100);
}

export function formatCurrency(amount: number, currency: string = 'gbp'): string {
  const formatter = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Convert from pence/cents to main currency unit
  const mainAmount = amount / 100;
  return formatter.format(mainAmount);
}

export function handlePaymentError(error: StripeError | Error | unknown): string {
  if (!error) {
    return 'An unknown error occurred';
  }

  // Handle Stripe errors
  if (typeof error === 'object' && error !== null && 'type' in error) {
    const stripeError = error as StripeError;

    switch (stripeError.type) {
      case 'card_error':
        return stripeError.message || 'Your card was declined';

      case 'validation_error':
        return 'Please check your payment details and try again';

      case 'api_connection_error':
        return 'Network error. Please check your connection and try again';

      case 'api_error':
      case 'authentication_error':
      case 'rate_limit_error':
        return 'Payment processing error. Please try again or contact support';

      case 'invalid_request_error':
        return 'Invalid payment request. Please contact support';

      default:
        return stripeError.message || 'Payment failed. Please try again';
    }
  }

  // Handle generic errors
  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}

export function validatePaymentAmount(amount: number): boolean {
  // Amount should be a positive integer (in pence/cents)
  return Number.isInteger(amount) && amount > 0;
}

export function convertToPence(pounds: number): number {
  // Convert pounds to pence
  return Math.round(pounds * 100);
}

export function convertFromPence(pence: number): number {
  // Convert pence to pounds
  return pence / 100;
}
