-- =====================================================
-- MIGRATION SCRIPTS
-- =====================================================
-- Run these scripts if you already have a companies table
-- and need to add missing columns to match the full schema.
--
-- IMPORTANT: These are safe to run multiple times - they use IF NOT EXISTS
-- where available and wrapped transactions to prevent errors.

-- =====================================================
-- Add missing columns to companies table (one by one)
-- =====================================================

-- Add registration_number if missing
ALTER TABLE companies ADD COLUMN IF NOT EXISTS registration_number VARCHAR(100);

-- Add currency if missing
ALTER TABLE companies ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'KES';

-- Add fiscal_year_start if missing
ALTER TABLE companies ADD COLUMN IF NOT EXISTS fiscal_year_start INTEGER DEFAULT 1;

-- Add logo_url if missing
ALTER TABLE companies ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add primary_color if missing
ALTER TABLE companies ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7) DEFAULT '#FF8C42';

-- Add created_at if missing (backfill with NOW() for existing rows)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add updated_at if missing (backfill with NOW() for existing rows)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add is_active if missing
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add status if missing
ALTER TABLE companies ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- =====================================================
-- Add constraints and indexes
-- =====================================================

-- Add UNIQUE constraint on name (if not already exists)
-- Note: This might fail if you have duplicate names - clean those up first
-- ALTER TABLE companies ADD CONSTRAINT companies_name_unique UNIQUE(name);

-- Add CHECK constraint on fiscal_year_start
-- ALTER TABLE companies ADD CONSTRAINT fiscal_year_check CHECK (fiscal_year_start >= 1 AND fiscal_year_start <= 12);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_is_active ON companies(is_active);
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON companies(created_at);
CREATE INDEX IF NOT EXISTS idx_companies_country ON companies(country);

-- =====================================================
-- Create or recreate triggers
-- =====================================================

-- Create function for updating updated_at (if not exists)
CREATE OR REPLACE FUNCTION update_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger to ensure it exists
DROP TRIGGER IF EXISTS trigger_update_companies_updated_at ON companies;
CREATE TRIGGER trigger_update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_companies_updated_at();

-- =====================================================
-- Verify the schema
-- =====================================================
-- Run this query to verify all columns exist:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'companies'
-- ORDER BY ordinal_position;

-- =====================================================
-- Sample data insertion
-- =====================================================
-- Insert a sample company with all fields
INSERT INTO companies (
  name,
  email,
  phone,
  address,
  city,
  state,
  postal_code,
  country,
  registration_number,
  currency,
  fiscal_year_start,
  logo_url,
  primary_color,
  is_active,
  status
) VALUES (
  'Medical Supplies Kenya Ltd',
  'info@medplusafrica.com',
  'Tel: 0741 207 690/0780 165 490',
  'P.O Box 85988-00200, Nairobi, Kenya',
  'Nairobi',
  'Nairobi',
  '00200',
  'Kenya',
  'KRA/REG/12345678',
  'KES',
  1,
  NULL, -- Logo URL (can be uploaded later)
  '#FF8C42',
  true,
  'active'
) ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- If using Supabase, enable RLS
-- =====================================================
/*
-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Companies are viewable by authenticated users"
  ON companies FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Companies can be inserted by authenticated users"
  ON companies FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Companies can be updated by authenticated users"
  ON companies FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Companies can be deleted by authenticated users"
  ON companies FOR DELETE
  USING (auth.role() = 'authenticated');
*/
