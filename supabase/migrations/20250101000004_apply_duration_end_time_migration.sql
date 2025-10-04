-- Apply the duration and end_time migration
-- This migration adds the new columns and updates existing data

-- Add the new columns
ALTER TABLE public.consultations 
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS end_time TIME;

-- Update existing records to have duration and end_time
UPDATE public.consultations 
SET 
  duration_minutes = 30,
  end_time = consultation_time + INTERVAL '30 minutes'
WHERE duration_minutes IS NULL OR end_time IS NULL;

-- Make duration_minutes NOT NULL after setting defaults
ALTER TABLE public.consultations 
ALTER COLUMN duration_minutes SET NOT NULL;

-- Add check constraints
ALTER TABLE public.consultations 
ADD CONSTRAINT IF NOT EXISTS check_duration_positive 
CHECK (duration_minutes > 0 AND duration_minutes <= 480);

ALTER TABLE public.consultations 
ADD CONSTRAINT IF NOT EXISTS check_end_time_after_start 
CHECK (end_time > consultation_time);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_consultations_time_range 
ON public.consultations(consultation_date, consultation_time, end_time);
