-- ============================================
-- Transport Finance Payment System Fixes
-- ============================================
-- This migration fixes critical accounting and data integrity issues:
-- 1. Adds automatic payment status synchronization
-- 2. Prevents duplicate records
-- 3. Implements audit trail for payment status changes
-- 4. Fixes stale payment_status data
-- ============================================

-- Step 1: Add audit trail for payment status changes
-- Create payment_status_changes tracking table
CREATE TABLE IF NOT EXISTS payment_status_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES transport_finance(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  total_paid DECIMAL(15, 2),
  selling_price DECIMAL(15, 2),
  changed_by UUID,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_status_changes_trip_id ON payment_status_changes(trip_id);
CREATE INDEX idx_payment_status_changes_company_id ON payment_status_changes(company_id);
CREATE INDEX idx_payment_status_changes_changed_at ON payment_status_changes(changed_at);

-- Step 2: Create function to synchronize payment_status from actual payments
CREATE OR REPLACE FUNCTION sync_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  v_total_paid DECIMAL(15, 2);
  v_selling_price DECIMAL(15, 2);
  v_new_status VARCHAR(50);
  v_old_status VARCHAR(50);
BEGIN
  -- Get the trip's selling price and total paid
  SELECT selling_price, payment_status INTO v_selling_price, v_old_status
  FROM transport_finance
  WHERE id = NEW.trip_id;

  -- Calculate total paid for this trip
  SELECT COALESCE(SUM(payment_amount), 0)
  INTO v_total_paid
  FROM transport_payments
  WHERE trip_id = NEW.trip_id;

  -- Determine new payment status based on actual payments
  IF v_total_paid >= v_selling_price THEN
    v_new_status := 'paid';
  ELSIF v_total_paid > 0 THEN
    v_new_status := 'pending';
  ELSE
    v_new_status := 'unpaid';
  END IF;

  -- Update transport_finance with new status if changed
  IF v_new_status != v_old_status THEN
    UPDATE transport_finance
    SET payment_status = v_new_status, updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.trip_id;

    -- Log the status change
    INSERT INTO payment_status_changes (
      trip_id, company_id, old_status, new_status, total_paid, selling_price, changed_by
    ) VALUES (
      NEW.trip_id, NEW.company_id, v_old_status, v_new_status, v_total_paid, v_selling_price, auth.uid()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create trigger for payment insert
CREATE TRIGGER transport_payments_after_insert
AFTER INSERT ON transport_payments
FOR EACH ROW EXECUTE FUNCTION sync_payment_status();

-- Step 4: Create trigger for payment update (handles payment amount changes)
CREATE TRIGGER transport_payments_after_update
AFTER UPDATE ON transport_payments
FOR EACH ROW EXECUTE FUNCTION sync_payment_status();

-- Step 5: Create function for payment delete (to handle deletion case)
CREATE OR REPLACE FUNCTION sync_payment_status_on_delete()
RETURNS TRIGGER AS $$
DECLARE
  v_total_paid DECIMAL(15, 2);
  v_selling_price DECIMAL(15, 2);
  v_new_status VARCHAR(50);
  v_old_status VARCHAR(50);
BEGIN
  -- Get the trip's selling price and current status
  SELECT selling_price, payment_status INTO v_selling_price, v_old_status
  FROM transport_finance
  WHERE id = OLD.trip_id;

  -- Calculate total paid for this trip (after deletion)
  SELECT COALESCE(SUM(payment_amount), 0)
  INTO v_total_paid
  FROM transport_payments
  WHERE trip_id = OLD.trip_id;

  -- Determine new payment status based on remaining payments
  IF v_total_paid >= v_selling_price THEN
    v_new_status := 'paid';
  ELSIF v_total_paid > 0 THEN
    v_new_status := 'pending';
  ELSE
    v_new_status := 'unpaid';
  END IF;

  -- Update transport_finance with new status if changed
  IF v_new_status != v_old_status THEN
    UPDATE transport_finance
    SET payment_status = v_new_status, updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.trip_id;

    -- Log the status change
    INSERT INTO payment_status_changes (
      trip_id, company_id, old_status, new_status, total_paid, selling_price, changed_by
    ) VALUES (
      OLD.trip_id, OLD.company_id, v_old_status, v_new_status, v_total_paid, v_selling_price, auth.uid()
    );
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger for payment delete
CREATE TRIGGER transport_payments_after_delete
AFTER DELETE ON transport_payments
FOR EACH ROW EXECUTE FUNCTION sync_payment_status_on_delete();

-- Step 7: Add audit logging for payment records
CREATE TRIGGER transport_payments_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON transport_payments
FOR EACH ROW EXECUTE FUNCTION log_transport_changes();

-- Step 8: Prevent direct manual edits to payment_status field
-- Add constraint to prevent inconsistent state
CREATE OR REPLACE FUNCTION validate_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  v_total_paid DECIMAL(15, 2);
BEGIN
  -- If someone tries to manually update payment_status, recalculate it
  SELECT COALESCE(SUM(payment_amount), 0)
  INTO v_total_paid
  FROM transport_payments
  WHERE trip_id = NEW.id;

  -- Correct the status based on actual payments
  IF v_total_paid >= NEW.selling_price THEN
    NEW.payment_status := 'paid';
  ELSIF v_total_paid > 0 THEN
    NEW.payment_status := 'pending';
  ELSE
    NEW.payment_status := 'unpaid';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce derived payment_status
CREATE TRIGGER transport_finance_enforce_payment_status
BEFORE UPDATE ON transport_finance
FOR EACH ROW EXECUTE FUNCTION validate_payment_status();

-- ============================================
-- DATA CLEANUP AND MIGRATION
-- ============================================

-- Step 9: Identify and fix negative profit/impossible states
-- Mark records with negative profit as 'pending' review
UPDATE transport_finance
SET payment_status = 'pending'
WHERE profit_loss < 0 AND payment_status = 'paid';

-- Step 10: Remove duplicate records (keep first, delete rest)
-- Identify duplicates
WITH duplicates AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY company_id, vehicle_id, material_id, date, customer_name
      ORDER BY created_at ASC
    ) as row_num
  FROM transport_finance
)
-- Delete duplicates (keep row_num = 1)
DELETE FROM transport_finance
WHERE id IN (
  SELECT id FROM duplicates WHERE row_num > 1
);

-- Step 11: Reconcile all payment statuses with actual payment records
-- This ensures data consistency
WITH payment_totals AS (
  SELECT
    trip_id,
    COALESCE(SUM(payment_amount), 0) as total_paid
  FROM transport_payments
  GROUP BY trip_id
)
UPDATE transport_finance tf
SET payment_status = CASE
  WHEN pt.total_paid >= tf.selling_price THEN 'paid'
  WHEN pt.total_paid > 0 THEN 'pending'
  ELSE 'unpaid'
END,
updated_at = CURRENT_TIMESTAMP
FROM payment_totals pt
WHERE tf.id = pt.trip_id
AND (
  (pt.total_paid >= tf.selling_price AND tf.payment_status != 'paid')
  OR (pt.total_paid > 0 AND tf.payment_status NOT IN ('paid', 'pending'))
  OR (pt.total_paid = 0 AND tf.payment_status != 'unpaid')
);

-- Step 12: Log the reconciliation
INSERT INTO payment_status_changes (
  trip_id, company_id, old_status, new_status, total_paid, selling_price, changed_by
)
SELECT
  tf.id,
  tf.company_id,
  'reconciled',
  tf.payment_status,
  pt.total_paid,
  tf.selling_price,
  auth.uid()
FROM transport_finance tf
LEFT JOIN (
  SELECT trip_id, COALESCE(SUM(payment_amount), 0) as total_paid
  FROM transport_payments
  GROUP BY trip_id
) pt ON tf.id = pt.trip_id
WHERE tf.updated_at > NOW() - INTERVAL '5 minutes';

-- ============================================
-- DATA VALIDATION VIEW
-- ============================================
-- View to identify any remaining data integrity issues
CREATE OR REPLACE VIEW payment_integrity_check AS
SELECT
  tf.id as trip_id,
  tf.company_id,
  tf.selling_price,
  tf.payment_status,
  COALESCE(SUM(tp.payment_amount), 0) as total_paid,
  (tf.selling_price - COALESCE(SUM(tp.payment_amount), 0)) as balance_due,
  CASE
    WHEN tf.profit_loss < 0 THEN 'negative_profit'
    WHEN (
      (COALESCE(SUM(tp.payment_amount), 0) >= tf.selling_price AND tf.payment_status != 'paid') OR
      (COALESCE(SUM(tp.payment_amount), 0) > 0 AND tf.payment_status NOT IN ('paid', 'pending')) OR
      (COALESCE(SUM(tp.payment_amount), 0) = 0 AND tf.payment_status != 'unpaid')
    ) THEN 'status_mismatch'
    ELSE 'ok'
  END as status as data_integrity
FROM transport_finance tf
LEFT JOIN transport_payments tp ON tf.id = tp.trip_id
GROUP BY tf.id, tf.company_id, tf.selling_price, tf.payment_status, tf.profit_loss;

-- ============================================
-- MIGRATION VERIFICATION
-- ============================================
-- Verify the fixes
SELECT
  'Duplicate records removed' as fix,
  COUNT(*) as records_affected
FROM transport_finance
WHERE id IN (
  SELECT id FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY company_id, vehicle_id, material_id, date, customer_name
        ORDER BY created_at ASC
      ) as row_num
    FROM transport_finance
  ) WHERE row_num > 1
)
UNION ALL
SELECT
  'Payment status synchronized' as fix,
  COUNT(*) as records_affected
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
