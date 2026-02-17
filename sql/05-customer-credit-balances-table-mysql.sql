-- =====================================================
-- CUSTOMER CREDIT BALANCES TABLE (NEW) - MySQL Version
-- =====================================================
-- Tracks customer credit from excess payments
-- Customers can accumulate credit from overpayments and apply it to future invoices
--
-- Status values:
-- - 'available': Credit is available for use
-- - 'applied': Credit has been fully applied to an invoice
-- - 'expired': Credit has expired and cannot be used

CREATE TABLE IF NOT EXISTS customer_credit_balances (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID identifier',
  company_id CHAR(36) NOT NULL COMMENT 'Foreign key to companies',
  customer_id CHAR(36) NOT NULL COMMENT 'Foreign key to customers',
  
  -- Credit Amount
  credit_amount DECIMAL(15, 2) NOT NULL COMMENT 'Available credit balance',
  
  -- Source Information
  source_receipt_id CHAR(36) NOT NULL COMMENT 'Receipt that generated this credit',
  source_payment_id CHAR(36) COMMENT 'Payment that generated the credit',
  
  -- Application Information
  applied_invoice_id CHAR(36) COMMENT 'Invoice credit was applied to (if any)',
  
  -- Status
  status VARCHAR(50) DEFAULT 'available' COMMENT 'available, applied, expired',
  
  -- Expiry
  expires_at TIMESTAMP NULL COMMENT 'Optional expiry date',
  
  -- Additional Info
  notes TEXT COMMENT 'Additional notes',
  
  -- Audit Fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_source_receipt (company_id, source_receipt_id),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (source_receipt_id) REFERENCES receipts(id) ON DELETE CASCADE,
  FOREIGN KEY (source_payment_id) REFERENCES payments(id) ON DELETE SET NULL,
  FOREIGN KEY (applied_invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
  INDEX idx_customer_credit_balances_company_id (company_id),
  INDEX idx_customer_credit_balances_customer_id (customer_id),
  INDEX idx_customer_credit_balances_status (status),
  INDEX idx_customer_credit_balances_source_receipt_id (source_receipt_id),
  INDEX idx_customer_credit_balances_applied_invoice_id (applied_invoice_id),
  INDEX idx_customer_credit_balances_expires_at (expires_at),
  INDEX idx_customer_credit_balances_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
