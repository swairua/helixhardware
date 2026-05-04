-- ============================================================================
-- MIGRATION 002: Add display_as_percentage column to document tables
-- ============================================================================
-- Purpose: Add a boolean flag to quotations, proforma_invoices, and invoices
-- to track whether the document should display calculated amounts instead of
-- percentage columns in PDFs and views.
-- ============================================================================

-- Add display_as_percentage to quotations table
ALTER TABLE quotations ADD COLUMN display_as_percentage BOOLEAN DEFAULT FALSE COMMENT 'When true, display calculated amounts instead of percentages in PDF';

-- Add display_as_percentage to proforma_invoices table
ALTER TABLE proforma_invoices ADD COLUMN display_as_percentage BOOLEAN DEFAULT FALSE COMMENT 'When true, display calculated amounts instead of percentages in PDF';

-- Add display_as_percentage to invoices table
ALTER TABLE invoices ADD COLUMN display_as_percentage BOOLEAN DEFAULT FALSE COMMENT 'When true, display calculated amounts instead of percentages in PDF';

-- ============================================================================
-- VERIFICATION QUERIES (run manually if needed)
-- ============================================================================
-- DESCRIBE quotations;
-- DESCRIBE proforma_invoices;
-- DESCRIBE invoices;
