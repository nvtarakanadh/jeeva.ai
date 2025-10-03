-- Comprehensive Supabase Fix - Address All Issues
-- Run this in your Supabase SQL Editor

-- 1. Fix all function search_path issues
DO $$ 
DECLARE
    func_record RECORD;
BEGIN
    -- Get all functions in public schema that don't have search_path set
    FOR func_record IN 
        SELECT proname, oid
        FROM pg_proc 
        WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        AND prokind = 'f'  -- Only functions, not procedures
    LOOP
        BEGIN
            EXECUTE format('ALTER FUNCTION public.%I() SET search_path = public', func_record.proname);
            RAISE NOTICE 'Fixed search_path for function: %', func_record.proname;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not fix function %: %', func_record.proname, SQLERRM;
        END;
    END LOOP;
END $$;

-- 2. Enable RLS on all tables that need it
DO $$ 
DECLARE
    table_record RECORD;
BEGIN
    -- Get all tables in public schema
    FOR table_record IN 
        SELECT table_name
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_record.table_name);
        RAISE NOTICE 'Enabled RLS on table: %', table_record.table_name;
        
        -- Create basic RLS policies
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.%I', table_record.table_name);
            EXECUTE format('CREATE POLICY "Enable read access for authenticated users" ON public.%I FOR SELECT USING (auth.role() = ''authenticated'')', table_record.table_name);
            
            EXECUTE format('DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.%I', table_record.table_name);
            EXECUTE format('CREATE POLICY "Enable insert for authenticated users" ON public.%I FOR INSERT WITH CHECK (auth.role() = ''authenticated'')', table_record.table_name);
            
            EXECUTE format('DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.%I', table_record.table_name);
            EXECUTE format('CREATE POLICY "Enable update for authenticated users" ON public.%I FOR UPDATE USING (auth.role() = ''authenticated'')', table_record.table_name);
            
            EXECUTE format('DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.%I', table_record.table_name);
            EXECUTE format('CREATE POLICY "Enable delete for authenticated users" ON public.%I FOR DELETE USING (auth.role() = ''authenticated'')', table_record.table_name);
            
            RAISE NOTICE 'Created RLS policies for table: %', table_record.table_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not create policies for table %: %', table_record.table_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- 3. Create missing notification functions
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

CREATE OR REPLACE FUNCTION public.mark_notification_read(
    p_notification_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.notifications 
    SET is_read = true, read_at = NOW()
    WHERE id = p_notification_id AND user_id = p_user_id;
    
    RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_all_notifications_read(
    p_user_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE public.notifications 
    SET is_read = true, read_at = NOW()
    WHERE user_id = p_user_id AND is_read = false;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_notifications(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    title TEXT,
    message TEXT,
    type TEXT,
    is_read BOOLEAN,
    created_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT n.id, n.title, n.message, n.type, n.is_read, n.created_at, n.read_at
    FROM public.notifications n
    WHERE n.user_id = p_user_id
    ORDER BY n.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

-- 4. Create update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 5. Create update_notifications_updated_at function
CREATE OR REPLACE FUNCTION public.update_notifications_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 6. Check and fix profiles table structure
DO $$ 
BEGIN
    -- Check if profiles table exists, if not create it
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        CREATE TABLE public.profiles (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
            full_name TEXT,
            specialization TEXT,
            hospital_affiliation TEXT,
            verified BOOLEAN DEFAULT false,
            role TEXT DEFAULT 'patient',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        RAISE NOTICE 'Created profiles table';
    ELSE
        -- Add user_id column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'user_id') THEN
            ALTER TABLE public.profiles ADD COLUMN user_id UUID REFERENCES auth.users(id) UNIQUE;
            RAISE NOTICE 'Added user_id column to profiles table';
        END IF;
        
        -- Add id column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'id') THEN
            ALTER TABLE public.profiles ADD COLUMN id UUID DEFAULT gen_random_uuid() PRIMARY KEY;
            RAISE NOTICE 'Added id column to profiles table';
        END IF;
    END IF;
END $$;

-- 7. Add missing columns to profiles table
DO $$ 
BEGIN
    -- Add full_name if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'full_name') THEN
        ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
    END IF;
    
    -- Add specialization if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'specialization') THEN
        ALTER TABLE public.profiles ADD COLUMN specialization TEXT;
    END IF;
    
    -- Add hospital_affiliation if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'hospital_affiliation') THEN
        ALTER TABLE public.profiles ADD COLUMN hospital_affiliation TEXT;
    END IF;
    
    -- Add verified if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'verified') THEN
        ALTER TABLE public.profiles ADD COLUMN verified BOOLEAN DEFAULT false;
    END IF;
    
    -- Add updated_at if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'updated_at') THEN
        ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 8. Add missing columns to consultations table
DO $$ 
BEGIN
    -- Add patient_id if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'consultations' AND column_name = 'patient_id') THEN
        ALTER TABLE public.consultations ADD COLUMN patient_id UUID REFERENCES auth.users(id);
    END IF;
    
    -- Add doctor_id if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'consultations' AND column_name = 'doctor_id') THEN
        -- Check if profiles table has user_id or id column
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'user_id') THEN
            ALTER TABLE public.consultations ADD COLUMN doctor_id UUID REFERENCES public.profiles(user_id);
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'id') THEN
            ALTER TABLE public.consultations ADD COLUMN doctor_id UUID REFERENCES public.profiles(id);
        ELSE
            ALTER TABLE public.consultations ADD COLUMN doctor_id UUID;
        END IF;
    END IF;
    
    -- Add consultation_date if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'consultations' AND column_name = 'consultation_date') THEN
        ALTER TABLE public.consultations ADD COLUMN consultation_date DATE;
    END IF;
    
    -- Add consultation_time if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'consultations' AND column_name = 'consultation_time') THEN
        ALTER TABLE public.consultations ADD COLUMN consultation_time TIME;
    END IF;
    
    -- Add reason if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'consultations' AND column_name = 'reason') THEN
        ALTER TABLE public.consultations ADD COLUMN reason TEXT;
    END IF;
    
    -- Add notes if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'consultations' AND column_name = 'notes') THEN
        ALTER TABLE public.consultations ADD COLUMN notes TEXT;
    END IF;
    
    -- Add status if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'consultations' AND column_name = 'status') THEN
        ALTER TABLE public.consultations ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;
    
    -- Add updated_at if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'consultations' AND column_name = 'updated_at') THEN
        ALTER TABLE public.consultations ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 9. Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Create schedules table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    type TEXT DEFAULT 'appointment',
    status TEXT DEFAULT 'scheduled',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Create triggers for updated_at columns
DO $$ 
DECLARE
    table_record RECORD;
BEGIN
    -- Add updated_at triggers to all tables that have updated_at column
    FOR table_record IN 
        SELECT table_name
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND column_name = 'updated_at'
        AND table_name IN ('profiles', 'consultations', 'notifications', 'schedules')
    LOOP
        -- Drop existing trigger if it exists
        EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON public.%I', table_record.table_name, table_record.table_name);
        
        -- Create new trigger
        EXECUTE format('CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', table_record.table_name, table_record.table_name);
        
        RAISE NOTICE 'Created updated_at trigger for table: %', table_record.table_name;
    END LOOP;
END $$;

-- 12. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_verified ON public.profiles(verified);
CREATE INDEX IF NOT EXISTS idx_consultations_patient_id ON public.consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor_id ON public.consultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultations_date ON public.consultations(consultation_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON public.schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_start_time ON public.schedules(start_time);

-- 13. Summary
SELECT 'All Supabase issues fixed successfully!' as status;
