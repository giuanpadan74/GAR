-- Fix RLS policies for import_logs table
-- This migration creates the necessary policies to allow authenticated users to insert logs

-- Grant basic permissions to authenticated users
GRANT ALL PRIVILEGES ON import_logs TO authenticated;

-- Create RLS policy to allow authenticated users to insert their own logs
CREATE POLICY "Users can insert their own import logs" ON import_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Create RLS policy to allow authenticated users to view their own logs
CREATE POLICY "Users can view their own import logs" ON import_logs
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Create RLS policy to allow authenticated users to update their own logs (if needed)
CREATE POLICY "Users can update their own import logs" ON import_logs
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Grant select permission to anon for reading logs (if needed for public access)
GRANT SELECT ON import_logs TO anon;