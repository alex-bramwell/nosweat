-- Delete gym function for gym owners.
-- Permanently removes a gym and all associated data.
-- Only the gym owner can call this.

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

  -- Get gym_id from profile, verify the caller owns the gym
  SELECT p.gym_id INTO v_gym_id
  FROM public.profiles p
  JOIN public.gyms g ON g.id = p.gym_id
  WHERE p.id = v_user_id
    AND g.owner_id = v_user_id;

  IF v_gym_id IS NULL THEN
    RAISE EXCEPTION 'No gym found or you are not the owner';
  END IF;

  -- Delete all gym-related data in FK-safe order
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

  -- Detach all profiles from this gym (don't delete profiles, just unlink)
  UPDATE public.profiles SET gym_id = NULL WHERE gym_id = v_gym_id;

  -- Finally delete the gym itself
  DELETE FROM public.gyms WHERE id = v_gym_id;
END;
$$;
