-- ============================================================================
-- Class booking summary RPC
--
-- The bookings table RLS only lets a member read their OWN bookings, so the
-- client can't compute how many spots a class has left (it would only ever see
-- its own row). This SECURITY DEFINER function returns per-class booking counts
-- across all members, plus whether the calling user is booked, so the member
-- dashboard can show accurate remaining spots and mark booked classes.
--
-- Only counts and a per-user boolean are exposed - no other members' data.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_class_booking_summary(p_class_ids TEXT[])
RETURNS TABLE (
  class_id TEXT,
  booking_count BIGINT,
  user_booked BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    b.class_id,
    COUNT(*) AS booking_count,
    bool_or(b.user_id = auth.uid()) AS user_booked
  FROM bookings b
  WHERE b.class_id = ANY(p_class_ids)
    AND b.status IN ('pending', 'confirmed')
  GROUP BY b.class_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_class_booking_summary(TEXT[]) TO authenticated;

-- Prevent the same member booking the same class instance twice (defends
-- against double-submits / races; the UI also guards against this).
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_user_class_active
  ON bookings (user_id, class_id)
  WHERE status IN ('pending', 'confirmed');
