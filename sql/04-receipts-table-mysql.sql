-- =====================================================
-- RECEIPTS TABLE (NEW) - MySQL Version
-- =====================================================
-- Receipts are derived from payments with independent receipt numbering
-- This provides better tracking and auditing of receipt-related transactions
-- 
-- Relationships:
-- - Each receipt links to exactly one payment (one-to-one)
-- - Each receipt links to exactly one invoice (one-to-one)
-- - Excess payments can be handled as credit balance or change note

CREATE TABLE IF NOT EXISTS receipts (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID identifier',
  company_id CHAR(36) NOT NULL COMMENT 'Foreign key to companies',
  payment_id CHAR(36) NOT NULL COMMENT 'Foreign key to payments',
  invoice_id CHAR(36) COMMENT 'Foreign key to invoices (nullable to preserve receipt history when invoice deleted)',
  
  -- Receipt Identification
  receipt_number VARCHAR(100) NOT NULL COMMENT 'Independent receipt numbering (REC-XXXX format)',
  receipt_date DATE NOT NULL COMMENT 'When receipt was issued',
  
  -- Receipt Type
  receipt_type VARCHAR(50) DEFAULT 'payment_against_invoice' COMMENT 'direct_receipt, payment_against_invoice',
  
  -- Amount Details
  total_amount DECIMAL(15, 2) NOT NULL COMMENT 'Total received',
  excess_amount DECIMAL(15, 2) DEFAULT 0 COMMENT 'Amount over invoice total (if any)',
  
  -- Excess Handling
  excess_handling VARCHAR(50) DEFAULT 'pending' COMMENT 'credit_balance, change_note, pending',
  change_note_id CHAR(36) COMMENT 'If excess_handling = change_note',

  -- Receipt Status / Lifecycle
  status VARCHAR(50) DEFAULT 'finalized' COMMENT 'draft, finalized, voided, archived',
  void_reason VARCHAR(255) COMMENT 'Reason if receipt was voided',
  voided_by CHAR(36) COMMENT 'User who voided the receipt',
  voided_at TIMESTAMP NULL COMMENT 'When receipt was voided',

  -- Additional Info
  notes TEXT COMMENT 'Additional notes',
  
  -- Audit Fields
  created_by CHAR(36) COMMENT 'User who created the receipt',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_receipt_number (company_id, receipt_number),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
  FOREIGN KEY (change_note_id) REFERENCES credit_notes(id) ON DELETE SET NULL,
  INDEX idx_receipts_company_id (company_id),
  INDEX idx_receipts_payment_id (payment_id),
  INDEX idx_receipts_invoice_id (invoice_id),
  INDEX idx_receipts_change_note_id (change_note_id),
  INDEX idx_receipts_created_by (created_by),
  INDEX idx_receipts_receipt_number (receipt_number),
  INDEX idx_receipts_receipt_date (receipt_date),
  INDEX idx_receipts_receipt_type (receipt_type),
  INDEX idx_receipts_excess_handling (excess_handling),
  INDEX idx_receipts_status (status),
  INDEX idx_receipts_voided_at (voided_at),
  INDEX idx_receipts_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
