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
    const { userId, classId, classDetails } = req.body;

    if (!userId || !classId || !classDetails) {
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

    // Get or create Stripe customer
    const { data: existingCustomer } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    let stripeCustomerId: string;

    if (existingCustomer) {
      stripeCustomerId = existingCustomer.stripe_customer_id;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: userId,
        },
      });

      stripeCustomerId = customer.id;

      // Save to database
      await supabase.from('stripe_customers').insert({
        user_id: userId,
        stripe_customer_id: stripeCustomerId,
      });
    }

    // Create payment intent for £10 (1000 pence)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1000, // £10 in pence
      currency: 'gbp',
      customer: stripeCustomerId,
      metadata: {
        user_id: userId,
        class_id: classId,
        class_day: classDetails.day,
        class_time: classDetails.time,
        class_name: classDetails.className,
        coach_name: classDetails.coach || '',
        payment_type: 'day-pass',
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Save payment record to database
    await supabase.from('payments').insert({
      user_id: userId,
      stripe_payment_intent_id: paymentIntent.id,
      stripe_customer_id: stripeCustomerId,
      amount: 1000,
      currency: 'gbp',
      status: 'pending',
      payment_type: 'day-pass',
      metadata: {
        class_id: classId,
        class_details: classDetails,
      },
    });

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
