-- Fix Supabase Database Errors
-- Run this in your Supabase SQL Editor

-- 1. Enable RLS on schedules table (if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'schedules') THEN
        ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 2. Fix function search_path issues (only for functions that exist)
-- This will safely check and fix search_path for existing functions only

DO $$ 
DECLARE
    func_name TEXT;
    func_oid OID;
BEGIN
    -- List of functions to check and fix
    FOR func_name IN VALUES 
        ('update_updated_at_column'),
        ('update_notifications_updated_at'),
        ('mark_notification_read'),
        ('mark_all_notifications_read'),
        ('get_user_notifications')
    LOOP
        -- Check if function exists
        SELECT oid INTO func_oid 
        FROM pg_proc 
        WHERE proname = func_name 
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
        
        -- If function exists, fix its search_path
        IF func_oid IS NOT NULL THEN
            EXECUTE format('ALTER FUNCTION public.%I() SET search_path = public', func_name);
            RAISE NOTICE 'Fixed search_path for function: %', func_name;
        ELSE
            RAISE NOTICE 'Function does not exist, skipping: %', func_name;
        END IF;
    END LOOP;
END $$;

-- 3. Create missing notification functions (if they don't exist)

-- Create create_notification function
CREATE OR REPLACE FUNCTION public.create_notification(
    p_user_id UUID,
    p_title TEXT,
    p_message TEXT,
    p_type TEXT DEFAULT 'info'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO public.notifications (user_id, title, message, type, created_at)
    VALUES (p_user_id, p_title, p_message, p_type, NOW())
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$;

-- 4. Create basic RLS policies for schedules table (if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'schedules') THEN
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.schedules;
        DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.schedules;
        DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.schedules;
        DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.schedules;
        
        -- Create new policies
        CREATE POLICY "Enable read access for authenticated users" ON public.schedules
            FOR SELECT USING (auth.role() = 'authenticated');

        CREATE POLICY "Enable insert for authenticated users" ON public.schedules
            FOR INSERT WITH CHECK (auth.role() = 'authenticated');

        CREATE POLICY "Enable update for authenticated users" ON public.schedules
            FOR UPDATE USING (auth.role() = 'authenticated');

        CREATE POLICY "Enable delete for authenticated users" ON public.schedules
            FOR DELETE USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 4. Verify the profiles table has the correct columns
-- Check if these columns exist, if not, you may need to add them
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS specialization TEXT;
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hospital_affiliation TEXT;
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

-- 5. Check if consultations table has the correct columns
-- ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES auth.users(id);
-- ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES public.profiles(user_id);
-- ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS consultation_date DATE;
-- ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS consultation_time TIME;
-- ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS reason TEXT;
-- ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS notes TEXT;
-- ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
