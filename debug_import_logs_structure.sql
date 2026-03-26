-- Check current RLS status and policies for import_logs
SELECT 
    relname,
    relrowsecurity,
    relforcerowsecurity
FROM pg_class 
WHERE relname = 'import_logs' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Check all policies on import_logs
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'import_logs' AND schemaname = 'public';

-- Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'import_logs'
ORDER BY ordinal_position;

-- Check foreign key constraints
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public' AND tc.table_name = 'import_logs' AND tc.constraint_type = 'FOREIGN KEY';