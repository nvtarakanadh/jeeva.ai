-- Fix RLS policies to allow proper database access
-- This will ensure the database connection works properly

-- First, let's check if we need to enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and recreate them with proper permissions
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Doctors can view all profiles" ON public.profiles;

-- Create policies that allow proper access
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow doctors to view all profiles (for patient management)
CREATE POLICY "Doctors can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND role = 'doctor'
        )
    );

-- Ensure consent_requests table has proper RLS
ALTER TABLE public.consent_requests ENABLE ROW LEVEL SECURITY;

-- Drop and recreate consent_requests policies
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
