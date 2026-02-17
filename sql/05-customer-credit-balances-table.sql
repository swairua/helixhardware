-- =====================================================
-- CUSTOMER CREDIT BALANCES TABLE (NEW)
-- =====================================================
-- Tracks customer credit from excess payments
-- Customers can accumulate credit from overpayments and apply it to future invoices
--
-- Status values:
-- - 'available': Credit is available for use
-- - 'applied': Credit has been fully applied to an invoice
-- - 'expired': Credit has expired and cannot be used

CREATE TABLE IF NOT EXISTS customer_credit_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Credit Amount
  credit_amount DECIMAL(15, 2) NOT NULL, -- Available credit balance
  
  -- Source Information
  source_receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE, -- Receipt that generated this credit
  source_payment_id UUID REFERENCES payments(id) ON DELETE SET NULL, -- Payment that generated the credit
  
  -- Application Information
  applied_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL, -- Invoice credit was applied to (if any)
  
  -- Status
  status VARCHAR(50) DEFAULT 'available', -- available, applied, expired
  
  -- Expiry
  expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiry date
  
  -- Additional Info
  notes TEXT,
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(company_id, source_receipt_id)
);

CREATE INDEX IF NOT EXISTS idx_customer_credit_balances_company_id ON customer_credit_balances(company_id);
CREATE INDEX IF NOT EXISTS idx_customer_credit_balances_customer_id ON customer_credit_balances(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_credit_balances_status ON customer_credit_balances(status);
CREATE INDEX IF NOT EXISTS idx_customer_credit_balances_source_receipt_id ON customer_credit_balances(source_receipt_id);
CREATE INDEX IF NOT EXISTS idx_customer_credit_balances_applied_invoice_id ON customer_credit_balances(applied_invoice_id);
CREATE INDEX IF NOT EXISTS idx_customer_credit_balances_expires_at ON customer_credit_balances(expires_at);
CREATE INDEX IF NOT EXISTS idx_customer_credit_balances_created_at ON customer_credit_balances(created_at DESC);
