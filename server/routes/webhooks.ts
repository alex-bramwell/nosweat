/**
 * Webhook API Routes
 * Handles Stripe webhook events
 */

import express from 'express';

const router = express.Router();

// TODO: Implement webhook routes from api/webhooks/
// - stripe.ts

router.post('/stripe', async (req, res) => {
  res.status(501).json({ error: 'Not yet implemented - migrate from Vercel function' });
});

export default router;
