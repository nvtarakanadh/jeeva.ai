-- Minimal Supabase Fix - Only Essential Changes
-- Run this in your Supabase SQL Editor

-- 1. Enable RLS on schedules table (if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'schedules') THEN
        ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on schedules table';
    ELSE
        RAISE NOTICE 'Schedules table does not exist, skipping RLS setup';
    END IF;
END $$;

-- 2. Create basic RLS policies for schedules table (if it exists)
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
            
        RAISE NOTICE 'Created RLS policies for schedules table';
    END IF;
END $$;

-- 3. Create create_notification function (if needed)
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

-- 4. Check if profiles table has required columns for doctors
DO $$ 
BEGIN
    -- Check if full_name column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'profiles' 
                   AND column_name = 'full_name') THEN
        ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
        RAISE NOTICE 'Added full_name column to profiles table';
    END IF;
    
    -- Check if specialization column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'profiles' 
                   AND column_name = 'specialization') THEN
        ALTER TABLE public.profiles ADD COLUMN specialization TEXT;
        RAISE NOTICE 'Added specialization column to profiles table';
    END IF;
    
    -- Check if hospital_affiliation column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'profiles' 
                   AND column_name = 'hospital_affiliation') THEN
        ALTER TABLE public.profiles ADD COLUMN hospital_affiliation TEXT;
        RAISE NOTICE 'Added hospital_affiliation column to profiles table';
    END IF;
    
    -- Check if verified column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'profiles' 
                   AND column_name = 'verified') THEN
        ALTER TABLE public.profiles ADD COLUMN verified BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added verified column to profiles table';
    END IF;
END $$;

-- 5. Check if consultations table has required columns
DO $$ 
BEGIN
    -- Check if patient_id column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'consultations' 
                   AND column_name = 'patient_id') THEN
        ALTER TABLE public.consultations ADD COLUMN patient_id UUID REFERENCES auth.users(id);
        RAISE NOTICE 'Added patient_id column to consultations table';
    END IF;
    
    -- Check if doctor_id column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'consultations' 
                   AND column_name = 'doctor_id') THEN
        ALTER TABLE public.consultations ADD COLUMN doctor_id UUID REFERENCES public.profiles(user_id);
        RAISE NOTICE 'Added doctor_id column to consultations table';
    END IF;
    
    -- Check if consultation_date column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'consultations' 
                   AND column_name = 'consultation_date') THEN
        ALTER TABLE public.consultations ADD COLUMN consultation_date DATE;
        RAISE NOTICE 'Added consultation_date column to consultations table';
    END IF;
    
    -- Check if consultation_time column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'consultations' 
                   AND column_name = 'consultation_time') THEN
        ALTER TABLE public.consultations ADD COLUMN consultation_time TIME;
        RAISE NOTICE 'Added consultation_time column to consultations table';
    END IF;
    
    -- Check if reason column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'consultations' 
                   AND column_name = 'reason') THEN
        ALTER TABLE public.consultations ADD COLUMN reason TEXT;
        RAISE NOTICE 'Added reason column to consultations table';
    END IF;
    
    -- Check if notes column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'consultations' 
                   AND column_name = 'notes') THEN
        ALTER TABLE public.consultations ADD COLUMN notes TEXT;
        RAISE NOTICE 'Added notes column to consultations table';
    END IF;
    
    -- Check if status column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'consultations' 
                   AND column_name = 'status') THEN
        ALTER TABLE public.consultations ADD COLUMN status TEXT DEFAULT 'pending';
        RAISE NOTICE 'Added status column to consultations table';
    END IF;
END $$;

-- 6. Summary
SELECT 'Database fixes completed successfully!' as status;
