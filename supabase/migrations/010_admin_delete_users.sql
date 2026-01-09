-- Allow admins to delete profiles
-- This will enable user deletion from the admin panel

-- Add DELETE policy for admins
CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create a function to delete a user (admin only)
-- This function will delete both the auth user and profile
-- Note: This requires admin privileges to delete from auth.users
CREATE OR REPLACE FUNCTION delete_user(
  target_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  calling_user_role TEXT;
  target_user_email TEXT;
BEGIN
  -- Check if caller is admin
  SELECT role INTO calling_user_role
  FROM profiles
  WHERE id = auth.uid();

  IF calling_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can delete users';
  END IF;

  -- Prevent admins from deleting themselves
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot delete your own account';
  END IF;

  -- Get target user email for logging
  SELECT email INTO target_user_email
  FROM profiles
  WHERE id = target_user_id;

  IF target_user_email IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Delete from profiles table first (will be done automatically by CASCADE, but being explicit)
  DELETE FROM profiles WHERE id = target_user_id;

  -- Note: Deleting from auth.users requires superuser or service role
  -- The CASCADE will handle the profile deletion
  -- For full auth user deletion, you'll need to use the Supabase Admin API
  -- from a server-side endpoint with the service role key

  RETURN TRUE;
END;
$$;

-- Grant execute permissions on function
GRANT EXECUTE ON FUNCTION delete_user TO authenticated;
