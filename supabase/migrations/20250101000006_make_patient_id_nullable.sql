-- Make patient_id nullable in consultations table to support non-consultation events
-- This allows doctors to create blocked time, meetings, reminders without requiring a patient

-- First, drop the NOT NULL constraint
ALTER TABLE public.consultations ALTER COLUMN patient_id DROP NOT NULL;

-- Update RLS policies to handle null patient_id
-- For events with null patient_id, only the doctor should be able to access them

-- Update the patient view policy to exclude null patient_id records
DROP POLICY IF EXISTS "Patients can view their consultations" ON public.consultations;
CREATE POLICY "Patients can view their consultations" ON public.consultations
    FOR SELECT USING (
        patient_id IS NOT NULL AND
        patient_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
    );

-- Update the patient create policy to only allow records with patient_id
DROP POLICY IF EXISTS "Patients can create consultations" ON public.consultations;
CREATE POLICY "Patients can create consultations" ON public.consultations
    FOR INSERT WITH CHECK (
        patient_id IS NOT NULL AND
        patient_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
    );

-- Update the patient update policy to only allow records with patient_id
DROP POLICY IF EXISTS "Patients can update their consultations" ON public.consultations;
CREATE POLICY "Patients can update their consultations" ON public.consultations
    FOR UPDATE USING (
        patient_id IS NOT NULL AND
        patient_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
    );

-- Update the patient delete policy to only allow records with patient_id
DROP POLICY IF EXISTS "Patients can delete their consultations" ON public.consultations;
CREATE POLICY "Patients can delete their consultations" ON public.consultations
    FOR DELETE USING (
        patient_id IS NOT NULL AND
        patient_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
    );

-- Add a new policy for doctors to create events without patient_id
DROP POLICY IF EXISTS "Doctors can create events" ON public.consultations;
CREATE POLICY "Doctors can create events" ON public.consultations
    FOR INSERT WITH CHECK (
        doctor_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
    );

-- Add a new policy for doctors to update events without patient_id
DROP POLICY IF EXISTS "Doctors can update all their events" ON public.consultations;
CREATE POLICY "Doctors can update all their events" ON public.consultations
    FOR UPDATE USING (
        doctor_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
    );

-- Add a new policy for doctors to delete events without patient_id
DROP POLICY IF EXISTS "Doctors can delete all their events" ON public.consultations;
CREATE POLICY "Doctors can delete all their events" ON public.consultations
    FOR DELETE USING (
        doctor_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
    );
