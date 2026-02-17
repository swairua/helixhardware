-- Stock Movements Constraint Fix
-- This script fixes the check constraint violations that occur when updating invoices
-- Problem: update_stock_on_invoice trigger was using lowercase 'out' and 'invoice'
--          but constraints require uppercase 'OUT' and 'INVOICE'

-- Step 1: Update any existing lowercase movement_type values to uppercase
UPDATE stock_movements 
SET movement_type = UPPER(movement_type) 
WHERE movement_type != UPPER(movement_type);

-- Step 2: Update any existing lowercase reference_type values to uppercase
UPDATE stock_movements 
SET reference_type = UPPER(reference_type) 
WHERE reference_type != UPPER(reference_type);

-- Step 3: Ensure constraints are in place with correct uppercase values
-- Drop old constraints if they exist (with any name pattern)
ALTER TABLE stock_movements DROP CONSTRAINT IF EXISTS stock_movements_type_check;
ALTER TABLE stock_movements DROP CONSTRAINT IF EXISTS stock_movements_reference_type_check;
ALTER TABLE stock_movements DROP CONSTRAINT IF EXISTS stock_movements_movement_type_check;

-- Add correct constraints with uppercase values
ALTER TABLE stock_movements 
ADD CONSTRAINT stock_movements_movement_type_check 
CHECK (movement_type IN ('IN', 'OUT', 'ADJUSTMENT'));

ALTER TABLE stock_movements 
ADD CONSTRAINT stock_movements_reference_type_check 
CHECK (reference_type IN ('INVOICE', 'DELIVERY_NOTE', 'RESTOCK', 'ADJUSTMENT', 'CREDIT_NOTE', 'PURCHASE', 'CREDIT_NOTE_REVERSAL'));

-- Verify fixes
SELECT 
  COUNT(*) as total_movements,
  COUNT(CASE WHEN movement_type NOT IN ('IN', 'OUT', 'ADJUSTMENT') THEN 1 END) as invalid_movement_types,
  COUNT(CASE WHEN reference_type NOT IN ('INVOICE', 'DELIVERY_NOTE', 'RESTOCK', 'ADJUSTMENT', 'CREDIT_NOTE', 'PURCHASE', 'CREDIT_NOTE_REVERSAL') THEN 1 END) as invalid_reference_types
FROM stock_movements;

-- If everything is fixed, both invalid counts should be 0
