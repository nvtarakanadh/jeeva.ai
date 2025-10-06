-- Check if the ai_insights table exists and what columns it has
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'ai_insights' 
AND table_schema = 'public'
ORDER BY ordinal_position;
