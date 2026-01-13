-- Fix workouts table to auto-set created_by on insert
-- This ensures created_by is always set to the authenticated user

-- Create function to set created_by on insert
CREATE OR REPLACE FUNCTION set_workout_created_by()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-set created_by
DROP TRIGGER IF EXISTS workout_set_created_by ON workouts;
CREATE TRIGGER workout_set_created_by
  BEFORE INSERT ON workouts
  FOR EACH ROW
  EXECUTE FUNCTION set_workout_created_by();

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Workout created_by trigger added successfully';
END $$;
