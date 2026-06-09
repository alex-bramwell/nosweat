import { supabase } from '../lib/supabase';
import { authFetch } from '../lib/auth';

// The two day-pass flows build the class object slightly differently (one from a
// typed ClassSchedule, one from registration-intent state with a plain string
// day), so accept a permissive shape - the endpoint just serializes it.
interface DayPassClassDetails {
  id: string;
  day: string;
  time: string;
  className: string;
  coach?: string;
}

/**
 * Create a day-pass PaymentIntent for a selected class and return its client
 * secret. Shared by the Hero day-pass flow and the Schedule day-pass flow.
 */
export async function createDayPassPaymentIntent(params: {
  userId: string | undefined;
  classId: string;
  classDetails: DayPassClassDetails;
  gymId?: string;
}): Promise<string> {
  const data = await authFetch<{ clientSecret: string }>(
    '/api/payments/create-payment-intent',
    {
      userId: params.userId,
      classId: params.classId,
      classDetails: params.classDetails,
      gymId: params.gymId,
    }
  );
  return data.clientSecret;
}

/**
 * Poll for the booking the Stripe webhook creates after a successful day-pass
 * payment. Resolves with the booking id, or throws after maxAttempts.
 */
export async function pollForBooking(
  userId: string,
  paymentIntentId: string,
  maxAttempts = 10
): Promise<string> {
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
}
