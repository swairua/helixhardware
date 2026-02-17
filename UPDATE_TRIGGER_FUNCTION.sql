-- Update the trigger function to use UPPERCASE movement_type and reference_type
-- This fixes the constraint violation when editing payments

CREATE OR REPLACE FUNCTION update_stock_on_invoice()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update stock when invoice status changes to 'sent' or 'paid'
    IF NEW.status IN ('sent', 'paid') AND (OLD.status IS NULL OR OLD.status NOT IN ('sent', 'paid')) THEN
        -- Decrease stock for each invoice item
        UPDATE products SET 
            stock_quantity = stock_quantity - ii.quantity,
            updated_at = NOW()
        FROM invoice_items ii 
        WHERE products.id = ii.product_id 
        AND ii.invoice_id = NEW.id;
        
        -- Create stock movement records
        INSERT INTO stock_movements (company_id, product_id, movement_type, quantity, reference_type, reference_id, reference_number, movement_date, created_by)
        SELECT 
            NEW.company_id,
            ii.product_id,
            'OUT',
            -ii.quantity,
            'INVOICE',
            NEW.id,
            NEW.invoice_number,
            NEW.invoice_date,
            NEW.created_by
        FROM invoice_items ii 
        WHERE ii.invoice_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verify the function was updated
SELECT pg_get_functiondef('update_stock_on_invoice()'::regprocedure);
