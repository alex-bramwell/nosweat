-- ============================================================================
-- 067: Onboarding Restructure
-- Adds owner personal details to profiles, gym timezone, and gym-level trial.
-- ============================================================================

-- 1. Add first_name, last_name, phone to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Add timezone to gyms
ALTER TABLE public.gyms
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Europe/London';

-- 3. Add trial fields to gyms
ALTER TABLE public.gyms
  ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_member_limit INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS trial_status TEXT DEFAULT 'none'
    CHECK (trial_status IN ('none', 'active', 'expired', 'converted'));

CREATE INDEX IF NOT EXISTS idx_gyms_trial_status ON public.gyms(trial_status);
CREATE INDEX IF NOT EXISTS idx_gyms_trial_end_date ON public.gyms(trial_end_date);

-- 4. Update handle_new_user() to support first_name + last_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, first_name, last_name, role, gym_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      TRIM(COALESCE(NEW.raw_user_meta_data->>'first_name', '') || ' ' || COALESCE(NEW.raw_user_meta_data->>'last_name', ''))
    ),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'member'),
    (NEW.raw_user_meta_data->>'gym_id')::UUID
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Helper: count members in a gym (for trial limit enforcement)
CREATE OR REPLACE FUNCTION public.gym_member_count(gym_id_param UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.profiles
  WHERE gym_id = gym_id_param
    AND role = 'member'
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 6. Trigger: enforce trial member limit on profile insert
CREATE OR REPLACE FUNCTION public.check_trial_member_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_member_limit INTEGER;
  v_on_trial BOOLEAN;
  v_current_count INTEGER;
BEGIN
  -- Only check for member role
  IF NEW.role != 'member' OR NEW.gym_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT
    g.trial_member_limit,
    (g.trial_status = 'active' AND g.trial_end_date > NOW())
  INTO v_member_limit, v_on_trial
  FROM public.gyms g
  WHERE g.id = NEW.gym_id;

  IF v_on_trial THEN
    SELECT COUNT(*) INTO v_current_count
    FROM public.profiles
    WHERE gym_id = NEW.gym_id AND role = 'member';

    IF v_current_count >= v_member_limit THEN
      RAISE EXCEPTION 'Trial member limit reached (% of %)', v_current_count, v_member_limit;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_trial_member_limit ON public.profiles;
CREATE TRIGGER enforce_trial_member_limit
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.check_trial_member_limit();
