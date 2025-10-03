-- Fix Final 4 Security Issues - Function Search Path
-- Run this to fix the remaining function search_path mutability issues

-- 1. Drop and recreate functions with proper search_path
-- This ensures the search_path is set correctly from the start

-- Drop existing functions first
DROP FUNCTION IF EXISTS public.create_notification(UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.mark_notification_read(UUID, UUID);
DROP FUNCTION IF EXISTS public.get_user_notifications(UUID, INTEGER, INTEGER);

-- Recreate create_notification function with proper search_path
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

-- Recreate mark_notification_read function with proper search_path
CREATE FUNCTION public.mark_notification_read(
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

-- Recreate get_user_notifications function with proper search_path
CREATE FUNCTION public.get_user_notifications(
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

-- 2. Alternative approach - Use ALTER FUNCTION to set search_path
-- This should work for the remaining functions
DO $$ 
BEGIN
    -- Try to alter each function's search_path
    BEGIN
        ALTER FUNCTION public.create_notification(UUID, TEXT, TEXT, TEXT) SET search_path = public;
        RAISE NOTICE 'Fixed search_path for create_notification';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not fix create_notification: %', SQLERRM;
    END;
    
    BEGIN
        ALTER FUNCTION public.mark_notification_read(UUID, UUID) SET search_path = public;
        RAISE NOTICE 'Fixed search_path for mark_notification_read';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not fix mark_notification_read: %', SQLERRM;
    END;
    
    BEGIN
        ALTER FUNCTION public.get_user_notifications(UUID, INTEGER, INTEGER) SET search_path = public;
        RAISE NOTICE 'Fixed search_path for get_user_notifications';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not fix get_user_notifications: %', SQLERRM;
    END;
END $$;

-- 3. Verify functions have proper search_path
SELECT 
    proname as function_name,
    proconfig as configuration,
    CASE 
        WHEN proconfig IS NULL THEN 'No search_path set'
        WHEN 'search_path=public' = ANY(proconfig) THEN 'search_path=public ✓'
        ELSE 'Other configuration: ' || array_to_string(proconfig, ', ')
    END as search_path_status
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND prokind = 'f'
AND proname IN (
    'create_notification',
    'mark_notification_read',
    'get_user_notifications'
)
ORDER BY proname;

-- 4. Summary
SELECT 'Security issues should now be fixed! Check the verification results above.' as status;
