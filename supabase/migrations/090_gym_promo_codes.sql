-- Per-gym promotion codes. Membership subscriptions are destination charges on
-- the PLATFORM Stripe account, so a gym's promo is a platform coupon restricted
-- to that gym's membership products (applies_to.products) - this is what stops
-- one gym's code working on another gym's checkout. We track them here so owners
-- can list and deactivate their own codes without hitting Stripe to enumerate.

CREATE TABLE IF NOT EXISTS public.gym_promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  stripe_promotion_code_id TEXT,
  stripe_coupon_id TEXT,
  percent_off INTEGER NOT NULL CHECK (percent_off BETWEEN 1 AND 100),
  duration TEXT NOT NULL DEFAULT 'once' CHECK (duration IN ('once', 'forever', 'repeating')),
  duration_in_months INTEGER,
  max_redemptions INTEGER,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gym_promo_codes_gym ON public.gym_promo_codes(gym_id);

ALTER TABLE public.gym_promo_codes ENABLE ROW LEVEL SECURITY;

-- Gym admins can read their own gym's promo codes.
CREATE POLICY "gym_promo_codes_select_admin" ON public.gym_promo_codes
  FOR SELECT USING (gym_id = get_user_gym_id() AND is_gym_admin());

-- Writes go through the service role only (the owner-verified API endpoints);
-- scoped to service_role so it doesn't grant blanket access to logged-in users.
CREATE POLICY "gym_promo_codes_service" ON public.gym_promo_codes
  FOR ALL TO service_role USING (true) WITH CHECK (true);
