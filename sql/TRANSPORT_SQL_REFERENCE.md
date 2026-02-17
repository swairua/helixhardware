# Transport Module SQL Reference

Complete SQL documentation for the Transport Management Module.

## Quick Start

If you just want to get started quickly:

1. Go to [Supabase Dashboard](https://supabase.com)
2. Open your project → SQL Editor
3. Create a **New Query**
4. Copy the entire content from **`sql/transport_quick_setup.sql`**
5. Click **Run**
6. Done! All tables are created

## Database Schema Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     TRANSPORT MODULE                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐                │
│  │ drivers  │   │ vehicles │   │materials │                │
│  ├──────────┤   ├──────────┤   ├──────────┤                │
│  │ id (PK)  │   │ id (PK)  │   │ id (PK)  │                │
│  │ company  │   │ company  │   │ company  │                │
│  │ name     │   │ number   │   │ name     │                │
│  │ phone    │   │ type     │   │ desc     │                │
│  │ license  │   │ capacity │   │ unit     │                │
│  │ status   │   │ status   │   │ status   │                │
│  └──────────┘   └──────────┘   └──────────┘                │
│        │              │              │                       │
│        └──────────────┼──────────────┘                       │
│                       │                                       │
│                       ↓                                       │
│          ┌──────────────────────────┐                       │
│          │  transport_finance       │                       │
│          ├──────────────────────────┤                       │
│          │ id (PK)                  │                       │
│          │ company_id (FK)          │                       │
│          │ vehicle_id (FK) ────────→vehicles                │
│          │ material_id (FK) ───────→materials               │
│          │ buying_price             │                       │
│          │ fuel_cost                │                       │
│          │ driver_fees              │                       │
│          │ other_expenses           │                       │
│          │ selling_price            │                       │
│          │ profit_loss (AUTO)       │                       │
│          │ payment_status           │                       │
│          │ customer_name            │                       │
│          │ date                     │                       │
│          └──────────────────────────┘                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Detailed Table Structure

### DRIVERS TABLE

```sql
CREATE TABLE drivers (
  id UUID PRIMARY KEY,                    -- Unique identifier
  company_id UUID NOT NULL,               -- Company association
  name VARCHAR(255) NOT NULL,             -- Driver full name
  phone VARCHAR(20),                      -- Contact number
  license_number VARCHAR(50),             -- License/ID number
  status VARCHAR(50) DEFAULT 'active',    -- 'active' or 'inactive'
  created_at TIMESTAMP WITH TIME ZONE,    -- Record creation time
  updated_at TIMESTAMP WITH TIME ZONE     -- Last modification time
);
```

**Indexes:**
- `company_id` - For querying drivers by company
- `status` - For filtering active/inactive drivers
- `name` - For searching drivers by name

**Example Queries:**

```sql
-- Get all active drivers for a company
SELECT * FROM drivers 
WHERE company_id = 'YOUR_COMPANY_ID' 
AND status = 'active';

-- Search drivers by name
SELECT * FROM drivers 
WHERE company_id = 'YOUR_COMPANY_ID' 
AND name ILIKE '%John%';

-- Count drivers by status
SELECT status, COUNT(*) 
FROM drivers 
WHERE company_id = 'YOUR_COMPANY_ID' 
GROUP BY status;
```

### VEHICLES TABLE

```sql
CREATE TABLE vehicles (
  id UUID PRIMARY KEY,                         -- Unique identifier
  company_id UUID NOT NULL,                    -- Company association
  vehicle_number VARCHAR(50) NOT NULL,         -- Registration number (e.g., KCE 2838)
  vehicle_type VARCHAR(100),                   -- Type (Truck, Van, Motorcycle, etc.)
  capacity INTEGER,                            -- Capacity in kg
  status VARCHAR(50) DEFAULT 'active',         -- 'active', 'inactive', or 'maintenance'
  created_at TIMESTAMP WITH TIME ZONE,         -- Record creation time
  updated_at TIMESTAMP WITH TIME ZONE,         -- Last modification time
  UNIQUE (company_id, vehicle_number)          -- Vehicle numbers must be unique per company
);
```

**Indexes:**
- `company_id` - For querying vehicles by company
- `status` - For filtering vehicle status
- `vehicle_number` - For searching by registration

**Example Queries:**

```sql
-- Get all active vehicles
SELECT * FROM vehicles 
WHERE company_id = 'YOUR_COMPANY_ID' 
AND status = 'active';

-- Get vehicles in maintenance
SELECT * FROM vehicles 
WHERE company_id = 'YOUR_COMPANY_ID' 
AND status = 'maintenance';

-- Find vehicle by registration number
SELECT * FROM vehicles 
WHERE company_id = 'YOUR_COMPANY_ID' 
AND vehicle_number = 'KCE 2838';

-- Get vehicle capacity summary
SELECT vehicle_type, COUNT(*), SUM(capacity) as total_capacity
FROM vehicles 
WHERE company_id = 'YOUR_COMPANY_ID' 
GROUP BY vehicle_type;
```

### MATERIALS TABLE

```sql
CREATE TABLE materials (
  id UUID PRIMARY KEY,                         -- Unique identifier
  company_id UUID NOT NULL,                    -- Company association
  name VARCHAR(255) NOT NULL,                  -- Material name
  description TEXT,                            -- Detailed description
  unit VARCHAR(50),                            -- Unit (kg, tons, liters, pieces, etc.)
  status VARCHAR(50) DEFAULT 'active',         -- 'active' or 'inactive'
  created_at TIMESTAMP WITH TIME ZONE,         -- Record creation time
  updated_at TIMESTAMP WITH TIME ZONE,         -- Last modification time
  UNIQUE (company_id, name)                    -- Names must be unique per company
);
```

**Indexes:**
- `company_id` - For querying materials by company
- `status` - For filtering active materials
- `name` - For searching materials

**Example Queries:**

```sql
-- Get all active materials
SELECT * FROM materials 
WHERE company_id = 'YOUR_COMPANY_ID' 
AND status = 'active';

-- Find material by name
SELECT * FROM materials 
WHERE company_id = 'YOUR_COMPANY_ID' 
AND name = 'Rockland';

-- List all material types
SELECT DISTINCT name FROM materials 
WHERE company_id = 'YOUR_COMPANY_ID' 
ORDER BY name;
```

### TRANSPORT_FINANCE TABLE

```sql
CREATE TABLE transport_finance (
  id UUID PRIMARY KEY,                         -- Unique identifier
  company_id UUID NOT NULL,                    -- Company association
  vehicle_id UUID NOT NULL,                    -- Reference to vehicle
  material_id UUID NOT NULL,                   -- Reference to material
  buying_price DECIMAL(15, 2) DEFAULT 0,      -- Cost of goods (from spreadsheet)
  fuel_cost DECIMAL(15, 2) DEFAULT 0,         -- Fuel expenses
  driver_fees DECIMAL(15, 2) DEFAULT 0,       -- Driver compensation
  other_expenses DECIMAL(15, 2) DEFAULT 0,    -- Additional costs
  selling_price DECIMAL(15, 2) DEFAULT 0,    -- Revenue from transport
  profit_loss DECIMAL(15, 2) DEFAULT 0,      -- AUTO-CALCULATED (selling - all expenses)
  payment_status VARCHAR(50) DEFAULT 'unpaid', -- 'paid', 'unpaid', or 'pending'
  customer_name VARCHAR(255),                  -- Customer/destination name
  date DATE NOT NULL DEFAULT CURRENT_DATE,    -- Transaction date
  created_at TIMESTAMP WITH TIME ZONE,         -- Record creation time
  updated_at TIMESTAMP WITH TIME ZONE          -- Last modification time
);
```

**Indexes:**
- `company_id` - For querying by company
- `vehicle_id` - For vehicle-specific reports
- `material_id` - For material-specific reports
- `payment_status` - For filtering payment status
- `date` - For date range queries

**Key Feature: Auto-Calculated Profit/Loss**

```sql
-- This trigger automatically calculates profit_loss
CREATE FUNCTION calculate_transport_profit() RETURNS TRIGGER AS $$
BEGIN
  NEW.profit_loss = NEW.selling_price - 
                    (NEW.buying_price + NEW.fuel_cost + 
                     NEW.driver_fees + NEW.other_expenses);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transport_finance_calculate_profit
BEFORE INSERT OR UPDATE ON transport_finance
FOR EACH ROW EXECUTE FUNCTION calculate_transport_profit();
```

**Example Queries:**

```sql
-- Get all finance records for a date range
SELECT * FROM transport_finance 
WHERE company_id = 'YOUR_COMPANY_ID' 
AND date BETWEEN '2025-01-01' AND '2025-01-31'
ORDER BY date DESC;

-- Get total profit by date
SELECT date, SUM(profit_loss) as daily_profit
FROM transport_finance 
WHERE company_id = 'YOUR_COMPANY_ID' 
GROUP BY date 
ORDER BY date DESC;

-- Get unpaid records
SELECT * FROM transport_finance 
WHERE company_id = 'YOUR_COMPANY_ID' 
AND payment_status = 'unpaid'
ORDER BY date DESC;

-- Calculate total profit by vehicle
SELECT v.vehicle_number, SUM(tf.profit_loss) as total_profit
FROM transport_finance tf
JOIN vehicles v ON tf.vehicle_id = v.id
WHERE tf.company_id = 'YOUR_COMPANY_ID'
GROUP BY v.vehicle_number
ORDER BY total_profit DESC;

-- Calculate profit margin by material
SELECT m.name, 
       SUM(tf.selling_price) as total_revenue,
       SUM(tf.profit_loss) as total_profit,
       ROUND((SUM(tf.profit_loss) / SUM(tf.selling_price) * 100)::numeric, 2) as profit_margin_pct
FROM transport_finance tf
JOIN materials m ON tf.material_id = m.id
WHERE tf.company_id = 'YOUR_COMPANY_ID'
GROUP BY m.name
ORDER BY total_profit DESC;
```

## Useful Views

All these views are created automatically:

### 1. transport_finance_summary
Shows finance records with vehicle and material names included (no joins needed).

```sql
SELECT * FROM transport_finance_summary 
WHERE company_id = 'YOUR_COMPANY_ID'
ORDER BY date DESC;
```

### 2. daily_transport_summary
Shows aggregated daily statistics.

```sql
SELECT * FROM daily_transport_summary 
WHERE company_id = 'YOUR_COMPANY_ID' 
AND date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date DESC;
```

### 3. vehicle_utilization
Shows vehicle performance metrics.

```sql
SELECT * FROM vehicle_utilization 
WHERE company_id = 'YOUR_COMPANY_ID'
ORDER BY total_profit_loss DESC;
```

### 4. material_profitability
Shows material performance metrics.

```sql
SELECT * FROM material_profitability 
WHERE company_id = 'YOUR_COMPANY_ID'
ORDER BY total_profit_loss DESC;
```

## Important Constraints

### Unique Constraints
- Vehicle numbers must be unique per company
- Material names must be unique per company

```sql
-- These will fail (duplicate vehicle number for same company)
INSERT INTO vehicles (company_id, vehicle_number, status)
VALUES ('company-1', 'KCE 2838', 'active');
INSERT INTO vehicles (company_id, vehicle_number, status)
VALUES ('company-1', 'KCE 2838', 'active'); -- ERROR!
```

### Foreign Key Constraints
- `vehicle_id` must reference an existing vehicle
- `material_id` must reference an existing material
- Deleting a vehicle with finance records will fail (RESTRICT)

```sql
-- This will fail (vehicle doesn't exist)
INSERT INTO transport_finance (vehicle_id, material_id, company_id)
VALUES ('invalid-uuid', 'valid-material-id', 'company-id'); -- ERROR!
```

## Data Modification Examples

### Create a Driver
```sql
INSERT INTO drivers (company_id, name, phone, license_number, status)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'John Kipchoge',
  '+254700123456',
  'DL001',
  'active'
);
```

### Create a Vehicle
```sql
INSERT INTO vehicles (company_id, vehicle_number, vehicle_type, capacity, status)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'KCE 2838',
  'Truck',
  5000,
  'active'
);
```

### Create a Material
```sql
INSERT INTO materials (company_id, name, description, unit, status)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Rockland',
  'Building materials and stones',
  'kg',
  'active'
);
```

### Create a Finance Record
```sql
-- profit_loss is AUTO-CALCULATED - don't set it manually!
INSERT INTO transport_finance (
  company_id, 
  vehicle_id, 
  material_id,
  buying_price,
  fuel_cost,
  driver_fees,
  other_expenses,
  selling_price,
  payment_status,
  customer_name,
  date
)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'vehicle-uuid-here',
  'material-uuid-here',
  16800,
  4000,
  1600,
  500,
  25200,
  'unpaid',
  'Perminus Infinity',
  CURRENT_DATE
);
-- profit_loss will automatically be: 25200 - (16800 + 4000 + 1600 + 500) = 2300
```

### Update a Vehicle Status
```sql
UPDATE vehicles 
SET status = 'maintenance'
WHERE id = 'vehicle-uuid-here' 
AND company_id = '550e8400-e29b-41d4-a716-446655440000';
```

### Mark Payment as Paid
```sql
UPDATE transport_finance 
SET payment_status = 'paid'
WHERE id = 'finance-uuid-here' 
AND company_id = '550e8400-e29b-41d4-a716-446655440000';
```

### Delete a Material
```sql
DELETE FROM materials 
WHERE id = 'material-uuid-here'
AND company_id = '550e8400-e29b-41d4-a716-446655440000';
```

## Row Level Security (RLS)

All transport tables have RLS enabled. Users can only see their company's data:

```sql
-- This policy ensures users only see their company's data
CREATE POLICY drivers_company_isolation ON drivers
  USING (company_id = (SELECT company_id FROM auth.users WHERE id = auth.uid() LIMIT 1))
  WITH CHECK (company_id = (SELECT company_id FROM auth.users WHERE id = auth.uid() LIMIT 1));
```

## Common Queries for Reporting

### Monthly Profit Report
```sql
SELECT 
  DATE_TRUNC('month', date) as month,
  COUNT(*) as transactions,
  SUM(selling_price) as total_revenue,
  SUM(buying_price + fuel_cost + driver_fees + other_expenses) as total_expenses,
  SUM(profit_loss) as total_profit,
  ROUND((SUM(profit_loss) / SUM(selling_price) * 100)::numeric, 2) as profit_margin_pct
FROM transport_finance
WHERE company_id = 'YOUR_COMPANY_ID'
GROUP BY DATE_TRUNC('month', date)
ORDER BY month DESC;
```

### Top Profitable Routes
```sql
SELECT 
  m.name as material,
  v.vehicle_number,
  COUNT(*) as trips,
  ROUND(AVG(tf.profit_loss)::numeric, 2) as avg_profit_per_trip,
  SUM(tf.profit_loss) as total_profit
FROM transport_finance tf
JOIN materials m ON tf.material_id = m.id
JOIN vehicles v ON tf.vehicle_id = v.id
WHERE tf.company_id = 'YOUR_COMPANY_ID'
GROUP BY m.name, v.vehicle_number
ORDER BY total_profit DESC;
```

### Outstanding Payments
```sql
SELECT 
  DATE_TRUNC('day', date)::date as transaction_date,
  COUNT(*) as unpaid_count,
  SUM(selling_price) as unpaid_amount,
  customer_name
FROM transport_finance
WHERE company_id = 'YOUR_COMPANY_ID'
AND payment_status = 'unpaid'
GROUP BY transaction_date, customer_name
ORDER BY transaction_date DESC;
```

## Troubleshooting

### Profit/Loss Not Calculating?
- Make sure you're NOT manually setting the `profit_loss` field
- The trigger should handle it automatically
- Check that the trigger exists: `SELECT proname FROM pg_proc WHERE proname = 'calculate_transport_profit';`

### Can't Insert Data?
- Check foreign keys are valid (vehicle_id, material_id must exist)
- Check unique constraints (vehicle_number, material name)
- Verify company_id is correct

### No Results in Queries?
- Check that company_id matches your actual company
- Verify RLS is not blocking your user
- Check that records actually exist

## Maintenance

### Check Table Sizes
```sql
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('drivers', 'vehicles', 'materials', 'transport_finance');
```

### Archive Old Records
```sql
-- Archive finance records older than 2 years (optional)
DELETE FROM transport_finance
WHERE company_id = 'YOUR_COMPANY_ID'
AND date < CURRENT_DATE - INTERVAL '2 years';
```

### Refresh Materialized Views
```sql
-- If you're using materialized views, refresh them periodically
REFRESH MATERIALIZED VIEW transport_finance_summary;
```

---

**Last Updated:** 2025-01-18
**Version:** 1.0
