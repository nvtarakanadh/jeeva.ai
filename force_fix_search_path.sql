-- Force Fix Search Path Issues - More Aggressive Approach
-- Run this to forcefully fix the remaining 4 function search_path issues

-- 1. First, let's see what functions exist and their current configuration
SELECT 
    proname as function_name,
    proconfig as current_config,
    prosrc as source_code
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND prokind = 'f'
AND proname IN (
    'create_notification',
    'mark_notification_read', 
    'get_user_notifications'
)
ORDER BY proname;

-- 2. Drop all problematic functions completely
DROP FUNCTION IF EXISTS public.create_notification(UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_notification(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.mark_notification_read(UUID, UUID);
DROP FUNCTION IF EXISTS public.get_user_notifications(UUID, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.get_user_notifications(UUID, INTEGER);
DROP FUNCTION IF EXISTS public.get_user_notifications(UUID);

-- 3. Recreate functions with explicit search_path in the function body
-- This approach embeds the search_path directly in the function

CREATE OR REPLACE FUNCTION public.create_notification(
    p_user_id UUID,
    p_title TEXT,
    p_message TEXT,
    p_type TEXT DEFAULT 'info'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    notification_id UUID;
BEGIN
    -- Explicitly set search_path at the beginning of function
    PERFORM set_config('search_path', 'public', true);
    
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
AS $$
BEGIN
    -- Explicitly set search_path at the beginning of function
    PERFORM set_config('search_path', 'public', true);
    
    UPDATE public.notifications 
    SET is_read = true, read_at = NOW()
    WHERE id = p_notification_id AND user_id = p_user_id;
    
    RETURN FOUND;
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
AS $$
BEGIN
    -- Explicitly set search_path at the beginning of function
    PERFORM set_config('search_path', 'public', true);
    
    RETURN QUERY
    SELECT n.id, n.title, n.message, n.type, n.is_read, n.created_at, n.read_at
    FROM public.notifications n
    WHERE n.user_id = p_user_id
    ORDER BY n.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

-- 4. Now try to set search_path using ALTER FUNCTION
DO $$ 
BEGIN
    -- Try different function signatures
    BEGIN
        ALTER FUNCTION public.create_notification(UUID, TEXT, TEXT, TEXT) SET search_path = public;
        RAISE NOTICE 'Successfully set search_path for create_notification with 4 params';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Failed to set search_path for create_notification with 4 params: %', SQLERRM;
    END;
    
    BEGIN
        ALTER FUNCTION public.mark_notification_read(UUID, UUID) SET search_path = public;
        RAISE NOTICE 'Successfully set search_path for mark_notification_read';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Failed to set search_path for mark_notification_read: %', SQLERRM;
    END;
    
    BEGIN
        ALTER FUNCTION public.get_user_notifications(UUID, INTEGER, INTEGER) SET search_path = public;
        RAISE NOTICE 'Successfully set search_path for get_user_notifications with 3 params';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Failed to set search_path for get_user_notifications with 3 params: %', SQLERRM;
    END;
END $$;

-- 5. Alternative approach - Create functions with different names and drop old ones
CREATE OR REPLACE FUNCTION public.create_notification_v2(
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

-- 6. Verify the functions now have proper search_path
SELECT 
    proname as function_name,
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
    'get_user_notifications',
    'create_notification_v2'
)
ORDER BY proname;

-- 7. Summary
SELECT 'Search path fix completed! Check the verification results above.' as status;
