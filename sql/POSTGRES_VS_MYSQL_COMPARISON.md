# PostgreSQL vs MySQL - Transport Module Comparison

Complete comparison guide for transport module between PostgreSQL (Supabase) and MySQL.

## Overview

Both databases support the full Transport Module. Choose based on your infrastructure:

- **PostgreSQL (Supabase)** - Cloud-hosted, managed, RLS built-in
- **MySQL** - Self-hosted or cloud, more widely available

## Side-by-Side Comparison

### 1. UUID Generation

**PostgreSQL:**
```sql
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ...
);

INSERT INTO drivers (name) VALUES ('John');
-- UUID auto-generated
```

**MySQL:**
```sql
CREATE TABLE drivers (
  id CHAR(36) PRIMARY KEY,
  ...
);

INSERT INTO drivers (id, name) VALUES (UUID(), 'John');
-- Must manually generate UUID
```

**Verdict:** PostgreSQL slightly easier for UUIDs

---

### 2. Timestamps with Timezone

**PostgreSQL:**
```sql
CREATE TABLE drivers (
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**MySQL:**
```sql
CREATE TABLE drivers (
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Verdict:** PostgreSQL has timezone support, MySQL doesn't (use application layer)

---

### 3. ENUM Types

**PostgreSQL:**
```sql
CREATE TYPE status_enum AS ENUM ('active', 'inactive');

CREATE TABLE drivers (
  status status_enum DEFAULT 'active'
);
```

**MySQL:**
```sql
CREATE TABLE drivers (
  status ENUM('active', 'inactive') DEFAULT 'active'
);
```

**Verdict:** Both support ENUM, MySQL is simpler

---

### 4. Trigger Syntax

**PostgreSQL:**
```sql
CREATE FUNCTION calculate_transport_profit()
RETURNS TRIGGER AS $$
BEGIN
  NEW.profit_loss = NEW.selling_price - (NEW.buying_price + NEW.fuel_cost + NEW.driver_fees + NEW.other_expenses);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transport_finance_calculate_profit
BEFORE INSERT OR UPDATE ON transport_finance
FOR EACH ROW EXECUTE FUNCTION calculate_transport_profit();
```

**MySQL:**
```sql
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
```

**Verdict:** PostgreSQL more concise, MySQL requires separate triggers for insert/update

---

### 5. Stored Procedures / Functions

**PostgreSQL:**
```sql
CREATE FUNCTION sp_monthly_profit_report(company_id UUID)
RETURNS TABLE (
  month TEXT,
  transactions INT,
  revenue DECIMAL,
  expenses DECIMAL,
  profit DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT DATE_TRUNC('month', date) as month, ...;
END;
$$ LANGUAGE plpgsql;

-- Call it
SELECT * FROM sp_monthly_profit_report('550e8400-e29b-41d4-a716-446655440000');
```

**MySQL:**
```sql
DELIMITER $$

CREATE PROCEDURE sp_monthly_profit_report(IN p_company_id CHAR(36))
BEGIN
  SELECT DATE_FORMAT(date, '%Y-%m') as month, ...;
END$$

DELIMITER ;

-- Call it
CALL sp_monthly_profit_report('550e8400-e29b-41d4-a716-446655440000');
```

**Verdict:** PostgreSQL functions more powerful, MySQL procedures simpler

---

### 6. Row Level Security (RLS)

**PostgreSQL:**
```sql
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY drivers_company_isolation ON drivers
  USING (company_id = auth.jwt() ->> 'company_id'::text)
  WITH CHECK (company_id = auth.jwt() ->> 'company_id'::text);
```

**MySQL:**
```sql
-- MySQL doesn't have built-in RLS
-- Implement at application level with WHERE company_id = @current_company_id
-- Or use MariaDB 10.5+ for built-in roles
```

**Verdict:** PostgreSQL RLS is built-in and powerful, MySQL requires application-level enforcement

---

### 7. Indexing

**PostgreSQL:**
```sql
CREATE INDEX idx_drivers_company_id ON drivers(company_id);
CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_drivers_name ON drivers(name);

-- B-tree (default), Hash, GiST, GIN indexes available
CREATE INDEX idx_drivers_search ON drivers USING GIN(to_tsvector('english', name));
```

**MySQL:**
```sql
INDEX idx_drivers_company_id (company_id),
INDEX idx_drivers_status (status),
INDEX idx_drivers_name (name(50))

-- B-tree (default), Full-text indexes available
CREATE FULLTEXT INDEX ft_drivers_name ON drivers(name);
```

**Verdict:** PostgreSQL has more index types, MySQL is simpler but sufficient

---

### 8. Query Syntax Differences

### Date Functions

**PostgreSQL:**
```sql
-- Date operations
DATE_TRUNC('month', date)
CURRENT_DATE
date + INTERVAL '1 day'
AGE(date1, date2)
```

**MySQL:**
```sql
-- Date operations
DATE_FORMAT(date, '%Y-%m')
CURDATE()
DATE_ADD(date, INTERVAL 1 DAY)
DATEDIFF(date1, date2)
```

### String Functions

**PostgreSQL:**
```sql
CONCAT(first_name, ' ', last_name)
SUBSTRING(name, 1, 5)
UPPER(name)
LOWER(name)
```

**MySQL:**
```sql
CONCAT(first_name, ' ', last_name)
SUBSTRING(name, 1, 5)
UPPER(name)
LOWER(name)
-- Same as PostgreSQL!
```

### Aggregation

**PostgreSQL:**
```sql
-- Window functions
ROW_NUMBER() OVER (PARTITION BY company_id ORDER BY date DESC)
SUM() OVER (PARTITION BY company_id)
RANK() OVER (ORDER BY profit_loss DESC)
```

**MySQL 8.0+:**
```sql
-- Window functions available
ROW_NUMBER() OVER (PARTITION BY company_id ORDER BY date DESC)
SUM() OVER (PARTITION BY company_id)
RANK() OVER (ORDER BY profit_loss DESC)
```

---

### 9. Null Handling

**Both:**
```sql
COALESCE(column, default_value)
NULLIF(column, value)
IS NULL
IS NOT NULL
```

**Same syntax in both databases!**

---

### 10. Transaction Support

**PostgreSQL:**
```sql
BEGIN;
INSERT INTO transport_finance (...) VALUES (...);
UPDATE vehicles SET status = 'maintenance' WHERE id = '...';
COMMIT;
-- Or ROLLBACK;
```

**MySQL:**
```sql
START TRANSACTION;
INSERT INTO transport_finance (...) VALUES (...);
UPDATE vehicles SET status = 'maintenance' WHERE id = '...';
COMMIT;
-- Or ROLLBACK;
```

**Verdict:** Both have excellent transaction support

---

## Feature Comparison Table

| Feature | PostgreSQL | MySQL |
|---------|-----------|-------|
| UUID Support | Native | CHAR(36) |
| Timezone Support | Yes | No |
| ENUM Type | Yes | Yes |
| Arrays | Yes | No |
| JSON/JSONB | Yes | Yes |
| Full-text Search | Yes | Yes |
| Triggers | Yes (better) | Yes |
| Stored Procedures | Yes (powerful) | Yes |
| Views | Yes | Yes |
| Window Functions | Yes | Yes (8.0+) |
| CTEs (WITH) | Yes | Yes (8.0+) |
| Row Level Security | Yes (built-in) | No |
| Foreign Keys | Yes | Yes |
| Transactions | Yes | Yes |
| Constraints | Excellent | Good |
| Performance | Excellent | Excellent |

---

## Performance Comparison

### Query Performance
Both databases perform similarly for the transport module.

**PostgreSQL Advantages:**
- Better with complex queries
- Superior JSON support
- Built-in RLS
- Better UUID handling

**MySQL Advantages:**
- Simpler setup
- Faster simple queries
- More widely hosted
- Easier replication

### Scalability
- **PostgreSQL:** Up to billions of rows, excellent with sharding
- **MySQL:** Up to billions of rows, excellent with replication

---

## Setup Complexity

### PostgreSQL (Supabase)
1. Click [Connect to Supabase](#open-mcp-popover)
2. Copy PostgreSQL schema
3. Paste in SQL editor
4. Click Run
⏱️ Takes 2 minutes

### MySQL
1. Get MySQL server access
2. Copy MySQL schema
3. Run in MySQL client
4. Verify tables created
⏱️ Takes 5 minutes

---

## Migration Between Databases

### PostgreSQL to MySQL

```sql
-- 1. Export from PostgreSQL
pg_dump -d database_name --table=drivers --table=vehicles > export.sql

-- 2. Convert SQL syntax
-- - UUID() instead of gen_random_uuid()
-- - TIMESTAMP instead of TIMESTAMP WITH TIME ZONE
-- - ENUM syntax adjustment

-- 3. Import to MySQL
mysql -u root -p database_name < converted.sql
```

### MySQL to PostgreSQL

```sql
-- 1. Export from MySQL
mysqldump database_name drivers vehicles materials transport_finance > export.sql

-- 2. Convert SQL syntax
-- - Add ::UUID type casting
-- - Add WITH TIME ZONE to timestamps
-- - Convert ENUM to PostgreSQL format

-- 3. Import to PostgreSQL
psql database_name < converted.sql
```

---

## Which Should You Choose?

### Choose PostgreSQL (Supabase) if:
✅ Using cloud infrastructure
✅ Need Row Level Security
✅ Complex queries/analytics needed
✅ Want managed database
✅ Need timezone support
✅ Want native UUID support
✅ Planning to scale horizontally

### Choose MySQL if:
✅ Self-hosted infrastructure
✅ MySQL already in use
✅ Simpler deployment needed
✅ Wider hosting availability
✅ Team familiar with MySQL
✅ Lower operational overhead
✅ Budget constraints

---

## Frontend Integration

### With PostgreSQL (Supabase)
```typescript
import { supabase } from '@/integrations/supabase/client';

const { data: drivers } = await supabase
  .from('drivers')
  .select('*');
```

### With MySQL
```typescript
import axios from 'axios';

const response = await axios.get('/api/drivers', {
  headers: { company_id: currentCompanyId }
});
const drivers = response.data;
```

**Note:** MySQL requires API layer, PostgreSQL uses direct Supabase client

---

## Cost Comparison

### PostgreSQL (Supabase)
- Free tier: 500 MB storage, up to 50,000 monthly active users
- Paid: $25/month + usage
- Best for: Growing businesses

### MySQL
- Self-hosted: Only infrastructure costs (cheap)
- Managed cloud: $15-100/month depending on provider
- Best for: Cost-conscious deployments

---

## Backup & Restore

### PostgreSQL
```bash
# Backup
pg_dump -d database_name > backup.sql

# Restore
psql -d database_name < backup.sql
```

### MySQL
```bash
# Backup
mysqldump -u root -p database_name > backup.sql

# Restore
mysql -u root -p database_name < backup.sql
```

---

## Troubleshooting

### PostgreSQL Issues

**Issue:** UUID functions not working
**Solution:** Use UUID() function or gen_random_uuid()

**Issue:** Timezone issues
**Solution:** Use AT TIME ZONE clause

**Issue:** RLS not enforced
**Solution:** Verify JWT claims in Supabase auth

### MySQL Issues

**Issue:** Foreign key constraints failing
**Solution:** Ensure InnoDB engine: `SET FOREIGN_KEY_CHECKS=1;`

**Issue:** Triggers not executing
**Solution:** Check `SHOW TRIGGERS;` and verify syntax

**Issue:** UUID collation issues
**Solution:** Use BINARY(16) instead of CHAR(36) for storage

---

## Summary

| Aspect | Winner |
|--------|--------|
| Setup Speed | PostgreSQL (Supabase) |
| Performance | Tie |
| Ease of Use | MySQL |
| Security (RLS) | PostgreSQL |
| Cost | MySQL (self-hosted) |
| Scalability | PostgreSQL |
| Support | Tie |
| Flexibility | PostgreSQL |

---

## Files Provided

### PostgreSQL
- `sql/transport_schema.sql` - Full schema
- `sql/transport_quick_setup.sql` - Quick setup
- `sql/TRANSPORT_SETUP.md` - Setup guide
- `sql/TRANSPORT_SQL_REFERENCE.md` - SQL reference

### MySQL
- `sql/transport_mysql_schema.sql` - Full schema
- `sql/transport_mysql_quick_setup.sql` - Quick setup
- `sql/TRANSPORT_MYSQL_GUIDE.md` - Complete guide
- `sql/POSTGRES_VS_MYSQL_COMPARISON.md` - This file

---

## Recommendation

**For this project:** Use PostgreSQL (Supabase)
- Already integrated with frontend
- Built-in RLS for security
- Managed service (no ops overhead)
- Scalable to production
- Better developer experience

**If you must use MySQL:** Follow `TRANSPORT_MYSQL_GUIDE.md`
- Same functionality
- Slightly more setup
- Need application-level RLS enforcement
- Works perfectly fine

---

**Version:** 1.0
**Created:** January 2025
**Status:** Complete & Ready

Choose your database and start transporting! 🚀
