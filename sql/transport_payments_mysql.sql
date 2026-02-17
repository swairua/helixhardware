-- ============================================
-- TRANSPORT PAYMENTS TABLE (MySQL)
-- ============================================

CREATE TABLE IF NOT EXISTS transport_payments (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NOT NULL,
  trip_id CHAR(36) NOT NULL,
  payment_amount DECIMAL(15, 2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURDATE(),
  payment_method VARCHAR(50) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'check', 'bank_transfer', 'mobile_money', 'card', 'other')),
  reference_number VARCHAR(100),
  notes LONGTEXT,
  recorded_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (trip_id) REFERENCES transport_finance(id) ON DELETE CASCADE,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  
  KEY idx_company_id (company_id),
  KEY idx_trip_id (trip_id),
  KEY idx_payment_date (payment_date),
  KEY idx_payment_method (payment_method)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- VIEW: Transport Payments Summary
-- ============================================

CREATE OR REPLACE VIEW transport_payments_summary AS
SELECT
  tf.id as trip_id,
  tf.company_id,
  tf.selling_price,
  tf.profit_loss,
  tf.payment_status,
  COALESCE(SUM(tp.payment_amount), 0) as total_paid,
  (tf.selling_price - COALESCE(SUM(tp.payment_amount), 0)) as balance_due,
  COUNT(tp.id) as payment_count,
  MAX(tp.payment_date) as last_payment_date
FROM transport_finance tf
LEFT JOIN transport_payments tp ON tf.id = tp.trip_id
GROUP BY tf.id, tf.company_id, tf.selling_price, tf.profit_loss, tf.payment_status;

-- ============================================
-- TRIGGER: Auto-update transport_finance payment_status
-- ============================================

DELIMITER $$

CREATE TRIGGER update_trip_payment_status_after_insert
AFTER INSERT ON transport_payments
FOR EACH ROW
BEGIN
  DECLARE trip_amount DECIMAL(15,2);
  DECLARE total_paid DECIMAL(15,2);
  DECLARE new_status VARCHAR(50);
  
  -- Get trip selling price
  SELECT selling_price INTO trip_amount FROM transport_finance WHERE id = NEW.trip_id;
  
  -- Get total paid for this trip
  SELECT COALESCE(SUM(payment_amount), 0) INTO total_paid FROM transport_payments WHERE trip_id = NEW.trip_id;
  
  -- Determine new payment status
  IF total_paid >= trip_amount THEN
    SET new_status = 'paid';
  ELSEIF total_paid > 0 THEN
    SET new_status = 'pending';
  ELSE
    SET new_status = 'unpaid';
  END IF;
  
  -- Update trip payment status
  UPDATE transport_finance SET payment_status = new_status WHERE id = NEW.trip_id;
END$$

CREATE TRIGGER update_trip_payment_status_after_update
AFTER UPDATE ON transport_payments
FOR EACH ROW
BEGIN
  DECLARE trip_amount DECIMAL(15,2);
  DECLARE total_paid DECIMAL(15,2);
  DECLARE new_status VARCHAR(50);
  
  -- Get trip selling price
  SELECT selling_price INTO trip_amount FROM transport_finance WHERE id = NEW.trip_id;
  
  -- Get total paid for this trip
  SELECT COALESCE(SUM(payment_amount), 0) INTO total_paid FROM transport_payments WHERE trip_id = NEW.trip_id;
  
  -- Determine new payment status
  IF total_paid >= trip_amount THEN
    SET new_status = 'paid';
  ELSEIF total_paid > 0 THEN
    SET new_status = 'pending';
  ELSE
    SET new_status = 'unpaid';
  END IF;
  
  -- Update trip payment status
  UPDATE transport_finance SET payment_status = new_status WHERE id = NEW.trip_id;
END$$

CREATE TRIGGER update_trip_payment_status_after_delete
AFTER DELETE ON transport_payments
FOR EACH ROW
BEGIN
  DECLARE trip_amount DECIMAL(15,2);
  DECLARE total_paid DECIMAL(15,2);
  DECLARE new_status VARCHAR(50);
  
  -- Get trip selling price
  SELECT selling_price INTO trip_amount FROM transport_finance WHERE id = OLD.trip_id;
  
  -- Get total paid for this trip
  SELECT COALESCE(SUM(payment_amount), 0) INTO total_paid FROM transport_payments WHERE trip_id = OLD.trip_id;
  
  -- Determine new payment status
  IF total_paid >= trip_amount THEN
    SET new_status = 'paid';
  ELSEIF total_paid > 0 THEN
    SET new_status = 'pending';
  ELSE
    SET new_status = 'unpaid';
  END IF;
  
  -- Update trip payment status
  UPDATE transport_finance SET payment_status = new_status WHERE id = OLD.trip_id;
END$$

DELIMITER ;
