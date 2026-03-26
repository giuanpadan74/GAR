-- Simple fix for import_logs RLS permissions
-- Drop specific existing policies if they exist

-- Drop existing policies by name
DROP POLICY IF EXISTS "Users can insert their own import logs" ON import_logs;
DROP POLICY IF EXISTS "Users can view their own import logs" ON import_logs;
DROP POLICY IF EXISTS "Users can update their own import logs" ON import_logs;
DROP POLICY IF EXISTS "Authenticated users can insert import logs" ON import_logs;
DROP POLICY IF EXISTS "Allow authenticated users to insert import logs" ON import_logs;
DROP POLICY IF EXISTS "Allow users to view their own import logs" ON import_logs;
DROP POLICY IF EXISTS "Allow users to update their own import logs" ON import_logs;
DROP POLICY IF EXISTS "Admin users can view all import logs" ON import_logs;

-- Ensure RLS is enabled
ALTER TABLE import_logs ENABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated users
GRANT ALL PRIVILEGES ON import_logs TO authenticated;
GRANT SELECT ON import_logs TO anon;

-- Create ultra-permissive insert policy - allows any authenticated user to insert
CREATE POLICY "Allow authenticated insert import logs" ON import_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Create policy for viewing own logs
CREATE POLICY "Allow authenticated select own import logs" ON import_logs
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Create policy for updating own logs
CREATE POLICY "Allow authenticated update own import logs" ON import_logs
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);