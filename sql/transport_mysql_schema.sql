-- MySQL Transport Module Schema
-- Complete SQL for Transport Management System
-- Compatible with MySQL 5.7+

-- ============================================
-- DATABASE CONFIGURATION
-- ============================================

-- Ensure UTF-8 support
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ============================================
-- DRIVERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS drivers (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID Primary Key',
  company_id CHAR(36) NOT NULL COMMENT 'Company Association',
  name VARCHAR(255) NOT NULL COMMENT 'Driver Full Name',
  phone VARCHAR(20) COMMENT 'Phone Number',
  license_number VARCHAR(50) COMMENT 'Driver License Number',
  status ENUM('active', 'inactive') DEFAULT 'active' COMMENT 'Driver Status',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation Time',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last Update Time',
  
  -- Foreign Key
  CONSTRAINT fk_drivers_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_drivers_company_id (company_id),
  INDEX idx_drivers_status (status),
  INDEX idx_drivers_name (name(50))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Driver Information';

-- ============================================
-- VEHICLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS vehicles (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID Primary Key',
  company_id CHAR(36) NOT NULL COMMENT 'Company Association',
  vehicle_number VARCHAR(50) NOT NULL COMMENT 'Vehicle Registration Number',
  vehicle_type VARCHAR(100) COMMENT 'Type of Vehicle (Truck, Van, Motorcycle)',
  capacity INT COMMENT 'Vehicle Capacity in kg',
  status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active' COMMENT 'Vehicle Status',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation Time',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last Update Time',
  
  -- Foreign Key
  CONSTRAINT fk_vehicles_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Unique Constraint
  UNIQUE KEY uk_vehicles_company_number (company_id, vehicle_number),
  
  -- Indexes
  INDEX idx_vehicles_company_id (company_id),
  INDEX idx_vehicles_status (status),
  INDEX idx_vehicles_vehicle_number (vehicle_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Vehicle Fleet Management';

-- ============================================
-- MATERIALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS materials (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID Primary Key',
  company_id CHAR(36) NOT NULL COMMENT 'Company Association',
  name VARCHAR(255) NOT NULL COMMENT 'Material Name',
  description TEXT COMMENT 'Material Description',
  unit VARCHAR(50) COMMENT 'Unit of Measurement (kg, tons, liters, pieces)',
  status ENUM('active', 'inactive') DEFAULT 'active' COMMENT 'Material Status',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation Time',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last Update Time',
  
  -- Foreign Key
  CONSTRAINT fk_materials_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Unique Constraint
  UNIQUE KEY uk_materials_company_name (company_id, name(100)),
  
  -- Indexes
  INDEX idx_materials_company_id (company_id),
  INDEX idx_materials_status (status),
  INDEX idx_materials_name (name(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Materials/Cargo Types';

-- ============================================
-- TRANSPORT FINANCE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS transport_finance (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID Primary Key',
  company_id CHAR(36) NOT NULL COMMENT 'Company Association',
  vehicle_id CHAR(36) NOT NULL COMMENT 'Vehicle Reference',
  material_id CHAR(36) NOT NULL COMMENT 'Material Reference',
  buying_price DECIMAL(15, 2) DEFAULT 0 COMMENT 'Buying Price of Goods',
  fuel_cost DECIMAL(15, 2) DEFAULT 0 COMMENT 'Fuel Expenses',
  driver_fees DECIMAL(15, 2) DEFAULT 0 COMMENT 'Driver Compensation',
  other_expenses DECIMAL(15, 2) DEFAULT 0 COMMENT 'Other Costs',
  selling_price DECIMAL(15, 2) DEFAULT 0 COMMENT 'Selling Price/Revenue',
  profit_loss DECIMAL(15, 2) DEFAULT 0 COMMENT 'Auto-Calculated Profit/Loss',
  payment_status ENUM('paid', 'unpaid', 'pending') DEFAULT 'unpaid' COMMENT 'Payment Status',
  customer_name VARCHAR(255) COMMENT 'Customer Name',
  date DATE NOT NULL COMMENT 'Transaction Date',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation Time',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last Update Time',
  
  -- Foreign Keys
  CONSTRAINT fk_transport_finance_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_transport_finance_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT,
  CONSTRAINT fk_transport_finance_material FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE RESTRICT,
  
  -- Indexes
  INDEX idx_transport_finance_company_id (company_id),
  INDEX idx_transport_finance_vehicle_id (vehicle_id),
  INDEX idx_transport_finance_material_id (material_id),
  INDEX idx_transport_finance_payment_status (payment_status),
  INDEX idx_transport_finance_date (date),
  INDEX idx_transport_finance_customer_name (customer_name(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Transport Finance Records';

-- ============================================
-- TRIGGER: Auto-Calculate Profit/Loss
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

-- View: Transport Finance with Vehicle and Material Details
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
  tf.created_at,
  tf.updated_at
FROM transport_finance tf
LEFT JOIN vehicles v ON tf.vehicle_id = v.id
LEFT JOIN materials m ON tf.material_id = m.id;

-- View: Daily Transport Summary
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

-- View: Vehicle Utilization Metrics
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

-- View: Material Profitability Analysis
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
-- STORED PROCEDURES
-- ============================================

-- Procedure: Get Monthly Profit Report
DELIMITER $$

CREATE PROCEDURE sp_monthly_profit_report(IN p_company_id CHAR(36))
BEGIN
  SELECT 
    DATE_FORMAT(date, '%Y-%m') as month,
    COUNT(*) as transactions,
    SUM(selling_price) as total_revenue,
    SUM(buying_price + fuel_cost + driver_fees + other_expenses) as total_expenses,
    SUM(profit_loss) as total_profit,
    ROUND((SUM(profit_loss) / SUM(selling_price) * 100), 2) as profit_margin_pct
  FROM transport_finance
  WHERE company_id = p_company_id
  GROUP BY DATE_FORMAT(date, '%Y-%m')
  ORDER BY month DESC;
END$$

-- Procedure: Get Top Profitable Routes
DELIMITER $$

CREATE PROCEDURE sp_top_profitable_routes(IN p_company_id CHAR(36), IN p_limit INT)
BEGIN
  SELECT 
    m.name as material,
    v.vehicle_number,
    COUNT(*) as trips,
    ROUND(AVG(tf.profit_loss), 2) as avg_profit_per_trip,
    SUM(tf.profit_loss) as total_profit
  FROM transport_finance tf
  JOIN materials m ON tf.material_id = m.id
  JOIN vehicles v ON tf.vehicle_id = v.id
  WHERE tf.company_id = p_company_id
  GROUP BY m.name, v.vehicle_number
  ORDER BY total_profit DESC
  LIMIT p_limit;
END$$

-- Procedure: Get Outstanding Payments
DELIMITER $$

CREATE PROCEDURE sp_outstanding_payments(IN p_company_id CHAR(36))
BEGIN
  SELECT 
    DATE(date) as transaction_date,
    COUNT(*) as unpaid_count,
    SUM(selling_price) as unpaid_amount,
    customer_name
  FROM transport_finance
  WHERE company_id = p_company_id
  AND payment_status IN ('unpaid', 'pending')
  GROUP BY DATE(date), customer_name
  ORDER BY transaction_date DESC;
END$$

DELIMITER ;

-- ============================================
-- SAMPLE DATA (Optional - Uncomment to use)
-- ============================================

-- Sample Drivers
-- INSERT INTO drivers (id, company_id, name, phone, license_number, status) VALUES
-- (UUID(), '550e8400-e29b-41d4-a716-446655440000', 'John Kipchoge', '+254700123456', 'DL001', 'active'),
-- (UUID(), '550e8400-e29b-41d4-a716-446655440000', 'Mary Kamau', '+254700123457', 'DL002', 'active');

-- Sample Vehicles
-- INSERT INTO vehicles (id, company_id, vehicle_number, vehicle_type, capacity, status) VALUES
-- (UUID(), '550e8400-e29b-41d4-a716-446655440000', 'KCE 2838', 'Truck', 5000, 'active'),
-- (UUID(), '550e8400-e29b-41d4-a716-446655440000', 'KCL 873K', 'Van', 2000, 'active');

-- Sample Materials
-- INSERT INTO materials (id, company_id, name, description, unit, status) VALUES
-- (UUID(), '550e8400-e29b-41d4-a716-446655440000', 'Rockland', 'Building materials', 'kg', 'active'),
-- (UUID(), '550e8400-e29b-41d4-a716-446655440000', 'Transport', 'General cargo', 'kg', 'active');

-- ============================================
-- DATABASE STATISTICS
-- ============================================
-- Run these queries to monitor your database:

-- Check Table Sizes:
-- SELECT 
--   TABLE_NAME, 
--   ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size in MB'
-- FROM information_schema.TABLES
-- WHERE TABLE_SCHEMA = DATABASE()
-- AND TABLE_NAME IN ('drivers', 'vehicles', 'materials', 'transport_finance');

-- Check Record Counts:
-- SELECT 
--   'drivers' AS table_name, COUNT(*) AS record_count FROM drivers
-- UNION ALL
-- SELECT 'vehicles', COUNT(*) FROM vehicles
-- UNION ALL
-- SELECT 'materials', COUNT(*) FROM materials
-- UNION ALL
-- SELECT 'transport_finance', COUNT(*) FROM transport_finance;

-- ============================================
-- USEFUL QUERIES FOR REPORTING
-- ============================================

-- Daily Profit
-- SELECT SUM(profit_loss) as daily_profit
-- FROM transport_finance
-- WHERE company_id = 'YOUR_COMPANY_ID'
-- AND DATE(date) = CURDATE();

-- Vehicle Performance
-- SELECT v.vehicle_number, SUM(tf.profit_loss) as total_profit
-- FROM transport_finance tf
-- JOIN vehicles v ON tf.vehicle_id = v.id
-- WHERE tf.company_id = 'YOUR_COMPANY_ID'
-- GROUP BY v.vehicle_number
-- ORDER BY total_profit DESC;

-- Material Profitability
-- SELECT m.name, 
--   ROUND((SUM(tf.profit_loss) / SUM(tf.selling_price) * 100), 2) as profit_margin_pct
-- FROM transport_finance tf
-- JOIN materials m ON tf.material_id = m.id
-- WHERE tf.company_id = 'YOUR_COMPANY_ID'
-- GROUP BY m.name
-- ORDER BY profit_margin_pct DESC;

-- ============================================
-- SETUP COMPLETE
-- ============================================
-- If you see this, all tables and functions were created successfully!
-- You can now use the Transport module in the application.
