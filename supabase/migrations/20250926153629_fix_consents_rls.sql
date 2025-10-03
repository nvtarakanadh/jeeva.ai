-- Fix RLS policies for consents table to allow doctors to create consents
-- Drop existing policies
DROP POLICY IF EXISTS "Patients can view their consents" ON public.consents;
DROP POLICY IF EXISTS "Doctors can view consents granted to them" ON public.consents;
DROP POLICY IF EXISTS "Patients can create consents" ON public.consents;
DROP POLICY IF EXISTS "Patients can update their consents" ON public.consents;

-- Create new policies
CREATE POLICY "Patients can view their consents" ON public.consents
FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can view consents they created" ON public.consents
FOR SELECT USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can create consents" ON public.consents
FOR INSERT WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Patients can update their consents" ON public.consents
FOR UPDATE USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can update consents they created" ON public.consents
FOR UPDATE USING (auth.uid() = doctor_id);
