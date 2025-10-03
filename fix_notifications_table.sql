-- Fix notifications table structure
-- First check what columns exist
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'notifications'
ORDER BY ordinal_position;

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add is_read column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications' 
        AND column_name = 'is_read'
    ) THEN
        ALTER TABLE public.notifications ADD COLUMN is_read BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_read column to notifications table';
    ELSE
        RAISE NOTICE 'is_read column already exists in notifications table';
    END IF;

    -- Add read_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications' 
        AND column_name = 'read_at'
    ) THEN
        ALTER TABLE public.notifications ADD COLUMN read_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added read_at column to notifications table';
    ELSE
        RAISE NOTICE 'read_at column already exists in notifications table';
    END IF;

    -- Add type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications' 
        AND column_name = 'type'
    ) THEN
        ALTER TABLE public.notifications ADD COLUMN type TEXT DEFAULT 'info';
        RAISE NOTICE 'Added type column to notifications table';
    ELSE
        RAISE NOTICE 'type column already exists in notifications table';
    END IF;

    -- Add title column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications' 
        AND column_name = 'title'
    ) THEN
        ALTER TABLE public.notifications ADD COLUMN title TEXT;
        RAISE NOTICE 'Added title column to notifications table';
    ELSE
        RAISE NOTICE 'title column already exists in notifications table';
    END IF;

    -- Add message column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications' 
        AND column_name = 'message'
    ) THEN
        ALTER TABLE public.notifications ADD COLUMN message TEXT;
        RAISE NOTICE 'Added message column to notifications table';
    ELSE
        RAISE NOTICE 'message column already exists in notifications table';
    END IF;

    -- Add user_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.notifications ADD COLUMN user_id UUID;
        RAISE NOTICE 'Added user_id column to notifications table';
    ELSE
        RAISE NOTICE 'user_id column already exists in notifications table';
    END IF;

    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.notifications ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added created_at column to notifications table';
    ELSE
        RAISE NOTICE 'created_at column already exists in notifications table';
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.notifications ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to notifications table';
    ELSE
        RAISE NOTICE 'updated_at column already exists in notifications table';
    END IF;

END $$;

-- Show final table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'notifications'
ORDER BY ordinal_position;

-- Summary
SELECT 'Notifications table structure fixed!' as status;
