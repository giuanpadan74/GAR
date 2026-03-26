-- Comprehensive fix for import_logs RLS permissions
-- Drop existing policies if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own import logs' AND tablename = 'import_logs') THEN
        EXECUTE 'DROP POLICY "Users can insert their own import logs" ON import_logs';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own import logs' AND tablename = 'import_logs') THEN
        EXECUTE 'DROP POLICY "Users can view their own import logs" ON import_logs';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own import logs' AND tablename = 'import_logs') THEN
        EXECUTE 'DROP POLICY "Users can update their own import logs" ON import_logs';
    END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE import_logs ENABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated users
GRANT ALL PRIVILEGES ON import_logs TO authenticated;
GRANT SELECT ON import_logs TO anon;

-- Create permissive policy for authenticated users to insert logs
-- This allows any authenticated user to insert logs (more permissive approach)
CREATE POLICY "Authenticated users can insert import logs" ON import_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Create policy for authenticated users to view their own logs
CREATE POLICY "Authenticated users can view their own import logs" ON import_logs
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Create policy for authenticated users to update their own logs
CREATE POLICY "Authenticated users can update their own import logs" ON import_logs
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create policy for admin users to view all logs (if needed)
CREATE POLICY "Admin users can view all import logs" ON import_logs
    FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
    ));