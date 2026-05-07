-- ============================================
-- QUICK FIX: Transport Finance Payment System
-- ============================================
-- Run this script to fix critical issues with payment status synchronization
-- and data integrity. This must be run before the data cleanup script.
-- ============================================

-- Add audit trail table for payment status changes
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

CREATE INDEX IF NOT EXISTS idx_payment_status_changes_trip_id ON payment_status_changes(trip_id);
CREATE INDEX IF NOT EXISTS idx_payment_status_changes_company_id ON payment_status_changes(company_id);
CREATE INDEX IF NOT EXISTS idx_payment_status_changes_changed_at ON payment_status_changes(changed_at);

-- Function: Auto-sync payment_status when payments are modified
CREATE OR REPLACE FUNCTION sync_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  v_total_paid DECIMAL(15, 2);
  v_selling_price DECIMAL(15, 2);
  v_new_status VARCHAR(50);
  v_old_status VARCHAR(50);
BEGIN
  SELECT selling_price, payment_status INTO v_selling_price, v_old_status
  FROM transport_finance
  WHERE id = NEW.trip_id;

  SELECT COALESCE(SUM(payment_amount), 0)
  INTO v_total_paid
  FROM transport_payments
  WHERE trip_id = NEW.trip_id;

  IF v_total_paid >= v_selling_price THEN
    v_new_status := 'paid';
  ELSIF v_total_paid > 0 THEN
    v_new_status := 'pending';
  ELSE
    v_new_status := 'unpaid';
  END IF;

  IF v_new_status != v_old_status THEN
    UPDATE transport_finance
    SET payment_status = v_new_status, updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.trip_id;

    INSERT INTO payment_status_changes (
      trip_id, company_id, old_status, new_status, total_paid, selling_price, changed_by
    ) VALUES (
      NEW.trip_id, NEW.company_id, v_old_status, v_new_status, v_total_paid, v_selling_price, auth.uid()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Sync payment_status when payments are deleted
CREATE OR REPLACE FUNCTION sync_payment_status_on_delete()
RETURNS TRIGGER AS $$
DECLARE
  v_total_paid DECIMAL(15, 2);
  v_selling_price DECIMAL(15, 2);
  v_new_status VARCHAR(50);
  v_old_status VARCHAR(50);
BEGIN
  SELECT selling_price, payment_status INTO v_selling_price, v_old_status
  FROM transport_finance
  WHERE id = OLD.trip_id;

  SELECT COALESCE(SUM(payment_amount), 0)
  INTO v_total_paid
  FROM transport_payments
  WHERE trip_id = OLD.trip_id;

  IF v_total_paid >= v_selling_price THEN
    v_new_status := 'paid';
  ELSIF v_total_paid > 0 THEN
    v_new_status := 'pending';
  ELSE
    v_new_status := 'unpaid';
  END IF;

  IF v_new_status != v_old_status THEN
    UPDATE transport_finance
    SET payment_status = v_new_status, updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.trip_id;

    INSERT INTO payment_status_changes (
      trip_id, company_id, old_status, new_status, total_paid, selling_price, changed_by
    ) VALUES (
      OLD.trip_id, OLD.company_id, v_old_status, v_new_status, v_total_paid, v_selling_price, auth.uid()
    );
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Function: Prevent manual edits to payment_status
CREATE OR REPLACE FUNCTION validate_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  v_total_paid DECIMAL(15, 2);
BEGIN
  SELECT COALESCE(SUM(payment_amount), 0)
  INTO v_total_paid
  FROM transport_payments
  WHERE trip_id = NEW.id;

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

-- Triggers on transport_payments: Auto-sync when payments change
DROP TRIGGER IF EXISTS transport_payments_after_insert ON transport_payments;
CREATE TRIGGER transport_payments_after_insert
AFTER INSERT ON transport_payments
FOR EACH ROW EXECUTE FUNCTION sync_payment_status();

DROP TRIGGER IF EXISTS transport_payments_after_update ON transport_payments;
CREATE TRIGGER transport_payments_after_update
AFTER UPDATE ON transport_payments
FOR EACH ROW EXECUTE FUNCTION sync_payment_status();

DROP TRIGGER IF EXISTS transport_payments_after_delete ON transport_payments;
CREATE TRIGGER transport_payments_after_delete
AFTER DELETE ON transport_payments
FOR EACH ROW EXECUTE FUNCTION sync_payment_status_on_delete();

-- Trigger on transport_finance: Enforce derived field
DROP TRIGGER IF EXISTS transport_finance_enforce_payment_status ON transport_finance;
CREATE TRIGGER transport_finance_enforce_payment_status
BEFORE UPDATE ON transport_finance
FOR EACH ROW EXECUTE FUNCTION validate_payment_status();

-- Audit trigger for payments
DROP TRIGGER IF EXISTS transport_payments_audit_trigger ON transport_payments;
CREATE TRIGGER transport_payments_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON transport_payments
FOR EACH ROW EXECUTE FUNCTION log_transport_changes();

-- ============================================
-- Immediate Data Reconciliation
-- ============================================

-- Fix all payment statuses based on actual payments
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

-- Flag negative profit records for review
UPDATE transport_finance
SET payment_status = 'pending'
WHERE profit_loss < 0 AND payment_status = 'paid';

-- ============================================
-- Verification
-- ============================================

-- Check data integrity
SELECT
  'Data Integrity Status' as check_type,
  CASE
    WHEN COUNT(*) = 0 THEN 'PASS: All records have correct payment_status'
    ELSE 'FAIL: ' || COUNT(*)::text || ' records have mismatched payment_status'
  END as result
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

-- Summary of fixes applied
SELECT
  'Transport Finance Payment System' as system,
  'Fixed' as status,
  'Automatic payment status synchronization enabled' as detail,
  CURRENT_TIMESTAMP as fixed_at;
