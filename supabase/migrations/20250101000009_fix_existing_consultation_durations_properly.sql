-- Fix existing consultations that were incorrectly set to 30 minutes
-- This migration properly sets the duration based on the consultation type and status

-- First, let's see what we have in the database
-- You can run this query to check current state:
-- SELECT id, patient_id, reason, consultation_time, duration_minutes, status FROM consultations ORDER BY created_at DESC LIMIT 10;

-- Update existing consultations with patient_id (actual consultations) to 60 minutes (1 hour)
UPDATE public.consultations 
SET 
  duration_minutes = 60,
  end_time = consultation_time + INTERVAL '60 minutes'
WHERE 
  patient_id IS NOT NULL 
  AND status IN ('scheduled', 'confirmed', 'completed');

-- Update existing consultations without patient_id (blocked time, meetings, etc.) to 30 minutes
UPDATE public.consultations 
SET 
  duration_minutes = 30,
  end_time = consultation_time + INTERVAL '30 minutes'
WHERE 
  patient_id IS NULL 
  AND status = 'cancelled';

-- If you have specific consultations that should be 2 hours, update them manually:
-- UPDATE public.consultations 
-- SET 
--   duration_minutes = 120,
--   end_time = consultation_time + INTERVAL '120 minutes'
-- WHERE 
--   id = 'your-consultation-id-here';

-- Verify the changes:
-- SELECT id, patient_id, reason, consultation_time, duration_minutes, end_time, status FROM consultations ORDER BY created_at DESC;
