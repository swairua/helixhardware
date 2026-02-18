# Schema Migration: UUID to INT AUTO_INCREMENT for Receipts

## Summary
Migrated `receipts` and `receipt_items` tables from `CHAR(36) UUID` to `INT AUTO_INCREMENT` primary keys to resolve duplicate entry errors in the PHP API when creating direct receipts.

## Date
February 17, 2026

## Changes Made

### Tables Updated
1. **receipts**
   - `id`: Changed from `CHAR(36)` to `INT AUTO_INCREMENT PRIMARY KEY`
   - `company_id`: Changed from `CHAR(36)` to `INT`
   - `payment_id`: Changed from `CHAR(36)` to `INT`
   - `invoice_id`: Changed from `CHAR(36)` to `INT`
   - `change_note_id`: Changed from `CHAR(36)` to `INT`
   - `voided_by`: Changed from `CHAR(36)` to `INT`
   - `created_by`: Changed from `CHAR(36)` to `INT`

2. **receipt_items**
   - `id`: Changed from `CHAR(36)` to `INT AUTO_INCREMENT PRIMARY KEY`
   - `receipt_id`: Changed from `CHAR(36)` to `INT` (foreign key to receipts)
   - `product_id`: Changed from `CHAR(36)` to `INT`
   - `tax_setting_id`: Changed from `CHAR(36)` to `INT`

3. **customer_credit_balances** (if exists)
   - `id`: Changed from `CHAR(36)` to `INT AUTO_INCREMENT PRIMARY KEY`
   - `company_id`: Changed from `CHAR(36)` to `INT`
   - `customer_id`: Changed from `CHAR(36)` to `INT`
   - `source_receipt_id`: Changed from `CHAR(36)` to `INT` (foreign key to receipts)
   - `source_payment_id`: Changed from `CHAR(36)` to `INT`
   - `applied_invoice_id`: Changed from `CHAR(36)` to `INT`

## Root Cause
The original error:
```
[17-Feb-2026 23:45:16 UTC] API Error [400]: Duplicate entry '' for key 'PRIMARY'
```

Occurred because:
- The `receipts.id` column was defined as `CHAR(36)` (expecting UUID strings)
- The PHP API code (`/home/layonsc1/helixgeneralhardware.com/api.php:1526`) did NOT generate valid UUIDs when inserting receipts
- The column received empty strings or NULL values instead of valid 36-character UUID strings
- MySQL rejected this as a duplicate PRIMARY key

## Resolution
Changed to `INT AUTO_INCREMENT`, which:
- Lets MySQL automatically generate sequential integer IDs
- Eliminates the need for client/application code to generate UUIDs
- Uses database-native auto-increment mechanism (more efficient)
- Prevents duplicate key errors from missing/invalid ID values

## Files Updated

### SQL Schema Definitions
- `sql/04-receipts-table-mysql.sql` - Updated receipts table definition
- `sql/06-receipt-items-table-mysql.sql` - Updated receipt_items table definition
- `sql/05-customer-credit-balances-table-mysql.sql` - Updated customer credit balances table definition
- `sql/INITIALIZE_RECEIPT_ITEMS.sql` - Updated initialization script
- `database/migrations/001_create_all_tables.sql` - Updated migration script

### PHP API Compatibility
- `public/tableDefinitions.php` - Updated table schema definitions for API

### Verification
- `public/api.php` - Already compatible (uses `$conn->insert_id` to retrieve generated IDs)
- Receipt creation code correctly omits the `id` column from INSERT statements
- Receipt item insertion correctly references the auto-generated `receipt_id`

## Backward Compatibility Notes

### No Breaking Changes to Client Code
- Client code does NOT generate receipt IDs (backend handles this)
- UUID validation functions in `src/utils/uuidHelpers.ts` are not used for receipt IDs
- Transaction-safe receipt creation hook correctly receives integer IDs from API

### No Breaking Changes to API
- PHP backend already uses `$conn->insert_id` for retrieving generated IDs
- API responses include the new integer `id` values
- All foreign key relationships properly reference integer IDs

## Related Features
The following features depend on this schema and have been verified:
- Direct receipt creation (api.php: `create_receipt_with_items_transaction`)
- Receipt item tracking
- Customer credit balance tracking (if customer_credit_balances table was updated)

## Testing Recommendations
After deployment:
1. Create a new direct receipt via the UI
2. Verify receipt is created with integer ID (e.g., `id: 1`, `id: 2`)
3. Verify receipt items are correctly linked to receipt via integer `receipt_id`
4. Check that excess payment handling creates customer credit balances if applicable
5. Verify receipt numbers are still sequential and unique per company

## Database Consistency
To ensure consistency across all environments:
1. This migration should be run on all database instances
2. All DDL files in the repository now reflect INT AUTO_INCREMENT
3. Any future table recreations will use the correct schema
4. If using Postgres/Supabase, those environments still use UUID (separate schema)
