# Receipt Items Table Setup

The receipt preview fix requires a new `receipt_items` table to store line items specific to each receipt. This ensures receipts retain their exact items even if the invoice is modified later.

## Quick Setup

You have three options to initialize the `receipt_items` table:

### Option 1: Run SQL Migration (Recommended for Production)

Execute the following SQL migration on your database:

```bash
mysql -u your_username -p your_database < sql/INITIALIZE_RECEIPT_ITEMS.sql
```

Or paste the SQL from `sql/INITIALIZE_RECEIPT_ITEMS.sql` directly into your database client (phpMyAdmin, MySQL Workbench, etc.)

### Option 2: API Initialization Endpoint

Call the setup endpoint from your server:

```bash
# From localhost (no auth required)
curl http://localhost:8000/setup/init-receipt-items.php

# From remote server (requires auth token)
curl http://your-domain.com/setup/init-receipt-items.php?token=YOUR_TOKEN
```

### Option 3: Automatic Initialization

The system will attempt to auto-initialize the table when the database manager initializes. This happens on app startup if the database provider supports it.

## What Changed

The fix includes three key changes:

### 1. **New Database Table** (`receipt_items`)
- Stores line items specific to each receipt
- Linked to receipts via `receipt_id` foreign key
- Includes all item details: quantity, price, tax, line total, etc.

### 2. **Receipt Creation** (`src/hooks/useQuotationItems.ts:1426-1445`)
- When a receipt is created, items are now copied to the `receipt_items` table
- This creates a snapshot of items at receipt creation time
- Original invoice items remain separate and independent

### 3. **Receipt Display** (`src/pages/DirectReceipts.tsx:178-195, 220`)
- Receipt preview now fetches items from `receipt_items` table instead of `invoice_items`
- Each receipt shows exactly its own items, not shared invoice items
- Prevents historical data from appearing in unrelated receipts

## Verification

After setup, verify the table exists:

```sql
-- Check if receipt_items table exists
SHOW TABLES LIKE 'receipt_items';

-- View table structure
DESCRIBE receipt_items;

-- Verify foreign key constraint
SELECT CONSTRAINT_NAME 
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_NAME = 'receipt_items';
```

## Troubleshooting

### Error: "Unknown table 'receipt_items'"
- The table hasn't been created yet
- Follow one of the setup options above

### Error: "Cannot add or update a child row"
- Make sure the `receipts` table exists and has foreign key constraints enabled
- Check that all parent receipt IDs exist in the `receipts` table

### Error: "Duplicate key name"
- Another index or constraint with the same name exists
- The table might have been partially created
- Try dropping and recreating: `DROP TABLE IF EXISTS receipt_items;` then run the migration

## Database Compatibility

The migration is compatible with:
- MySQL 5.7+
- MySQL 8.0+
- MariaDB 10.3+
- Supabase PostgreSQL (with slight syntax modifications)

## Migration Files

- `sql/INITIALIZE_RECEIPT_ITEMS.sql` - MySQL version
- `sql/06-receipt-items-table-mysql.sql` - MySQL with detailed comments
- `sql/06-receipt-items-table.sql` - PostgreSQL version
- `setup/init-receipt-items.php` - PHP endpoint for API initialization
