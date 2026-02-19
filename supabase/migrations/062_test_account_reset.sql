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

  SELECT gym_id INTO v_gym_id FROM public.profiles WHERE id = v_user_id;

  IF v_gym_id IS NOT NULL THEN
    -- Delete gym-related data in dependency order
    DELETE FROM public.gym_feature_billing WHERE gym_id = v_gym_id;
    DELETE FROM public.gym_features        WHERE gym_id = v_gym_id;
    DELETE FROM public.gym_memberships     WHERE gym_id = v_gym_id;
    DELETE FROM public.gym_stats           WHERE gym_id = v_gym_id;
    DELETE FROM public.gym_schedule        WHERE gym_id = v_gym_id;
    DELETE FROM public.gym_programs        WHERE gym_id = v_gym_id;
    DELETE FROM public.gym_branding        WHERE gym_id = v_gym_id;
    DELETE FROM public.gyms                WHERE id = v_gym_id;

    -- Clear gym_id from the user's profile
    UPDATE public.profiles SET gym_id = NULL WHERE id = v_user_id;
  END IF;
END;
$$;
