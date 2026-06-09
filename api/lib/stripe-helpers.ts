import { stripe } from './stripe';
import { supabase } from './supabase';

/**
 * Strip HTML tags and cap length before sending values to Stripe metadata.
 * Stripe metadata is visible in the dashboard and forwarded to webhooks, so we
 * sanitize at the boundary to prevent XSS/injection.
 */
export function sanitizeMetadata(value: string): string {
  return String(value || '').replace(/<[^>]*>/g, '').slice(0, 500);
}

/**
 * Return the user's Stripe customer id, creating and persisting one if needed.
 * Idempotent: avoids creating duplicate Stripe customers on repeat purchases.
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string | undefined
): Promise<string> {
  const { data: existing } = await supabase
    .from('stripe_customers')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .single();

  if (existing) return existing.stripe_customer_id;

  const customer = await stripe.customers.create({
    email,
    metadata: { user_id: userId },
  });
  await supabase.from('stripe_customers').insert({
    user_id: userId,
    stripe_customer_id: customer.id,
  });
  return customer.id;
}
