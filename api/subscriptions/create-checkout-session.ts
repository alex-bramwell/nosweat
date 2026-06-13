import type { VercelRequest, VercelResponse } from '@vercel/node';
import { stripe } from '../lib/stripe.js';
import { assertMethod } from '../lib/auth.js';
import { checkRateLimit } from '../lib/rateLimit.js';
import { captureError } from '../lib/sentry.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!assertMethod(req, res, 'POST')) return;

  try {
    const { priceId, email, userId } = req.body;

    if (!priceId || !email) {
      return res.status(400).json({ error: 'Missing required fields: priceId, email' });
    }

    // No auth on this endpoint (pre-signup checkout), so throttle by the caller's
    // identity to limit abuse.
    if (!(await checkRateLimit(`checkout-session:${userId || email}`, 10, 60))) {
      return res.status(429).json({ error: 'Too many requests. Please slow down and try again shortly.' });
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
    await captureError(error, { endpoint: 'subscriptions/create-checkout-session' });
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
