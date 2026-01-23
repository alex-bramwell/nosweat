-- Allow coaches to update their own service rates
-- Note: Coaches can only update hourly_rate and description, not is_active (admin-only)

-- Create policy to allow coaches to update their own service rates
CREATE POLICY "Coaches can update their own service rates"
  ON coach_services FOR UPDATE
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

-- Add a trigger to prevent coaches from changing is_active field
-- Only admins should be able to enable/disable services
CREATE OR REPLACE FUNCTION check_coach_service_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If the user is the coach (not an admin), they can only change rate and description
  IF auth.uid() = NEW.coach_id THEN
    -- Check if user is admin
    IF NOT EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    ) THEN
      -- Not an admin - preserve is_active from old value
      NEW.is_active := OLD.is_active;
    END IF;
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS coach_service_update_trigger ON coach_services;
CREATE TRIGGER coach_service_update_trigger
  BEFORE UPDATE ON coach_services
  FOR EACH ROW
  EXECUTE FUNCTION check_coach_service_update();
