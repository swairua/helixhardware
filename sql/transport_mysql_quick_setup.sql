-- MySQL Transport Module - Quick Setup
-- Copy and paste this into MySQL Workbench or command line
-- Works with MySQL 5.7+

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ============================================
-- DRIVERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS drivers (
  id CHAR(36) PRIMARY KEY,
  company_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  license_number VARCHAR(50),
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_drivers_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  INDEX idx_drivers_company_id (company_id),
  INDEX idx_drivers_status (status),
  INDEX idx_drivers_name (name(50))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- VEHICLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS vehicles (
  id CHAR(36) PRIMARY KEY,
  company_id CHAR(36) NOT NULL,
  vehicle_number VARCHAR(50) NOT NULL,
  vehicle_type VARCHAR(100),
  capacity INT,
  status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_vehicles_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  UNIQUE KEY uk_vehicles_company_number (company_id, vehicle_number),
  INDEX idx_vehicles_company_id (company_id),
  INDEX idx_vehicles_status (status),
  INDEX idx_vehicles_vehicle_number (vehicle_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- MATERIALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS materials (
  id CHAR(36) PRIMARY KEY,
  company_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  unit VARCHAR(50),
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_materials_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  UNIQUE KEY uk_materials_company_name (company_id, name(100)),
  INDEX idx_materials_company_id (company_id),
  INDEX idx_materials_status (status),
  INDEX idx_materials_name (name(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TRANSPORT FINANCE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS transport_finance (
  id CHAR(36) PRIMARY KEY,
  company_id CHAR(36) NOT NULL,
  vehicle_id CHAR(36) NOT NULL,
  material_id CHAR(36) NOT NULL,
  buying_price DECIMAL(15, 2) DEFAULT 0,
  fuel_cost DECIMAL(15, 2) DEFAULT 0,
  driver_fees DECIMAL(15, 2) DEFAULT 0,
  other_expenses DECIMAL(15, 2) DEFAULT 0,
  selling_price DECIMAL(15, 2) DEFAULT 0,
  profit_loss DECIMAL(15, 2) DEFAULT 0,
  payment_status ENUM('paid', 'unpaid', 'pending') DEFAULT 'unpaid',
  customer_name VARCHAR(255),
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_transport_finance_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_transport_finance_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT,
  CONSTRAINT fk_transport_finance_material FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE RESTRICT,
  INDEX idx_transport_finance_company_id (company_id),
  INDEX idx_transport_finance_vehicle_id (vehicle_id),
  INDEX idx_transport_finance_material_id (material_id),
  INDEX idx_transport_finance_payment_status (payment_status),
  INDEX idx_transport_finance_date (date),
  INDEX idx_transport_finance_customer_name (customer_name(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- AUTO-CALCULATE PROFIT/LOSS TRIGGERS
-- ============================================
DELIMITER $$

CREATE TRIGGER transport_finance_calculate_profit_insert
BEFORE INSERT ON transport_finance
FOR EACH ROW
BEGIN
  SET NEW.profit_loss = NEW.selling_price - (NEW.buying_price + NEW.fuel_cost + NEW.driver_fees + NEW.other_expenses);
END$$

CREATE TRIGGER transport_finance_calculate_profit_update
BEFORE UPDATE ON transport_finance
FOR EACH ROW
BEGIN
  SET NEW.profit_loss = NEW.selling_price - (NEW.buying_price + NEW.fuel_cost + NEW.driver_fees + NEW.other_expenses);
END$$

DELIMITER ;

-- ============================================
-- VIEWS FOR ANALYTICS
-- ============================================

CREATE OR REPLACE VIEW transport_finance_summary AS
SELECT
  tf.id,
  tf.company_id,
  tf.vehicle_id,
  v.vehicle_number,
  v.vehicle_type,
  tf.material_id,
  m.name as material_name,
  tf.buying_price,
  tf.fuel_cost,
  tf.driver_fees,
  tf.other_expenses,
  (tf.buying_price + tf.fuel_cost + tf.driver_fees + tf.other_expenses) as total_expenses,
  tf.selling_price,
  tf.profit_loss,
  tf.payment_status,
  tf.customer_name,
  tf.date,
  tf.created_at
FROM transport_finance tf
LEFT JOIN vehicles v ON tf.vehicle_id = v.id
LEFT JOIN materials m ON tf.material_id = m.id;

CREATE OR REPLACE VIEW daily_transport_summary AS
SELECT
  company_id,
  date,
  COUNT(*) as transaction_count,
  SUM(buying_price + fuel_cost + driver_fees + other_expenses) as total_expenses,
  SUM(selling_price) as total_revenue,
  SUM(profit_loss) as total_profit_loss,
  SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) as paid_count,
  SUM(CASE WHEN payment_status = 'unpaid' THEN 1 ELSE 0 END) as unpaid_count,
  SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END) as pending_count
FROM transport_finance
GROUP BY company_id, date;

CREATE OR REPLACE VIEW vehicle_utilization AS
SELECT
  v.id,
  v.company_id,
  v.vehicle_number,
  v.vehicle_type,
  v.status,
  COUNT(tf.id) as total_trips,
  SUM(CASE WHEN tf.profit_loss > 0 THEN 1 ELSE 0 END) as profitable_trips,
  SUM(CASE WHEN tf.profit_loss <= 0 THEN 1 ELSE 0 END) as loss_trips,
  SUM(tf.profit_loss) as total_profit_loss,
  ROUND(AVG(tf.profit_loss), 2) as avg_profit_per_trip,
  MAX(tf.date) as last_used
FROM vehicles v
LEFT JOIN transport_finance tf ON v.id = tf.vehicle_id
GROUP BY v.id, v.company_id, v.vehicle_number, v.vehicle_type, v.status;

CREATE OR REPLACE VIEW material_profitability AS
SELECT
  m.id,
  m.company_id,
  m.name as material_name,
  m.unit,
  COUNT(tf.id) as total_shipments,
  SUM(tf.buying_price) as total_buying_price,
  SUM(tf.selling_price) as total_selling_price,
  SUM(tf.profit_loss) as total_profit_loss,
  ROUND(AVG(tf.profit_loss), 2) as avg_profit_per_shipment,
  ROUND((SUM(tf.profit_loss) / NULLIF(SUM(tf.selling_price), 0) * 100), 2) as profit_margin_percent
FROM materials m
LEFT JOIN transport_finance tf ON m.id = tf.material_id
GROUP BY m.id, m.company_id, m.name, m.unit;

-- ============================================
-- SUCCESS!
-- ============================================
-- All tables, triggers, and views created successfully!
-- Ready to use the Transport module.
