-- ============================================================================
-- COMPLETE DOCUMENT SEQUENTIAL NUMBERING MIGRATION
-- ============================================================================
-- This migration initializes sequential numbering for ALL document types:
-- INV (Invoices), PRO (Proforma Invoices), QT (Quotations), PO (Purchase Orders),
-- LPO (Local Purchase Orders), DN (Delivery Notes), CN (Credit Notes),
-- PAY (Payments), REC (Receipts)
--
-- Format: TYPE-YYYY-NNNN (e.g., INV-2026-0001, QT-2026-0042)
-- ============================================================================

-- ============================================================================
-- PHASE 1: TABLE CREATION
-- ============================================================================
-- Create document_sequences table if not exists
CREATE TABLE IF NOT EXISTS `document_sequences` (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    document_type CHAR(3) NOT NULL,
    year INT NOT NULL,
    sequence_number INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_type_year (document_type, year),
    INDEX idx_document_sequences_type (document_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PHASE 2: INITIALIZE ALL DOCUMENT TYPES FOR CURRENT YEAR
-- ============================================================================

-- 1. INVOICES (INV)
-- Insert with initial sequence 0
INSERT IGNORE INTO document_sequences (document_type, year, sequence_number)
VALUES ('INV', YEAR(CURDATE()), 0);

-- Update sequence based on existing invoices count for current year
UPDATE document_sequences 
SET sequence_number = COALESCE((
  SELECT COUNT(*) FROM invoices 
  WHERE YEAR(created_at) = YEAR(CURDATE())
    AND invoice_number LIKE CONCAT('INV-', YEAR(CURDATE()), '-%')
), 0)
WHERE document_type = 'INV' AND year = YEAR(CURDATE());

-- 2. PROFORMA INVOICES (PRO)
-- Insert with initial sequence 0
INSERT IGNORE INTO document_sequences (document_type, year, sequence_number)
VALUES ('PRO', YEAR(CURDATE()), 0);

-- Update sequence based on existing proformas count for current year
-- Check for all legacy formats (PRO-, PF-, PROFORMA-) and count them
UPDATE document_sequences 
SET sequence_number = COALESCE((
  SELECT COUNT(*) FROM proforma_invoices 
  WHERE YEAR(created_at) = YEAR(CURDATE())
    AND (
      proforma_number LIKE CONCAT('PRO-', YEAR(CURDATE()), '-%')
      OR proforma_number LIKE CONCAT('PF-', YEAR(CURDATE()), '-%')
      OR proforma_number LIKE CONCAT('PROFORMA-', YEAR(CURDATE()), '-%')
    )
), 0)
WHERE document_type = 'PRO' AND year = YEAR(CURDATE());

-- 3. QUOTATIONS (QT)
-- Insert with initial sequence 0
INSERT IGNORE INTO document_sequences (document_type, year, sequence_number)
VALUES ('QT', YEAR(CURDATE()), 0);

-- Update sequence based on existing quotations count for current year
UPDATE document_sequences 
SET sequence_number = COALESCE((
  SELECT COUNT(*) FROM quotations 
  WHERE YEAR(created_at) = YEAR(CURDATE())
    AND quotation_number LIKE CONCAT('QT-', YEAR(CURDATE()), '-%')
), 0)
WHERE document_type = 'QT' AND year = YEAR(CURDATE());

-- 4. PURCHASE ORDERS (PO)
-- Insert with initial sequence 0
INSERT IGNORE INTO document_sequences (document_type, year, sequence_number)
VALUES ('PO', YEAR(CURDATE()), 0);

-- Update sequence based on existing POs count for current year
UPDATE document_sequences 
SET sequence_number = COALESCE((
  SELECT COUNT(*) FROM purchase_orders 
  WHERE YEAR(created_at) = YEAR(CURDATE())
    AND po_number LIKE CONCAT('PO-', YEAR(CURDATE()), '-%')
), 0)
WHERE document_type = 'PO' AND year = YEAR(CURDATE());

-- 5. LOCAL PURCHASE ORDERS (LPO)
-- Insert with initial sequence 0
INSERT IGNORE INTO document_sequences (document_type, year, sequence_number)
VALUES ('LPO', YEAR(CURDATE()), 0);

-- Update sequence based on existing LPOs count for current year
UPDATE document_sequences 
SET sequence_number = COALESCE((
  SELECT COUNT(*) FROM lpos 
  WHERE YEAR(created_at) = YEAR(CURDATE())
    AND lpo_number LIKE CONCAT('LPO-', YEAR(CURDATE()), '-%')
), 0)
WHERE document_type = 'LPO' AND year = YEAR(CURDATE());

-- 6. DELIVERY NOTES (DN)
-- Insert with initial sequence 0
INSERT IGNORE INTO document_sequences (document_type, year, sequence_number)
VALUES ('DN', YEAR(CURDATE()), 0);

-- Update sequence based on existing delivery notes count for current year
UPDATE document_sequences 
SET sequence_number = COALESCE((
  SELECT COUNT(*) FROM delivery_notes 
  WHERE YEAR(created_at) = YEAR(CURDATE())
    AND delivery_note_number LIKE CONCAT('DN-', YEAR(CURDATE()), '-%')
), 0)
WHERE document_type = 'DN' AND year = YEAR(CURDATE());

-- 7. CREDIT NOTES (CN)
-- Insert with initial sequence 0
INSERT IGNORE INTO document_sequences (document_type, year, sequence_number)
VALUES ('CN', YEAR(CURDATE()), 0);

-- Update sequence based on existing credit notes count for current year
UPDATE document_sequences 
SET sequence_number = COALESCE((
  SELECT COUNT(*) FROM credit_notes 
  WHERE YEAR(created_at) = YEAR(CURDATE())
    AND credit_note_number LIKE CONCAT('CN-', YEAR(CURDATE()), '-%')
), 0)
WHERE document_type = 'CN' AND year = YEAR(CURDATE());

-- 8. PAYMENTS (PAY)
-- Insert with initial sequence 0
INSERT IGNORE INTO document_sequences (document_type, year, sequence_number)
VALUES ('PAY', YEAR(CURDATE()), 0);

-- Update sequence based on existing payments count for current year
UPDATE document_sequences 
SET sequence_number = COALESCE((
  SELECT COUNT(*) FROM payments 
  WHERE YEAR(created_at) = YEAR(CURDATE())
    AND payment_number LIKE CONCAT('PAY-', YEAR(CURDATE()), '-%')
), 0)
WHERE document_type = 'PAY' AND year = YEAR(CURDATE());

-- 9. RECEIPTS (REC)
-- Insert with initial sequence 0
INSERT IGNORE INTO document_sequences (document_type, year, sequence_number)
VALUES ('REC', YEAR(CURDATE()), 0);

-- Update sequence based on existing receipts count for current year
UPDATE document_sequences 
SET sequence_number = COALESCE((
  SELECT COUNT(*) FROM receipts 
  WHERE YEAR(created_at) = YEAR(CURDATE())
    AND receipt_number LIKE CONCAT('REC-', YEAR(CURDATE()), '-%')
), 0)
WHERE document_type = 'REC' AND year = YEAR(CURDATE());

-- ============================================================================
-- PHASE 3: VERIFICATION QUERIES
-- ============================================================================

-- Verify all document types are initialized
SELECT 
  document_type,
  year,
  sequence_number,
  CONCAT(document_type, '-', year, '-0001') as next_number_example,
  created_at
FROM document_sequences 
WHERE year = YEAR(CURDATE())
ORDER BY document_type;

-- ============================================================================
-- PHASE 4: OPTIONAL ANALYSIS QUERIES (Uncomment to run)
-- ============================================================================

-- Show count of existing documents by type for current year
-- This helps verify the sequence numbers are set correctly
/*
SELECT 
  'INV' as type,
  COUNT(*) as count,
  YEAR(CURDATE()) as year
FROM invoices 
WHERE YEAR(created_at) = YEAR(CURDATE())
UNION ALL
SELECT 
  'PRO' as type,
  COUNT(*) as count,
  YEAR(CURDATE()) as year
FROM proforma_invoices 
WHERE YEAR(created_at) = YEAR(CURDATE())
UNION ALL
SELECT 
  'QT' as type,
  COUNT(*) as count,
  YEAR(CURDATE()) as year
FROM quotations 
WHERE YEAR(created_at) = YEAR(CURDATE())
UNION ALL
SELECT 
  'PO' as type,
  COUNT(*) as count,
  YEAR(CURDATE()) as year
FROM purchase_orders 
WHERE YEAR(created_at) = YEAR(CURDATE())
UNION ALL
SELECT 
  'LPO' as type,
  COUNT(*) as count,
  YEAR(CURDATE()) as year
FROM lpos 
WHERE YEAR(created_at) = YEAR(CURDATE())
UNION ALL
SELECT 
  'DN' as type,
  COUNT(*) as count,
  YEAR(CURDATE()) as year
FROM delivery_notes 
WHERE YEAR(created_at) = YEAR(CURDATE())
UNION ALL
SELECT 
  'CN' as type,
  COUNT(*) as count,
  YEAR(CURDATE()) as year
FROM credit_notes 
WHERE YEAR(created_at) = YEAR(CURDATE())
UNION ALL
SELECT 
  'PAY' as type,
  COUNT(*) as count,
  YEAR(CURDATE()) as year
FROM payments 
WHERE YEAR(created_at) = YEAR(CURDATE())
UNION ALL
SELECT 
  'REC' as type,
  COUNT(*) as count,
  YEAR(CURDATE()) as year
FROM receipts 
WHERE YEAR(created_at) = YEAR(CURDATE())
ORDER BY type;
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- SUMMARY:
-- ✅ document_sequences table created with proper indexes
-- ✅ All 9 document types initialized for current year
-- ✅ Sequence numbers set to match existing document counts
-- ✅ Ready for TYPE-YYYY-NNNN format generation
--
-- NEXT STEPS:
-- 1. Deploy this migration to your database
-- 2. Verify the output of the verification query above
-- 3. All new documents will use the generateDocumentNumberAPI() function
-- 4. Old documents keep their existing numbers (backward compatible)
--
-- NOTES:
-- - Format: TYPE-YYYY-NNNN (e.g., INV-2026-0001)
-- - Counter resets to 0001 each calendar year
-- - Each document type has independent sequence counter
-- - System uses database transactions for thread-safe atomicity
-- - Legacy document formats (timestamps, random) remain unchanged
-- ============================================================================
