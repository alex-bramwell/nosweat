-- Reset function for test accounts
-- Deletes all gym data for the calling user so they can retest onboarding.
-- Only works for users with a @nosweattest.com email.

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

  -- Try to find gym via profile first, then fall back to owner_id
  -- (handles partial onboarding where profile.gym_id wasn't set)
  SELECT gym_id INTO v_gym_id FROM public.profiles WHERE id = v_user_id;

  IF v_gym_id IS NULL THEN
    SELECT id INTO v_gym_id FROM public.gyms WHERE owner_id = v_user_id LIMIT 1;
  END IF;

  IF v_gym_id IS NOT NULL THEN
    -- Delete gym-related data in dependency order
    DELETE FROM public.accounting_synced_transactions WHERE gym_id = v_gym_id;
    DELETE FROM public.accounting_account_mappings    WHERE gym_id = v_gym_id;
    DELETE FROM public.accounting_sync_logs           WHERE gym_id = v_gym_id;
    DELETE FROM public.accounting_integrations        WHERE gym_id = v_gym_id;
    DELETE FROM public.service_bookings               WHERE gym_id = v_gym_id;
    DELETE FROM public.coach_services                 WHERE gym_id = v_gym_id;
    DELETE FROM public.workout_bookings               WHERE gym_id = v_gym_id;
    DELETE FROM public.workouts                       WHERE gym_id = v_gym_id;
    DELETE FROM public.trial_memberships              WHERE gym_id = v_gym_id;
    DELETE FROM public.payments                       WHERE gym_id = v_gym_id;
    DELETE FROM public.bookings                       WHERE gym_id = v_gym_id;
    DELETE FROM public.stripe_customers               WHERE gym_id = v_gym_id;
    DELETE FROM public.gym_feature_billing            WHERE gym_id = v_gym_id;
    DELETE FROM public.gym_features                   WHERE gym_id = v_gym_id;
    DELETE FROM public.gym_memberships                WHERE gym_id = v_gym_id;
    DELETE FROM public.gym_stats                      WHERE gym_id = v_gym_id;
    DELETE FROM public.gym_schedule                   WHERE gym_id = v_gym_id;
    DELETE FROM public.gym_programs                   WHERE gym_id = v_gym_id;
    DELETE FROM public.gym_branding                   WHERE gym_id = v_gym_id;

    -- Detach ALL profiles from this gym before deleting it
    UPDATE public.profiles SET gym_id = NULL WHERE gym_id = v_gym_id;

    -- Now safe to delete the gym
    DELETE FROM public.gyms                           WHERE id = v_gym_id;
  END IF;
END;
$$;
