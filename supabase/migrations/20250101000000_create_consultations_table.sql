-- Create consultations table
CREATE TABLE IF NOT EXISTS public.consultations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    consultation_date DATE NOT NULL,
    consultation_time TIME NOT NULL,
    reason TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'scheduled_no_consent', 'completed', 'cancelled')),
    consent_id UUID REFERENCES public.consent_requests(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for consultations
DROP POLICY IF EXISTS "Patients can view their consultations" ON public.consultations;
CREATE POLICY "Patients can view their consultations" ON public.consultations
    FOR SELECT USING (
        patient_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Doctors can view their consultations" ON public.consultations;
CREATE POLICY "Doctors can view their consultations" ON public.consultations
    FOR SELECT USING (
        doctor_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Patients can create consultations" ON public.consultations;
CREATE POLICY "Patients can create consultations" ON public.consultations
    FOR INSERT WITH CHECK (
        patient_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Patients can update their consultations" ON public.consultations;
CREATE POLICY "Patients can update their consultations" ON public.consultations
    FOR UPDATE USING (
        patient_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Doctors can update their consultations" ON public.consultations;
CREATE POLICY "Doctors can update their consultations" ON public.consultations
    FOR UPDATE USING (
        doctor_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
    );

-- Add delete policies
DROP POLICY IF EXISTS "Patients can delete their consultations" ON public.consultations;
CREATE POLICY "Patients can delete their consultations" ON public.consultations
    FOR DELETE USING (
        patient_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Doctors can delete their consultations" ON public.consultations;
CREATE POLICY "Doctors can delete their consultations" ON public.consultations
    FOR DELETE USING (
        doctor_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_consultations_patient_id ON public.consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor_id ON public.consultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultations_consultation_date ON public.consultations(consultation_date);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON public.consultations(status);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_consultations_updated_at ON public.consultations;
CREATE TRIGGER update_consultations_updated_at
    BEFORE UPDATE ON public.consultations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
