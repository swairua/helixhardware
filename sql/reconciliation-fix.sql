-- ===================================================================
-- MEDPLUS Database Reconciliation & Data Repair Script
-- Fixes orphaned payments, broken allocations, and invoice balances
-- ===================================================================

-- Start transaction for safety
START TRANSACTION;

-- ===================================================================
-- STEP 1: DIAGNOSE - Find all data issues
-- ===================================================================

SELECT '=== DIAGNOSIS START ===' as status;

-- Check orphaned payments (no invoice_id but have allocations)
SELECT 'ISSUE 1: Orphaned Payments' as issue_type,
       p.id as payment_id,
       p.amount,
       p.payment_date,
       p.invoice_id as current_invoice_id,
       GROUP_CONCAT(DISTINCT pa.invoice_id) as allocated_invoices
FROM payments p
LEFT JOIN payment_allocations pa ON p.id = pa.payment_id
WHERE p.invoice_id IS NULL 
  AND pa.payment_id IS NOT NULL
GROUP BY p.id;

-- Check payments with mismatched invoice_id vs allocations
SELECT 'ISSUE 2: Mismatched Invoice IDs' as issue_type,
       p.id as payment_id,
       p.invoice_id as payments_table_invoice_id,
       GROUP_CONCAT(DISTINCT pa.invoice_id) as allocation_invoice_ids,
       p.amount
FROM payments p
INNER JOIN payment_allocations pa ON p.id = pa.payment_id
WHERE p.invoice_id != pa.invoice_id
GROUP BY p.id;

-- Check invoices with incorrect paid_amount (don't match allocations)
SELECT 'ISSUE 3: Incorrect Invoice Balance' as issue_type,
       i.id as invoice_id,
       i.invoice_number,
       i.total_amount,
       i.paid_amount as recorded_paid_amount,
       COALESCE(SUM(pa.amount), 0) as actual_allocated_amount,
       (i.total_amount - COALESCE(SUM(pa.amount), 0)) as correct_balance_due,
       i.balance_due as recorded_balance_due,
       i.status as current_status
FROM invoices i
LEFT JOIN payment_allocations pa ON i.id = pa.invoice_id
GROUP BY i.id
HAVING ABS(i.paid_amount - COALESCE(SUM(pa.amount), 0)) > 0.01
   OR ABS(i.balance_due - (i.total_amount - COALESCE(SUM(pa.amount), 0))) > 0.01;

SELECT '=== DIAGNOSIS END ===' as status;

-- ===================================================================
-- STEP 2: FIX - Link orphaned payments to their correct invoices
-- ===================================================================

SELECT '=== APPLYING FIXES ===' as status;

-- Fix 1: Update payments table with correct invoice_id from allocations
-- For payments that have NULL invoice_id but have allocations
UPDATE payments p
INNER JOIN (
    SELECT pa.payment_id, MIN(pa.invoice_id) as correct_invoice_id
    FROM payment_allocations pa
    GROUP BY pa.payment_id
) pa_summary ON p.id = pa_summary.payment_id
SET p.invoice_id = pa_summary.correct_invoice_id,
    p.updated_at = NOW()
WHERE p.invoice_id IS NULL;

SELECT CONCAT('Fixed: ', ROW_COUNT(), ' orphaned payments linked to invoices') as fix_status;

-- Fix 2: Update payments with mismatched invoice_id
-- Use the invoice_id from payment_allocations (the source of truth)
UPDATE payments p
INNER JOIN (
    SELECT pa.payment_id, MIN(pa.invoice_id) as correct_invoice_id
    FROM payment_allocations pa
    GROUP BY pa.payment_id
) pa_summary ON p.id = pa_summary.payment_id
SET p.invoice_id = pa_summary.correct_invoice_id,
    p.updated_at = NOW()
WHERE p.invoice_id != pa_summary.correct_invoice_id;

SELECT CONCAT('Fixed: ', ROW_COUNT(), ' payments with corrected invoice_id') as fix_status;

-- ===================================================================
-- STEP 3: RECALCULATE - Update all invoice balances based on actual allocations
-- ===================================================================

-- Calculate correct paid amounts and balances for all invoices with allocations
UPDATE invoices i
INNER JOIN (
    SELECT pa.invoice_id,
           SUM(pa.amount) as total_allocated,
           CASE 
               WHEN SUM(pa.amount) >= i2.total_amount THEN 'paid'
               WHEN SUM(pa.amount) > 0 THEN 'partial'
               ELSE 'draft'
           END as correct_status
    FROM payment_allocations pa
    INNER JOIN invoices i2 ON pa.invoice_id = i2.id
    GROUP BY pa.invoice_id
) allocations ON i.id = allocations.invoice_id
SET i.paid_amount = allocations.total_allocated,
    i.balance_due = GREATEST(0, i.total_amount - allocations.total_allocated),
    i.status = allocations.correct_status,
    i.updated_at = NOW()
WHERE ABS(i.paid_amount - allocations.total_allocated) > 0.01
   OR ABS(i.balance_due - GREATEST(0, i.total_amount - allocations.total_allocated)) > 0.01
   OR i.status != allocations.correct_status;

SELECT CONCAT('Fixed: ', ROW_COUNT(), ' invoices with recalculated balances') as fix_status;

-- ===================================================================
-- STEP 4: CLEANUP - Remove duplicate or invalid allocations (optional)
-- ===================================================================

-- Identify duplicate allocations (same payment+invoice combination)
SELECT 'Checking for duplicates...' as status;

SELECT 'DUPLICATE CHECK: Same payment allocated multiple times to same invoice' as check_type,
       payment_id,
       invoice_id,
       COUNT(*) as occurrence_count,
       SUM(amount) as total_allocated
FROM payment_allocations
GROUP BY payment_id, invoice_id
HAVING COUNT(*) > 1;

-- Keep only the first allocation, delete duplicates
-- This is commented out - review before uncommenting
-- DELETE FROM payment_allocations
-- WHERE id NOT IN (
--     SELECT min_id FROM (
--         SELECT MIN(id) as min_id
--         FROM payment_allocations
--         GROUP BY payment_id, invoice_id
--     ) temp
-- );

-- ===================================================================
-- STEP 5: VERIFY - Check that all data is now consistent
-- ===================================================================

SELECT '=== VERIFICATION START ===' as status;

-- Verify no orphaned payments
SELECT 'VERIFICATION 1: Orphaned Payments' as check_name,
       COUNT(*) as count
FROM payments p
LEFT JOIN payment_allocations pa ON p.id = pa.payment_id
WHERE p.invoice_id IS NULL 
  AND pa.payment_id IS NOT NULL;

-- Verify no mismatched invoice_ids
SELECT 'VERIFICATION 2: Mismatched Invoice IDs' as check_name,
       COUNT(*) as count
FROM payments p
INNER JOIN payment_allocations pa ON p.id = pa.payment_id
WHERE p.invoice_id != pa.invoice_id;

-- Verify invoice balances are correct
SELECT 'VERIFICATION 3: Incorrect Invoice Balances' as check_name,
       COUNT(*) as count
FROM (
    SELECT i.id,
           COALESCE(SUM(pa.amount), 0) as actual_paid,
           i.paid_amount as recorded_paid,
           ABS(i.paid_amount - COALESCE(SUM(pa.amount), 0)) as difference
    FROM invoices i
    LEFT JOIN payment_allocations pa ON i.id = pa.invoice_id
    GROUP BY i.id
    HAVING difference > 0.01
) issues;

-- Show all invoices with their payment status
SELECT 'VERIFICATION 4: Final Invoice Status' as check_name,
       i.id,
       i.invoice_number,
       i.total_amount,
       i.paid_amount,
       i.balance_due,
       i.status,
       COALESCE(SUM(pa.amount), 0) as actual_allocation_sum,
       COUNT(pa.id) as allocation_count
FROM invoices i
LEFT JOIN payment_allocations pa ON i.id = pa.invoice_id
GROUP BY i.id
ORDER BY i.id;

SELECT '=== VERIFICATION END ===' as status;

-- ===================================================================
-- FINAL: Commit or Rollback
-- ===================================================================

-- Review all changes above before committing
-- If everything looks good, run:
COMMIT;

-- If you want to discard changes, run instead:
-- ROLLBACK;

SELECT 'Reconciliation Complete!' as final_status;
