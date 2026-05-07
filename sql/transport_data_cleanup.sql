-- ============================================
-- Transport Finance Data Cleanup
-- ============================================
-- This script identifies and fixes data integrity issues:
-- 1. Removes duplicate records
-- 2. Reconciles payment statuses
-- 3. Identifies records with anomalies
-- ============================================

-- ============================================
-- PHASE 1: ANALYSIS - Identify Issues
-- ============================================

-- Query 1: Find duplicate records (same trip on same date)
SELECT
  company_id,
  vehicle_id,
  material_id,
  customer_name,
  date,
  COUNT(*) as duplicate_count,
  ARRAY_AGG(id) as record_ids
FROM transport_finance
GROUP BY company_id, vehicle_id, material_id, customer_name, date
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Query 2: Find negative profit records
SELECT
  id,
  company_id,
  customer_name,
  selling_price,
  (buying_price + fuel_cost + driver_fees + other_expenses) as total_costs,
  profit_loss,
  payment_status
FROM transport_finance
WHERE profit_loss < 0
ORDER BY profit_loss ASC;

-- Query 3: Find payment status mismatches
WITH payment_summary AS (
  SELECT
    trip_id,
    COALESCE(SUM(payment_amount), 0) as total_paid
  FROM transport_payments
  GROUP BY trip_id
)
SELECT
  tf.id,
  tf.company_id,
  tf.selling_price,
  ps.total_paid,
  tf.payment_status,
  CASE
    WHEN ps.total_paid >= tf.selling_price THEN 'paid'
    WHEN ps.total_paid > 0 THEN 'pending'
    ELSE 'unpaid'
  END as correct_status,
  CASE
    WHEN ps.total_paid >= tf.selling_price AND tf.payment_status != 'paid' THEN 'MISMATCH'
    WHEN ps.total_paid > 0 AND tf.payment_status NOT IN ('paid', 'pending') THEN 'MISMATCH'
    WHEN ps.total_paid = 0 AND tf.payment_status != 'unpaid' THEN 'MISMATCH'
    ELSE 'OK'
  END as status
FROM transport_finance tf
LEFT JOIN payment_summary ps ON tf.id = ps.trip_id
WHERE (
  (ps.total_paid >= tf.selling_price AND tf.payment_status != 'paid') OR
  (ps.total_paid > 0 AND tf.payment_status NOT IN ('paid', 'pending')) OR
  (COALESCE(ps.total_paid, 0) = 0 AND tf.payment_status != 'unpaid')
)
ORDER BY tf.company_id, tf.date DESC;

-- Query 4: Find orphaned payments (payments for non-existent trips)
SELECT
  id,
  trip_id,
  company_id,
  payment_amount,
  payment_date
FROM transport_payments
WHERE trip_id NOT IN (SELECT id FROM transport_finance);

-- ============================================
-- PHASE 2: CLEANUP - Fix Issues
-- ============================================

-- Step 1: Delete orphaned payments first (safest)
DELETE FROM transport_payments
WHERE trip_id NOT IN (SELECT id FROM transport_finance);

-- Step 2: Remove duplicate records (keep the earliest one by creation date)
DELETE FROM transport_finance
WHERE id NOT IN (
  SELECT id FROM (
    SELECT
      DISTINCT ON (company_id, vehicle_id, material_id, customer_name, date)
      id
    FROM transport_finance
    ORDER BY company_id, vehicle_id, material_id, customer_name, date, created_at ASC
  ) AS first_records
);

-- Step 3: Reconcile payment statuses
WITH payment_summary AS (
  SELECT
    trip_id,
    COALESCE(SUM(payment_amount), 0) as total_paid
  FROM transport_payments
  GROUP BY trip_id
)
UPDATE transport_finance tf
SET
  payment_status = CASE
    WHEN ps.total_paid >= tf.selling_price THEN 'paid'
    WHEN ps.total_paid > 0 THEN 'pending'
    ELSE 'unpaid'
  END,
  updated_at = CURRENT_TIMESTAMP
FROM payment_summary ps
WHERE tf.id = ps.trip_id
AND (
  (ps.total_paid >= tf.selling_price AND tf.payment_status != 'paid') OR
  (ps.total_paid > 0 AND tf.payment_status NOT IN ('paid', 'pending')) OR
  (ps.total_paid = 0 AND tf.payment_status != 'unpaid')
);

-- Step 4: Flag negative profit records for review
-- These should be investigated manually to understand root cause
UPDATE transport_finance
SET payment_status = 'pending'
WHERE profit_loss < 0 AND payment_status = 'paid';

-- Log a note for negative profit records
INSERT INTO payment_status_changes (
  trip_id,
  company_id,
  old_status,
  new_status,
  total_paid,
  selling_price,
  changed_by
)
SELECT
  id,
  company_id,
  'paid',
  'pending',
  0,
  selling_price,
  auth.uid()
FROM transport_finance
WHERE profit_loss < 0;

-- ============================================
-- PHASE 3: VERIFICATION - Check Results
-- ============================================

-- Query 1: Verify no duplicates remain
SELECT
  'Duplicates Check' as check_name,
  COUNT(*) as count,
  CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as result
FROM transport_finance tf1
WHERE EXISTS (
  SELECT 1 FROM transport_finance tf2
  WHERE tf1.company_id = tf2.company_id
  AND tf1.vehicle_id = tf2.vehicle_id
  AND tf1.material_id = tf2.material_id
  AND tf1.customer_name = tf2.customer_name
  AND tf1.date = tf2.date
  AND tf1.id != tf2.id
);

-- Query 2: Verify payment status consistency
SELECT
  'Payment Status Consistency' as check_name,
  COUNT(*) as records_with_mismatches
FROM transport_finance tf
WHERE payment_status NOT IN (
  SELECT CASE
    WHEN COALESCE(SUM(payment_amount), 0) >= tf.selling_price THEN 'paid'
    WHEN COALESCE(SUM(payment_amount), 0) > 0 THEN 'pending'
    ELSE 'unpaid'
  END
  FROM transport_payments tp
  WHERE tp.trip_id = tf.id
);

-- Query 3: Summary of data quality
SELECT
  company_id,
  COUNT(*) as total_records,
  SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) as paid,
  SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END) as pending,
  SUM(CASE WHEN payment_status = 'unpaid' THEN 1 ELSE 0 END) as unpaid,
  SUM(CASE WHEN profit_loss < 0 THEN 1 ELSE 0 END) as negative_profit,
  COUNT(DISTINCT (company_id, vehicle_id, material_id, customer_name, date)) as unique_trips
FROM transport_finance
GROUP BY company_id
ORDER BY total_records DESC;

-- ============================================
-- PHASE 4: GENERATE AUDIT REPORT
-- ============================================

-- Create summary of changes made
CREATE TEMP TABLE cleanup_summary AS
SELECT
  'Duplicates Removed' as action,
  (SELECT COUNT(*) FROM (
    SELECT 1 FROM transport_finance tf1
    WHERE EXISTS (
      SELECT 1 FROM transport_finance tf2
      WHERE tf1.company_id = tf2.company_id
      AND tf1.vehicle_id = tf2.vehicle_id
      AND tf1.material_id = tf2.material_id
      AND tf1.customer_name = tf2.customer_name
      AND tf1.date = tf2.date
      AND tf1.id != tf2.id
    )
  ) AS t)::text as count
UNION ALL
SELECT
  'Payment Status Reconciled' as action,
  (SELECT COUNT(*) FROM payment_status_changes WHERE changed_at > NOW() - INTERVAL '1 hour')::text as count;

SELECT * FROM cleanup_summary;

-- ============================================
-- FINAL STATUS CHECK
-- ============================================

-- Overall data integrity report
SELECT
  'Total Records' as metric,
  COUNT(*)::text as value
FROM transport_finance
UNION ALL
SELECT
  'Records with Negative Profit' as metric,
  COUNT(*)::text as value
FROM transport_finance
WHERE profit_loss < 0
UNION ALL
SELECT
  'Paid Transactions' as metric,
  COUNT(*)::text as value
FROM transport_finance
WHERE payment_status = 'paid'
UNION ALL
SELECT
  'Pending Transactions' as metric,
  COUNT(*)::text as value
FROM transport_finance
WHERE payment_status = 'pending'
UNION ALL
SELECT
  'Unpaid Transactions' as metric,
  COUNT(*)::text as value
FROM transport_finance
WHERE payment_status = 'unpaid'
UNION ALL
SELECT
  'Total Payment Records' as metric,
  COUNT(*)::text as value
FROM transport_payments
UNION ALL
SELECT
  'Payment Status Audit Entries' as metric,
  COUNT(*)::text as value
FROM payment_status_changes;
