/**
 * Express API Server
 * Handles all backend API routes for payments, accounting, and webhooks
 */

import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import accountingRoutes from './routes/accounting.js';
import paymentRoutes from './routes/payments.js';
import webhookRoutes from './routes/webhooks.js';

// Load environment variables
config();

const app = express();
const PORT = process.env.API_PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.VITE_APP_URL || 'http://localhost:5173',
  credentials: true
}));

// Webhook routes need raw body for signature verification
app.use('/api/webhooks', express.raw({ type: 'application/json' }));

// JSON body parser for other routes
app.use(express.json());

// API Routes
app.use('/api/accounting', accountingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/webhooks', webhookRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${process.env.VITE_APP_URL || 'http://localhost:5173'}`);
});

export default app;
