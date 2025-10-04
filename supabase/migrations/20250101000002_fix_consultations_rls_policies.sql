-- Fix RLS policies for consultations table
-- The original policies were using auth.uid() directly but we need to check against profiles table

-- Drop existing policies
DROP POLICY IF EXISTS "Patients can view their consultations" ON public.consultations;
DROP POLICY IF EXISTS "Doctors can view their consultations" ON public.consultations;
DROP POLICY IF EXISTS "Patients can create consultations" ON public.consultations;
DROP POLICY IF EXISTS "Patients can update their consultations" ON public.consultations;
DROP POLICY IF EXISTS "Doctors can update their consultations" ON public.consultations;

-- Create corrected RLS policies for consultations
CREATE POLICY "Patients can view their consultations" ON public.consultations
    FOR SELECT USING (
        patient_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Doctors can view their consultations" ON public.consultations
    FOR SELECT USING (
        doctor_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Patients can create consultations" ON public.consultations
    FOR INSERT WITH CHECK (
        patient_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Patients can update their consultations" ON public.consultations
    FOR UPDATE USING (
        patient_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Doctors can update their consultations" ON public.consultations
    FOR UPDATE USING (
        doctor_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
    );

-- Add delete policies
CREATE POLICY "Patients can delete their consultations" ON public.consultations
    FOR DELETE USING (
        patient_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Doctors can delete their consultations" ON public.consultations
    FOR DELETE USING (
        doctor_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
    );
