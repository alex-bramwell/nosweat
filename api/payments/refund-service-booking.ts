import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bookingId, userId } = req.body;

    if (!bookingId || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify auth token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user || user.id !== userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Fetch the booking
    const { data: booking, error: bookingError } = await supabase
      .from('service_bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Verify the user owns this booking
    if (booking.member_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to cancel this booking' });
    }

    // Check if booking is already cancelled
    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Booking is already cancelled' });
    }

    // Check if booking is completed
    if (booking.status === 'completed') {
      return res.status(400).json({ error: 'Cannot cancel a completed booking' });
    }

    // Check if payment was made
    const hasPayment = booking.payment_status === 'paid' && booking.payment_intent_id;
    let refundProcessed = false;
    let refundEligible = false;

    if (hasPayment) {
      // Check if refund is eligible (current time is before refund_eligible_until)
      const now = new Date();
      const refundDeadline = booking.refund_eligible_until
        ? new Date(booking.refund_eligible_until)
        : null;

      refundEligible = refundDeadline ? now < refundDeadline : false;

      if (refundEligible) {
        // Process refund via Stripe
        try {
          await stripe.refunds.create({
            payment_intent: booking.payment_intent_id,
          });
          refundProcessed = true;
        } catch (stripeError) {
          console.error('Stripe refund error:', stripeError);
          // Continue with cancellation even if refund fails
          // Admin can manually process refund
        }
      }
    }

    // Update booking status
    const updateData: Record<string, unknown> = {
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    };

    if (refundProcessed) {
      updateData.payment_status = 'refunded';
    }

    const { error: updateError } = await supabase
      .from('service_bookings')
      .update(updateData)
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return res.status(500).json({ error: 'Failed to cancel booking' });
    }

    return res.status(200).json({
      success: true,
      refundProcessed,
      refundEligible,
      message: refundProcessed
        ? 'Booking cancelled and refund processed'
        : refundEligible
          ? 'Booking cancelled but refund failed - contact support'
          : 'Booking cancelled. No refund - cancellation was within 24 hours of booking time',
    });
  } catch (error) {
    console.error('Error processing cancellation:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
