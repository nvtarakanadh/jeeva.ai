-- Add role column to profiles table (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE profiles ADD COLUMN role text DEFAULT 'patient';
    END IF;
END $$;

-- Set all existing users as patients by default
UPDATE profiles SET role = 'patient' WHERE role IS NULL;

-- Note: You'll need to manually set your current user as 'doctor' 
-- Run this in Supabase SQL Editor after the migration:
-- UPDATE profiles SET role = 'doctor' WHERE user_id = 'your-actual-user-id';
