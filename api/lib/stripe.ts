import Stripe from 'stripe';

/**
 * Shared Stripe client for all API endpoints.
 * One instance with the API version pinned in a single place, so every handler
 * behaves identically (instead of each file doing `new Stripe(...)`).
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});
