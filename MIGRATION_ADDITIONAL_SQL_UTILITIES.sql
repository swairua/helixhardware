-- ============================================================================
-- ADDITIONAL SQL UTILITIES - HELPERS FOR MIGRATION MAINTENANCE
-- ============================================================================
-- This file contains additional SQL scripts for:
-- - Initializing sequences for past years
-- - Resetting sequences
-- - Data reconciliation and cleanup
-- - Diagnostic utilities
-- - Performance optimization
-- - Backup and recovery utilities
-- ============================================================================

-- ============================================================================
-- SECTION 1: PAST YEAR INITIALIZATION
-- ============================================================================
-- Use these scripts to initialize sequences for previous years
-- Run these AFTER the main migration if you have documents from past years

-- Initialize all document types for a specific past year (example: 2025)
-- Change "2025" to your desired year

/*
INSERT IGNORE INTO document_sequences (document_type, year, sequence_number)
VALUES 
  ('INV', 2025, 0),
  ('PRO', 2025, 0),
  ('QT', 2025, 0),
  ('PO', 2025, 0),
  ('LPO', 2025, 0),
  ('DN', 2025, 0),
  ('CN', 2025, 0),
  ('PAY', 2025, 0),
  ('REC', 2025, 0);

-- Then update each type with the count from the previous year
UPDATE document_sequences SET sequence_number = COALESCE((SELECT COUNT(*) FROM invoices WHERE YEAR(created_at) = 2025 AND invoice_number LIKE 'INV-2025-%'), 0) WHERE document_type = 'INV' AND year = 2025;
UPDATE document_sequences SET sequence_number = COALESCE((SELECT COUNT(*) FROM proforma_invoices WHERE YEAR(created_at) = 2025 AND (proforma_number LIKE 'PRO-2025-%' OR proforma_number LIKE 'PF-2025-%' OR proforma_number LIKE 'PROFORMA-2025-%')), 0) WHERE document_type = 'PRO' AND year = 2025;
UPDATE document_sequences SET sequence_number = COALESCE((SELECT COUNT(*) FROM quotations WHERE YEAR(created_at) = 2025 AND quotation_number LIKE 'QT-2025-%'), 0) WHERE document_type = 'QT' AND year = 2025;
UPDATE document_sequences SET sequence_number = COALESCE((SELECT COUNT(*) FROM purchase_orders WHERE YEAR(created_at) = 2025 AND po_number LIKE 'PO-2025-%'), 0) WHERE document_type = 'PO' AND year = 2025;
UPDATE document_sequences SET sequence_number = COALESCE((SELECT COUNT(*) FROM lpos WHERE YEAR(created_at) = 2025 AND lpo_number LIKE 'LPO-2025-%'), 0) WHERE document_type = 'LPO' AND year = 2025;
UPDATE document_sequences SET sequence_number = COALESCE((SELECT COUNT(*) FROM delivery_notes WHERE YEAR(created_at) = 2025 AND delivery_note_number LIKE 'DN-2025-%'), 0) WHERE document_type = 'DN' AND year = 2025;
UPDATE document_sequences SET sequence_number = COALESCE((SELECT COUNT(*) FROM credit_notes WHERE YEAR(created_at) = 2025 AND credit_note_number LIKE 'CN-2025-%'), 0) WHERE document_type = 'CN' AND year = 2025;
UPDATE document_sequences SET sequence_number = COALESCE((SELECT COUNT(*) FROM payments WHERE YEAR(created_at) = 2025 AND payment_number LIKE 'PAY-2025-%'), 0) WHERE document_type = 'PAY' AND year = 2025;
UPDATE document_sequences SET sequence_number = COALESCE((SELECT COUNT(*) FROM receipts WHERE YEAR(created_at) = 2025 AND receipt_number LIKE 'REC-2025-%'), 0) WHERE document_type = 'REC' AND year = 2025;
*/

-- ============================================================================
-- SECTION 2: BULK INITIALIZATION FOR MULTIPLE PAST YEARS
-- ============================================================================
-- Initialize document types for years 2020-2025 (adjust range as needed)

/*
-- Create entries for years 2020-2025 (adjust as needed)
INSERT IGNORE INTO document_sequences (document_type, year, sequence_number)
SELECT 
  types.doc_type,
  years.year_num,
  0
FROM (
  SELECT 'INV' as doc_type UNION SELECT 'PRO' UNION SELECT 'QT' UNION SELECT 'PO' 
  UNION SELECT 'LPO' UNION SELECT 'DN' UNION SELECT 'CN' UNION SELECT 'PAY' UNION SELECT 'REC'
) types
CROSS JOIN (
  SELECT 2020 as year_num UNION SELECT 2021 UNION SELECT 2022 UNION SELECT 2023 
  UNION SELECT 2024 UNION SELECT 2025
) years;

-- Then update counts for each combination (this is a more complex approach)
-- For this, you may need to run individual UPDATE statements for each year/type combination
*/

-- ============================================================================
-- SECTION 3: RESET AND CLEANUP UTILITIES
-- ============================================================================

-- Reset sequence for a specific document type and year
-- WARNING: Only use if you've made an error and need to start over
-- This sets the counter back to 0 - use with caution!

/*
UPDATE document_sequences 
SET sequence_number = 0 
WHERE document_type = 'INV' AND year = YEAR(CURDATE());
*/

-- Drop the entire document_sequences table (nuclear option - for complete reset)
-- WARNING: This removes all sequence tracking. Only use if rebuilding from scratch.

/*
DROP TABLE IF EXISTS document_sequences;
*/

-- ============================================================================
-- SECTION 4: SEQUENCE RECONCILIATION SCRIPTS
-- ============================================================================

-- Find documents with gaps in sequences (numbers that should exist but don't)
-- This helps identify if documents were deleted or renumbered

SELECT 
  'SEQUENCE GAPS - Invoices' as document_type,
  doc.invoice_number,
  doc.created_at,
  CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(doc.invoice_number, '-', -1), 'A', 1) AS UNSIGNED) as extracted_seq
FROM invoices doc
WHERE YEAR(doc.created_at) = YEAR(CURDATE())
  AND doc.invoice_number LIKE CONCAT('INV-', YEAR(CURDATE()), '-%')
ORDER BY extracted_seq;

-- Find documents with duplicate numbers (which shouldn't happen with sequential system)

SELECT 
  'DUPLICATES - Invoices' as check_type,
  invoice_number,
  COUNT(*) as duplicate_count,
  GROUP_CONCAT(id SEPARATOR ', ') as duplicate_ids
FROM invoices 
WHERE invoice_number IS NOT NULL
GROUP BY invoice_number
HAVING COUNT(*) > 1;

-- Find documents that don't match expected format

SELECT 
  'FORMAT MISMATCH - Invoices' as check_type,
  invoice_number,
  COUNT(*) as count
FROM invoices 
WHERE YEAR(created_at) = YEAR(CURDATE())
  AND invoice_number NOT LIKE 'INV-___-____'
  AND invoice_number NOT LIKE 'INV-____-____'
GROUP BY invoice_number;

-- ============================================================================
-- SECTION 5: SEQUENCE RESYNCHRONIZATION
-- ============================================================================

-- If sequences become out of sync, resync them with actual document counts
-- This is a comprehensive resync for all types in current year

/*
-- Step 1: Get current counts
SELECT 
  document_type,
  COUNT(*) as actual_count,
  (SELECT sequence_number FROM document_sequences ds WHERE ds.document_type = 'INV' AND ds.year = YEAR(CURDATE())) as inv_seq,
  (SELECT sequence_number FROM document_sequences ds WHERE ds.document_type = 'PRO' AND ds.year = YEAR(CURDATE())) as pro_seq,
  (SELECT sequence_number FROM document_sequences ds WHERE ds.document_type = 'QT' AND ds.year = YEAR(CURDATE())) as qt_seq,
  (SELECT sequence_number FROM document_sequences ds WHERE ds.document_type = 'PO' AND ds.year = YEAR(CURDATE())) as po_seq,
  (SELECT sequence_number FROM document_sequences ds WHERE ds.document_type = 'LPO' AND ds.year = YEAR(CURDATE())) as lpo_seq,
  (SELECT sequence_number FROM document_sequences ds WHERE ds.document_type = 'DN' AND ds.year = YEAR(CURDATE())) as dn_seq,
  (SELECT sequence_number FROM document_sequences ds WHERE ds.document_type = 'CN' AND ds.year = YEAR(CURDATE())) as cn_seq,
  (SELECT sequence_number FROM document_sequences ds WHERE ds.document_type = 'PAY' AND ds.year = YEAR(CURDATE())) as pay_seq,
  (SELECT sequence_number FROM document_sequences ds WHERE ds.document_type = 'REC' AND ds.year = YEAR(CURDATE())) as rec_seq
FROM (
  SELECT 'INV' as document_type FROM invoices WHERE YEAR(created_at) = YEAR(CURDATE())
  UNION SELECT 'PRO' FROM proforma_invoices WHERE YEAR(created_at) = YEAR(CURDATE())
  UNION SELECT 'QT' FROM quotations WHERE YEAR(created_at) = YEAR(CURDATE())
  UNION SELECT 'PO' FROM purchase_orders WHERE YEAR(created_at) = YEAR(CURDATE())
  UNION SELECT 'LPO' FROM lpos WHERE YEAR(created_at) = YEAR(CURDATE())
  UNION SELECT 'DN' FROM delivery_notes WHERE YEAR(created_at) = YEAR(CURDATE())
  UNION SELECT 'CN' FROM credit_notes WHERE YEAR(created_at) = YEAR(CURDATE())
  UNION SELECT 'PAY' FROM payments WHERE YEAR(created_at) = YEAR(CURDATE())
  UNION SELECT 'REC' FROM receipts WHERE YEAR(created_at) = YEAR(CURDATE())
) doc_types
GROUP BY document_type;

-- Step 2: Run these updates to resync (only if counts don't match)
UPDATE document_sequences SET sequence_number = (SELECT COUNT(*) FROM invoices WHERE YEAR(created_at) = YEAR(CURDATE()) AND invoice_number LIKE CONCAT('INV-', YEAR(CURDATE()), '-%')) WHERE document_type = 'INV' AND year = YEAR(CURDATE());
UPDATE document_sequences SET sequence_number = (SELECT COUNT(*) FROM proforma_invoices WHERE YEAR(created_at) = YEAR(CURDATE()) AND (proforma_number LIKE CONCAT('PRO-', YEAR(CURDATE()), '-%') OR proforma_number LIKE CONCAT('PF-', YEAR(CURDATE()), '-%') OR proforma_number LIKE CONCAT('PROFORMA-', YEAR(CURDATE()), '-%'))) WHERE document_type = 'PRO' AND year = YEAR(CURDATE());
UPDATE document_sequences SET sequence_number = (SELECT COUNT(*) FROM quotations WHERE YEAR(created_at) = YEAR(CURDATE()) AND quotation_number LIKE CONCAT('QT-', YEAR(CURDATE()), '-%')) WHERE document_type = 'QT' AND year = YEAR(CURDATE());
UPDATE document_sequences SET sequence_number = (SELECT COUNT(*) FROM purchase_orders WHERE YEAR(created_at) = YEAR(CURDATE()) AND po_number LIKE CONCAT('PO-', YEAR(CURDATE()), '-%')) WHERE document_type = 'PO' AND year = YEAR(CURDATE());
UPDATE document_sequences SET sequence_number = (SELECT COUNT(*) FROM lpos WHERE YEAR(created_at) = YEAR(CURDATE()) AND lpo_number LIKE CONCAT('LPO-', YEAR(CURDATE()), '-%')) WHERE document_type = 'LPO' AND year = YEAR(CURDATE());
UPDATE document_sequences SET sequence_number = (SELECT COUNT(*) FROM delivery_notes WHERE YEAR(created_at) = YEAR(CURDATE()) AND delivery_note_number LIKE CONCAT('DN-', YEAR(CURDATE()), '-%')) WHERE document_type = 'DN' AND year = YEAR(CURDATE());
UPDATE document_sequences SET sequence_number = (SELECT COUNT(*) FROM credit_notes WHERE YEAR(created_at) = YEAR(CURDATE()) AND credit_note_number LIKE CONCAT('CN-', YEAR(CURDATE()), '-%')) WHERE document_type = 'CN' AND year = YEAR(CURDATE());
UPDATE document_sequences SET sequence_number = (SELECT COUNT(*) FROM payments WHERE YEAR(created_at) = YEAR(CURDATE()) AND payment_number LIKE CONCAT('PAY-', YEAR(CURDATE()), '-%')) WHERE document_type = 'PAY' AND year = YEAR(CURDATE());
UPDATE document_sequences SET sequence_number = (SELECT COUNT(*) FROM receipts WHERE YEAR(created_at) = YEAR(CURDATE()) AND receipt_number LIKE CONCAT('REC-', YEAR(CURDATE()), '-%')) WHERE document_type = 'REC' AND year = YEAR(CURDATE());
*/

-- ============================================================================
-- SECTION 6: DIAGNOSTIC AND ANALYSIS QUERIES
-- ============================================================================

-- Show all sequences currently in the database with status

SELECT 
  document_type,
  year,
  sequence_number,
  CASE 
    WHEN year = YEAR(CURDATE()) THEN 'ACTIVE (Current Year)'
    WHEN year = YEAR(CURDATE()) - 1 THEN 'RECENT (Last Year)'
    ELSE 'ARCHIVE'
  END as status,
  created_at,
  updated_at,
  TIMESTAMPDIFF(DAY, created_at, NOW()) as days_since_creation
FROM document_sequences
ORDER BY year DESC, document_type;

-- Show which document types have the most documents

SELECT 
  'Document Distribution' as metric,
  'INV' as type, COUNT(*) as count FROM invoices WHERE YEAR(created_at) = YEAR(CURDATE())
UNION ALL
SELECT 'Document Distribution' as metric, 'PRO' as type, COUNT(*) as count FROM proforma_invoices WHERE YEAR(created_at) = YEAR(CURDATE())
UNION ALL
SELECT 'Document Distribution' as metric, 'QT' as type, COUNT(*) as count FROM quotations WHERE YEAR(created_at) = YEAR(CURDATE())
UNION ALL
SELECT 'Document Distribution' as metric, 'PO' as type, COUNT(*) as count FROM purchase_orders WHERE YEAR(created_at) = YEAR(CURDATE())
UNION ALL
SELECT 'Document Distribution' as metric, 'LPO' as type, COUNT(*) as count FROM lpos WHERE YEAR(created_at) = YEAR(CURDATE())
UNION ALL
SELECT 'Document Distribution' as metric, 'DN' as type, COUNT(*) as count FROM delivery_notes WHERE YEAR(created_at) = YEAR(CURDATE())
UNION ALL
SELECT 'Document Distribution' as metric, 'CN' as type, COUNT(*) as count FROM credit_notes WHERE YEAR(created_at) = YEAR(CURDATE())
UNION ALL
SELECT 'Document Distribution' as metric, 'PAY' as type, COUNT(*) as count FROM payments WHERE YEAR(created_at) = YEAR(CURDATE())
UNION ALL
SELECT 'Document Distribution' as metric, 'REC' as type, COUNT(*) as count FROM receipts WHERE YEAR(created_at) = YEAR(CURDATE())
ORDER BY count DESC;

-- Show sequence growth over time (when documents were created)

SELECT 
  'Sequence Growth Timeline' as metric,
  YEAR(created_at) as year,
  MONTH(created_at) as month,
  CONCAT(YEAR(created_at), '-', LPAD(MONTH(created_at), 2, '0')) as year_month,
  'INV' as type,
  COUNT(*) as documents_created
FROM invoices
WHERE YEAR(created_at) >= YEAR(CURDATE()) - 2
GROUP BY YEAR(created_at), MONTH(created_at)
ORDER BY year DESC, month DESC;

-- ============================================================================
-- SECTION 7: PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Optimize the document_sequences table

/*
OPTIMIZE TABLE document_sequences;
ANALYZE TABLE document_sequences;
*/

-- Check table statistics

SELECT 
  'Table Statistics' as metric,
  TABLE_NAME,
  ENGINE,
  TABLE_ROWS,
  DATA_LENGTH,
  INDEX_LENGTH,
  DATA_FREE,
  AUTO_INCREMENT,
  CREATED,
  UPDATED
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'document_sequences';

-- ============================================================================
-- SECTION 8: BACKUP AND ARCHIVE UTILITIES
-- ============================================================================

-- Export document_sequences for backup

/*
-- Create a backup table
CREATE TABLE document_sequences_backup_2026_01_26 AS
SELECT * FROM document_sequences;

-- Or export to file (run from command line):
-- mysqldump -u user -p database_name document_sequences > document_sequences_backup.sql
*/

-- Show all backup tables

SELECT 
  'Backup Tables' as metric,
  TABLE_NAME,
  CREATED,
  TABLE_ROWS
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME LIKE 'document_sequences_backup%'
ORDER BY CREATED DESC;

-- ============================================================================
-- SECTION 9: DATA CONSISTENCY CHECKS
-- ============================================================================

-- Check for null or empty document numbers

SELECT 
  'NULL Check - Invoices' as check_name,
  COUNT(*) as null_count
FROM invoices
WHERE invoice_number IS NULL OR invoice_number = '';

UNION ALL

SELECT 
  'NULL Check - Proformas' as check_name,
  COUNT(*) as null_count
FROM proforma_invoices
WHERE proforma_number IS NULL OR proforma_number = '';

UNION ALL

SELECT 
  'NULL Check - Quotations' as check_name,
  COUNT(*) as null_count
FROM quotations
WHERE quotation_number IS NULL OR quotation_number = '';

-- ============================================================================
-- SECTION 10: MIGRATION ROLLBACK AND RECOVERY
-- ============================================================================

-- Restore document_sequences from backup (if you created one)

/*
-- If you created a backup table, restore from it:
TRUNCATE TABLE document_sequences;
INSERT INTO document_sequences SELECT * FROM document_sequences_backup_2026_01_26;

-- Or restore from mysqldump:
-- mysql -u user -p database_name < document_sequences_backup.sql
*/

-- Remove just the current year sequences (to re-initialize)

/*
DELETE FROM document_sequences WHERE year = YEAR(CURDATE());
*/

-- ============================================================================
-- SECTION 11: CUSTOM QUERIES FOR SPECIFIC USE CASES
-- ============================================================================

-- Generate a list of documents with gaps (for audit purposes)

SELECT 
  'Document Audit Report' as report_type,
  i.invoice_number,
  i.created_at,
  c.company_name,
  i.total_amount,
  i.status
FROM invoices i
LEFT JOIN companies c ON i.company_id = c.id
WHERE YEAR(i.created_at) = YEAR(CURDATE())
  AND i.invoice_number LIKE CONCAT('INV-', YEAR(CURDATE()), '-%')
ORDER BY i.created_at DESC;

-- Show sequence progression for monitoring

SELECT 
  'Sequence Progression' as metric,
  document_type,
  year,
  sequence_number as current_sequence,
  DATE(updated_at) as last_updated,
  TIME(updated_at) as last_update_time,
  CASE 
    WHEN HOUR(NOW()) - HOUR(updated_at) < 1 THEN 'ACTIVE NOW'
    WHEN DATE(updated_at) = DATE(NOW()) THEN 'TODAY'
    WHEN DATE(updated_at) >= DATE(NOW()) - INTERVAL 7 DAY THEN 'THIS WEEK'
    ELSE 'EARLIER'
  END as activity_status
FROM document_sequences
WHERE year = YEAR(CURDATE())
ORDER BY updated_at DESC;

-- ============================================================================
-- SECTION 12: QUICK REFERENCE COMMANDS
-- ============================================================================

-- Check if migration has been applied
-- SELECT COUNT(*) as table_exists FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'document_sequences';

-- Get current year's sequences
-- SELECT * FROM document_sequences WHERE year = YEAR(CURDATE()) ORDER BY document_type;

-- Get next sequence number for a type
-- SELECT sequence_number FROM document_sequences WHERE document_type = 'INV' AND year = YEAR(CURDATE());

-- See all documents created today
-- SELECT * FROM invoices WHERE DATE(created_at) = DATE(NOW()) ORDER BY created_at DESC;

-- Count documents by type this year
-- SELECT 'INV', COUNT(*) FROM invoices WHERE YEAR(created_at) = YEAR(CURDATE()) UNION ALL SELECT 'PRO', COUNT(*) FROM proforma_invoices WHERE YEAR(created_at) = YEAR(CURDATE());

-- ============================================================================
-- END OF ADDITIONAL SQL UTILITIES
-- ============================================================================
-- These scripts are provided as helpers and references. Most are commented out
-- to prevent accidental execution. Uncomment the sections you need and modify
-- as appropriate for your specific situation.
-- 
-- CAUTION:
-- - Always backup before running UPDATE or DELETE queries
-- - Test scripts in a development environment first
-- - Verify results before executing on production
-- ============================================================================
