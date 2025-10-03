-- Fix RLS policies for consultations table
-- This script will create the necessary policies to allow doctors to manage consultations

-- First, let's check if RLS is enabled and what policies exist
-- (Run this in Supabase SQL Editor to check current state)
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'consultations';

-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'consultations';

-- Drop existing policies if they exist (optional - only if you want to start fresh)
-- DROP POLICY IF EXISTS "Doctors can view consultations" ON consultations;
-- DROP POLICY IF EXISTS "Doctors can insert consultations" ON consultations;
-- DROP POLICY IF EXISTS "Doctors can update consultations" ON consultations;
-- DROP POLICY IF EXISTS "Doctors can delete consultations" ON consultations;

-- Create policies for consultations table
-- Policy 1: Allow doctors to view consultations where they are the doctor
CREATE POLICY "Doctors can view consultations" ON consultations
    FOR SELECT
    USING (
        doctor_id IN (
            SELECT id FROM profiles 
            WHERE user_id = auth.uid() 
            AND role = 'doctor'
        )
    );

-- Policy 2: Allow doctors to insert consultations where they are the doctor
CREATE POLICY "Doctors can insert consultations" ON consultations
    FOR INSERT
    WITH CHECK (
        doctor_id IN (
            SELECT id FROM profiles 
            WHERE user_id = auth.uid() 
            AND role = 'doctor'
        )
    );

-- Policy 3: Allow doctors to update consultations where they are the doctor
CREATE POLICY "Doctors can update consultations" ON consultations
    FOR UPDATE
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

-- Policy 4: Allow doctors to delete consultations where they are the doctor
CREATE POLICY "Doctors can delete consultations" ON consultations
    FOR DELETE
    USING (
        doctor_id IN (
            SELECT id FROM profiles 
            WHERE user_id = auth.uid() 
            AND role = 'doctor'
        )
    );

-- Policy 5: Allow patients to view their own consultations
CREATE POLICY "Patients can view their consultations" ON consultations
    FOR SELECT
    USING (
        patient_id IN (
            SELECT id FROM profiles 
            WHERE user_id = auth.uid() 
            AND role = 'patient'
        )
    );

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'consultations'
ORDER BY policyname;
