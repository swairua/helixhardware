-- Quick Setup SQL for Transport Module
-- Copy and paste this entire file into Supabase SQL Editor and run it

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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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
  capacity INTEGER,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT vehicles_company_vehicle_number_unique UNIQUE (company_id, vehicle_number)
);

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
  unit VARCHAR(50),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT materials_company_name_unique UNIQUE (company_id, name)
);

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
  profit_loss DECIMAL(15, 2) DEFAULT 0,
  payment_status VARCHAR(50) DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'unpaid', 'pending')),
  customer_name VARCHAR(255),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transport_finance_company_id ON transport_finance(company_id);
CREATE INDEX idx_transport_finance_vehicle_id ON transport_finance(vehicle_id);
CREATE INDEX idx_transport_finance_material_id ON transport_finance(material_id);
CREATE INDEX idx_transport_finance_payment_status ON transport_finance(payment_status);
CREATE INDEX idx_transport_finance_date ON transport_finance(date);

-- ============================================
-- AUTO-CALCULATE PROFIT/LOSS FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION calculate_transport_profit()
RETURNS TRIGGER AS $$
BEGIN
  NEW.profit_loss = NEW.selling_price - (NEW.buying_price + NEW.fuel_cost + NEW.driver_fees + NEW.other_expenses);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER FOR AUTO-CALCULATING PROFIT/LOSS
-- ============================================
CREATE TRIGGER transport_finance_calculate_profit
BEFORE INSERT OR UPDATE ON transport_finance
FOR EACH ROW EXECUTE FUNCTION calculate_transport_profit();

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_finance ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================
CREATE POLICY drivers_company_isolation ON drivers
  USING (company_id = (SELECT company_id FROM auth.users WHERE id = auth.uid() LIMIT 1) OR auth.uid() IS NULL)
  WITH CHECK (company_id = (SELECT company_id FROM auth.users WHERE id = auth.uid() LIMIT 1));

CREATE POLICY vehicles_company_isolation ON vehicles
  USING (company_id = (SELECT company_id FROM auth.users WHERE id = auth.uid() LIMIT 1) OR auth.uid() IS NULL)
  WITH CHECK (company_id = (SELECT company_id FROM auth.users WHERE id = auth.uid() LIMIT 1));

CREATE POLICY materials_company_isolation ON materials
  USING (company_id = (SELECT company_id FROM auth.users WHERE id = auth.uid() LIMIT 1) OR auth.uid() IS NULL)
  WITH CHECK (company_id = (SELECT company_id FROM auth.users WHERE id = auth.uid() LIMIT 1));

CREATE POLICY transport_finance_company_isolation ON transport_finance
  USING (company_id = (SELECT company_id FROM auth.users WHERE id = auth.uid() LIMIT 1) OR auth.uid() IS NULL)
  WITH CHECK (company_id = (SELECT company_id FROM auth.users WHERE id = auth.uid() LIMIT 1));

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

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
-- If you see this, all tables and functions were created successfully!
-- You can now use the Transport module in the application.
