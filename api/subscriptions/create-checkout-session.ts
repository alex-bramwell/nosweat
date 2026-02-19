import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { priceId, email, userId } = req.body;

    if (!priceId || !email) {
      return res.status(400).json({ error: 'Missing required fields: priceId, email' });
    }

    const origin = req.headers.origin || 'https://nosweat.fitness';

    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      metadata: {
        user_id: userId || '',
      },
      return_url: `${origin}/subscribe/complete?session_id={CHECKOUT_SESSION_ID}`,
    });

    return res.status(200).json({
      clientSecret: session.client_secret,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
