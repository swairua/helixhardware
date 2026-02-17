-- Transport Module Schema
-- This file contains all SQL needed to set up the transport management system

-- ============================================
-- DRIVERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  license_number VARCHAR(50),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT drivers_company_id_idx UNIQUE (id, company_id)
);

-- Create indexes for drivers
CREATE INDEX idx_drivers_company_id ON drivers(company_id);
CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_drivers_name ON drivers(name);

-- ============================================
-- VEHICLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  vehicle_number VARCHAR(50) NOT NULL,
  vehicle_type VARCHAR(100),
  capacity INTEGER, -- Capacity in kg
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT vehicles_company_vehicle_number_unique UNIQUE (company_id, vehicle_number)
);

-- Create indexes for vehicles
CREATE INDEX idx_vehicles_company_id ON vehicles(company_id);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_vehicle_number ON vehicles(vehicle_number);

-- ============================================
-- MATERIALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  unit VARCHAR(50), -- kg, tons, liters, pieces, etc.
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT materials_company_name_unique UNIQUE (company_id, name)
);

-- Create indexes for materials
CREATE INDEX idx_materials_company_id ON materials(company_id);
CREATE INDEX idx_materials_status ON materials(status);
CREATE INDEX idx_materials_name ON materials(name);

-- ============================================
-- TRANSPORT FINANCE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS transport_finance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
  buying_price DECIMAL(15, 2) DEFAULT 0,
  fuel_cost DECIMAL(15, 2) DEFAULT 0,
  driver_fees DECIMAL(15, 2) DEFAULT 0,
  other_expenses DECIMAL(15, 2) DEFAULT 0,
  selling_price DECIMAL(15, 2) DEFAULT 0,
  profit_loss DECIMAL(15, 2) DEFAULT 0, -- Calculated field
  payment_status VARCHAR(50) DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'unpaid', 'pending')),
  customer_name VARCHAR(255),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for transport_finance
CREATE INDEX idx_transport_finance_company_id ON transport_finance(company_id);
CREATE INDEX idx_transport_finance_vehicle_id ON transport_finance(vehicle_id);
CREATE INDEX idx_transport_finance_material_id ON transport_finance(material_id);
CREATE INDEX idx_transport_finance_payment_status ON transport_finance(payment_status);
CREATE INDEX idx_transport_finance_date ON transport_finance(date);
CREATE INDEX idx_transport_finance_customer_name ON transport_finance(customer_name);

-- ============================================
-- VIEWS FOR TRANSPORT ANALYTICS
-- ============================================

-- View for transport finance with vehicle and material names
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

-- View for daily transport summary
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

-- View for vehicle utilization
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
  ROUND(AVG(tf.profit_loss)::NUMERIC, 2) as avg_profit_per_trip,
  MAX(tf.date) as last_used
FROM vehicles v
LEFT JOIN transport_finance tf ON v.id = tf.vehicle_id
GROUP BY v.id, v.company_id, v.vehicle_number, v.vehicle_type, v.status;

-- View for material profitability
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
  ROUND(AVG(tf.profit_loss)::NUMERIC, 2) as avg_profit_per_shipment,
  ROUND((SUM(tf.profit_loss) / NULLIF(SUM(tf.selling_price), 0) * 100)::NUMERIC, 2) as profit_margin_percent
FROM materials m
LEFT JOIN transport_finance tf ON m.id = tf.material_id
GROUP BY m.id, m.company_id, m.name, m.unit;

-- ============================================
-- RLS (ROW LEVEL SECURITY) POLICIES
-- ============================================

-- Enable RLS on all transport tables
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_finance ENABLE ROW LEVEL SECURITY;

-- ============================================
-- TRANSPORT PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS transport_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES transport_finance(id) ON DELETE CASCADE,
  payment_amount DECIMAL(15, 2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method VARCHAR(50) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'check', 'bank_transfer', 'mobile_money', 'card', 'other')),
  reference_number VARCHAR(100),
  notes TEXT,
  recorded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for transport_payments
CREATE INDEX idx_transport_payments_company_id ON transport_payments(company_id);
CREATE INDEX idx_transport_payments_trip_id ON transport_payments(trip_id);
CREATE INDEX idx_transport_payments_payment_date ON transport_payments(payment_date);
CREATE INDEX idx_transport_payments_payment_method ON transport_payments(payment_method);

-- Enable RLS on transport_payments
ALTER TABLE transport_payments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- VIEW FOR TRANSPORT PAYMENTS SUMMARY
-- ============================================
CREATE OR REPLACE VIEW transport_payments_summary AS
SELECT
  tf.id as trip_id,
  tf.company_id,
  tf.selling_price,
  tf.profit_loss,
  tf.payment_status,
  COALESCE(SUM(tp.payment_amount), 0)::DECIMAL(15, 2) as total_paid,
  (tf.selling_price - COALESCE(SUM(tp.payment_amount), 0))::DECIMAL(15, 2) as balance_due,
  COUNT(tp.id) as payment_count,
  MAX(tp.payment_date) as last_payment_date
FROM transport_finance tf
LEFT JOIN transport_payments tp ON tf.id = tp.trip_id
GROUP BY tf.id, tf.company_id, tf.selling_price, tf.profit_loss, tf.payment_status;

-- Drivers RLS Policies
CREATE POLICY drivers_company_isolation ON drivers
  USING (company_id = auth.jwt() ->> 'company_id'::text OR auth.jwt() ->> 'company_id'::text IS NULL)
  WITH CHECK (company_id = auth.jwt() ->> 'company_id'::text);

-- Vehicles RLS Policies
CREATE POLICY vehicles_company_isolation ON vehicles
  USING (company_id = auth.jwt() ->> 'company_id'::text OR auth.jwt() ->> 'company_id'::text IS NULL)
  WITH CHECK (company_id = auth.jwt() ->> 'company_id'::text);

-- Materials RLS Policies
CREATE POLICY materials_company_isolation ON materials
  USING (company_id = auth.jwt() ->> 'company_id'::text OR auth.jwt() ->> 'company_id'::text IS NULL)
  WITH CHECK (company_id = auth.jwt() ->> 'company_id'::text);

-- Transport Finance RLS Policies
CREATE POLICY transport_finance_company_isolation ON transport_finance
  USING (company_id = auth.jwt() ->> 'company_id'::text OR auth.jwt() ->> 'company_id'::text IS NULL)
  WITH CHECK (company_id = auth.jwt() ->> 'company_id'::text);

-- Transport Payments RLS Policies
CREATE POLICY transport_payments_company_isolation ON transport_payments
  USING (company_id = auth.jwt() ->> 'company_id'::text OR auth.jwt() ->> 'company_id'::text IS NULL)
  WITH CHECK (company_id = auth.jwt() ->> 'company_id'::text);

-- ============================================
-- AUDIT LOGGING
-- ============================================

-- Create audit log trigger function if not exists
CREATE OR REPLACE FUNCTION log_transport_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    company_id,
    table_name,
    record_id,
    action,
    changes,
    user_id,
    created_at
  ) VALUES (
    COALESCE(NEW.company_id, OLD.company_id),
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id)::text,
    TG_OP,
    jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW)
    ),
    auth.uid(),
    CURRENT_TIMESTAMP
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for audit logging
CREATE TRIGGER drivers_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON drivers
FOR EACH ROW EXECUTE FUNCTION log_transport_changes();

CREATE TRIGGER vehicles_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON vehicles
FOR EACH ROW EXECUTE FUNCTION log_transport_changes();

CREATE TRIGGER materials_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON materials
FOR EACH ROW EXECUTE FUNCTION log_transport_changes();

CREATE TRIGGER transport_finance_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON transport_finance
FOR EACH ROW EXECUTE FUNCTION log_transport_changes();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to calculate profit/loss before insert/update
CREATE OR REPLACE FUNCTION calculate_transport_profit()
RETURNS TRIGGER AS $$
BEGIN
  NEW.profit_loss = NEW.selling_price - (NEW.buying_price + NEW.fuel_cost + NEW.driver_fees + NEW.other_expenses);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate profit/loss
CREATE TRIGGER transport_finance_calculate_profit
BEFORE INSERT OR UPDATE ON transport_finance
FOR EACH ROW EXECUTE FUNCTION calculate_transport_profit();

-- ============================================
-- SAMPLE DATA (Optional - Comment out if not needed)
-- ============================================

-- Sample drivers for testing
-- INSERT INTO drivers (company_id, name, phone, license_number, status) VALUES
-- ('550e8400-e29b-41d4-a716-446655440000', 'John Kipchoge', '+254700123456', 'DL001', 'active'),
-- ('550e8400-e29b-41d4-a716-446655440000', 'Mary Kamau', '+254700123457', 'DL002', 'active');

-- Sample vehicles for testing
-- INSERT INTO vehicles (company_id, vehicle_number, vehicle_type, capacity, status) VALUES
-- ('550e8400-e29b-41d4-a716-446655440000', 'KCE 2838', 'Truck', 5000, 'active'),
-- ('550e8400-e29b-41d4-a716-446655440000', 'KCL 873K', 'Van', 2000, 'active');

-- Sample materials for testing
-- INSERT INTO materials (company_id, name, description, unit, status) VALUES
-- ('550e8400-e29b-41d4-a716-446655440000', 'Rockland', 'Building materials', 'kg', 'active'),
-- ('550e8400-e29b-41d4-a716-446655440000', 'Transport', 'General cargo', 'kg', 'active');
