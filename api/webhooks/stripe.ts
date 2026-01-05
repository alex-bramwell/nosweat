import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { buffer } from 'micro';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      return res.status(400).json({ error: 'Missing stripe signature' });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return res.status(400).json({ error: 'Webhook signature verification failed' });
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentSucceeded(paymentIntent);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentFailed(paymentIntent);
        break;
      }

      case 'setup_intent.succeeded': {
        const setupIntent = event.data.object as Stripe.SetupIntent;
        await handleSetupIntentSucceeded(setupIntent);
        break;
      }

      case 'setup_intent.setup_failed': {
        const setupIntent = event.data.object as Stripe.SetupIntent;
        await handleSetupIntentFailed(setupIntent);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({
      error: 'Webhook handler failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    const userId = paymentIntent.metadata.user_id;
    const classId = paymentIntent.metadata.class_id;

    // Update payment status
    await supabase
      .from('payments')
      .update({ status: 'succeeded' })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    // Create booking
    await supabase.from('bookings').insert({
      user_id: userId,
      class_id: classId,
      class_day: paymentIntent.metadata.class_day,
      class_time: paymentIntent.metadata.class_time,
      class_name: paymentIntent.metadata.class_name,
      coach_name: paymentIntent.metadata.coach_name || null,
      booking_type: 'day-pass',
      status: 'confirmed',
    });

    console.log(`Payment succeeded and booking created for user ${userId}`);
  } catch (error) {
    console.error('Error handling payment_intent.succeeded:', error);
    throw error;
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    // Update payment status
    await supabase
      .from('payments')
      .update({ status: 'failed' })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    console.log(`Payment failed for payment intent ${paymentIntent.id}`);
  } catch (error) {
    console.error('Error handling payment_intent.payment_failed:', error);
    throw error;
  }
}

async function handleSetupIntentSucceeded(setupIntent: Stripe.SetupIntent) {
  try {
    const userId = setupIntent.metadata.user_id;

    // Update trial membership with payment method
    await supabase
      .from('trial_memberships')
      .update({
        stripe_payment_method_id: setupIntent.payment_method as string,
        status: 'active',
      })
      .eq('stripe_setup_intent_id', setupIntent.id);

    // Update user profile - set trial as used and membership type to trial
    await supabase
      .from('profiles')
      .update({
        trial_used: true,
        trial_started_at: new Date().toISOString(),
        membership_type: 'trial',
      })
      .eq('id', userId);

    console.log(`Trial setup succeeded for user ${userId}`);
  } catch (error) {
    console.error('Error handling setup_intent.succeeded:', error);
    throw error;
  }
}

async function handleSetupIntentFailed(setupIntent: Stripe.SetupIntent) {
  try {
    // Update trial membership status
    await supabase
      .from('trial_memberships')
      .update({ status: 'cancelled' })
      .eq('stripe_setup_intent_id', setupIntent.id);

    console.log(`Trial setup failed for setup intent ${setupIntent.id}`);
  } catch (error) {
    console.error('Error handling setup_intent.setup_failed:', error);
    throw error;
  }
}
