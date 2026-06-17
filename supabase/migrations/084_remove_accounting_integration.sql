-- Remove the QuickBooks/Xero accounting integration feature entirely.
-- The integration was never completed (Xero stubbed, QuickBooks broken/inert,
-- no OAuth credentials configured) and duplicated mature Stripe -> QuickBooks/Xero
-- connectors. This drops all of its tables/columns and recreates the two
-- functions that referenced them so they no longer break.

-- 1. Recreate delete_gym_data() without the accounting deletes.
CREATE OR REPLACE FUNCTION delete_gym_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_gym_id  uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT p.gym_id INTO v_gym_id
  FROM public.profiles p
  JOIN public.gyms g ON g.id = p.gym_id
  WHERE p.id = v_user_id
    AND g.owner_id = v_user_id;

  IF v_gym_id IS NULL THEN
    RAISE EXCEPTION 'No gym found or you are not the owner';
  END IF;

  DELETE FROM public.service_bookings   WHERE gym_id = v_gym_id;
  DELETE FROM public.coach_services     WHERE gym_id = v_gym_id;
  DELETE FROM public.workout_bookings   WHERE gym_id = v_gym_id;
  DELETE FROM public.workouts           WHERE gym_id = v_gym_id;
  DELETE FROM public.trial_memberships  WHERE gym_id = v_gym_id;
  DELETE FROM public.payments           WHERE gym_id = v_gym_id;
  DELETE FROM public.bookings           WHERE gym_id = v_gym_id;
  DELETE FROM public.stripe_customers   WHERE gym_id = v_gym_id;
  DELETE FROM public.gym_feature_billing WHERE gym_id = v_gym_id;
  DELETE FROM public.gym_features       WHERE gym_id = v_gym_id;
  DELETE FROM public.gym_memberships    WHERE gym_id = v_gym_id;
  DELETE FROM public.gym_stats          WHERE gym_id = v_gym_id;
  DELETE FROM public.gym_schedule       WHERE gym_id = v_gym_id;
  DELETE FROM public.gym_programs       WHERE gym_id = v_gym_id;
  DELETE FROM public.gym_branding       WHERE gym_id = v_gym_id;

  UPDATE public.profiles SET gym_id = NULL WHERE gym_id = v_gym_id;

  DELETE FROM public.gyms WHERE id = v_gym_id;
END;
$$;

-- 2. Recreate reset_test_account() without the accounting deletes.
CREATE OR REPLACE FUNCTION reset_test_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_email   text;
  v_gym_id  uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;
  IF v_email NOT LIKE '%@nosweattest.com' THEN
    RAISE EXCEPTION 'Reset is only available for test accounts';
  END IF;

  SELECT gym_id INTO v_gym_id FROM public.profiles WHERE id = v_user_id;

  IF v_gym_id IS NULL THEN
    SELECT id INTO v_gym_id FROM public.gyms WHERE owner_id = v_user_id LIMIT 1;
  END IF;

  IF v_gym_id IS NOT NULL THEN
    DELETE FROM public.service_bookings   WHERE gym_id = v_gym_id;
    DELETE FROM public.coach_services     WHERE gym_id = v_gym_id;
    DELETE FROM public.workout_bookings   WHERE gym_id = v_gym_id;
    DELETE FROM public.workouts           WHERE gym_id = v_gym_id;
    DELETE FROM public.trial_memberships  WHERE gym_id = v_gym_id;
    DELETE FROM public.payments           WHERE gym_id = v_gym_id;
    DELETE FROM public.bookings           WHERE gym_id = v_gym_id;
    DELETE FROM public.stripe_customers   WHERE gym_id = v_gym_id;
    DELETE FROM public.gym_feature_billing WHERE gym_id = v_gym_id;
    DELETE FROM public.gym_features       WHERE gym_id = v_gym_id;
    DELETE FROM public.gym_memberships    WHERE gym_id = v_gym_id;
    DELETE FROM public.gym_stats          WHERE gym_id = v_gym_id;
    DELETE FROM public.gym_schedule       WHERE gym_id = v_gym_id;
    DELETE FROM public.gym_programs       WHERE gym_id = v_gym_id;
    DELETE FROM public.gym_branding       WHERE gym_id = v_gym_id;

    UPDATE public.profiles SET gym_id = NULL WHERE gym_id = v_gym_id;

    DELETE FROM public.gyms WHERE id = v_gym_id;
  END IF;
END;
$$;

-- 3. Drop the accounting columns + their indexes from payments.
DROP INDEX IF EXISTS idx_payments_accounting_synced_qb;
DROP INDEX IF EXISTS idx_payments_accounting_synced_xero;
DROP INDEX IF EXISTS idx_payments_last_sync_attempt;

ALTER TABLE public.payments DROP COLUMN IF EXISTS accounting_synced_qb;
ALTER TABLE public.payments DROP COLUMN IF EXISTS accounting_synced_xero;
ALTER TABLE public.payments DROP COLUMN IF EXISTS accounting_last_sync_attempt;

-- 4. Drop the accounting tables (and oauth_states, used only by this feature).
DROP TABLE IF EXISTS public.accounting_synced_transactions CASCADE;
DROP TABLE IF EXISTS public.accounting_account_mappings    CASCADE;
DROP TABLE IF EXISTS public.accounting_sync_logs           CASCADE;
DROP TABLE IF EXISTS public.accounting_integrations        CASCADE;
DROP TABLE IF EXISTS public.accounting_encryption_keys     CASCADE;
DROP TABLE IF EXISTS public.oauth_states                   CASCADE;
