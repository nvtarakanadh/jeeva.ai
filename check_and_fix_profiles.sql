-- Check and Fix Profiles Table Structure
-- Run this first to see what columns exist

-- 1. Check what columns exist in profiles table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. Check if profiles table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') 
        THEN 'profiles table EXISTS'
        ELSE 'profiles table DOES NOT EXIST'
    END as table_status;

-- 3. If profiles table doesn't exist, create it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
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
        RAISE NOTICE 'Created profiles table with all required columns';
    ELSE
        RAISE NOTICE 'Profiles table already exists';
    END IF;
END $$;

-- 4. If profiles table exists but missing columns, add them
DO $$ 
BEGIN
    -- Add user_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'user_id') THEN
        ALTER TABLE public.profiles ADD COLUMN user_id UUID REFERENCES auth.users(id) UNIQUE;
        RAISE NOTICE 'Added user_id column to profiles table';
    ELSE
        RAISE NOTICE 'user_id column already exists in profiles table';
    END IF;
    
    -- Add id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'id') THEN
        ALTER TABLE public.profiles ADD COLUMN id UUID DEFAULT gen_random_uuid() PRIMARY KEY;
        RAISE NOTICE 'Added id column to profiles table';
    ELSE
        RAISE NOTICE 'id column already exists in profiles table';
    END IF;
    
    -- Add full_name if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'full_name') THEN
        ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
        RAISE NOTICE 'Added full_name column to profiles table';
    ELSE
        RAISE NOTICE 'full_name column already exists in profiles table';
    END IF;
    
    -- Add specialization if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'specialization') THEN
        ALTER TABLE public.profiles ADD COLUMN specialization TEXT;
        RAISE NOTICE 'Added specialization column to profiles table';
    ELSE
        RAISE NOTICE 'specialization column already exists in profiles table';
    END IF;
    
    -- Add hospital_affiliation if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'hospital_affiliation') THEN
        ALTER TABLE public.profiles ADD COLUMN hospital_affiliation TEXT;
        RAISE NOTICE 'Added hospital_affiliation column to profiles table';
    ELSE
        RAISE NOTICE 'hospital_affiliation column already exists in profiles table';
    END IF;
    
    -- Add verified if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'verified') THEN
        ALTER TABLE public.profiles ADD COLUMN verified BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added verified column to profiles table';
    ELSE
        RAISE NOTICE 'verified column already exists in profiles table';
    END IF;
    
    -- Add role if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'patient';
        RAISE NOTICE 'Added role column to profiles table';
    ELSE
        RAISE NOTICE 'role column already exists in profiles table';
    END IF;
    
    -- Add created_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'created_at') THEN
        ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added created_at column to profiles table';
    ELSE
        RAISE NOTICE 'created_at column already exists in profiles table';
    END IF;
    
    -- Add updated_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'updated_at') THEN
        ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to profiles table';
    ELSE
        RAISE NOTICE 'updated_at column already exists in profiles table';
    END IF;
END $$;

-- 5. Show final profiles table structure
SELECT 
    'Final profiles table structure:' as info,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;
