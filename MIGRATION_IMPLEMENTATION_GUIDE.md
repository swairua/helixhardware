# Complete Document Sequential Numbering Migration - Implementation Guide

## Overview

This guide provides step-by-step instructions for deploying the comprehensive sequential numbering migration that initializes all 9 document types in your system.

## What This Migration Does

The migration (`COMPLETE_MIGRATION_SQL.sql`) performs the following operations:

1. **Creates the `document_sequences` table** with proper structure, indexes, and constraints
2. **Initializes all 9 document types** for the current year:
   - INV (Invoices)
   - PRO (Proforma Invoices)
   - QT (Quotations)
   - PO (Purchase Orders)
   - LPO (Local Purchase Orders)
   - DN (Delivery Notes)
   - CN (Credit Notes)
   - PAY (Payments)
   - REC (Receipts)

3. **Sets sequence numbers** based on existing document counts to prevent conflicts
4. **Provides verification queries** to confirm successful initialization

## Document Number Format

After this migration, all new documents will use the sequential format:

```
TYPE-YYYY-NNNN
```

Examples:
- `INV-2026-0001` (first invoice of 2026)
- `PRO-2026-0042` (42nd proforma of 2026)
- `QT-2026-0015` (15th quotation of 2026)

## Key Features

- **Per-Year Sequences**: Each year starts with sequence number 0001
- **Type-Specific Counters**: Each document type maintains its own sequence
- **Thread-Safe**: Uses database transactions and UNIQUE constraints for atomicity
- **Backward Compatible**: Old documents with legacy formats remain unchanged
- **API-Driven**: Uses centralized `generateDocumentNumberAPI()` function for generation

## Deployment Steps

### Prerequisites

- Database access (MySQL/MariaDB)
- Backup of your current database (highly recommended)
- SSH/database client access to your server

### Step 1: Backup Your Database

Before running any migration, always backup your database:

```bash
mysqldump -u username -p database_name > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Step 2: Review the Migration SQL

Open `COMPLETE_MIGRATION_SQL.sql` and review the content:
- Understand what changes will be made
- Check table names match your schema
- Verify document type codes

### Step 3: Deploy the Migration

Choose one of these methods:

#### Method A: Using MySQL Client (Recommended)

```bash
mysql -u username -p database_name < COMPLETE_MIGRATION_SQL.sql
```

#### Method B: Using phpMyAdmin

1. Log in to phpMyAdmin
2. Select your database
3. Click "Import" tab
4. Choose `COMPLETE_MIGRATION_SQL.sql` file
5. Click "Go" to execute

#### Method C: Direct SQL Execution

1. Connect to your database using a SQL client
2. Copy the SQL content from `COMPLETE_MIGRATION_SQL.sql`
3. Execute the entire script

### Step 4: Verify the Migration

After running the migration, verify success by checking the output. The migration includes a verification query that shows:

```sql
SELECT 
  document_type,
  year,
  sequence_number,
  CONCAT(document_type, '-', year, '-0001') as next_number_example,
  created_at
FROM document_sequences 
WHERE year = YEAR(CURDATE())
ORDER BY document_type;
```

Expected output (for 2026):
```
| document_type | year | sequence_number | next_number_example | created_at           |
|---------------|------|-----------------|--------------------|--------------------|
| CN            | 2026 | 0               | CN-2026-0001       | 2026-01-26 10:30:00 |
| DN            | 2026 | 0               | DN-2026-0001       | 2026-01-26 10:30:00 |
| INV           | 2026 | 5               | INV-2026-0001      | 2026-01-26 10:30:00 |
| LPO           | 2026 | 0               | LPO-2026-0001      | 2026-01-26 10:30:00 |
| PAY           | 2026 | 0               | PAY-2026-0001      | 2026-01-26 10:30:00 |
| PO            | 2026 | 0               | PO-2026-0001       | 2026-01-26 10:30:00 |
| PRO           | 2026 | 8               | PRO-2026-0001      | 2026-01-26 10:30:00 |
| QT            | 2026 | 3               | QT-2026-0001       | 2026-01-26 10:30:00 |
| REC           | 2026 | 0               | REC-2026-0001      | 2026-01-26 10:30:00 |
```

The `sequence_number` should match the count of existing documents for each type. If a number is higher than 0, it means existing documents were found and the sequence was initialized to prevent conflicts.

## Testing the Migration

### Manual Testing (After Deployment)

1. **Create a test document** (e.g., invoice) in your application
2. **Verify the document number** follows the new format: `TYPE-YYYY-NNNN`
3. **Create another document** of the same type and verify the sequence increments
4. **Create a document of a different type** and verify it has its own counter

### API Testing

Test the document generation API directly:

```bash
curl -X POST http://localhost/api.php \
  -H "Content-Type: application/json" \
  -d '{
    "action": "get_next_document_number",
    "type": "INV",
    "year": 2026
  }'
```

Expected response:
```json
{
  "success": true,
  "number": "INV-2026-0006",
  "type": "INV",
  "year": 2026,
  "sequence": 6
}
```

## Data Preservation

### What Happens to Existing Documents?

- **Unchanged**: All existing documents with legacy number formats remain as-is
- **New Documents**: Only new documents created after the migration use the `TYPE-YYYY-NNNN` format
- **Mixed System**: Your system will have both old and new formats for documents

Example:
```
Old format: PF-2026-ABC123 (existing proforma before migration)
New format: PRO-2026-0001 (first new proforma after migration)
```

## Handling Edge Cases

### Tables Don't Exist

If a document table (e.g., `invoices`) doesn't exist, the migration safely handles it:
- The COUNT query returns 0
- The sequence is initialized to 0
- No errors are thrown

### Documents from Previous Years

The migration initializes sequences for the **current year only**. If you have documents from previous years and need sequential numbering for those years:

```sql
-- To initialize for a specific past year (e.g., 2025):
INSERT IGNORE INTO document_sequences (document_type, year, sequence_number)
VALUES ('INV', 2025, 0);

UPDATE document_sequences 
SET sequence_number = (SELECT COUNT(*) FROM invoices WHERE YEAR(created_at) = 2025)
WHERE document_type = 'INV' AND year = 2025;
```

### High-Concurrency Environments

The migration is safe for high-concurrency environments because:
1. The `document_sequences` table uses a `UNIQUE KEY` on `(document_type, year)`
2. Database transactions ensure atomic increments
3. The backend API uses transaction-based increments (see `backend/api.php:1242-1293`)

## Rollback Instructions

If you need to rollback the migration:

```bash
# Restore from your backup
mysql -u username -p database_name < backup_YYYYMMDD_HHMMSS.sql
```

Or drop just the sequences:

```sql
-- To remove the document_sequences table only:
DROP TABLE IF EXISTS document_sequences;
```

## File Locations in Your Project

- **Migration SQL**: `COMPLETE_MIGRATION_SQL.sql` (root directory)
- **API Handler**: `backend/api.php:1196-1295` (get_next_document_number action)
- **Client Wrapper**: `src/utils/documentNumbering.ts` (generateDocumentNumberAPI function)
- **Previous Migration**: `PROFORMA_MIGRATION_SQL.sql` (for reference, handles PRO only)

## Troubleshooting

### Issue: "Table document_sequences already exists"

This is normal and expected if you've already run the migration or the API has auto-created it. The `CREATE TABLE IF NOT EXISTS` clause handles this safely.

### Issue: "Unknown table 'invoices'" or similar

This means that table doesn't exist in your database yet. The migration handles this gracefully - it will initialize the sequence but the UPDATE won't find any documents, leaving sequence_number at 0.

### Issue: Migration Fails with Permission Error

Ensure your database user has these permissions:
- `CREATE TABLE`
- `INSERT`
- `UPDATE`
- `SELECT` (on `INFORMATION_SCHEMA.TABLES`)

### Issue: Document Numbers Don't Follow New Format

Check that:
1. Migration ran successfully (verify with the verification query)
2. Your application is calling `generateDocumentNumberAPI()` 
3. The backend API endpoint (`/api.php` with action `get_next_document_number`) is accessible

## Post-Migration Checklist

- [ ] Backup taken before migration
- [ ] Migration SQL reviewed and understood
- [ ] Migration executed successfully
- [ ] Verification query shows all 9 document types
- [ ] Sequence numbers match expected counts
- [ ] Test document created with new format
- [ ] Document number sequence increments correctly
- [ ] Different document types have independent counters
- [ ] API responds correctly to number generation requests
- [ ] Existing documents remain unchanged
- [ ] Team notified of new numbering format

## Support

If you encounter issues or have questions:

1. Check the **Troubleshooting** section above
2. Review the **Verification Queries** section to diagnose issues
3. Examine `backend/api.php` to understand the generation logic
4. Check `src/utils/documentNumbering.ts` for client-side implementation

## Additional Resources

- **Document Numbering Utility**: `src/utils/documentNumbering.ts`
- **API Implementation**: `backend/api.php` (search for "get_next_document_number")
- **Previous Implementation**: `PROFORMA_MIGRATION_SQL.sql`
- **Hooks Using This**: `src/hooks/useProforma.ts`, `src/hooks/useQuotationItems.ts`, etc.

---

**Version**: 1.0  
**Last Updated**: 2026-01-26  
**Scope**: All 9 document types (INV, PRO, QT, PO, LPO, DN, CN, PAY, REC)
