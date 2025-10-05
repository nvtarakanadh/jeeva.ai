-- Fix existing consultations that were set to 30 minutes default
-- This migration updates existing consultations to have their correct duration

-- Update existing consultations to have 60 minutes duration (1 hour) if they were consultations
-- You can adjust this based on your actual consultation durations
UPDATE public.consultations 
SET 
  duration_minutes = 60,
  end_time = consultation_time + INTERVAL '60 minutes'
WHERE 
  patient_id IS NOT NULL 
  AND duration_minutes = 30 
  AND status = 'scheduled';

-- Update existing consultations to have 30 minutes duration if they were blocked time
UPDATE public.consultations 
SET 
  duration_minutes = 30,
  end_time = consultation_time + INTERVAL '30 minutes'
WHERE 
  patient_id IS NULL 
  AND duration_minutes = 30 
  AND status = 'cancelled';
