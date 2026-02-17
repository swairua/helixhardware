-- =====================================================
-- MIGRATION: Fix payment_allocations cascading deletion (PostgreSQL)
-- =====================================================
-- This migration adds proper foreign key constraints with CASCADE rules
-- to the payment_allocations table to ensure data consistency when
-- payments or invoices are deleted.
--
-- Issue: payment_allocations table was missing FK constraints,
-- causing orphaned records when payments or invoices were deleted.

-- PostgreSQL Version
-- Drop existing foreign keys if they exist
ALTER TABLE payment_allocations DROP CONSTRAINT IF EXISTS fk_payment_allocations_payment_id CASCADE;
ALTER TABLE payment_allocations DROP CONSTRAINT IF EXISTS fk_payment_allocations_invoice_id CASCADE;

-- Add proper foreign keys with CASCADE on delete
ALTER TABLE payment_allocations
ADD CONSTRAINT fk_payment_allocations_payment_id
FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_payment_allocations_invoice_id
FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE;

-- Verify the constraints were added
-- SELECT constraint_name, table_name, column_name, referenced_table_name
-- FROM information_schema.key_column_usage
-- WHERE table_name = 'payment_allocations' AND column_name IN ('payment_id', 'invoice_id');
