-- =====================================================
-- COMPANIES TABLE SCHEMA (MYSQL VERSION)
-- =====================================================
-- This SQL creates the companies table with all necessary fields
-- for the company management system.
-- 
-- MySQL compatible version - use this for MySQL/MariaDB databases
-- For PostgreSQL/Supabase, use 01-companies-table.sql instead

-- Create companies table with full schema
CREATE TABLE IF NOT EXISTS companies (
  -- Primary Key
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  
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
  fiscal_year_start INT DEFAULT 1 CHECK (fiscal_year_start >= 1 AND fiscal_year_start <= 12),
  
  -- Branding
  logo_url LONGTEXT,
  primary_color VARCHAR(7) DEFAULT '#FF8C42',
  
  -- Audit Fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  status VARCHAR(50) DEFAULT 'active'
);

-- Create indexes for common queries
CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_is_active ON companies(is_active);
CREATE INDEX idx_companies_created_at ON companies(created_at);
CREATE INDEX idx_companies_country ON companies(country);

-- Create trigger to automatically update updated_at timestamp
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
-- TAX SETTINGS TABLE (for tax rates and numbers)
-- =====================================================
-- Tax numbers, rates, and settings are stored here, NOT in companies table
CREATE TABLE IF NOT EXISTS tax_settings (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NOT NULL,
  
  -- Tax Information
  name VARCHAR(100) NOT NULL,
  rate DECIMAL(5, 2) NOT NULL,
  tax_number VARCHAR(100),
  
  -- Settings
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  -- Audit Fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE(company_id, name),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Create indexes for tax_settings
CREATE INDEX idx_tax_settings_company_id ON tax_settings(company_id);
CREATE INDEX idx_tax_settings_is_active ON tax_settings(is_active);
CREATE INDEX idx_tax_settings_is_default ON tax_settings(is_default);

-- Create trigger for tax_settings updated_at
DELIMITER $$

DROP TRIGGER IF EXISTS trigger_update_tax_settings_updated_at$$

CREATE TRIGGER trigger_update_tax_settings_updated_at
  BEFORE UPDATE ON tax_settings
  FOR EACH ROW
  BEGIN
    SET NEW.updated_at = NOW();
  END$$

DELIMITER ;

-- =====================================================
-- HELPFUL QUERIES
-- =====================================================

-- View all companies with their info
-- SELECT * FROM companies WHERE is_active = true ORDER BY created_at DESC;

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
