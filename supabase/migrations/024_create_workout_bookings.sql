-- Create workout_bookings table to track WOD bookings
-- Each workout has a maximum capacity of 16 spaces
CREATE TABLE workout_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('booked', 'cancelled', 'attended', 'no-show')) DEFAULT 'booked',
  booked_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Prevent duplicate bookings
  UNIQUE(workout_id, user_id)
);

-- Create indexes for faster lookups
CREATE INDEX idx_workout_bookings_workout_id ON workout_bookings(workout_id);
CREATE INDEX idx_workout_bookings_user_id ON workout_bookings(user_id);
CREATE INDEX idx_workout_bookings_status ON workout_bookings(status);

-- Enable Row Level Security
ALTER TABLE workout_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own bookings
CREATE POLICY "Users can view their own workout bookings"
  ON workout_bookings FOR SELECT
  USING (auth.uid() = user_id);

-- Coaches and admins can view all bookings
CREATE POLICY "Staff can view all workout bookings"
  ON workout_bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('staff', 'coach', 'admin')
    )
  );

-- Users can create their own bookings (with capacity check)
CREATE POLICY "Users can create their own workout bookings"
  ON workout_bookings FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      SELECT COUNT(*) FROM workout_bookings wb
      WHERE wb.workout_id = workout_id
      AND wb.status = 'booked'
    ) < 16
  );

-- Users can cancel their own bookings
CREATE POLICY "Users can cancel their own workout bookings"
  ON workout_bookings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Coaches and admins can update any booking (e.g., mark attendance)
CREATE POLICY "Staff can update workout bookings"
  ON workout_bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('staff', 'coach', 'admin')
    )
  );

-- Users can delete their own bookings
CREATE POLICY "Users can delete their own workout bookings"
  ON workout_bookings FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can delete any booking
CREATE POLICY "Admins can delete any workout booking"
  ON workout_bookings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to get booking count for a workout
CREATE OR REPLACE FUNCTION get_workout_booking_count(p_workout_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM workout_bookings
    WHERE workout_id = p_workout_id
    AND status = 'booked'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a workout has available space
CREATE OR REPLACE FUNCTION workout_has_space(p_workout_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) < 16
    FROM workout_bookings
    WHERE workout_id = p_workout_id
    AND status = 'booked'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
