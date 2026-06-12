-- Platform subscription state for gym owners paying for noSweat.
--
-- The subscription belongs to the GYM (the entity that is on trial - gyms
-- already has trial_status with a 'converted' value that nothing set until now).
-- The webhook previously wrote these fields to `profiles`, where the columns
-- never existed, so every gym-owner subscription silently failed to record.
--
-- Cancellation model: cancel sets subscription_cancel_at_period_end = true and
-- the gym keeps access (trial_status stays 'converted') until
-- subscription_current_period_end, when Stripe cancels the subscription and the
-- customer.subscription.deleted webhook flips trial_status to 'expired'.

ALTER TABLE public.gyms
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT,
  ADD COLUMN IF NOT EXISTS subscription_cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ;

-- Look up a gym by its Stripe subscription id when syncing webhook events.
CREATE INDEX IF NOT EXISTS idx_gyms_stripe_subscription
  ON public.gyms(stripe_subscription_id);
