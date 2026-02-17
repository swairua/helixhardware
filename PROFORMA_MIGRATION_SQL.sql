-- ============================================================================
-- Proforma Invoice Number Generation - Migration SQL
-- ============================================================================
-- This migration initializes the document_sequences table for sequential
-- proforma number generation with format: PRO-YYYY-NNNN
-- Run this on your database to set up automatic sequential numbering
-- ============================================================================

-- Step 1: Create document_sequences table if not exists
-- This table tracks sequential numbers by document type and year
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

-- Step 2: Initialize document_sequences for proforma if not already exists
-- This ensures an entry exists for the current year
INSERT IGNORE INTO document_sequences (document_type, year, sequence_number)
VALUES ('PRO', YEAR(CURDATE()), 0);

-- Step 3: Set sequence number based on existing proforma count for current year
-- This prevents number conflicts with existing proformas
UPDATE document_sequences 
SET sequence_number = (
  SELECT COUNT(*) FROM proforma_invoices 
  WHERE (
    proforma_number LIKE CONCAT('PRO-', YEAR(CURDATE()), '-%')
    OR proforma_number LIKE CONCAT('PF-', YEAR(CURDATE()), '-%')
    OR proforma_number LIKE CONCAT('PROFORMA-', YEAR(CURDATE()), '-%')
  )
)
WHERE document_type = 'PRO' AND year = YEAR(CURDATE());

-- Step 4: Verify the setup was successful
SELECT 'Setup Complete' as status, * FROM document_sequences WHERE document_type = 'PRO';

-- Step 5: (Optional) View existing proforma numbers by format
-- Uncomment to analyze your existing proforma numbers
-- SELECT 
--   proforma_number,
--   CASE 
--     WHEN proforma_number LIKE 'PRO-%' THEN 'NEW FORMAT (Sequential)'
--     WHEN proforma_number LIKE 'PF-%' THEN 'OLD FORMAT (PF prefix)'
--     WHEN proforma_number LIKE 'PROFORMA-%' THEN 'OLD FORMAT (PROFORMA prefix)'
--     ELSE 'UNKNOWN FORMAT'
--   END as format_type,
--   COUNT(*) as count
-- FROM proforma_invoices
-- WHERE proforma_number IS NOT NULL
-- GROUP BY format_type
-- ORDER BY count DESC;

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. Old proforma invoices (with PF-, PROFORMA-, etc. prefixes) keep their 
--    original numbers and will NOT be modified
-- 2. Only NEW proformas created after this migration use PRO-YYYY-NNNN format
-- 3. The sequence resets to 0001 each calendar year automatically
-- 4. Each document type has its own sequence counter
-- 5. The system is thread-safe and uses database transactions for atomicity
-- ============================================================================
