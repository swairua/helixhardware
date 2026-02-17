-- =====================================================
-- MIGRATION: Fix payment_allocations cascading deletion
-- =====================================================
-- This migration adds proper foreign key constraints with CASCADE rules
-- to the payment_allocations table to ensure data consistency when
-- payments or invoices are deleted.
--
-- Issue: payment_allocations table was missing FK constraints,
-- causing orphaned records when payments or invoices were deleted.

-- MySQL Version
-- Drop existing foreign keys if they exist (MySQL)
ALTER TABLE `payment_allocations` DROP FOREIGN KEY IF EXISTS `fk_payment_allocations_payment_id`;
ALTER TABLE `payment_allocations` DROP FOREIGN KEY IF EXISTS `fk_payment_allocations_invoice_id`;

-- Add proper foreign keys with CASCADE on delete
ALTER TABLE `payment_allocations`
ADD CONSTRAINT `fk_payment_allocations_payment_id`
FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON DELETE CASCADE,
ADD CONSTRAINT `fk_payment_allocations_invoice_id`
FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE;

-- Verify the constraints were added
-- SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
-- FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
-- WHERE TABLE_NAME = 'payment_allocations' AND COLUMN_NAME IN ('payment_id', 'invoice_id');
