-- Fix Remaining 7 Security Warnings
-- Run this to fix the function search_path mutability issues

-- 1. Fix search_path for all functions that have mutable search_path
DO $$ 
DECLARE
    func_record RECORD;
BEGIN
    -- Get all functions in public schema that need search_path fixed
    FOR func_record IN 
        SELECT proname, oid
        FROM pg_proc 
        WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        AND prokind = 'f'  -- Only functions, not procedures
        AND proname IN (
            'update_updated_at_column',
            'update_notifications_updated_at', 
            'create_notification',
            'mark_notification_read',
            'mark_all_notifications_read',
            'get_user_notifications'
        )
    LOOP
        BEGIN
            -- Set search_path to public for each function
            EXECUTE format('ALTER FUNCTION public.%I() SET search_path = public', func_record.proname);
            RAISE NOTICE 'Fixed search_path for function: %', func_record.proname;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not fix function %: %', func_record.proname, SQLERRM;
        END;
    END LOOP;
END $$;

-- 2. Alternative approach - Recreate functions with proper search_path
-- This ensures the search_path is set correctly from the start

-- Recreate update_updated_at_column function
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

-- Recreate update_notifications_updated_at function  
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

-- Recreate create_notification function
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

-- Recreate mark_notification_read function
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

-- Recreate mark_all_notifications_read function
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

-- Recreate get_user_notifications function
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

-- 3. Verify all functions now have proper search_path
SELECT 
    proname as function_name,
    prosrc as source_code,
    proconfig as configuration
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND prokind = 'f'
AND proname IN (
    'update_updated_at_column',
    'update_notifications_updated_at', 
    'create_notification',
    'mark_notification_read',
    'mark_all_notifications_read',
    'get_user_notifications'
)
ORDER BY proname;

-- 4. Summary
SELECT 'All function search_path warnings should now be fixed!' as status;
