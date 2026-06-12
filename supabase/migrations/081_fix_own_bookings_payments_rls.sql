-- Fix: day-pass customers could not read their own booking/payment rows.
--
-- The "view own" SELECT policies on bookings and payments required
--   (auth.uid() = user_id) AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
-- get_user_gym_id() reads the gym_id from the user's profile. A day-pass
-- customer has no gym membership, so their profile gym_id is NULL while the
-- booking/payment gym_id is the gym's id. That makes both branches of the
-- gym_id check false, so the user was denied SELECT on their OWN rows.
--
-- The frontend confirmation (pollForBooking) reads these rows with the user's
-- session, so the day-pass success screen never appeared. A user always owns
-- their own bookings/payments, so ownership alone is the correct condition.
-- Gym-wide visibility for staff/admins is handled by separate policies.

DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
CREATE POLICY "Users can view own bookings"
  ON public.bookings
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments"
  ON public.payments
  FOR SELECT
  USING (auth.uid() = user_id);
