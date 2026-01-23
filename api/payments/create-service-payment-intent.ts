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
    const {
      serviceId,
      coachId,
      memberId,
      bookingDate,
      startTime,
      endTime,
      notes
    } = req.body;

    if (!serviceId || !coachId || !memberId || !bookingDate || !startTime || !endTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify auth token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user || user.id !== memberId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Fetch the service to get the hourly rate
    const { data: service, error: serviceError } = await supabase
      .from('coach_services')
      .select(`
        *,
        profiles!coach_id (full_name, email)
      `)
      .eq('id', serviceId)
      .single();

    if (serviceError || !service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    if (!service.is_active) {
      return res.status(400).json({ error: 'Service is not currently active' });
    }

    if (!service.hourly_rate || service.hourly_rate <= 0) {
      return res.status(400).json({ error: 'Service does not have a valid rate set' });
    }

    // Calculate amount in pence (1 hour session = hourly rate)
    const amountInPence = Math.round(service.hourly_rate * 100);

    // Get or create Stripe customer
    const { data: existingCustomer } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', memberId)
      .single();

    let stripeCustomerId: string;

    if (existingCustomer) {
      stripeCustomerId = existingCustomer.stripe_customer_id;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: memberId,
        },
      });

      stripeCustomerId = customer.id;

      // Save to database
      await supabase.from('stripe_customers').insert({
        user_id: memberId,
        stripe_customer_id: stripeCustomerId,
      });
    }

    // Calculate refund eligible until (24 hours before booking start)
    const bookingDateTime = new Date(`${bookingDate}T${startTime}`);
    const refundEligibleUntil = new Date(bookingDateTime.getTime() - 24 * 60 * 60 * 1000);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPence,
      currency: 'gbp',
      customer: stripeCustomerId,
      metadata: {
        user_id: memberId,
        service_id: serviceId,
        coach_id: coachId,
        booking_date: bookingDate,
        start_time: startTime,
        end_time: endTime,
        service_type: service.service_type,
        coach_name: service.profiles?.full_name || '',
        payment_type: 'service-booking',
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Return the client secret and booking details
    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amountInPence,
      refundEligibleUntil: refundEligibleUntil.toISOString(),
      bookingDetails: {
        serviceId,
        coachId,
        memberId,
        bookingDate,
        startTime,
        endTime,
        notes,
        coachName: service.profiles?.full_name,
        serviceType: service.service_type,
        hourlyRate: service.hourly_rate,
      },
    });
  } catch (error) {
    console.error('Error creating service payment intent:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
