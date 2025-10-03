-- Add sample doctors to the database for testing
-- This migration adds some sample doctor profiles for testing purposes

-- Insert sample doctors (only if they don't already exist)
INSERT INTO public.profiles (
  user_id,
  full_name,
  email,
  role,
  specialization,
  hospital_affiliation,
  phone
) VALUES 
  (
    gen_random_uuid(),
    'Dr. Sarah Johnson',
    'sarah.johnson@hospital.com',
    'doctor',
    'Cardiology',
    'City General Hospital',
    '+1-555-0101'
  ),
  (
    gen_random_uuid(),
    'Dr. Michael Chen',
    'michael.chen@hospital.com',
    'doctor',
    'Neurology',
    'City General Hospital',
    '+1-555-0102'
  ),
  (
    gen_random_uuid(),
    'Dr. Emily Rodriguez',
    'emily.rodriguez@hospital.com',
    'doctor',
    'Dermatology',
    'Medical Center',
    '+1-555-0103'
  ),
  (
    gen_random_uuid(),
    'Dr. David Thompson',
    'david.thompson@hospital.com',
    'doctor',
    'General Medicine',
    'Community Health Center',
    '+1-555-0104'
  ),
  (
    gen_random_uuid(),
    'Dr. Lisa Wang',
    'lisa.wang@hospital.com',
    'doctor',
    'Pediatrics',
    'Children''s Hospital',
    '+1-555-0105'
  )
ON CONFLICT (email) DO NOTHING;

-- Update the created_at timestamp for the inserted records
UPDATE public.profiles 
SET created_at = now(), updated_at = now()
WHERE role = 'doctor' 
AND full_name IN (
  'Dr. Sarah Johnson',
  'Dr. Michael Chen', 
  'Dr. Emily Rodriguez',
  'Dr. David Thompson',
  'Dr. Lisa Wang'
);
