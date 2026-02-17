-- =====================================================
-- RELATED TABLES THAT REFERENCE COMPANIES
-- =====================================================
-- These tables are related to the companies table
-- Ensure the companies table exists before running this

-- =====================================================
-- CUSTOMERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Customer Info
  customer_code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100),
  
  -- Credit Settings
  credit_limit DECIMAL(15, 2) DEFAULT 0,
  payment_terms INTEGER DEFAULT 0, -- Days
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(company_id, customer_code)
);

CREATE INDEX IF NOT EXISTS idx_customers_company_id ON customers(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_customer_code ON customers(customer_code);
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON customers(is_active);

-- =====================================================
-- INVOICES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  
  -- Invoice Details
  invoice_number VARCHAR(50) NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE,
  
  -- Amounts
  subtotal DECIMAL(15, 2) DEFAULT 0,
  tax_amount DECIMAL(15, 2) DEFAULT 0,
  total_amount DECIMAL(15, 2) DEFAULT 0,
  paid_amount DECIMAL(15, 2) DEFAULT 0,
  balance_due DECIMAL(15, 2) DEFAULT 0,
  
  -- Status
  status VARCHAR(50) DEFAULT 'draft', -- draft, sent, paid, partial, overdue, cancelled
  notes TEXT,
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(company_id, invoice_number)
);

CREATE INDEX IF NOT EXISTS idx_invoices_company_id ON invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date);

-- =====================================================
-- PAYMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  
  -- Payment Details
  payment_number VARCHAR(50) NOT NULL,
  payment_date DATE NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  payment_method VARCHAR(100), -- Cash, Bank Transfer, Check, etc.
  reference_number VARCHAR(100),
  notes TEXT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'completed', -- completed, pending, failed
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(company_id, payment_number)
);

CREATE INDEX IF NOT EXISTS idx_payments_company_id ON payments(company_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- =====================================================
-- PRODUCTS/INVENTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Product Info
  product_code VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sku VARCHAR(100),
  
  -- Pricing
  unit_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
  cost_price DECIMAL(15, 2) DEFAULT 0,
  
  -- Inventory
  quantity_on_hand INT DEFAULT 0,
  reorder_level INT DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(company_id, product_code)
);

CREATE INDEX IF NOT EXISTS idx_products_company_id ON products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_product_code ON products(product_code);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

-- =====================================================
-- QUOTATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  
  -- Quotation Details
  quotation_number VARCHAR(50) NOT NULL,
  quotation_date DATE NOT NULL,
  valid_until DATE,
  
  -- Amounts
  subtotal DECIMAL(15, 2) DEFAULT 0,
  tax_amount DECIMAL(15, 2) DEFAULT 0,
  total_amount DECIMAL(15, 2) DEFAULT 0,
  
  -- Status
  status VARCHAR(50) DEFAULT 'draft', -- draft, sent, accepted, rejected, expired
  notes TEXT,
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(company_id, quotation_number)
);

CREATE INDEX IF NOT EXISTS idx_quotations_company_id ON quotations(company_id);
CREATE INDEX IF NOT EXISTS idx_quotations_customer_id ON quotations(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);

-- =====================================================
-- PAYMENT METHODS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_name VARCHAR(100), -- For UI icons
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(company_id, code)
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_company_id ON payment_methods(company_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_active ON payment_methods(is_active);

-- =====================================================
-- UNITS OF MEASURE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS units_of_measure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(company_id, code)
);

CREATE INDEX IF NOT EXISTS idx_units_of_measure_company_id ON units_of_measure(company_id);

-- =====================================================
-- INSERT DEFAULT PAYMENT METHODS
-- =====================================================
-- Add default payment methods (only once)
INSERT INTO payment_methods (company_id, code, name, icon_name, is_active)
SELECT 
  id,
  'cash',
  'Cash',
  'DollarSign',
  true
FROM companies
ON CONFLICT (company_id, code) DO NOTHING;

INSERT INTO payment_methods (company_id, code, name, icon_name, is_active)
SELECT 
  id,
  'bank_transfer',
  'Bank Transfer',
  'CreditCard',
  true
FROM companies
ON CONFLICT (company_id, code) DO NOTHING;

INSERT INTO payment_methods (company_id, code, name, icon_name, is_active)
SELECT 
  id,
  'check',
  'Check',
  'FileText',
  true
FROM companies
ON CONFLICT (company_id, code) DO NOTHING;

-- =====================================================
-- INSERT DEFAULT UNITS OF MEASURE
-- =====================================================
INSERT INTO units_of_measure (company_id, code, name, is_active)
SELECT id, 'pcs', 'Pieces', true FROM companies
ON CONFLICT (company_id, code) DO NOTHING;

INSERT INTO units_of_measure (company_id, code, name, is_active)
SELECT id, 'box', 'Box', true FROM companies
ON CONFLICT (company_id, code) DO NOTHING;

INSERT INTO units_of_measure (company_id, code, name, is_active)
SELECT id, 'kg', 'Kilogram', true FROM companies
ON CONFLICT (company_id, code) DO NOTHING;

INSERT INTO units_of_measure (company_id, code, name, is_active)
SELECT id, 'ltr', 'Liter', true FROM companies
ON CONFLICT (company_id, code) DO NOTHING;

INSERT INTO units_of_measure (company_id, code, name, is_active)
SELECT id, 'meter', 'Meter', true FROM companies
ON CONFLICT (company_id, code) DO NOTHING;
