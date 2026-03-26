-- Check current RLS policies and permissions for import_logs
SELECT 
    schemaname,
    tablename,
    attname,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'import_logs';

-- Check current grants
SELECT 
    grantee,
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' AND table_name = 'import_logs' 
ORDER BY grantee, privilege_type;

-- Check if RLS is enabled
SELECT 
    relname,
    relrowsecurity 
FROM pg_class 
WHERE relname = 'import_logs' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');