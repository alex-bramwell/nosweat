-- Create workouts table to store daily programming
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  workout_type TEXT CHECK (workout_type IN ('amrap', 'fortime', 'emom', 'strength', 'endurance')) NOT NULL,
  duration TEXT,
  rounds INTEGER,

  -- Structured workout sections
  warmup JSONB,           -- Array of strings
  strength JSONB,         -- Array of strings
  metcon JSONB,           -- Array of strings
  cooldown JSONB,         -- Array of strings
  movements TEXT[],       -- Main movements list for backward compatibility

  -- Metadata
  coach_notes TEXT,
  scaling_notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Status for draft/published
  status TEXT CHECK (status IN ('draft', 'published')) DEFAULT 'published'
);

-- Create indexes
CREATE INDEX idx_workouts_date ON workouts(date);
CREATE INDEX idx_workouts_status ON workouts(status);
CREATE INDEX idx_workouts_created_by ON workouts(created_by);

-- Enable RLS
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Everyone can view published workouts
CREATE POLICY "Anyone can view published workouts"
  ON workouts FOR SELECT
  USING (status = 'published');

-- Coaches and admins can create workouts
CREATE POLICY "Coaches and admins can create workouts"
  ON workouts FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('coach', 'admin')
    )
  );

-- Coaches can update their own workouts, admins can update all
CREATE POLICY "Coaches can update own workouts, admins can update all"
  ON workouts FOR UPDATE
  USING (
    auth.uid() = created_by OR
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Only admins can delete workouts
CREATE POLICY "Only admins can delete workouts"
  ON workouts FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_workout_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER workout_updated_at
  BEFORE UPDATE ON workouts
  FOR EACH ROW
  EXECUTE FUNCTION update_workout_updated_at();