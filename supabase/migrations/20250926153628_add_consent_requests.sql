-- Create consent requests table
CREATE TABLE IF NOT EXISTS public.consent_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  purpose TEXT NOT NULL,
  requested_data_types TEXT[] NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'revoked', 'expired')),
  message TEXT,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.consent_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for consent requests (drop first if they exist)
DROP POLICY IF EXISTS "Patients can view their consent requests" ON public.consent_requests;
DROP POLICY IF EXISTS "Doctors can view consent requests they made" ON public.consent_requests;
DROP POLICY IF EXISTS "Doctors can create consent requests" ON public.consent_requests;
DROP POLICY IF EXISTS "Patients can update consent requests" ON public.consent_requests;

CREATE POLICY "Patients can view their consent requests" ON public.consent_requests
FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can view consent requests they made" ON public.consent_requests
FOR SELECT USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can create consent requests" ON public.consent_requests
FOR INSERT WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Patients can update consent requests" ON public.consent_requests
FOR UPDATE USING (auth.uid() = patient_id);

-- Create trigger for automatic timestamp updates (if function exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        DROP TRIGGER IF EXISTS update_consent_requests_updated_at ON public.consent_requests;
        CREATE TRIGGER update_consent_requests_updated_at
            BEFORE UPDATE ON public.consent_requests
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_consent_requests_patient_id ON public.consent_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_consent_requests_doctor_id ON public.consent_requests(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consent_requests_status ON public.consent_requests(status);
CREATE INDEX IF NOT EXISTS idx_consent_requests_requested_at ON public.consent_requests(requested_at);
