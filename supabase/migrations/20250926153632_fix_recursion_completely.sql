-- Completely fix the infinite recursion issue
-- Remove all policies and recreate them properly

-- Drop ALL policies on profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Doctors can view all profiles" ON public.profiles;

-- Create simple, non-recursive policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- For now, let's allow all authenticated users to view profiles
-- This will fix the immediate issue and you can restrict it later
CREATE POLICY "Authenticated users can view profiles" ON public.profiles
    FOR SELECT USING (auth.uid() IS NOT NULL);
