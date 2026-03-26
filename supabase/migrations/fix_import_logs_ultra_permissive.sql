-- Ultra-permissive fix for import_logs RLS - allows any authenticated user to insert
-- This is a temporary fix to identify if the issue is with user_id validation

-- Drop all existing policies on import_logs
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all existing policies
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'import_logs' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY "%I" ON import_logs', policy_record.policyname);
    END LOOP;
END $$;

-- Ensure RLS is enabled
ALTER TABLE import_logs ENABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated users
GRANT ALL PRIVILEGES ON import_logs TO authenticated;
GRANT SELECT ON import_logs TO anon;

-- Create ultra-permissive insert policy - allows any authenticated user to insert
CREATE POLICY "Allow authenticated users to insert import logs" ON import_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Create policy for viewing own logs
CREATE POLICY "Allow users to view their own import logs" ON import_logs
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Create policy for updating own logs
CREATE POLICY "Allow users to update their own import logs" ON import_logs
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);