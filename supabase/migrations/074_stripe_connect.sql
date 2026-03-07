-- ============================================================================
-- 074: Stripe Connect Support
-- Adds Connect onboarding fields to gyms, Stripe price IDs to memberships,
-- and a member_subscriptions table for recurring gym membership payments.
-- ============================================================================

-- 1. Add Connect onboarding status to gyms
ALTER TABLE public.gyms
  ADD COLUMN IF NOT EXISTS stripe_account_status TEXT DEFAULT 'not_started'
    CHECK (stripe_account_status IN ('not_started', 'onboarding', 'active', 'restricted', 'disabled')),
  ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS platform_fee_percent NUMERIC(5,2) DEFAULT 10.00;

-- 2. Add Stripe price ID to gym_memberships so recurring billing works
ALTER TABLE public.gym_memberships
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_product_id TEXT;

-- 3. Create member_subscriptions table for tracking active gym memberships
CREATE TABLE IF NOT EXISTS public.member_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  membership_id UUID REFERENCES public.gym_memberships(id),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'past_due', 'cancelled', 'incomplete', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_member_subscriptions_gym_id ON public.member_subscriptions(gym_id);
CREATE INDEX IF NOT EXISTS idx_member_subscriptions_user_id ON public.member_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_member_subscriptions_stripe_sub ON public.member_subscriptions(stripe_subscription_id);

ALTER TABLE public.member_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS: Members can read their own subscriptions
CREATE POLICY "member_subscriptions_select_own" ON public.member_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- RLS: Gym admins/owners can read all subscriptions for their gym
CREATE POLICY "member_subscriptions_select_admin" ON public.member_subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND gym_id = member_subscriptions.gym_id AND role IN ('admin', 'owner')
    )
    OR is_gym_owner(member_subscriptions.gym_id)
  );

-- RLS: Service role can do everything (for webhook handlers)
CREATE POLICY "member_subscriptions_service" ON public.member_subscriptions
  FOR ALL USING (true) WITH CHECK (true);

-- 4. Update trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_member_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_member_subscriptions_updated_at
  BEFORE UPDATE ON public.member_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_member_subscriptions_updated_at();
