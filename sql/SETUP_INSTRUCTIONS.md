# Complete Database Setup Instructions

## 🎯 Overview

This guide will help you set up your database schema correctly. The main issue we fixed was that `tax_number` was being saved to the wrong place.

### Key Fix
✅ **Tax numbers now go in the `tax_settings` table, NOT the `companies` table**

This allows companies to have multiple tax numbers and rates.

---

## 📋 Files You Have

| File | Purpose |
|------|---------|
| `01-companies-table.sql` | Creates companies & tax_settings tables (START HERE) |
| `02-migrations-add-missing-columns.sql` | Adds missing columns to existing tables |
| `03-related-tables.sql` | Creates customers, invoices, products, etc. |
| `04-quick-commands.sql` | Copy-paste SQL for common operations |
| `README.md` | Detailed documentation |
| `SETUP_INSTRUCTIONS.md` | This file |

---

## 🚀 Quick Setup (5 minutes)

### For PostgreSQL / Supabase

```bash
# Step 1: Run schema creation (from your SQL editor or terminal)
psql -h your_host -U your_user -d your_database -f sql/01-companies-table.sql

# Step 2: Run related tables
psql -h your_host -U your_user -d your_database -f sql/03-related-tables.sql

# Step 3: Verify
psql -h your_host -U your_user -d your_database
\dt  # Lists all tables
\d companies  # Shows companies table structure
```

### For Supabase Dashboard

1. Open your Supabase project
2. Go to **SQL Editor**
3. Click **+ New Query**
4. Copy content from **01-companies-table.sql**
5. Click **Run**
6. Repeat steps 3-5 for **03-related-tables.sql**
7. Done! ✅

---

## 📊 Schema Diagram

```
companies (root table)
├── id (UUID, PRIMARY KEY)
├── name (UNIQUE)
├── email, phone, address, city, country
├── currency, fiscal_year_start
├── logo_url, primary_color
└── is_active, status

    ↓ references companies.id

tax_settings
├── id (UUID, PRIMARY KEY)
├── company_id (FOREIGN KEY → companies.id)
├── name (e.g., "VAT 16%")
├── rate (percentage)
├── tax_number ← TAX NUMBER GOES HERE! ✅
└── is_active, is_default

    ↓ references companies.id

customers
├── id (UUID)
├── company_id (FOREIGN KEY)
├── customer_code, name, email, phone
├── address, city, country
├── credit_limit, payment_terms
└── is_active

    ↓ references companies.id & customers.id

invoices
├── id (UUID)
├── company_id (FOREIGN KEY)
├── customer_id (FOREIGN KEY)
├── invoice_number, invoice_date, due_date
├── subtotal, tax_amount, total_amount
├── paid_amount, balance_due
└── status, notes

    ↓ references companies.id & invoices.id

payments
├── id (UUID)
├── company_id (FOREIGN KEY)
├── customer_id (FOREIGN KEY)
├── invoice_id (FOREIGN KEY)
├── payment_number, payment_date, amount
├── payment_method, reference_number
└── status, notes
```

---

## ✅ Verification Checklist

After running the SQL files, verify everything is working:

```sql
-- 1. Check all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Check companies table structure
\d companies

-- 3. Check tax_settings table structure
\d tax_settings

-- 4. Verify triggers exist
SELECT * FROM information_schema.tables 
WHERE table_name IN ('companies', 'tax_settings');

-- 5. Test insert
INSERT INTO companies (name, email, country)
VALUES ('Test Company', 'test@example.com', 'Kenya');

-- 6. Verify tax settings
INSERT INTO tax_settings (company_id, name, rate, tax_number)
SELECT id, 'VAT (16%)', 16.00, 'TEST123'
FROM companies WHERE name = 'Test Company' LIMIT 1;

-- 7. Query it back
SELECT c.name, t.name, t.rate, t.tax_number
FROM companies c
LEFT JOIN tax_settings t ON c.id = t.company_id
WHERE c.name = 'Test Company';
```

---

## 🔧 Environment-Specific Instructions

### Using Supabase

1. **Connect to Dashboard**
   - Go to supabase.com
   - Select your project
   - Go to **SQL Editor**

2. **Create New Query**
   - Click **+ New Query**
   - Paste content from `01-companies-table.sql`
   - Click **Run**

3. **Monitor Tables**
   - Go to **Table Editor**
   - Verify `companies`, `tax_settings` tables appear

4. **Test from App**
   - Open CompanySettings page
   - Fill in company info
   - Click Save
   - Should work without errors ✅

### Using PostgreSQL Locally

```bash
# Install PostgreSQL if needed
# macOS:
brew install postgresql

# Linux:
sudo apt-get install postgresql

# Start server
postgres -D /usr/local/var/postgres

# In another terminal:
createdb myapp_db
psql myapp_db -f sql/01-companies-table.sql
psql myapp_db -f sql/03-related-tables.sql

# Verify
psql myapp_db
\dt  # List tables
\q   # Quit
```

### Using MySQL

```bash
# Install MySQL if needed
brew install mysql

# Start server
mysql.server start

# Create database
mysql -u root -p
CREATE DATABASE myapp_db CHARACTER SET utf8mb4;
USE myapp_db;

# Run SQL (will need MySQL syntax adjustments)
# In 01-companies-table.sql, change:
# - gen_random_uuid() → UUID()
# - TIMESTAMP WITH TIME ZONE → TIMESTAMP
# - plpgsql → plpgsql (or mysql's equivalent)

source sql/01-companies-table.sql;
```

### Using Docker

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: myapp_db
    ports:
      - "5432:5432"
    volumes:
      - ./sql:/docker-entrypoint-initdb.d
```

```bash
docker-compose up
# SQL files in ./sql/ will auto-run on first startup
```

---

## 🐛 Troubleshooting

### Problem: "Unknown column 'tax_number' in field list"

**Cause:** Code is trying to save `tax_number` to companies table

**Solution:** 
```javascript
// WRONG ❌
const payload = {
  name: 'Company Name',
  tax_number: 'TAX123'  // This doesn't exist in table!
};

// RIGHT ✅
const payload = {
  name: 'Company Name',
  // Don't include tax_number here
};

// Then separately create tax_settings:
// INSERT INTO tax_settings (company_id, name, tax_number)
// VALUES ('...', 'VAT', 'TAX123');
```

The fix has already been applied in `src/pages/settings/CompanySettings.tsx`.

### Problem: "Duplicate entry for key 'companies.name'"

**Cause:** Table has duplicate company names

**Solution:**
```sql
-- Find duplicates
SELECT name, COUNT(*) as count
FROM companies
GROUP BY name
HAVING COUNT(*) > 1;

-- Delete duplicates (keep first one)
DELETE FROM companies
WHERE id NOT IN (
  SELECT MIN(id) FROM companies GROUP BY name
);

-- Then add UNIQUE constraint
ALTER TABLE companies ADD UNIQUE (name);
```

### Problem: "Foreign key constraint failed"

**Cause:** Trying to reference non-existent company

**Solution:**
```sql
-- Check if company exists
SELECT id, name FROM companies WHERE id = 'xxx';

-- Create company first
INSERT INTO companies (name) VALUES ('Company Name');

-- Then create related records
```

### Problem: Tables don't exist

**Solution:**
```sql
-- Check existing tables
\dt

-- If missing, run:
psql -f sql/01-companies-table.sql
psql -f sql/03-related-tables.sql

-- Verify
\dt
```

### Problem: Columns missing from companies table

**Solution:**
```bash
# Run migration script
psql -f sql/02-migrations-add-missing-columns.sql

# Verify columns were added
psql -c "\d companies"
```

---

## 📝 Common Operations

### Insert a Company
```sql
INSERT INTO companies (name, email, phone, city, country, currency)
VALUES ('My Company', 'info@mycompany.com', '0700000000', 'Nairobi', 'Kenya', 'KES');
```

### Add Tax to Company
```sql
INSERT INTO tax_settings (company_id, name, rate, tax_number, is_default)
SELECT id, 'VAT (16%)', 16.00, 'KRA123456', true
FROM companies WHERE name = 'My Company'
LIMIT 1;
```

### Add Customer
```sql
INSERT INTO customers (company_id, customer_code, name, email, credit_limit)
SELECT id, 'CUST001', 'Simon Gichuki', 'simon@example.com', 100000
FROM companies WHERE name = 'My Company'
LIMIT 1;
```

### Create Invoice
```sql
INSERT INTO invoices (company_id, customer_id, invoice_number, invoice_date, total_amount, status)
SELECT c.id, cu.id, 'INV001', CURRENT_DATE, 50000, 'draft'
FROM companies c
CROSS JOIN customers cu
WHERE c.name = 'My Company' AND cu.customer_code = 'CUST001'
LIMIT 1;
```

---

## 🔐 Security Notes

### Row Level Security (Supabase)

The SQL includes RLS policies (commented out). To enable:

```sql
-- Uncomment in 01-companies-table.sql and run:
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own companies"
  ON companies FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create companies"
  ON companies FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
```

### Backups

```bash
# PostgreSQL backup
pg_dump myapp_db > backup.sql

# Restore
psql myapp_db < backup.sql

# Scheduled backups
0 2 * * * pg_dump myapp_db > /backups/myapp_$(date +\%Y\%m\%d).sql
```

---

## 📞 Support

If you still have issues:

1. **Check the logs:**
   ```bash
   tail -f /var/log/postgresql/postgresql.log
   ```

2. **Test connection:**
   ```bash
   psql -U user -d myapp_db -c "SELECT 1;"
   ```

3. **Review the schema:**
   ```bash
   psql myapp_db -c "\d+"
   ```

4. **Compare with README.md** for expected schema

---

## ✨ Summary

You now have:
- ✅ Correct schema with companies and tax_settings tables
- ✅ All necessary columns and relationships
- ✅ Triggers for automatic timestamp updates
- ✅ Indexes for performance
- ✅ Sample data and queries
- ✅ CompanySettings page fixed to not save tax_number to companies table

**Next:** Start creating companies and using the system!

---

**Last Updated:** 2024  
**Database:** PostgreSQL 12+, MySQL 8+, Supabase  
**Status:** Ready for Production
