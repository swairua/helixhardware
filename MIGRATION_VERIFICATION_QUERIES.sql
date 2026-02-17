-- ============================================================================
-- MIGRATION VERIFICATION AND ANALYSIS QUERIES
-- ============================================================================
-- Use these queries to verify the migration was successful and to analyze
-- the current state of document numbering in your system
-- ============================================================================

-- ============================================================================
-- 1. BASIC VERIFICATION - Check all document types are initialized
-- ============================================================================
-- This should show all 9 document types for the current year

SELECT 
  '1. BASIC VERIFICATION' as step,
  document_type,
  year,
  sequence_number,
  CONCAT(document_type, '-', year, '-', LPAD(sequence_number + 1, 4, '0')) as next_number_to_generate,
  created_at,
  updated_at
FROM document_sequences 
WHERE year = YEAR(CURDATE())
ORDER BY document_type;

-- ============================================================================
-- 2. DOCUMENT COUNT ANALYSIS - Verify sequence numbers match existing docs
-- ============================================================================
-- This shows the count of existing documents per type and compares with 
-- sequence_number to ensure they match

SELECT 
  '2. COUNT ANALYSIS' as step,
  ds.document_type,
  ds.sequence_number as initialized_sequence,
  COALESCE(doc_counts.document_count, 0) as existing_document_count,
  CASE 
    WHEN ds.sequence_number = COALESCE(doc_counts.document_count, 0) THEN '✓ MATCH'
    ELSE '⚠ MISMATCH'
  END as status
FROM document_sequences ds
LEFT JOIN (
  -- Combined count of all document types for current year
  SELECT 'INV' as doc_type, COUNT(*) as document_count FROM invoices WHERE YEAR(created_at) = YEAR(CURDATE())
  UNION ALL
  SELECT 'PRO' as doc_type, COUNT(*) as document_count FROM proforma_invoices WHERE YEAR(created_at) = YEAR(CURDATE())
  UNION ALL
  SELECT 'QT' as doc_type, COUNT(*) as document_count FROM quotations WHERE YEAR(created_at) = YEAR(CURDATE())
  UNION ALL
  SELECT 'PO' as doc_type, COUNT(*) as document_count FROM purchase_orders WHERE YEAR(created_at) = YEAR(CURDATE())
  UNION ALL
  SELECT 'LPO' as doc_type, COUNT(*) as document_count FROM lpos WHERE YEAR(created_at) = YEAR(CURDATE())
  UNION ALL
  SELECT 'DN' as doc_type, COUNT(*) as document_count FROM delivery_notes WHERE YEAR(created_at) = YEAR(CURDATE())
  UNION ALL
  SELECT 'CN' as doc_type, COUNT(*) as document_count FROM credit_notes WHERE YEAR(created_at) = YEAR(CURDATE())
  UNION ALL
  SELECT 'PAY' as doc_type, COUNT(*) as document_count FROM payments WHERE YEAR(created_at) = YEAR(CURDATE())
  UNION ALL
  SELECT 'REC' as doc_type, COUNT(*) as document_count FROM receipts WHERE YEAR(created_at) = YEAR(CURDATE())
) doc_counts ON ds.document_type = doc_counts.doc_type
WHERE ds.year = YEAR(CURDATE())
ORDER BY ds.document_type;

-- ============================================================================
-- 3. SEQUENCE TABLE STRUCTURE - Verify table schema
-- ============================================================================
-- Check the table structure matches expectations

SELECT 
  '3. TABLE STRUCTURE' as step,
  COLUMN_NAME,
  COLUMN_TYPE,
  IS_NULLABLE,
  COLUMN_KEY,
  COLUMN_DEFAULT,
  EXTRA
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'document_sequences'
ORDER BY ORDINAL_POSITION;

-- ============================================================================
-- 4. INDEXES VERIFICATION - Verify proper indexes exist
-- ============================================================================
-- Check that UNIQUE key and indexes are in place

SELECT 
  '4. INDEXES' as step,
  INDEX_NAME,
  COLUMN_NAME,
  SEQ_IN_INDEX,
  NON_UNIQUE
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'document_sequences'
ORDER BY INDEX_NAME, SEQ_IN_INDEX;

-- ============================================================================
-- 5. LEGACY FORMAT ANALYSIS - Identify documents with old number formats
-- ============================================================================
-- This helps understand the mix of old and new formats in your system

SELECT 
  '5. LEGACY FORMAT ANALYSIS' as step,
  'Invoices' as document_type,
  CASE 
    WHEN invoice_number LIKE 'INV-%' THEN 'NEW FORMAT (Sequential)'
    WHEN invoice_number LIKE '%-%-%' THEN 'LEGACY FORMAT'
    ELSE 'UNKNOWN FORMAT'
  END as format_type,
  COUNT(*) as count
FROM invoices 
WHERE YEAR(created_at) = YEAR(CURDATE())
GROUP BY format_type
UNION ALL
SELECT 
  '5. LEGACY FORMAT ANALYSIS' as step,
  'Proformas' as document_type,
  CASE 
    WHEN proforma_number LIKE 'PRO-%' THEN 'NEW FORMAT (Sequential)'
    WHEN proforma_number LIKE 'PF-%' THEN 'LEGACY FORMAT (PF prefix)'
    WHEN proforma_number LIKE 'PROFORMA-%' THEN 'LEGACY FORMAT (PROFORMA prefix)'
    ELSE 'UNKNOWN FORMAT'
  END as format_type,
  COUNT(*) as count
FROM proforma_invoices 
WHERE YEAR(created_at) = YEAR(CURDATE())
GROUP BY format_type
UNION ALL
SELECT 
  '5. LEGACY FORMAT ANALYSIS' as step,
  'Quotations' as document_type,
  CASE 
    WHEN quotation_number LIKE 'QT-%' THEN 'NEW FORMAT (Sequential)'
    ELSE 'LEGACY FORMAT'
  END as format_type,
  COUNT(*) as count
FROM quotations 
WHERE YEAR(created_at) = YEAR(CURDATE())
GROUP BY format_type;

-- ============================================================================
-- 6. DETAILED DOCUMENT LISTING - See actual document numbers by type
-- ============================================================================
-- Sample of actual document numbers in the system

-- Invoices sample
SELECT 
  '6. SAMPLE DOCUMENTS - Invoices' as document_type,
  invoice_number,
  created_at,
  status
FROM invoices 
WHERE YEAR(created_at) = YEAR(CURDATE())
LIMIT 10;

-- Proformas sample
SELECT 
  '6. SAMPLE DOCUMENTS - Proformas' as document_type,
  proforma_number,
  created_at,
  status
FROM proforma_invoices 
WHERE YEAR(created_at) = YEAR(CURDATE())
LIMIT 10;

-- ============================================================================
-- 7. MULTI-YEAR INITIALIZATION CHECK - For reference/optional setup
-- ============================================================================
-- Shows all initialized years in the system

SELECT 
  '7. MULTI-YEAR SUMMARY' as step,
  document_type,
  COUNT(*) as years_initialized,
  MIN(year) as oldest_year,
  MAX(year) as newest_year,
  GROUP_CONCAT(year ORDER BY year SEPARATOR ', ') as years_list
FROM document_sequences 
GROUP BY document_type
ORDER BY document_type;

-- ============================================================================
-- 8. SEQUENCE INTEGRITY CHECK - Verify no gaps in sequences
-- ============================================================================
-- This helps identify if there are any issues with sequence generation

SELECT 
  '8. SEQUENCE INTEGRITY' as step,
  ds.document_type,
  ds.year,
  ds.sequence_number,
  MIN(extracted_seq.seq_num) as min_existing_seq,
  MAX(extracted_seq.seq_num) as max_existing_seq,
  COUNT(DISTINCT extracted_seq.seq_num) as unique_existing_seqs
FROM document_sequences ds
LEFT JOIN (
  -- Extract sequence numbers from all document types
  SELECT 'INV' as doc_type, CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(invoice_number, '-', -1), 'A', 1) AS UNSIGNED) as seq_num FROM invoices
  UNION ALL
  SELECT 'PRO' as doc_type, CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(proforma_number, '-', -1), 'A', 1) AS UNSIGNED) as seq_num FROM proforma_invoices WHERE proforma_number LIKE 'PRO-%'
  UNION ALL
  SELECT 'QT' as doc_type, CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(quotation_number, '-', -1), 'A', 1) AS UNSIGNED) as seq_num FROM quotations
  UNION ALL
  SELECT 'PO' as doc_type, CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(po_number, '-', -1), 'A', 1) AS UNSIGNED) as seq_num FROM purchase_orders
  UNION ALL
  SELECT 'REC' as doc_type, CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(receipt_number, '-', -1), 'A', 1) AS UNSIGNED) as seq_num FROM receipts
) extracted_seq ON ds.document_type = extracted_seq.doc_type
WHERE ds.year = YEAR(CURDATE())
GROUP BY ds.document_type, ds.year;

-- ============================================================================
-- 9. API ENDPOINT TEST - Test the API with a mock request
-- ============================================================================
-- This is a conceptual test; actual API testing should be done via curl/HTTP

-- To test the API, run this curl command (replace with your actual domain):
-- curl -X POST https://yourdomain.com/api.php \
--   -H "Content-Type: application/json" \
--   -d '{
--     "action": "get_next_document_number",
--     "type": "INV",
--     "year": 2026
--   }'

-- Expected response (if migration successful):
-- {
--   "success": true,
--   "number": "INV-2026-0006",
--   "type": "INV",
--   "year": 2026,
--   "sequence": 6
-- }

-- ============================================================================
-- 10. SUMMARY REPORT - Overall migration status
-- ============================================================================
-- Quick summary showing overall health of the migration

SELECT 
  '10. SUMMARY REPORT' as step,
  (SELECT COUNT(DISTINCT document_type) FROM document_sequences WHERE year = YEAR(CURDATE())) as total_document_types_initialized,
  (SELECT YEAR(CURDATE())) as current_year,
  (SELECT COUNT(*) FROM document_sequences WHERE year = YEAR(CURDATE())) as sequences_count,
  (SELECT MAX(updated_at) FROM document_sequences) as last_update,
  CASE 
    WHEN (SELECT COUNT(DISTINCT document_type) FROM document_sequences WHERE year = YEAR(CURDATE())) = 9 THEN '✓ ALL 9 TYPES INITIALIZED'
    ELSE '⚠ INCOMPLETE - Check initialization'
  END as migration_status;

-- ============================================================================
-- ADDITIONAL DIAGNOSTIC QUERIES
-- ============================================================================

-- Check if document_sequences table exists
-- SELECT IF(
--   EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'document_sequences'),
--   '✓ Table exists',
--   '✗ Table missing'
-- ) as table_status;

-- Count total documents across all types for current year
-- SELECT 
--   'TOTAL DOCUMENTS' as type,
--   YEAR(CURDATE()) as year,
--   (
--     (SELECT COUNT(*) FROM invoices WHERE YEAR(created_at) = YEAR(CURDATE())) +
--     (SELECT COUNT(*) FROM proforma_invoices WHERE YEAR(created_at) = YEAR(CURDATE())) +
--     (SELECT COUNT(*) FROM quotations WHERE YEAR(created_at) = YEAR(CURDATE())) +
--     (SELECT COUNT(*) FROM purchase_orders WHERE YEAR(created_at) = YEAR(CURDATE())) +
--     (SELECT COUNT(*) FROM lpos WHERE YEAR(created_at) = YEAR(CURDATE())) +
--     (SELECT COUNT(*) FROM delivery_notes WHERE YEAR(created_at) = YEAR(CURDATE())) +
--     (SELECT COUNT(*) FROM credit_notes WHERE YEAR(created_at) = YEAR(CURDATE())) +
--     (SELECT COUNT(*) FROM payments WHERE YEAR(created_at) = YEAR(CURDATE())) +
--     (SELECT COUNT(*) FROM receipts WHERE YEAR(created_at) = YEAR(CURDATE()))
--   ) as total_documents;

-- ============================================================================
-- NOTES AND NEXT STEPS
-- ============================================================================
-- 
-- After running these verification queries:
--
-- 1. BASIC VERIFICATION (Query 1):
--    - Should show 9 rows (one for each document type)
--    - All should be for the current year
--    - status column should show '✓ MATCH' for all
--
-- 2. COUNT ANALYSIS (Query 2):
--    - Compares initialized_sequence with existing_document_count
--    - If they don't match, the migration may need to be re-run
--    - A mismatch indicates documents were added after migration started
--
-- 3. TABLE STRUCTURE (Query 3):
--    - Verifies all required columns exist
--    - Checks data types are correct
--
-- 4. INDEXES (Query 4):
--    - Confirms UNIQUE key on (document_type, year) exists
--    - Confirms INDEX on document_type exists
--
-- 5. LEGACY FORMAT (Query 5):
--    - Shows mix of old and new number formats
--    - Helps understand your document history
--    - New documents should use 'NEW FORMAT (Sequential)'
--
-- 6. SAMPLE DOCUMENTS (Query 6):
--    - Shows actual document numbers in your system
--    - Verify format and patterns
--
-- 7. MULTI-YEAR SUMMARY (Query 7):
--    - Shows all years with initialized sequences
--    - Helps if you have multi-year documents
--
-- 8. SEQUENCE INTEGRITY (Query 8):
--    - Advanced check for sequence consistency
--    - Identifies potential gaps or issues
--
-- 9. API TEST (Query 9):
--    - Instructions for testing the API endpoint
--    - Run the curl command to verify API works
--
-- 10. SUMMARY REPORT (Query 10):
--    - Quick health check of the entire migration
--    - Shows migration_status as '✓' or '⚠'
--
-- ============================================================================
