-- =====================================================
-- RECEIPT ITEMS TABLE (MySQL)
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
  id CHAR(36) PRIMARY KEY COMMENT 'UUID identifier',
  receipt_id CHAR(36) NOT NULL COMMENT 'Foreign key to receipts',
  product_id CHAR(36) COMMENT 'Foreign key to products (optional)',
  
  -- Item Description
  description TEXT NOT NULL COMMENT 'Item description',
  
  -- Quantity and Pricing
  quantity DECIMAL(10, 3) NOT NULL COMMENT 'Item quantity',
  unit_price DECIMAL(15, 2) NOT NULL COMMENT 'Price per unit',
  
  -- Tax Information
  tax_percentage DECIMAL(5, 2) DEFAULT 0 COMMENT 'Tax percentage',
  tax_amount DECIMAL(15, 2) DEFAULT 0 COMMENT 'Calculated tax amount',
  tax_inclusive TINYINT(1) DEFAULT 0 COMMENT 'Whether tax is included in unit price',
  
  -- Discount (before VAT)
  discount_before_vat DECIMAL(15, 2) DEFAULT 0 COMMENT 'Discount applied before tax',
  
  -- Tax Setting Reference (for audit purposes)
  tax_setting_id CHAR(36) COMMENT 'Reference to tax_settings for audit',
  
  -- Line Total (quantity * unit_price + adjustments)
  line_total DECIMAL(15, 2) NOT NULL COMMENT 'Total for this line item',
  
  -- Optional Notes
  notes TEXT COMMENT 'Additional notes for this item',
  
  -- Sort Order
  sort_order INT DEFAULT 0 COMMENT 'Display order',
  
  -- Audit Fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When item was created',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last updated',
  
  -- Foreign Keys
  FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  
  -- Indexes
  INDEX idx_receipt_items_receipt_id (receipt_id),
  INDEX idx_receipt_items_product_id (product_id),
  INDEX idx_receipt_items_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
