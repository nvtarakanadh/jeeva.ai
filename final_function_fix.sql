-- Final Function Fix - Target the Remaining 2 Functions
-- Run this to fix the last 2 function search_path issues

-- 1. Check current function signatures and configurations
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

-- 2. Drop ALL versions of these functions completely
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

-- 3. Recreate functions with explicit search_path in the function definition
-- This is the most reliable method

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

-- 4. Alternative approach - Create with different names and then rename
CREATE FUNCTION public.create_notification_new(
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

CREATE FUNCTION public.mark_notification_read_new(
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

-- 5. Try to rename the new functions to the original names
DO $$ 
BEGIN
    -- Drop the old functions if they still exist
    DROP FUNCTION IF EXISTS public.create_notification(UUID, TEXT, TEXT, TEXT);
    DROP FUNCTION IF EXISTS public.mark_notification_read(UUID, UUID);
    
    -- Rename new functions to original names
    ALTER FUNCTION public.create_notification_new(UUID, TEXT, TEXT, TEXT) RENAME TO create_notification;
    ALTER FUNCTION public.mark_notification_read_new(UUID, UUID) RENAME TO mark_notification_read;
    
    RAISE NOTICE 'Successfully renamed functions to original names';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not rename functions: %', SQLERRM;
END $$;

-- 6. Final verification - Check all functions and their search_path
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
    'mark_notification_read',
    'create_notification_new',
    'mark_notification_read_new'
)
ORDER BY proname, pg_get_function_identity_arguments(oid);

-- 7. Summary
SELECT 'Final function fix completed! Check verification results above.' as status;
