# MySQL Transport Module - Quick Reference Card

## Setup Command

**Go to MySQL Client or MySQL Workbench and run:**
```
sql/transport_mysql_quick_setup.sql
```

**Takes:** 5 minutes ⏱️

---

## Quick Connection

### MySQL Command Line
```bash
mysql -u root -p database_name
```

### MySQL Workbench
1. Open MySQL Workbench
2. Click your connection
3. Enter password
4. File → Open SQL Script → select .sql file
5. Run the script

---

## Key Database Tables

### drivers
```
id | company_id | name | phone | license_number | status
```

### vehicles
```
id | company_id | vehicle_number | vehicle_type | capacity | status
```

### materials
```
id | company_id | name | description | unit | status
```

### transport_finance
```
id | company_id | vehicle_id | material_id | 
buying_price | fuel_cost | driver_fees | other_expenses | 
selling_price | profit_loss (AUTO) | payment_status | customer_name | date
```

---

## Profit/Loss Formula

```
profit_loss = selling_price - (buying_price + fuel_cost + driver_fees + other_expenses)
```

**Automatic** - Triggers calculate it!

---

## Status Values

### Drivers
- `active` (default)
- `inactive`

### Vehicles
- `active` (default)
- `inactive`
- `maintenance`

### Materials
- `active` (default)
- `inactive`

### Finance Payments
- `unpaid` (default)
- `paid`
- `pending`

---

## Quick SQL Queries

### Daily Profit
```sql
SELECT SUM(profit_loss) FROM transport_finance 
WHERE company_id = 'YOUR_ID' 
AND DATE(date) = CURDATE();
```

### Total Revenue
```sql
SELECT SUM(selling_price) FROM transport_finance 
WHERE company_id = 'YOUR_ID';
```

### Total Profit
```sql
SELECT SUM(profit_loss) FROM transport_finance 
WHERE company_id = 'YOUR_ID';
```

### Outstanding Payments
```sql
SELECT COUNT(*) FROM transport_finance 
WHERE company_id = 'YOUR_ID' 
AND payment_status != 'paid';
```

### Vehicle Profit
```sql
SELECT v.vehicle_number, SUM(tf.profit_loss)
FROM transport_finance tf
JOIN vehicles v ON tf.vehicle_id = v.id
WHERE tf.company_id = 'YOUR_ID'
GROUP BY v.vehicle_number;
```

### Material Margin
```sql
SELECT m.name, 
  ROUND((SUM(tf.profit_loss) / SUM(tf.selling_price) * 100), 2) as margin_pct
FROM transport_finance tf
JOIN materials m ON tf.material_id = m.id
WHERE tf.company_id = 'YOUR_ID'
GROUP BY m.name;
```

---

## Insert Statements

### Add Driver
```sql
INSERT INTO drivers (id, company_id, name, phone, license_number, status)
VALUES (UUID(), 'COMPANY_ID', 'Name', '+254...', 'DL001', 'active');
```

### Add Vehicle
```sql
INSERT INTO vehicles (id, company_id, vehicle_number, vehicle_type, capacity, status)
VALUES (UUID(), 'COMPANY_ID', 'ABC 123', 'Truck', 5000, 'active');
```

### Add Material
```sql
INSERT INTO materials (id, company_id, name, unit, status)
VALUES (UUID(), 'COMPANY_ID', 'Rockland', 'kg', 'active');
```

### Add Finance Record
```sql
INSERT INTO transport_finance (
  id, company_id, vehicle_id, material_id,
  buying_price, fuel_cost, driver_fees, other_expenses,
  selling_price, payment_status, customer_name, date
) VALUES (
  UUID(), 'COMPANY_ID', 'vehicle-uuid', 'material-uuid',
  16800, 4000, 1600, 500,
  25200, 'unpaid', 'Customer Name', CURDATE()
);
-- profit_loss auto-calculated as 2300
```

---

## Update Statements

### Update Vehicle Status
```sql
UPDATE vehicles SET status = 'maintenance' 
WHERE id = 'vehicle-uuid';
```

### Mark Payment Paid
```sql
UPDATE transport_finance SET payment_status = 'paid' 
WHERE id = 'record-uuid';
```

### Update Multiple Payments
```sql
UPDATE transport_finance SET payment_status = 'paid'
WHERE company_id = 'YOUR_ID'
AND date < DATE_SUB(CURDATE(), INTERVAL 30 DAY)
AND payment_status = 'unpaid';
```

---

## Delete Statements

### Delete Driver
```sql
DELETE FROM drivers WHERE id = 'driver-uuid';
```

### Delete Old Records
```sql
DELETE FROM transport_finance
WHERE company_id = 'YOUR_ID'
AND date < DATE_SUB(CURDATE(), INTERVAL 2 YEAR);
```

---

## Views

### Get Finance Summary
```sql
SELECT * FROM transport_finance_summary 
WHERE company_id = 'YOUR_ID'
ORDER BY date DESC;
```

### Daily Summary
```sql
SELECT * FROM daily_transport_summary 
WHERE company_id = 'YOUR_ID'
ORDER BY date DESC;
```

### Vehicle Utilization
```sql
SELECT * FROM vehicle_utilization 
WHERE company_id = 'YOUR_ID'
ORDER BY total_profit_loss DESC;
```

### Material Profitability
```sql
SELECT * FROM material_profitability 
WHERE company_id = 'YOUR_ID'
ORDER BY total_profit_loss DESC;
```

---

## Date Functions Reference

| Function | Example | Result |
|----------|---------|--------|
| CURDATE() | SELECT CURDATE() | 2025-01-18 |
| CURTIME() | SELECT CURTIME() | 14:30:45 |
| NOW() | SELECT NOW() | 2025-01-18 14:30:45 |
| DATE_ADD | DATE_ADD(CURDATE(), INTERVAL 1 DAY) | Tomorrow |
| DATE_SUB | DATE_SUB(CURDATE(), INTERVAL 1 MONTH) | 1 month ago |
| DATE_FORMAT | DATE_FORMAT(date, '%Y-%m') | 2025-01 |
| DATEDIFF | DATEDIFF(date1, date2) | Days between |
| DAYOFMONTH | DAYOFMONTH(date) | 18 |
| MONTH | MONTH(date) | 1 |
| YEAR | YEAR(date) | 2025 |

---

## Useful Administrative Queries

### Verify Setup
```sql
SHOW TABLES LIKE 'drivers';
SHOW TABLES LIKE 'vehicles';
SHOW TABLES LIKE 'materials';
SHOW TABLES LIKE 'transport_finance';
```

### Check Record Count
```sql
SELECT 'drivers' AS table_name, COUNT(*) FROM drivers
UNION ALL
SELECT 'vehicles', COUNT(*) FROM vehicles
UNION ALL
SELECT 'materials', COUNT(*) FROM materials
UNION ALL
SELECT 'transport_finance', COUNT(*) FROM transport_finance;
```

### View Table Structure
```sql
DESCRIBE drivers;
DESCRIBE vehicles;
DESCRIBE materials;
DESCRIBE transport_finance;
```

### Check Indexes
```sql
SHOW INDEX FROM drivers;
SHOW INDEX FROM vehicles;
SHOW INDEX FROM materials;
SHOW INDEX FROM transport_finance;
```

### List Triggers
```sql
SHOW TRIGGERS;
```

### Trigger Details
```sql
SELECT TRIGGER_SCHEMA, TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE
FROM information_schema.TRIGGERS
WHERE TRIGGER_SCHEMA = DATABASE();
```

---

## Table Sizes

```sql
SELECT 
  TABLE_NAME, 
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size MB'
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME IN ('drivers', 'vehicles', 'materials', 'transport_finance')
ORDER BY TABLE_NAME;
```

---

## Maintenance

### Analyze Table
```sql
ANALYZE TABLE transport_finance;
```

### Optimize Table
```sql
OPTIMIZE TABLE transport_finance;
```

### Check Table Integrity
```sql
CHECK TABLE transport_finance;
```

### Repair Table
```sql
REPAIR TABLE transport_finance;
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| UUID format error | Use UUID() function to generate |
| Foreign key error | Ensure companies table exists |
| Duplicate key error | Vehicle numbers must be unique per company |
| Trigger not working | Check SHOW TRIGGERS; |
| Slow queries | Add indexes or archive old data |
| Permission denied | Check user privileges with SHOW GRANTS; |

---

## File Locations

```
Frontend Code:
  src/pages/Transport.tsx
  src/components/transport/*.tsx (8 modal components)
  src/hooks/useTransport.ts
  src/App.tsx (updated)
  src/components/layout/Sidebar.tsx (updated)

MySQL SQL:
  sql/transport_mysql_schema.sql (full version)
  sql/transport_mysql_quick_setup.sql (quick version - USE THIS!)
  sql/TRANSPORT_MYSQL_GUIDE.md (complete guide)
  sql/POSTGRES_VS_MYSQL_COMPARISON.md (postgres vs mysql)
  sql/TRANSPORT_MYSQL_QUICK_REFERENCE.md (this file)
```

---

## Connection Strings

### Application Connection
```
Database: your_database_name
Host: localhost (or your MySQL host)
Port: 3306
User: your_mysql_user
Password: your_password
```

### Environment Variable
```
DATABASE_URL=mysql://user:password@localhost:3306/database_name
```

---

## Key Differences from PostgreSQL

| Feature | MySQL | PostgreSQL |
|---------|-------|-----------|
| UUID Generation | UUID() | gen_random_uuid() |
| Timestamp with TZ | TIMESTAMP | TIMESTAMP WITH TIME ZONE |
| Triggers | Separate insert/update | Single trigger |
| Functions | Stored procedures | PL/pgSQL functions |
| RLS | Application level | Built-in policies |

---

## Backup Commands

### Full Database
```bash
mysqldump -u root -p database_name > backup.sql
```

### Specific Tables
```bash
mysqldump -u root -p database_name drivers vehicles materials transport_finance > backup.sql
```

### Restore
```bash
mysql -u root -p database_name < backup.sql
```

---

## Performance Tips

1. ✓ Indexes created automatically
2. ✓ Use WHERE company_id in all queries
3. ✓ Archive records older than 2 years
4. ✓ Monitor table sizes regularly
5. ✓ Use EXPLAIN to analyze slow queries

---

## Next Steps

1. Copy `sql/transport_mysql_quick_setup.sql`
2. Run in MySQL Client
3. Wait for success message
4. Verify tables with: `SHOW TABLES LIKE 'drivers';`
5. Start using the Transport module!

---

## Support

- **Setup Issues?** See `sql/TRANSPORT_MYSQL_GUIDE.md`
- **PostgreSQL Comparison?** See `sql/POSTGRES_VS_MYSQL_COMPARISON.md`
- **MySQL Docs:** https://dev.mysql.com/doc/

---

**Version:** 1.0
**MySQL Compatible:** 5.7+
**Status:** Production Ready

Ready to go! 🚀
