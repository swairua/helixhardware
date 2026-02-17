-- =====================================================
-- MIGRATION SCRIPTS (MYSQL VERSION)
-- =====================================================
-- Run these scripts if you already have a companies table
-- and need to add missing columns to match the full schema.
--
-- MySQL compatible version
-- IMPORTANT: These are safe to run multiple times - they use IF NOT EXISTS

-- =====================================================
-- Add missing columns to companies table (one by one)
-- =====================================================

ALTER TABLE companies ADD COLUMN IF NOT EXISTS registration_number VARCHAR(100);

ALTER TABLE companies ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'KES';

ALTER TABLE companies ADD COLUMN IF NOT EXISTS fiscal_year_start INT DEFAULT 1;

ALTER TABLE companies ADD COLUMN IF NOT EXISTS logo_url LONGTEXT;

ALTER TABLE companies ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7) DEFAULT '#FF8C42';

ALTER TABLE companies ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE companies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE companies ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- =====================================================
-- Add constraints and indexes
-- =====================================================

-- Add UNIQUE constraint on name (if not already exists)
-- Note: This might fail if you have duplicate names - clean those up first
-- ALTER TABLE companies ADD UNIQUE (name);

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

DELIMITER $$

DROP TRIGGER IF EXISTS trigger_update_companies_updated_at$$

CREATE TRIGGER trigger_update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  BEGIN
    SET NEW.updated_at = NOW();
  END$$

DELIMITER ;

-- =====================================================
-- Verify the schema
-- =====================================================
-- Run this query to verify all columns exist:
-- SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
-- FROM INFORMATION_SCHEMA.COLUMNS
-- WHERE TABLE_NAME = 'companies'
-- ORDER BY ORDINAL_POSITION;

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
  NULL,
  '#FF8C42',
  true,
  'active'
) ON DUPLICATE KEY UPDATE
  email = VALUES(email),
  phone = VALUES(phone);
