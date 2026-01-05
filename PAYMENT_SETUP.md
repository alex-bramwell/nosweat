# Day Pass & Trial Payment Setup Guide

This document outlines the complete implementation of day pass and free trial payment flows with Stripe integration.

## Implementation Summary

### ✅ Completed Features

1. **Intent Tracking System** - Persists user intent (day pass vs trial) through registration using sessionStorage
2. **Database Schema** - 5 new tables for bookings, payments, trial memberships, and Stripe customers
3. **Payment Processing** - Full Stripe integration with PaymentIntents (day pass) and SetupIntents (trial)
4. **API Routes** - 3 serverless functions for payment creation and webhook handling
5. **Frontend Components** - Complete UI for day pass checkout and trial card setup
6. **User Flows** - Seamless routing from Hero → Auth → Payment → Confirmation

## Setup Instructions

### 1. Database Setup (Supabase)

Run the migration files in order:

```bash
# Navigate to migrations folder
cd supabase/migrations

# Run each migration in order
001_create_stripe_customers.sql
002_create_bookings.sql
003_create_payments.sql
004_create_trial_memberships.sql
005_update_profiles.sql
```

**In Supabase Dashboard:**
1. Go to SQL Editor
2. Copy contents of each migration file
3. Execute in order
4. Verify tables created successfully

### 2. Stripe Account Setup

1. **Create Stripe Account**
   - Go to [stripe.com](https://stripe.com) and sign up
   - Enable Test Mode (toggle in top right)

2. **Create Products** (in Stripe Dashboard → Products)
   - **Day Pass**
     - Name: "Day Pass"
     - Type: One-time
     - Price: £10.00 GBP
   - **Trial Membership**
     - Name: "Trial Membership Setup"
     - Type: One-time
     - Price: £0.00 (setup intent only)

3. **Get API Keys** (Stripe Dashboard → Developers → API keys)
   - Copy **Publishable key** (starts with `pk_test_`)
   - Copy **Secret key** (starts with `sk_test_`)

4. **Setup Webhook** (Stripe Dashboard → Developers → Webhooks)
   - Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Select events to listen to:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `setup_intent.succeeded`
     - `setup_intent.setup_failed`
   - Copy **Webhook signing secret** (starts with `whsec_`)

### 3. Environment Variables

Update your `.env` file:

```env
# Existing Supabase vars...
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Add these new variables:
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
```

### 4. Vercel Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables:

Add these **secret** variables:
- `STRIPE_SECRET_KEY` = `sk_test_your_secret_key`
- `STRIPE_WEBHOOK_SECRET` = `whsec_your_webhook_secret`
- `SUPABASE_SERVICE_KEY` = `your_service_role_key` (from Supabase Settings → API)

### 5. Deploy

```bash
# Build locally to test
npm run build

# Deploy to Vercel
vercel deploy
```

After deployment, update the Stripe webhook endpoint URL to your production domain.

## User Flows

### Day Pass Flow

1. User clicks "Book Day Pass" on Hero section
2. Intent stored: `{ type: 'day-pass', step: 'class-selection' }`
3. User navigates to `/schedule`
4. If not authenticated: Auth modal opens
5. After auth: User selects a class from schedule
6. Selected class shown in banner with "Continue to Payment (£10)" button
7. DayPassPaymentModal opens with Stripe Elements
8. User enters card details and pays £10
9. Payment processed, webhook creates booking
10. Redirect to `/booking-confirmation` with booking details

### Trial Flow

1. User clicks "Book Trial Pass" on Hero section
2. Intent stored: `{ type: 'trial', step: 'intent' }`
3. TrialModal opens (Step 1: What's Included)
4. User clicks "Continue to Create Account"
5. Step 2: AuthModal embedded for account creation
6. After signup: Step 3: Card Setup
7. StripeCardSetupForm displays (authorization, no charge)
8. User enters card details
9. Card authorized via SetupIntent, webhook updates profile
10. Redirect to `/schedule` with trial active message

## Testing

### Stripe Test Cards

Use these test card numbers:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Insufficient Funds**: `4000 0000 0000 9995`
- **Requires Authentication**: `4000 0027 6000 3184`

Use any future expiry date, any 3-digit CVC, and any postal code.

### Test Webhook Locally

```bash
# Install Stripe CLI
brew install stripe/stripe-brew/stripe

# Login to Stripe
stripe login

# Forward webhooks to local API
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# In another terminal, trigger events
stripe trigger payment_intent.succeeded
stripe trigger setup_intent.succeeded
```

## Architecture

### Files Created (20+)

**Backend (API Routes):**
- `api/payments/create-payment-intent.ts` - Day pass payment
- `api/payments/create-setup-intent.ts` - Trial card setup
- `api/webhooks/stripe.ts` - Payment confirmations

**Frontend (Components):**
- `src/contexts/RegistrationContext.tsx` - Intent tracking
- `src/components/DayPassPaymentModal/` - Day pass checkout
- `src/components/StripeCardSetupForm/` - Trial card form
- `src/pages/BookingConfirmation.tsx` - Success page

**Utilities:**
- `src/lib/stripe.ts` - Stripe client
- `src/utils/payment.ts` - Payment helpers

**Database:**
- `supabase/migrations/` - 5 SQL migration files

### Files Modified (6)

- `src/App.tsx` - Added RegistrationProvider and route
- `src/components/sections/Hero/Hero.tsx` - Intent tracking
- `src/components/TrialModal/TrialModal.tsx` - Added Step 3
- `src/components/AuthModal/AuthModal.tsx` - Post-auth routing
- `src/pages/Schedule.tsx` - Class selection UI
- `vercel.json` - API routes configuration

## Security Notes

- Card details never touch your server (handled by Stripe)
- API routes verify Supabase JWT tokens
- Webhook signatures verified before processing
- Amount validation server-side (client can't override)
- RLS policies on all database tables

## Troubleshooting

### Payment Intent Not Creating
- Check Stripe secret key in Vercel env vars
- Verify Supabase service key is set
- Check API route logs in Vercel dashboard

### Webhook Not Firing
- Verify webhook URL in Stripe dashboard
- Check webhook secret in Vercel env vars
- Test webhook locally with Stripe CLI

### Card Setup Failing
- Ensure user has trial_used = false
- Check SetupIntent creation in Stripe dashboard
- Verify payment method attached to customer

## Next Steps

1. **Run Migrations** - Execute SQL files in Supabase
2. **Setup Stripe Account** - Create products and get API keys
3. **Configure Environment** - Add all required env vars
4. **Test Locally** - Use Stripe test cards
5. **Deploy** - Push to Vercel
6. **Update Webhook** - Point to production URL
7. **Test Production** - Verify end-to-end flows

## Support

For issues or questions:
- Check Vercel function logs for API errors
- Check Stripe Dashboard → Events for webhook delivery
- Check Supabase Dashboard → Table Editor for data
- Verify all environment variables are set correctly
