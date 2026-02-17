-- Enable public read access to companies table for login page branding
-- This allows unauthenticated users to fetch company name and logo
-- 
-- Usage:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Create a new query
-- 3. Copy and paste this entire file
-- 4. Click "Run"
-- 5. You should see "Policy created successfully"

-- Check if the policy already exists and drop it if it does
DROP POLICY IF EXISTS "Public can read companies" ON companies;

-- Create the public read policy
CREATE POLICY "Public can read companies" ON companies
  FOR SELECT 
  USING (true);

-- Verify the policy was created
SELECT 
  policyname,
  tablename,
  permissive,
  roles,
  qual
FROM pg_policies 
WHERE tablename = 'companies' AND policyname = 'Public can read companies';
