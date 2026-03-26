-- Emergency fix: Temporarily disable RLS on import_logs for debugging
-- This should only be used for development/testing

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow authenticated insert import logs" ON import_logs;
DROP POLICY IF EXISTS "Allow authenticated select own import logs" ON import_logs;
DROP POLICY IF EXISTS "Allow authenticated update own import logs" ON import_logs;

-- Disable RLS completely
ALTER TABLE import_logs DISABLE ROW LEVEL SECURITY;

-- Ensure proper grants
GRANT ALL PRIVILEGES ON import_logs TO authenticated;
GRANT SELECT ON import_logs TO anon;