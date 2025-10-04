-- Add duration and end_time columns to consultations table
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

-- Add check constraint for duration
ALTER TABLE public.consultations 
ADD CONSTRAINT check_duration_positive 
CHECK (duration_minutes > 0 AND duration_minutes <= 480); -- Max 8 hours

-- Add check constraint for end_time
ALTER TABLE public.consultations 
ADD CONSTRAINT check_end_time_after_start 
CHECK (end_time > consultation_time);

-- Create index for better performance on time-based queries
CREATE INDEX IF NOT EXISTS idx_consultations_time_range 
ON public.consultations(consultation_date, consultation_time, end_time);

-- Update the trigger to also update end_time when consultation_time changes
CREATE OR REPLACE FUNCTION update_consultation_end_time()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate end_time based on consultation_time and duration_minutes
  NEW.end_time = NEW.consultation_time + (NEW.duration_minutes || ' minutes')::INTERVAL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for end_time calculation
DROP TRIGGER IF EXISTS update_consultation_end_time_trigger ON public.consultations;
CREATE TRIGGER update_consultation_end_time_trigger
  BEFORE INSERT OR UPDATE ON public.consultations
  FOR EACH ROW
  EXECUTE FUNCTION update_consultation_end_time();
