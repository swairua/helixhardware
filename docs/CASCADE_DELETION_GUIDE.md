# Invoice and Payment Cascade Deletion Implementation Guide

## Overview

This document describes the cascade deletion implementation for invoices and payments in the invoice management system. The system ensures that when invoices or receipts/payments are deleted, all related records are properly cleaned up to maintain database integrity.

## Table of Contents

1. [Architecture](#architecture)
2. [Invoice Deletion Flow](#invoice-deletion-flow)
3. [Receipt/Payment Deletion Flow](#receipt-deletion-flow)
4. [Database Constraints](#database-constraints)
5. [Error Handling & Transactions](#error-handling--transactions)
6. [Testing](#testing)
7. [Implementation Details](#implementation-details)
8. [Troubleshooting](#troubleshooting)

---

## Architecture

### Deletion Strategy

The system uses **explicit deletion with transaction control** rather than relying solely on database cascade constraints. This approach provides:

- **Explicit ordering**: Ensures records are deleted in the correct dependency order
- **Atomicity**: All deletions happen together; if any fail, all are rolled back
- **Auditability**: Clear log of what was deleted and in what order
- **Control**: Ability to handle special cases (e.g., payment audit logs)

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Explicit deletion in code | Safer than relying on DB constraints alone; easier to debug |
| Transaction wrapping | Ensures atomicity: all-or-nothing deletion |
| Payment audit log handling | Explicitly delete before payments to maintain referential integrity |
| Invoice balance recalculation | Properly handle partial payment deletion |

---

## Invoice Deletion Flow

### Endpoint

```
POST /api.php
Content-Type: application/json

{
  "action": "delete_invoice_with_cascade",
  "invoice_id": "invoice-uuid"
}
```

### Deletion Order (Sequential)

1. **Fetch invoice details** (before deletion, for response)
   - Verifies invoice exists
   - Captures invoice_number for response

2. **Find all related payments**
   - Payments directly linked: `WHERE invoice_id = ?`
   - Payments allocated to this invoice: `WHERE payment_id IN (SELECT payment_id FROM payment_allocations WHERE invoice_id = ?)`

3. **Delete payment_audit_log entries** (must be before payments)
   - Deletes all audit records for the payments
   - Also deletes any audit records directly linked to the invoice

4. **Delete receipt records** (linked to those payments)
   - First delete receipt_items (due to FK constraint)
   - Then delete receipts themselves

5. **Delete payment_allocations**
   - Removes the link between payments and this invoice
   - Critical if payments are shared with other invoices

6. **Delete payments**
   - Deletes payment records directly linked to invoice

7. **Delete credit_note_allocations**
   - Removes credit notes allocated to this invoice

8. **Delete stock_movements**
   - Removes inventory movements traced to this invoice
   - Criteria: `WHERE reference_type = 'INVOICE' AND reference_id = ?`

9. **Delete invoice_items**
   - Removes line items from the invoice

10. **Delete invoice** (last)
    - Deletes the main invoice record

### Example Response

**Success:**
```json
{
  "status": "success",
  "message": "Invoice INV-2024-001 and all related records deleted successfully",
  "data": {
    "invoice_id": "invoice-uuid",
    "invoice_number": "INV-2024-001",
    "related_records_deleted": {
      "payments_count": 2,
      "timestamp": "2024-01-15 10:30:45"
    }
  }
}
```

**Error:**
```json
{
  "status": "error",
  "message": "Invoice deletion failed: Failed to delete payment allocations: [error details]"
}
```

### Transaction Behavior

```
BEGIN TRANSACTION
  [Execute 10 deletion steps above]
  COMMIT
ON ERROR:
  ROLLBACK (all deletions are undone)
```

---

## Receipt Deletion Flow

### Endpoint

```
POST /api.php
Content-Type: application/json

{
  "action": "delete_receipt_with_cascade",
  "receipt_id": "receipt-uuid"
}
```

### Deletion Order (Sequential)

1. **Fetch receipt details** (before deletion)
   - Verifies receipt exists
   - Captures: receipt_number, payment_id, invoice_id, total_amount

2. **Delete receipt_items**
   - Removes line items from the receipt snapshot

3. **Delete payment_audit_log entries** (must be before payment)
   - Cleans up all audit records for the payment

4. **Delete payment_allocations**
   - Removes link between payment and all invoices

5. **Delete payment** (if linked)
   - Removes the payment record

6. **Recalculate invoice balance** (if linked to invoice)
   - Calculate remaining paid_amount from other payment_allocations
   - Determine new status:
     - If paid_amount >= total_amount → "paid"
     - If paid_amount > 0 → "partial"
     - If paid_amount = 0 → "draft"
   - Update: status, paid_amount, balance_due

7. **Delete receipt** (last)
   - Removes the receipt record

### Example Response

**Success:**
```json
{
  "status": "success",
  "message": "Receipt RCP-2024-0001 and all related records deleted successfully",
  "data": {
    "receipt_id": "receipt-uuid",
    "receipt_number": "RCP-2024-0001",
    "invoice_id": "invoice-uuid",
    "payment_id": "payment-uuid",
    "amount_reversed": 1000.00
  }
}
```

### Invoice Status Logic After Receipt Deletion

| Scenario | Before | After | Reason |
|----------|--------|-------|--------|
| Paid, 1 receipt | paid | draft | All payments removed |
| Paid, 2 receipts, delete 1 | paid | partial | $500/$1000 remains |
| Partial, 2 receipts, delete 1 | partial | draft | All allocations removed |
| Draft, 1 receipt | draft | draft | No change (already draft) |

---

## Database Constraints

### Foreign Key Relationships

All relationships with "ON DELETE CASCADE" in schema are handled explicitly in code:

```
invoices
  ├── invoice_items (ON DELETE CASCADE)
  ├── payment_allocations (ON DELETE CASCADE)
  ├── credit_note_allocations (ON DELETE CASCADE)
  └── payment_audit_log (ON DELETE CASCADE)

payments
  ├── payment_allocations (ON DELETE CASCADE)
  ├── payment_audit_log (ON DELETE CASCADE)
  └── receipts (ON DELETE SET NULL)

receipts
  └── receipt_items (ON DELETE CASCADE)
```

### Deletion Priority

The code deletes records in this order to respect constraints:

1. **Audit logs** - Can reference payments
2. **Receipts** - Can reference payments
3. **Allocations** - Bridge tables between entities
4. **Main records** - Invoices and payments
5. **References** - Credit notes, stock movements

---

## Error Handling & Transactions

### Transaction Safety

All deletion operations are wrapped in database transactions:

```php
if (!$conn->begin_transaction()) {
    throw new Exception("Failed to start transaction");
}

try {
    // Perform all deletions
    
    if (!$conn->commit()) {
        throw new Exception("Failed to commit transaction");
    }
} catch (Exception $e) {
    $conn->rollback();
    // Return error response
}
```

### Error Scenarios

| Error | Cause | Recovery |
|-------|-------|----------|
| "Invoice not found" | Invalid invoice_id | Check ID format and existence |
| "Failed to delete payment allocations" | Constraint violation | Check if payment is locked |
| "Failed to update invoice status" | Invalid status value | Check invoice state |
| "Failed to commit transaction" | Database error | Retry or check logs |

### Partial Failure Handling

If any step fails:
1. Exception is thrown with detailed message
2. Transaction is rolled back
3. All records remain unchanged (atomic operation)
4. Error response is returned with details

---

## Testing

### Test Coverage

The test suite (`tests/cascade-deletion.test.ts`) covers:

#### Basic Invoice Deletion
- ✅ Deletes invoice_items
- ✅ Deletes payment_allocations
- ✅ Deletes payments
- ✅ Deletes credit_note_allocations
- ✅ Deletes payment_audit_log entries
- ✅ Deletes stock_movements
- ✅ Deletes receipt records
- ✅ Deletes invoice itself

#### Complex Scenarios
- ✅ Multiple payments on one invoice
- ✅ Payments allocated to multiple invoices
- ✅ Partial vs fully paid invoices
- ✅ Invoices in different statuses (draft, paid, partial)
- ✅ Transaction rollback on error

#### Receipt Deletion
- ✅ Deletes receipt_items
- ✅ Deletes payment_audit_log
- ✅ Deletes associated payment
- ✅ Recalculates invoice balance
- ✅ Updates invoice status correctly
- ✅ Handles receipts without invoices

#### Edge Cases
- ✅ Zero-amount receipts
- ✅ Receipts with excess amounts
- ✅ Orphaned record detection
- ✅ Error handling
- ✅ Invalid IDs

### Running Tests

```bash
# Install dependencies
npm install

# Run cascade deletion tests
npm test -- cascade-deletion.test.ts

# Run all tests
npm test

# Run with coverage
npm test -- --coverage
```

### Manual Testing

1. **Create test data**:
   ```sql
   INSERT INTO invoices (...) VALUES (...);
   INSERT INTO invoice_items (...) VALUES (...);
   INSERT INTO payments (...) VALUES (...);
   INSERT INTO payment_allocations (...) VALUES (...);
   INSERT INTO payment_audit_log (...) VALUES (...);
   ```

2. **Delete invoice**:
   ```bash
   curl -X POST http://localhost:3000/api.php \
     -H "Content-Type: application/json" \
     -d '{"action":"delete_invoice_with_cascade","invoice_id":"uuid"}'
   ```

3. **Verify deletion**:
   ```sql
   SELECT COUNT(*) FROM invoices WHERE id = 'uuid';
   SELECT COUNT(*) FROM invoice_items WHERE invoice_id = 'uuid';
   SELECT COUNT(*) FROM payments WHERE invoice_id = 'uuid';
   SELECT COUNT(*) FROM payment_audit_log WHERE invoice_id = 'uuid';
   ```

---

## Implementation Details

### Code Location

- **Invoice deletion**: `public/api.php:1679-1801` (`delete_invoice_with_cascade` action)
- **Receipt deletion**: `public/api.php:2447-2565` (`delete_receipt_with_cascade` action)

### Key Functions

#### delete_invoice_with_cascade()

Handles complete invoice deletion with all cascading deletes.

**Parameters:**
- `invoice_id` (required): UUID of invoice to delete

**Logic:**
1. Find all related payments
2. Delete audit logs
3. Delete receipts
4. Delete allocations
5. Delete payments
6. Delete credit allocations
7. Delete stock movements
8. Delete items
9. Delete invoice

#### delete_receipt_with_cascade()

Handles receipt deletion with payment cleanup and invoice balance recalculation.

**Parameters:**
- `receipt_id` (required): UUID of receipt to delete

**Logic:**
1. Delete receipt items
2. Delete payment audit logs
3. Delete payment allocations
4. Delete payment
5. Recalculate invoice balance
6. Delete receipt

### Helper Methods

#### Finding Related Records

```php
// Find all payments related to invoice
$payments_sql = "
    SELECT DISTINCT p.id FROM payments p
    WHERE p.invoice_id = '$invoice_id_e'
    OR p.id IN (
        SELECT payment_id FROM payment_allocations 
        WHERE invoice_id = '$invoice_id_e'
    )
";
```

#### Recalculating Invoice Balance

```php
// Calculate remaining paid amount
$paid_sum_sql = "
    SELECT COALESCE(SUM(pa.amount), 0) as paid_amount
    FROM payment_allocations pa
    WHERE pa.invoice_id = '$invoice_id_e'
";

// Determine status
if ($paid_amount >= $total_amount) {
    $new_status = 'paid';
} elseif ($paid_amount > 0) {
    $new_status = 'partial';
} else {
    $new_status = 'draft';
}
```

---

## Troubleshooting

### Issue: "Failed to delete payment allocations"

**Cause**: Payment is locked or constraint violation

**Solution**:
1. Check if payment is in a locked state
2. Verify no other constraints prevent deletion
3. Check database logs: `SELECT * FROM payment_allocations WHERE invoice_id = ?`

### Issue: "Invoice deletion failed: [error]" with no details

**Cause**: Generic error handling

**Solution**:
1. Check application error log
2. Enable debug logging in API
3. Check database transaction log

### Issue: Orphaned records remain after deletion

**Cause**: Deletion order issue or incomplete implementation

**Solution**:
1. Run verification query:
   ```sql
   SELECT * FROM payment_audit_log WHERE invoice_id = 'deleted-id';
   SELECT * FROM receipt_items WHERE receipt_id IN 
     (SELECT id FROM receipts WHERE invoice_id = 'deleted-id');
   ```
2. Check implementation against this guide
3. Verify all related tables were handled

### Issue: Invoice status not updating correctly after receipt deletion

**Cause**: Balance recalculation issue

**Solution**:
1. Check remaining payment_allocations:
   ```sql
   SELECT SUM(amount) FROM payment_allocations 
   WHERE invoice_id = ?;
   ```
2. Verify status logic in code
3. Check for other payments allocated to this invoice

### Issue: Transaction rollback happening unexpectedly

**Cause**: One of the deletion steps is failing

**Solution**:
1. Check error message from API response
2. Run each delete statement individually to find the failing one
3. Check for FK constraint violations
4. Look at application error log for detailed error

---

## Future Improvements

### Potential Enhancements

1. **Soft Deletes**: Instead of hard delete, mark records as deleted
2. **Audit Trail**: Log what was deleted, by whom, when
3. **Selective Deletion**: Allow user to choose what gets deleted
4. **Archive**: Move deleted records to archive tables
5. **Undo Capability**: Allow reverting deletions within a time window
6. **Batch Deletion**: Ability to delete multiple invoices in one operation

### Monitoring

- Add metrics for deletion success/failure rates
- Log deletion operations for compliance
- Set up alerts for cascading deletion failures
- Track impact on database performance

---

## Related Documentation

- [Database Schema Guide](./DATABASE_SCHEMA.md)
- [API Reference](./API_REFERENCE.md)
- [Payment Allocation System](./PAYMENT_ALLOCATION_SYSTEM.md)
- [Invoice Management](./INVOICE_MANAGEMENT.md)

---

## Support & Contact

For questions or issues regarding cascade deletion:

1. Check this guide first
2. Review test cases in `tests/cascade-deletion.test.ts`
3. Check application logs in error_log()
4. Contact database team for constraint issues
5. File bug report with:
   - Invoice/Receipt ID
   - Error message
   - Database state (before deletion)
   - Steps to reproduce
