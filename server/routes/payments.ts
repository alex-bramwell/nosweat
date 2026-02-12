/**
 * Payment API Routes
 * Handles Stripe payment intents and setup intents
 */

import express from 'express';

const router = express.Router();

// TODO: Implement payment routes from api/payments/
// - create-payment-intent.ts
// - create-setup-intent.ts

router.post('/create-payment-intent', async (req, res) => {
  res.status(501).json({ error: 'Not yet implemented - migrate from Vercel function' });
});

router.post('/create-setup-intent', async (req, res) => {
  res.status(501).json({ error: 'Not yet implemented - migrate from Vercel function' });
});

export default router;
