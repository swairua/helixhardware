# Database Schema Setup Guide

This directory contains SQL scripts to set up and maintain your database schema for the Medical Supplies Management System.

## Overview

The database is organized around the **Companies** table as the central entity, with related tables for:
- **Customers** - Client information and credit settings
- **Invoices** - Sales transactions
- **Payments** - Payment records
- **Quotations** - Quote management
- **Products** - Inventory management
- **Tax Settings** - Tax rates and compliance info
- **Payment Methods** - Supported payment types
- **Units of Measure** - Product unit definitions

## Files & Execution Order

### 1. **01-companies-table.sql** (START HERE)
**Purpose:** Creates the foundational companies table and tax_settings table

**What it does:**
- Creates the `companies` table with all required columns
- Creates the `tax_settings` table (tax numbers go HERE, not in companies)
- Sets up indexes for performance
- Creates auto-update triggers for `updated_at` timestamps
- Includes example RLS policies (for Supabase)

**When to use:**
- Fresh database setup
- Complete schema rebuild

**Key columns in companies table:**
```
- id (UUID, Primary Key)
- name (VARCHAR 255, UNIQUE)
- email, phone, address, city, state, postal_code, country
- registration_number (for business registration)
- currency (KES, USD, etc.)
- fiscal_year_start (month 1-12)
- logo_url (for company branding)
- primary_color (hex color for UI)
- is_active, status (for soft deletes)
- created_at, updated_at (audit fields)
```

**Important:** 
⚠️ `tax_number` is NOT stored in companies table. Use `tax_settings` table instead.

---

### 2. **02-migrations-add-missing-columns.sql** (FOR EXISTING DATABASES)
**Purpose:** Safely adds missing columns to an existing companies table

**What it does:**
- Uses `IF NOT EXISTS` to prevent errors on re-run
- Adds missing columns one by one
- Creates indexes if not present
- Recreates triggers
- Includes sample company insertion

**When to use:**
- You already have a companies table but it's missing columns
- After code changes that expect new columns
- Safe to run multiple times

**Columns it may add:**
- registration_number
- currency
- fiscal_year_start
- logo_url
- primary_color
- created_at
- updated_at
- is_active
- status

---

### 3. **03-related-tables.sql** (FOR COMPLETE SETUP)
**Purpose:** Creates all related tables that depend on companies

**What it does:**
- Creates `customers`, `invoices`, `payments` tables
- Creates `quotations`, `products` tables
- Creates `payment_methods`, `units_of_measure` tables
- Inserts default payment methods and units
- Sets up proper foreign keys and indexes

**When to use:**
- After creating the companies table
- Setting up a complete system
- Adding new related tables

---

## Quick Start Guide

### Option A: Fresh Database (New Setup)

```bash
# Step 1: Create companies and tax_settings tables
psql -h your_host -U your_user -d your_database -f 01-companies-table.sql

# Step 2: Create all related tables
psql -h your_host -U your_user -d your_database -f 03-related-tables.sql
```

### Option B: Existing Database (Upgrading)

```bash
# Step 1: Add missing columns to existing companies table
psql -h your_host -U your_user -d your_database -f 02-migrations-add-missing-columns.sql

# Step 2: Create missing related tables
psql -h your_host -U your_user -d your_database -f 03-related-tables.sql
```

### Option C: Using Supabase Dashboard

1. Go to SQL Editor in Supabase dashboard
2. Click "+ New Query"
3. Copy and paste content from each SQL file
4. Click "Run" for each query

### Option D: Using MySQL/Direct SQL

If using MySQL instead of PostgreSQL:
- Replace `gen_random_uuid()` with `UUID()`
- Replace `TIMESTAMP WITH TIME ZONE` with `TIMESTAMP`
- Adjust function syntax as needed for MySQL

---

## Important Notes

### Tax Number Handling ⚠️

**WRONG:**
```sql
-- Do NOT store tax_number in companies table
ALTER TABLE companies ADD COLUMN tax_number VARCHAR(100);
```

**RIGHT:**
```sql
-- Store tax_number in tax_settings table instead
INSERT INTO tax_settings (company_id, name, rate, tax_number)
VALUES ('550e8400-...', 'VAT', 16.00, 'P051658002D');
```

### Why Separate Tax Table?

Companies can have multiple tax numbers:
- National VAT number
- City tax ID
- State tax ID
- Different rates for different regions

The `tax_settings` table handles this properly.

---

## Common Queries

### Get Company Info with Tax Settings
```sql
SELECT 
  c.id,
  c.name,
  c.email,
  c.phone,
  c.address,
  c.city,
  c.country,
  c.currency,
  c.logo_url,
  c.primary_color,
  json_agg(
    json_build_object(
      'name', t.name,
      'rate', t.rate,
      'tax_number', t.tax_number
    ) ORDER BY t.is_default DESC
  ) as tax_settings
FROM companies c
LEFT JOIN tax_settings t ON c.id = t.company_id AND t.is_active = true
WHERE c.is_active = true
GROUP BY c.id
ORDER BY c.created_at DESC;
```

### List All Companies
```sql
SELECT 
  id,
  name,
  email,
  phone,
  city,
  country,
  currency,
  is_active,
  created_at
FROM companies
ORDER BY created_at DESC;
```

### Get Company Statistics
```sql
SELECT 
  c.name,
  COUNT(DISTINCT cu.id) as total_customers,
  COUNT(DISTINCT i.id) as total_invoices,
  COALESCE(SUM(i.total_amount), 0) as total_revenue,
  COALESCE(SUM(i.balance_due), 0) as outstanding_balance
FROM companies c
LEFT JOIN customers cu ON c.id = cu.company_id
LEFT JOIN invoices i ON c.id = i.company_id
WHERE c.is_active = true
GROUP BY c.id
ORDER BY total_revenue DESC;
```

### Add Tax Setting to Company
```sql
INSERT INTO tax_settings (company_id, name, rate, tax_number, is_active, is_default)
VALUES ('550e8400-...', 'VAT (16%)', 16.00, 'P051658002D', true, true);
```

---

## Troubleshooting

### Error: "Unknown column 'tax_number'"
This means you're trying to save tax_number to the companies table. Use the tax_settings table instead.

**Fix:** In your application code (CompanySettings.tsx), don't include tax_number in the save payload.

### Error: "Duplicate entry for key 'companies.name'"
Your companies table has duplicate names. Fix it:
```sql
-- Find duplicates
SELECT name, COUNT(*) FROM companies GROUP BY name HAVING COUNT(*) > 1;

-- Remove duplicates manually or with UPDATE
```

### Error: "Foreign key constraint failed"
Make sure the companies table exists before creating related tables. Run scripts in order.

### Timestamp fields not updating
Triggers may not be created. Re-run the CREATE TRIGGER portions of the migration scripts.

---

## Backup & Recovery

### Backup your database
```bash
pg_dump -h your_host -U your_user -d your_database > backup.sql
```

### Restore from backup
```bash
psql -h your_host -U your_user -d your_database < backup.sql
```

---

## Next Steps

1. ✅ Run the appropriate SQL files from this directory
2. ✅ Verify schema with: `\d companies` (in psql) or similar in your client
3. ✅ Test company creation in the application
4. ✅ Insert sample data if needed
5. ✅ Set up Row Level Security (RLS) policies if using Supabase

---

## Support

If you encounter issues:
1. Check the error message against the **Troubleshooting** section
2. Verify all tables exist: 
   ```sql
   \dt  -- in psql
   ```
3. Check column existence:
   ```sql
   \d companies  -- in psql
   ```
4. Review the comments in each SQL file for detailed explanations

---

## Version History

- **v1.0** - Initial schema with companies, tax_settings, and related tables
- **v1.1** - Added tax_settings table (moved from companies table)
- **v1.2** - Added indexes and triggers for better performance

---

Last Updated: 2024
Database: PostgreSQL 12+ / MySQL 8+
