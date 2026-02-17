-- =====================================================
-- COMPANIES TABLE SCHEMA
-- =====================================================
-- This SQL creates the companies table with all necessary fields
-- for the company management system.
-- 
-- Run this in your database to create or recreate the table.
-- If the table already exists, drop it first or use the migration scripts below.

-- Create companies table with full schema
CREATE TABLE IF NOT EXISTS companies (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Information
  name VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'Kenya',
  
  -- Registration & Compliance (Note: tax_number is NOT stored here - use tax_settings table instead)
  registration_number VARCHAR(100),
  
  -- Financial Settings
  currency VARCHAR(3) DEFAULT 'KES',
  fiscal_year_start INTEGER DEFAULT 1 CHECK (fiscal_year_start >= 1 AND fiscal_year_start <= 12),
  
  -- Branding
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#FF8C42',
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  status VARCHAR(50) DEFAULT 'active' -- Can be: active, inactive, archived
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_is_active ON companies(is_active);
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON companies(created_at);
CREATE INDEX IF NOT EXISTS idx_companies_country ON companies(country);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_companies_updated_at ON companies;
CREATE TRIGGER trigger_update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_companies_updated_at();

-- Add Row Level Security (RLS) if using Supabase
-- Uncomment these lines if you're using Supabase:
/*
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

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

-- =====================================================
-- TAX SETTINGS TABLE (for tax rates and numbers)
-- =====================================================
-- Tax numbers, rates, and settings are stored here, NOT in companies table
CREATE TABLE IF NOT EXISTS tax_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Tax Information
  name VARCHAR(100) NOT NULL, -- e.g., "VAT", "Income Tax"
  rate DECIMAL(5, 2) NOT NULL, -- Tax rate as percentage (e.g., 16.00 for 16%)
  tax_number VARCHAR(100), -- Company's tax number for this tax type
  
  -- Settings
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false, -- Default tax to apply
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(company_id, name)
);

-- Create indexes for tax_settings
CREATE INDEX IF NOT EXISTS idx_tax_settings_company_id ON tax_settings(company_id);
CREATE INDEX IF NOT EXISTS idx_tax_settings_is_active ON tax_settings(is_active);
CREATE INDEX IF NOT EXISTS idx_tax_settings_is_default ON tax_settings(is_default);

-- Create trigger for tax_settings updated_at
CREATE OR REPLACE FUNCTION update_tax_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_tax_settings_updated_at ON tax_settings;
CREATE TRIGGER trigger_update_tax_settings_updated_at
  BEFORE UPDATE ON tax_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_tax_settings_updated_at();

-- =====================================================
-- HELPFUL QUERIES
-- =====================================================

-- View all companies with their info
-- SELECT * FROM companies WHERE is_active = true ORDER BY created_at DESC;

-- View company details with tax settings
-- SELECT 
--   c.id,
--   c.name,
--   c.email,
--   c.phone,
--   c.address,
--   c.city,
--   c.country,
--   c.currency,
--   ARRAY_AGG(
--     JSON_BUILD_OBJECT('name', t.name, 'rate', t.rate, 'tax_number', t.tax_number)
--     ORDER BY t.is_default DESC, t.name
--   ) FILTER (WHERE t.id IS NOT NULL) as tax_settings
-- FROM companies c
-- LEFT JOIN tax_settings t ON c.id = t.company_id AND t.is_active = true
-- WHERE c.is_active = true
-- GROUP BY c.id
-- ORDER BY c.created_at DESC;

-- Insert a new company
-- INSERT INTO companies (name, email, phone, address, city, country, currency, logo_url, primary_color)
-- VALUES (
--   'Medical Supplies Inc',
--   'info@medplusafrica.com',
--   'Tel: 0741 207 690/0780 165 490',
--   'P.O Box 85988-00200\nNairobi, Kenya',
--   'Nairobi',
--   'Kenya',
--   'KES',
--   'https://example.com/logo.png',
--   '#FF8C42'
-- );

-- Add a tax setting to a company
-- INSERT INTO tax_settings (company_id, name, rate, tax_number, is_active, is_default)
-- SELECT id, 'VAT (16%)', 16.00, 'P051658002D', true, true
-- FROM companies
-- WHERE name = 'Medical Supplies Inc'
-- LIMIT 1;
