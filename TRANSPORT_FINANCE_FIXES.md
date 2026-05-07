# Transport Finance Payment System - Fixes

## Overview

This document outlines the critical fixes applied to resolve accounting and data integrity issues in the Transport Finance Payment System.

## Issues Fixed

### 1. **Stale Payment Status Field**
**Problem:** The `payment_status` field in `transport_finance` was manually updated by application logic but could become stale when payments were modified outside of the UI.

**Solution:**
- Added PostgreSQL triggers (`sync_payment_status()`, `sync_payment_status_on_delete()`) that automatically update `payment_status` whenever:
  - A payment record is inserted
  - A payment record is updated
  - A payment record is deleted
- Status is now derived from actual payment records: calculated as the source of truth

### 2. **Profit Calculation Issues**
**Problem:** Profit display and calculation were inconsistent with the formula (Selling Price - Total Expenses).

**Solution:**
- The existing `calculate_transport_profit()` trigger ensures profit is auto-calculated on insert/update
- Formula: `profit_loss = selling_price - (buying_price + fuel_cost + driver_fees + other_expenses)`
- This cannot be manually overridden; it's enforced at the database level

### 3. **Duplicate Records**
**Problem:** Multiple identical trip records existed with different payment statuses, causing data confusion.

**Solution:**
- Data cleanup script removes duplicates, keeping only the earliest record (by creation date)
- Added unique constraint consideration for `(company_id, vehicle_id, material_id, customer_name, date)`

### 4. **Negative Profit Display**
**Problem:** Records showed impossible states (negative profit marked as "paid" with zero amounts).

**Solution:**
- Negative profit records are flagged as `pending` for manual review
- These indicate either:
  - Data entry errors (selling price < costs)
  - Margin transactions
  - Requires investigation (logged in `payment_status_changes` audit trail)

### 5. **Missing Payment Reconciliation**
**Problem:** No mechanism to sync payment status when payments were recorded outside the system.

**Solution:**
- Added comprehensive reconciliation logic in SQL that:
  - Calculates total paid from all payment records for a trip
  - Determines correct status based on rules:
    - `paid`: total_paid >= selling_price
    - `pending`: total_paid > 0 AND total_paid < selling_price
    - `unpaid`: total_paid = 0
  - Updates transport_finance record if status differs

### 6. **Manual Payment Status Editing**
**Problem:** Users could manually set payment_status to inconsistent values.

**Solution:**
- UI components (`EditTransportFinanceModal`, `TransportFinanceModal`) now show payment_status as **read-only**
- Added informational text: "Auto-calculated from recorded payments"
- Enforced at database level with `validate_payment_status()` trigger that overrides manual changes

### 7. **Missing Audit Trail**
**Problem:** No tracking of when payment_status changed or who changed it.

**Solution:**
- Created `payment_status_changes` table to track:
  - trip_id: which transaction
  - old_status → new_status: what changed
  - total_paid, selling_price: context
  - changed_by: user who triggered the change
  - changed_at: timestamp
- Automatically logged whenever payment_status changes
- Provides complete audit trail for compliance and debugging

### 8. **Race Conditions and Orphaned Records**
**Problem:** Payments could be deleted or modified, leaving parent trip records in inconsistent state.

**Solution:**
- Triggers on `transport_payments` table handle all modification cases:
  - INSERT: sync status up
  - UPDATE: recalculate status
  - DELETE: recalculate status with remaining payments
- Foreign key constraint (`ON DELETE CASCADE`) ensures data consistency

## Implementation Details

### Database Changes

**New Tables:**
- `payment_status_changes`: Audit trail for all status changes

**New Functions:**
- `sync_payment_status()`: Synchronizes status on insert/update of payments
- `sync_payment_status_on_delete()`: Synchronizes status on delete of payments
- `validate_payment_status()`: Enforces derived field pattern for payment_status

**New Triggers:**
- `transport_payments_after_insert`: Call sync_payment_status on payment insert
- `transport_payments_after_update`: Call sync_payment_status on payment update
- `transport_payments_after_delete`: Call sync_payment_status_on_delete on payment delete
- `transport_finance_enforce_payment_status`: Prevent manual edits to payment_status
- `transport_payments_audit_trigger`: Log all payment changes to audit_logs

### Application Code Changes

**useDatabase.ts:**
- Simplified `useCreateTransportPayment()` to remove manual status calculation
- Database triggers now handle status synchronization automatically
- Update and delete mutations already had proper query invalidation

**EditTransportFinanceModal.tsx:**
- Changed `payment_status` field from editable Select to read-only display
- Added informational text explaining auto-calculation
- Shows current status and notes it's derived from payments

**TransportFinanceModal.tsx:**
- Changed `payment_status` field from editable Select to read-only display
- Always defaults to "unpaid" for new records
- Added explanation that status updates automatically

### Data Cleanup

**Scripts provided:**

1. **transport_payment_fixes.sql**
   - Adds all triggers and functions
   - Removes duplicates
   - Reconciles payment statuses
   - Creates validation views

2. **transport_data_cleanup.sql**
   - Analysis queries to identify issues
   - Cleanup steps to fix data
   - Verification queries to confirm fixes
   - Generates audit reports

## Payment Status Rules

Payment status is now **always** derived using this formula:

```
IF total_paid >= selling_price THEN 'paid'
ELSE IF total_paid > 0 THEN 'pending'
ELSE 'unpaid'
```

Where:
- `total_paid` = SUM(payment_amount) from all transport_payments for this trip
- `selling_price` = the trip's selling price

## How to Deploy

### Step 1: Run Migration
```sql
-- Apply all triggers, functions, and new tables
\i sql/transport_payment_fixes.sql
```

### Step 2: Run Data Cleanup
```sql
-- Fix existing data issues
\i sql/transport_data_cleanup.sql
```

### Step 3: Deploy Code Changes
- Update the application code (useDatabase.ts, modal components)
- All changes are backward compatible

### Step 4: Verify
- Check `payment_integrity_check` view for any remaining issues
- Review `payment_status_changes` audit table
- Test payment recording flow with a test trip

## Verification Checklist

- [ ] `SELECT COUNT(*) FROM transport_payments WHERE trip_id NOT IN (SELECT id FROM transport_finance);` returns 0
- [ ] `SELECT COUNT(*) FROM transport_finance tf1 WHERE EXISTS (SELECT 1 FROM transport_finance tf2 WHERE tf1.id != tf2.id AND tf1.company_id = tf2.company_id AND tf1.vehicle_id = tf2.vehicle_id AND tf1.material_id = tf2.material_id AND tf1.date = tf2.date);` returns 0
- [ ] All records in `payment_integrity_check` view show data_integrity = 'ok'
- [ ] UI shows payment_status as read-only in modals
- [ ] Recording a payment updates payment_status automatically
- [ ] Deleting a payment recalculates payment_status correctly

## Monitoring

After deployment, monitor:

1. **payment_status_changes table**
   - Should have entries for all status transitions
   - Helps identify unusual patterns

2. **payment_integrity_check view**
   - Run regularly to catch any new inconsistencies
   - Should show all records as 'ok'

3. **negative_profit records**
   - Manually review records with profit_loss < 0
   - These need root cause analysis

## Future Enhancements

1. **Webhook notifications** when payment_status changes
2. **Payment reconciliation dashboard** showing outstanding amounts
3. **Bulk payment operations** with transaction safety
4. **Payment scheduling** and reminders
5. **Integration with accounting system** for automatic GL posting

## Rollback Plan

If needed to rollback:

```sql
-- Remove new triggers
DROP TRIGGER IF EXISTS transport_payments_after_insert ON transport_payments;
DROP TRIGGER IF EXISTS transport_payments_after_update ON transport_payments;
DROP TRIGGER IF EXISTS transport_payments_after_delete ON transport_payments;
DROP TRIGGER IF EXISTS transport_finance_enforce_payment_status ON transport_finance;
DROP TRIGGER IF EXISTS transport_payments_audit_trigger ON transport_payments;

-- Remove new functions
DROP FUNCTION IF EXISTS sync_payment_status();
DROP FUNCTION IF EXISTS sync_payment_status_on_delete();
DROP FUNCTION IF EXISTS validate_payment_status();

-- Remove new tables
DROP TABLE IF EXISTS payment_status_changes;
DROP VIEW IF EXISTS payment_integrity_check;
```

Then revert code changes to application files.

## Support

For issues or questions about these fixes, refer to:
- SQL: Check `payment_status_changes` table for audit trail
- Application: Review console logs during payment operations
- Database: Run `payment_integrity_check` view to diagnose issues
