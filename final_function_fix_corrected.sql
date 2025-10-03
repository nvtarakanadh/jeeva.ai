-- Final Function Fix - Corrected for actual notifications table structure
-- Run this to fix the last 2 function search_path issues

-- 1. First, fix the notifications table structure
DO $$ 
BEGIN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications' 
        AND column_name = 'is_read'
    ) THEN
        ALTER TABLE public.notifications ADD COLUMN is_read BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_read column to notifications table';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications' 
        AND column_name = 'read_at'
    ) THEN
        ALTER TABLE public.notifications ADD COLUMN read_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added read_at column to notifications table';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications' 
        AND column_name = 'type'
    ) THEN
        ALTER TABLE public.notifications ADD COLUMN type TEXT DEFAULT 'info';
        RAISE NOTICE 'Added type column to notifications table';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications' 
        AND column_name = 'title'
    ) THEN
        ALTER TABLE public.notifications ADD COLUMN title TEXT;
        RAISE NOTICE 'Added title column to notifications table';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications' 
        AND column_name = 'message'
    ) THEN
        ALTER TABLE public.notifications ADD COLUMN message TEXT;
        RAISE NOTICE 'Added message column to notifications table';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.notifications ADD COLUMN user_id UUID;
        RAISE NOTICE 'Added user_id column to notifications table';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.notifications ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added created_at column to notifications table';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.notifications ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to notifications table';
    END IF;

END $$;

-- 2. Check current function signatures and configurations
SELECT 
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments,
    proconfig as current_config,
    prokind as function_type
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND prokind = 'f'
AND proname IN (
    'create_notification',
    'mark_notification_read'
)
ORDER BY proname, pg_get_function_identity_arguments(oid);

-- 3. Drop ALL versions of these functions completely
DO $$ 
DECLARE
    func_record RECORD;
BEGIN
    -- Get all function signatures for these functions
    FOR func_record IN 
        SELECT proname, oid, pg_get_function_identity_arguments(oid) as args
        FROM pg_proc 
        WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        AND prokind = 'f'
        AND proname IN ('create_notification', 'mark_notification_read')
    LOOP
        BEGIN
            EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s)', func_record.proname, func_record.args);
            RAISE NOTICE 'Dropped function: %(%)', func_record.proname, func_record.args;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop function %(%): %', func_record.proname, func_record.args, SQLERRM;
        END;
    END LOOP;
END $$;

-- 4. Recreate functions with explicit search_path in the function definition
CREATE FUNCTION public.create_notification(
    p_user_id UUID,
    p_title TEXT,
    p_message TEXT,
    p_type TEXT DEFAULT 'info'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO public.notifications (user_id, title, message, type, created_at)
    VALUES (p_user_id, p_title, p_message, p_type, NOW())
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$func$;

CREATE FUNCTION public.mark_notification_read(
    p_notification_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
    UPDATE public.notifications 
    SET is_read = true, read_at = NOW()
    WHERE id = p_notification_id AND user_id = p_user_id;
    
    RETURN FOUND;
END;
$func$;

-- 5. Final verification - Check all functions and their search_path
SELECT 
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments,
    proconfig as configuration,
    CASE 
        WHEN proconfig IS NULL THEN 'No search_path set'
        WHEN 'search_path=public' = ANY(proconfig) THEN 'search_path=public ✓'
        WHEN array_to_string(proconfig, ',') LIKE '%search_path%' THEN 'search_path set: ' || array_to_string(proconfig, ',')
        ELSE 'Other configuration: ' || array_to_string(proconfig, ',')
    END as search_path_status
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND prokind = 'f'
AND proname IN (
    'create_notification',
    'mark_notification_read'
)
ORDER BY proname, pg_get_function_identity_arguments(oid);

-- 6. Summary
SELECT 'Final function fix completed! Check verification results above.' as status;
