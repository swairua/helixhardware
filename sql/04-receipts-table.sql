-- =====================================================
-- RECEIPTS TABLE (NEW)
-- =====================================================
-- Receipts are derived from payments with independent receipt numbering
-- This provides better tracking and auditing of receipt-related transactions
-- 
-- Relationships:
-- - Each receipt links to exactly one payment (one-to-one)
-- - Each receipt links to exactly one invoice (one-to-one)
-- - Excess payments can be handled as credit balance or change note

CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  
  -- Receipt Identification
  receipt_number VARCHAR(100) NOT NULL, -- Independent receipt numbering (REC-XXXX format)
  receipt_date DATE NOT NULL,
  
  -- Receipt Type
  receipt_type VARCHAR(50) DEFAULT 'payment_against_invoice', -- direct_receipt, payment_against_invoice
  
  -- Amount Details
  total_amount DECIMAL(15, 2) NOT NULL, -- Total received
  excess_amount DECIMAL(15, 2) DEFAULT 0, -- Amount over invoice total (if any)
  
  -- Excess Handling
  excess_handling VARCHAR(50) DEFAULT 'pending', -- credit_balance, change_note, pending
  change_note_id UUID REFERENCES credit_notes(id) ON DELETE SET NULL, -- If excess_handling = 'change_note'

  -- Receipt Status / Lifecycle
  status VARCHAR(50) DEFAULT 'finalized', -- draft, finalized, voided, archived
  void_reason VARCHAR(255), -- Reason if receipt was voided
  voided_by UUID, -- User who voided the receipt
  voided_at TIMESTAMP WITH TIME ZONE, -- When receipt was voided

  -- Additional Info
  notes TEXT,
  
  -- Audit Fields
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(company_id, receipt_number)
);

CREATE INDEX IF NOT EXISTS idx_receipts_company_id ON receipts(company_id);
CREATE INDEX IF NOT EXISTS idx_receipts_payment_id ON receipts(payment_id);
CREATE INDEX IF NOT EXISTS idx_receipts_invoice_id ON receipts(invoice_id);
CREATE INDEX IF NOT EXISTS idx_receipts_change_note_id ON receipts(change_note_id);
CREATE INDEX IF NOT EXISTS idx_receipts_created_by ON receipts(created_by);
CREATE INDEX IF NOT EXISTS idx_receipts_receipt_number ON receipts(receipt_number);
CREATE INDEX IF NOT EXISTS idx_receipts_receipt_date ON receipts(receipt_date);
CREATE INDEX IF NOT EXISTS idx_receipts_receipt_type ON receipts(receipt_type);
CREATE INDEX IF NOT EXISTS idx_receipts_excess_handling ON receipts(excess_handling);
CREATE INDEX IF NOT EXISTS idx_receipts_status ON receipts(status);
CREATE INDEX IF NOT EXISTS idx_receipts_voided_at ON receipts(voided_at);
CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON receipts(created_at DESC);
