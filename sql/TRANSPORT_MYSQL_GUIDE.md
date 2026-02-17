# MySQL Transport Module - Complete Guide

Complete guide for setting up and using the Transport Management Module with MySQL.

## Overview

You have two MySQL files:
1. **`transport_mysql_quick_setup.sql`** (195 lines) - Quick copy-paste version ⭐ START HERE
2. **`transport_mysql_schema.sql`** (355 lines) - Full version with stored procedures

## Prerequisites

- MySQL 5.7 or higher
- Admin access to MySQL server
- Existing `companies` table in your database
- MySQL Client or MySQL Workbench installed

## Quick Setup (3 Minutes)

### Step 1: Open MySQL Client
```bash
mysql -u root -p your_database_name
```

Or use MySQL Workbench:
1. Open MySQL Workbench
2. Connect to your database
3. Create a new SQL script

### Step 2: Copy SQL
Copy the entire content from: **`sql/transport_mysql_quick_setup.sql`**

### Step 3: Execute
Paste in MySQL Client or MySQL Workbench and run.

### Step 4: Verify
```sql
SHOW TABLES LIKE 'drivers';
SHOW TABLES LIKE 'vehicles';
SHOW TABLES LIKE 'materials';
SHOW TABLES LIKE 'transport_finance';
```

All should return 1 row each. ✓

## Database Schema

### Table 1: drivers
```sql
CREATE TABLE drivers (
  id CHAR(36) PRIMARY KEY,           -- UUID
  company_id CHAR(36) NOT NULL,      -- Foreign key
  name VARCHAR(255) NOT NULL,        -- Driver name
  phone VARCHAR(20),                 -- Phone number
  license_number VARCHAR(50),        -- License number
  status ENUM('active','inactive'),  -- Status
  created_at TIMESTAMP,              -- Creation time
  updated_at TIMESTAMP               -- Update time
);
```

**Indexes:**
- company_id (foreign key)
- status (for filtering)
- name (for searching)

### Table 2: vehicles
```sql
CREATE TABLE vehicles (
  id CHAR(36) PRIMARY KEY,                          -- UUID
  company_id CHAR(36) NOT NULL,                     -- Foreign key
  vehicle_number VARCHAR(50) NOT NULL UNIQUE,       -- Registration
  vehicle_type VARCHAR(100),                        -- Type
  capacity INT,                                     -- Capacity in kg
  status ENUM('active','inactive','maintenance'),   -- Status
  created_at TIMESTAMP,                             -- Creation time
  updated_at TIMESTAMP                              -- Update time
);
```

**Constraints:**
- UNIQUE on (company_id, vehicle_number)

**Indexes:**
- company_id
- status
- vehicle_number

### Table 3: materials
```sql
CREATE TABLE materials (
  id CHAR(36) PRIMARY KEY,              -- UUID
  company_id CHAR(36) NOT NULL,         -- Foreign key
  name VARCHAR(255) NOT NULL UNIQUE,    -- Material name
  description TEXT,                     -- Description
  unit VARCHAR(50),                     -- Unit of measurement
  status ENUM('active','inactive'),     -- Status
  created_at TIMESTAMP,                 -- Creation time
  updated_at TIMESTAMP                  -- Update time
);
```

**Constraints:**
- UNIQUE on (company_id, name)

**Indexes:**
- company_id
- status
- name

### Table 4: transport_finance
```sql
CREATE TABLE transport_finance (
  id CHAR(36) PRIMARY KEY,                                 -- UUID
  company_id CHAR(36) NOT NULL,                           -- Foreign key
  vehicle_id CHAR(36) NOT NULL,                           -- FK to vehicles
  material_id CHAR(36) NOT NULL,                          -- FK to materials
  buying_price DECIMAL(15, 2) DEFAULT 0,                 -- Cost of goods
  fuel_cost DECIMAL(15, 2) DEFAULT 0,                    -- Fuel
  driver_fees DECIMAL(15, 2) DEFAULT 0,                  -- Driver fees
  other_expenses DECIMAL(15, 2) DEFAULT 0,               -- Other costs
  selling_price DECIMAL(15, 2) DEFAULT 0,                -- Revenue
  profit_loss DECIMAL(15, 2) DEFAULT 0,                  -- AUTO-CALCULATED
  payment_status ENUM('paid','unpaid','pending'),        -- Payment status
  customer_name VARCHAR(255),                             -- Customer
  date DATE NOT NULL,                                     -- Transaction date
  created_at TIMESTAMP,                                   -- Creation time
  updated_at TIMESTAMP                                    -- Update time
);
```

**Foreign Keys:**
- company_id → companies(id) ON DELETE CASCADE
- vehicle_id → vehicles(id) ON DELETE RESTRICT
- material_id → materials(id) ON DELETE RESTRICT

**Indexes:**
- All foreign keys
- payment_status (for filtering)
- date (for range queries)
- customer_name (for searching)

## Triggers

### Automatic Profit/Loss Calculation

Two triggers ensure profit/loss is always calculated:

```sql
-- Insert trigger
CREATE TRIGGER transport_finance_calculate_profit_insert
BEFORE INSERT ON transport_finance
FOR EACH ROW
BEGIN
  SET NEW.profit_loss = NEW.selling_price - 
      (NEW.buying_price + NEW.fuel_cost + NEW.driver_fees + NEW.other_expenses);
END;

-- Update trigger
CREATE TRIGGER transport_finance_calculate_profit_update
BEFORE UPDATE ON transport_finance
FOR EACH ROW
BEGIN
  SET NEW.profit_loss = NEW.selling_price - 
      (NEW.buying_price + NEW.fuel_cost + NEW.driver_fees + NEW.other_expenses);
END;
```

**Features:**
- Triggers fire BEFORE insert/update
- Automatically calculate profit/loss
- No manual calculation needed
- Always accurate

## Views

### 1. transport_finance_summary
Shows finance records with vehicle and material names.

```sql
SELECT * FROM transport_finance_summary 
WHERE company_id = 'YOUR_ID';
```

**Columns:**
- All finance fields
- Vehicle number and type
- Material name
- Total expenses calculated

### 2. daily_transport_summary
Shows aggregated daily statistics.

```sql
SELECT * FROM daily_transport_summary 
WHERE company_id = 'YOUR_ID'
ORDER BY date DESC;
```

**Columns:**
- date
- transaction_count
- total_expenses
- total_revenue
- total_profit_loss
- paid_count, unpaid_count, pending_count

### 3. vehicle_utilization
Shows vehicle performance metrics.

```sql
SELECT * FROM vehicle_utilization 
WHERE company_id = 'YOUR_ID'
ORDER BY total_profit_loss DESC;
```

**Columns:**
- Vehicle information
- total_trips
- profitable_trips vs loss_trips
- total_profit_loss
- avg_profit_per_trip
- last_used date

### 4. material_profitability
Shows material performance analysis.

```sql
SELECT * FROM material_profitability 
WHERE company_id = 'YOUR_ID'
ORDER BY total_profit_loss DESC;
```

**Columns:**
- Material information
- total_shipments
- total_buying_price, total_selling_price
- total_profit_loss
- avg_profit_per_shipment
- profit_margin_percent

## Common SQL Queries

### Daily Profit
```sql
SELECT DATE(date) as day, SUM(profit_loss) as daily_profit
FROM transport_finance
WHERE company_id = '550e8400-e29b-41d4-a716-446655440000'
GROUP BY DATE(date)
ORDER BY day DESC;
```

### Vehicle Performance
```sql
SELECT v.vehicle_number, 
       SUM(tf.profit_loss) as total_profit,
       COUNT(*) as trips
FROM transport_finance tf
JOIN vehicles v ON tf.vehicle_id = v.id
WHERE tf.company_id = '550e8400-e29b-41d4-a716-446655440000'
GROUP BY v.vehicle_number
ORDER BY total_profit DESC;
```

### Material Profitability
```sql
SELECT m.name, 
       COUNT(*) as shipments,
       ROUND((SUM(tf.profit_loss) / SUM(tf.selling_price) * 100), 2) as margin_pct
FROM transport_finance tf
JOIN materials m ON tf.material_id = m.id
WHERE tf.company_id = '550e8400-e29b-41d4-a716-446655440000'
GROUP BY m.name
ORDER BY margin_pct DESC;
```

### Outstanding Payments
```sql
SELECT customer_name, 
       SUM(selling_price) as amount,
       COUNT(*) as invoice_count,
       MAX(date) as last_date
FROM transport_finance
WHERE company_id = '550e8400-e29b-41d4-a716-446655440000'
AND payment_status IN ('unpaid', 'pending')
GROUP BY customer_name
ORDER BY amount DESC;
```

### Monthly Summary
```sql
SELECT 
  DATE_FORMAT(date, '%Y-%m') as month,
  COUNT(*) as transactions,
  SUM(selling_price) as revenue,
  SUM(buying_price + fuel_cost + driver_fees + other_expenses) as expenses,
  SUM(profit_loss) as profit,
  ROUND((SUM(profit_loss) / SUM(selling_price) * 100), 2) as margin_pct
FROM transport_finance
WHERE company_id = '550e8400-e29b-41d4-a716-446655440000'
GROUP BY DATE_FORMAT(date, '%Y-%m')
ORDER BY month DESC;
```

## Insert Examples

### Add a Driver
```sql
INSERT INTO drivers (id, company_id, name, phone, license_number, status)
VALUES (
  UUID(),
  '550e8400-e29b-41d4-a716-446655440000',
  'John Kipchoge',
  '+254700123456',
  'DL001',
  'active'
);
```

### Add a Vehicle
```sql
INSERT INTO vehicles (id, company_id, vehicle_number, vehicle_type, capacity, status)
VALUES (
  UUID(),
  '550e8400-e29b-41d4-a716-446655440000',
  'KCE 2838',
  'Truck',
  5000,
  'active'
);
```

### Add a Material
```sql
INSERT INTO materials (id, company_id, name, unit, status)
VALUES (
  UUID(),
  '550e8400-e29b-41d4-a716-446655440000',
  'Rockland',
  'kg',
  'active'
);
```

### Add a Finance Record
```sql
-- DON'T set profit_loss - it's auto-calculated!
INSERT INTO transport_finance (
  id,
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
) VALUES (
  UUID(),
  '550e8400-e29b-41d4-a716-446655440000',
  'vehicle-uuid',
  'material-uuid',
  16800,
  4000,
  1600,
  500,
  25200,
  'unpaid',
  'Perminus Infinity',
  CURDATE()
);

-- profit_loss automatically becomes: 25200 - (16800 + 4000 + 1600 + 500) = 2300
```

## Update Examples

### Update Vehicle Status
```sql
UPDATE vehicles 
SET status = 'maintenance'
WHERE id = 'vehicle-uuid'
AND company_id = '550e8400-e29b-41d4-a716-446655440000';
```

### Mark Payment as Paid
```sql
UPDATE transport_finance 
SET payment_status = 'paid'
WHERE id = 'finance-uuid'
AND company_id = '550e8400-e29b-41d4-a716-446655440000';
```

### Update Multiple Payments
```sql
UPDATE transport_finance 
SET payment_status = 'paid'
WHERE company_id = '550e8400-e29b-41d4-a716-446655440000'
AND date < DATE_SUB(CURDATE(), INTERVAL 30 DAY)
AND payment_status = 'unpaid';
```

## Delete Examples

### Delete a Driver
```sql
DELETE FROM drivers
WHERE id = 'driver-uuid'
AND company_id = '550e8400-e29b-41d4-a716-446655440000';
```

### Delete Old Records
```sql
-- Delete records older than 2 years
DELETE FROM transport_finance
WHERE company_id = '550e8400-e29b-41d4-a716-446655440000'
AND date < DATE_SUB(CURDATE(), INTERVAL 2 YEAR);
```

## Differences: PostgreSQL vs MySQL

| Feature | PostgreSQL | MySQL |
|---------|-----------|-------|
| UUID Generation | `gen_random_uuid()` | `UUID()` |
| Timestamp | `TIMESTAMP WITH TIME ZONE` | `TIMESTAMP` |
| Boolean | `BOOLEAN` | `TINYINT(1)` |
| Serial/Sequence | `SERIAL` | `AUTO_INCREMENT` |
| Timezone | Built-in | Use application |
| Function Syntax | PL/pgSQL | MySQL Stored Procedure |
| UUID Type | Native UUID | CHAR(36) |
| ENUM | Supported | Supported |
| Triggers | PostgreSQL syntax | MySQL syntax |

## MySQL Tips

### 1. Enable InnoDB
Ensure all tables use InnoDB:
```sql
SET GLOBAL default_storage_engine=InnoDB;
```

### 2. UTF-8 Support
Always set character set:
```sql
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
```

### 3. UUID vs AUTO_INCREMENT
MySQL doesn't have native UUID type. Options:
- Use `CHAR(36)` for UUID (what we did)
- Use `BINARY(16)` for smaller storage
- Use `BIGINT AUTO_INCREMENT` if you prefer

### 4. Trigger Limitations
MySQL limitations on triggers:
- Cannot use CALL to stored procedures (we don't do this)
- Cannot reference other tables in trigger (we don't do this)
- Cannot use IF EXISTS in trigger body (we don't do this)

### 5. View Updates
To refresh views in MySQL:
```sql
FLUSH TABLES;
-- Or recreate the view:
DROP VIEW IF EXISTS transport_finance_summary;
CREATE VIEW transport_finance_summary AS ...
```

## Performance Optimization

### 1. Index Maintenance
```sql
-- Analyze table statistics
ANALYZE TABLE transport_finance;

-- Check index usage
SHOW INDEX FROM transport_finance;
```

### 2. Query Performance
```sql
-- Enable query profiling
SET profiling=1;
SELECT * FROM transport_finance WHERE company_id = '...';
SHOW PROFILES;

-- Explain query plan
EXPLAIN SELECT * FROM transport_finance WHERE date = CURDATE();
```

### 3. Table Maintenance
```sql
-- Check table integrity
CHECK TABLE transport_finance;

-- Optimize table
OPTIMIZE TABLE transport_finance;

-- Repair if needed
REPAIR TABLE transport_finance;
```

## Stored Procedures (Optional)

These are in the full schema file:

### Monthly Profit Report
```sql
CALL sp_monthly_profit_report('550e8400-e29b-41d4-a716-446655440000');
```

### Top Profitable Routes
```sql
CALL sp_top_profitable_routes('550e8400-e29b-41d4-a716-446655440000', 10);
```

### Outstanding Payments
```sql
CALL sp_outstanding_payments('550e8400-e29b-41d4-a716-446655440000');
```

## Backup & Restore

### Backup
```bash
mysqldump -u root -p database_name > transport_backup.sql
```

### Restore
```bash
mysql -u root -p database_name < transport_backup.sql
```

### Selective Backup (Tables Only)
```bash
mysqldump -u root -p database_name \
  drivers vehicles materials transport_finance \
  > transport_tables_backup.sql
```

## Troubleshooting

### Tables Not Created?
1. Check MySQL version: `SELECT VERSION();`
2. Verify you have CREATE privilege: `SHOW GRANTS;`
3. Check for error messages in MySQL error log
4. Try creating each table individually

### Foreign Key Errors?
1. Ensure `companies` table exists
2. Enable foreign key support: `SET FOREIGN_KEY_CHECKS=1;`
3. Verify company_id values exist in companies table

### Trigger Not Working?
1. Check trigger exists: `SHOW TRIGGERS;`
2. Verify trigger syntax: Check MySQL error log
3. Recreate trigger if needed

### UUID Issues?
1. MySQL UUID() returns string format
2. Ensure column is CHAR(36) not BINARY(16)
3. For better performance, consider BINARY(16) + HEX()

### Slow Queries?
1. Add indexes on frequently searched columns
2. Use EXPLAIN to analyze query plan
3. Archive old records to keep table size manageable

## Monitoring

### Table Sizes
```sql
SELECT 
  TABLE_NAME, 
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size MB'
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME IN ('drivers', 'vehicles', 'materials', 'transport_finance')
ORDER BY TABLE_NAME;
```

### Record Counts
```sql
SELECT 'drivers' AS table_name, COUNT(*) FROM drivers
UNION ALL
SELECT 'vehicles', COUNT(*) FROM vehicles
UNION ALL
SELECT 'materials', COUNT(*) FROM materials
UNION ALL
SELECT 'transport_finance', COUNT(*) FROM transport_finance;
```

### Recent Activity
```sql
SELECT * FROM transport_finance
ORDER BY created_at DESC
LIMIT 10;
```

## Best Practices

✅ **DO:**
- Always include company_id in WHERE clauses
- Use transactions for multi-table updates
- Archive old records regularly
- Monitor table sizes
- Back up regularly
- Use stored procedures for complex logic

❌ **DON'T:**
- Manually set profit_loss field
- Delete records with active transactions
- Run complex queries during peak hours
- Ignore foreign key constraints
- Use SELECT * in production code

## Additional Resources

- [MySQL Documentation](https://dev.mysql.com/doc/)
- [UUID in MySQL](https://dev.mysql.com/doc/refman/8.0/en/miscellaneous-functions.html#function_uuid)
- [MySQL Triggers](https://dev.mysql.com/doc/refman/8.0/en/create-trigger.html)
- [MySQL Views](https://dev.mysql.com/doc/refman/8.0/en/views.html)

---

**Version:** 1.0
**Created:** January 2025
**MySQL Compatibility:** 5.7+
**Status:** Ready for Production

Happy transporting! 🚚💰
