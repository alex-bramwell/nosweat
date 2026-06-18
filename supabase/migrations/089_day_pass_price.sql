-- Owner-configurable day-pass price. Stored in pence on the gym, read
-- server-side at charge time (create-payment-intent). Defaults to £10 so the
-- price is unchanged for existing gyms.

ALTER TABLE public.gyms
  ADD COLUMN IF NOT EXISTS day_pass_price_pence INTEGER NOT NULL DEFAULT 1000;

COMMENT ON COLUMN public.gyms.day_pass_price_pence IS 'Single-class day-pass price in pence (GBP). Owner-set; read server-side. Stripe min charge is 30p.';
