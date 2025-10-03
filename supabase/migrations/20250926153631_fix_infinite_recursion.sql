-- Fix infinite recursion in RLS policies
-- The issue is in the "Doctors can view all profiles" policy

-- Drop the problematic policy
DROP POLICY IF EXISTS "Doctors can view all profiles" ON public.profiles;

-- Create a simpler policy that doesn't cause recursion
CREATE POLICY "Doctors can view all profiles" ON public.profiles
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND role = 'doctor'
        )
    );
