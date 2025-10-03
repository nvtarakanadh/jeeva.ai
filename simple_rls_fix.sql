-- Simple RLS fix for consultations table
-- Run this in Supabase SQL Editor

-- Enable RLS if not already enabled
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

-- Create policy for doctors to manage consultations
CREATE POLICY "Doctors can manage consultations" ON consultations
    FOR ALL
    USING (
        doctor_id IN (
            SELECT id FROM profiles 
            WHERE user_id = auth.uid() 
            AND role = 'doctor'
        )
    )
    WITH CHECK (
        doctor_id IN (
            SELECT id FROM profiles 
            WHERE user_id = auth.uid() 
            AND role = 'doctor'
        )
    );

-- Create policy for patients to view their consultations
CREATE POLICY "Patients can view their consultations" ON consultations
    FOR SELECT
    USING (
        patient_id IN (
            SELECT id FROM profiles 
            WHERE user_id = auth.uid() 
            AND role = 'patient'
        )
    );
