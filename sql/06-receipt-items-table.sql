-- =====================================================
-- RECEIPT ITEMS TABLE (PostgreSQL)
-- =====================================================
-- Line items specific to each receipt
-- This table provides a dedicated place for receipt line items,
-- decoupled from invoice items to ensure receipts retain their
-- exact items even if the invoice is modified later
--
-- Relationships:
-- - Each receipt_item belongs to exactly one receipt (many-to-one)
-- - Each receipt_item can reference a product (optional)

CREATE TABLE IF NOT EXISTS receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  product_id UUID,
  
  -- Item Description
  description TEXT NOT NULL,
  
  -- Quantity and Pricing
  quantity DECIMAL(10, 3) NOT NULL,
  unit_price DECIMAL(15, 2) NOT NULL,
  
  -- Tax Information
  tax_percentage DECIMAL(5, 2) DEFAULT 0,
  tax_amount DECIMAL(15, 2) DEFAULT 0,
  tax_inclusive BOOLEAN DEFAULT FALSE,
  
  -- Discount (before VAT)
  discount_before_vat DECIMAL(15, 2) DEFAULT 0,
  
  -- Tax Setting Reference (for audit purposes)
  tax_setting_id UUID,
  
  -- Line Total (quantity * unit_price + adjustments)
  line_total DECIMAL(15, 2) NOT NULL,
  
  -- Optional Notes
  notes TEXT,
  
  -- Sort Order
  sort_order INT DEFAULT 0,
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_receipt_items_receipt_id ON receipt_items(receipt_id);
CREATE INDEX IF NOT EXISTS idx_receipt_items_product_id ON receipt_items(product_id);
CREATE INDEX IF NOT EXISTS idx_receipt_items_created_at ON receipt_items(created_at DESC);
