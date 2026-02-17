-- =====================================================
-- QUICK COMMANDS FOR COMMON OPERATIONS
-- =====================================================
-- Copy and paste these commands to perform common tasks
-- Replace placeholders with your actual values

-- =====================================================
-- 1. INSERT COMPANY
-- =====================================================

INSERT INTO companies (
  name,
  email,
  phone,
  address,
  city,
  state,
  postal_code,
  country,
  registration_number,
  currency,
  fiscal_year_start,
  primary_color,
  is_active,
  status
) VALUES (
  'Medical Supplies Kenya Ltd',
  'info@medplusafrica.com',
  'Tel: 0741 207 690/0780 165 490',
  'P.O Box 85988-00200
Nairobi, Kenya',
  'Nairobi',
  'Nairobi County',
  '00200',
  'Kenya',
  'KRA/REG/12345678',
  'KES',
  1,
  '#FF8C42',
  true,
  'active'
)
RETURNING id, name, email;

-- =====================================================
-- 2. ADD TAX SETTING TO COMPANY
-- =====================================================

INSERT INTO tax_settings (company_id, name, rate, tax_number, is_active, is_default)
SELECT 
  id,
  'VAT (16%)',
  16.00,
  'P051658002D',
  true,
  true
FROM companies
WHERE name = 'Medical Supplies Kenya Ltd'
LIMIT 1;

-- =====================================================
-- 3. ADD PAYMENT METHOD
-- =====================================================

INSERT INTO payment_methods (company_id, code, name, icon_name, is_active)
SELECT 
  id,
  'mpesa',
  'M-Pesa',
  'Smartphone',
  true
FROM companies
WHERE name = 'Medical Supplies Kenya Ltd'
LIMIT 1
ON CONFLICT (company_id, code) DO NOTHING;

-- =====================================================
-- 4. VIEW ALL COMPANIES WITH DETAILS
-- =====================================================

SELECT 
  c.id,
  c.name,
  c.email,
  c.phone,
  c.city,
  c.country,
  c.currency,
  c.primary_color,
  c.is_active,
  c.created_at,
  COUNT(DISTINCT cu.id) as total_customers,
  COUNT(DISTINCT i.id) as total_invoices,
  COALESCE(SUM(i.total_amount), 0)::NUMERIC(15,2) as total_revenue
FROM companies c
LEFT JOIN customers cu ON c.id = cu.company_id AND cu.is_active = true
LEFT JOIN invoices i ON c.id = i.company_id
WHERE c.is_active = true
GROUP BY c.id, c.name, c.email, c.phone, c.city, c.country, c.currency, c.primary_color, c.is_active, c.created_at
ORDER BY c.created_at DESC;

-- =====================================================
-- 5. VIEW COMPANY WITH TAX SETTINGS
-- =====================================================

SELECT 
  c.id,
  c.name,
  c.email,
  c.phone,
  c.address,
  c.city,
  c.country,
  c.registration_number,
  c.currency,
  c.fiscal_year_start,
  c.logo_url,
  c.primary_color,
  json_agg(
    DISTINCT json_build_object(
      'id', t.id,
      'name', t.name,
      'rate', t.rate,
      'tax_number', t.tax_number,
      'is_default', t.is_default
    ) ORDER BY t.is_default DESC
  ) FILTER (WHERE t.id IS NOT NULL) as tax_settings,
  c.is_active,
  c.created_at,
  c.updated_at
FROM companies c
LEFT JOIN tax_settings t ON c.id = t.company_id AND t.is_active = true
WHERE c.name = 'Medical Supplies Kenya Ltd'
GROUP BY c.id, c.name, c.email, c.phone, c.address, c.city, c.country, 
         c.registration_number, c.currency, c.fiscal_year_start, c.logo_url, 
         c.primary_color, c.is_active, c.created_at, c.updated_at;

-- =====================================================
-- 6. UPDATE COMPANY INFO
-- =====================================================

UPDATE companies
SET 
  email = 'newemail@medplusafrica.com',
  phone = 'Tel: 0700 000000',
  primary_color = '#2563EB',
  updated_at = NOW()
WHERE name = 'Medical Supplies Kenya Ltd';

-- =====================================================
-- 7. UPDATE COMPANY LOGO
-- =====================================================

UPDATE companies
SET 
  logo_url = 'https://example.com/logo.png',
  updated_at = NOW()
WHERE id = 'YOUR_COMPANY_ID_HERE';

-- =====================================================
-- 8. ADD CUSTOMER TO COMPANY
-- =====================================================

INSERT INTO customers (
  company_id,
  customer_code,
  name,
  email,
  phone,
  address,
  city,
  country,
  credit_limit,
  payment_terms,
  is_active
)
SELECT 
  id,
  'CUST001',
  'Simon Gichuki',
  'simon@example.com',
  '+254 700 000000',
  'Enter customer address',
  'Nairobi',
  'Kenya',
  100000.00,
  14,
  true
FROM companies
WHERE name = 'Medical Supplies Kenya Ltd'
LIMIT 1;

-- =====================================================
-- 9. VIEW ALL CUSTOMERS FOR COMPANY
-- =====================================================

SELECT 
  c.id,
  c.customer_code,
  c.name,
  c.email,
  c.phone,
  c.city,
  c.credit_limit,
  c.payment_terms,
  c.is_active,
  c.created_at,
  COUNT(DISTINCT i.id) as total_invoices,
  COALESCE(SUM(i.total_amount), 0)::NUMERIC(15,2) as total_purchase_value
FROM customers c
LEFT JOIN invoices i ON c.id = i.customer_id
WHERE c.company_id = (
  SELECT id FROM companies WHERE name = 'Medical Supplies Kenya Ltd'
)
GROUP BY c.id, c.customer_code, c.name, c.email, c.phone, c.city, c.credit_limit, c.payment_terms, c.is_active, c.created_at
ORDER BY c.created_at DESC;

-- =====================================================
-- 10. CREATE INVOICE
-- =====================================================

INSERT INTO invoices (
  company_id,
  customer_id,
  invoice_number,
  invoice_date,
  due_date,
  subtotal,
  tax_amount,
  total_amount,
  paid_amount,
  balance_due,
  status,
  notes
)
SELECT 
  co.id as company_id,
  cu.id as customer_id,
  'INV001',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '14 days',
  10000.00,
  1600.00,
  11600.00,
  0.00,
  11600.00,
  'draft',
  'Initial invoice'
FROM companies co
CROSS JOIN customers cu
WHERE co.name = 'Medical Supplies Kenya Ltd' 
  AND cu.customer_code = 'CUST001'
LIMIT 1
RETURNING id, invoice_number, total_amount;

-- =====================================================
-- 11. RECORD PAYMENT
-- =====================================================

INSERT INTO payments (
  company_id,
  customer_id,
  invoice_id,
  payment_number,
  payment_date,
  amount,
  payment_method,
  reference_number,
  notes,
  status
)
SELECT 
  co.id,
  cu.id,
  i.id,
  'PMT001',
  CURRENT_DATE,
  5000.00,
  'Bank Transfer',
  'REF123456',
  'Partial payment received',
  'completed'
FROM companies co
CROSS JOIN customers cu
CROSS JOIN invoices i
WHERE co.name = 'Medical Supplies Kenya Ltd'
  AND cu.customer_code = 'CUST001'
  AND i.invoice_number = 'INV001'
LIMIT 1
RETURNING id, payment_number, amount;

-- =====================================================
-- 12. UPDATE INVOICE PAYMENT STATUS
-- =====================================================

UPDATE invoices
SET 
  paid_amount = paid_amount + 5000.00,
  balance_due = total_amount - (paid_amount + 5000.00),
  status = CASE 
    WHEN (total_amount - (paid_amount + 5000.00)) <= 0 THEN 'paid'
    WHEN (paid_amount + 5000.00) > 0 THEN 'partial'
    ELSE 'draft'
  END,
  updated_at = NOW()
WHERE invoice_number = 'INV001'
  AND company_id = (
    SELECT id FROM companies WHERE name = 'Medical Supplies Kenya Ltd'
  );

-- =====================================================
-- 13. CHECK OUTSTANDING INVOICES
-- =====================================================

SELECT 
  c.customer_code,
  c.name,
  i.invoice_number,
  i.invoice_date,
  i.due_date,
  i.total_amount,
  i.paid_amount,
  i.balance_due,
  i.status,
  CASE 
    WHEN i.due_date < CURRENT_DATE AND i.balance_due > 0 THEN 'OVERDUE'
    WHEN i.due_date = CURRENT_DATE AND i.balance_due > 0 THEN 'DUE TODAY'
    WHEN i.due_date > CURRENT_DATE AND i.balance_due > 0 THEN 'PENDING'
    ELSE 'OK'
  END as payment_status
FROM invoices i
JOIN customers c ON i.customer_id = c.id
WHERE i.company_id = (
  SELECT id FROM companies WHERE name = 'Medical Supplies Kenya Ltd'
)
AND i.balance_due > 0
AND i.status != 'cancelled'
ORDER BY i.due_date ASC;

-- =====================================================
-- 14. ADD PRODUCT/INVENTORY ITEM
-- =====================================================

INSERT INTO products (
  company_id,
  product_code,
  name,
  description,
  sku,
  unit_price,
  cost_price,
  quantity_on_hand,
  reorder_level,
  is_active
)
SELECT 
  id,
  'PROD001',
  'Medical Gloves (Box of 100)',
  'Disposable latex gloves, size M',
  'GLOVE-M-100',
  150.00,
  80.00,
  500,
  100,
  true
FROM companies
WHERE name = 'Medical Supplies Kenya Ltd'
LIMIT 1;

-- =====================================================
-- 15. VERIFY SCHEMA
-- =====================================================

-- Check if all required tables exist
SELECT 
  table_name,
  count(*) as column_count
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
AND t.table_name IN (
  'companies', 'tax_settings', 'customers', 'invoices', 
  'payments', 'products', 'quotations', 'payment_methods',
  'units_of_measure'
)
GROUP BY t.table_name
ORDER BY t.table_name;

-- =====================================================
-- 16. DATABASE STATISTICS
-- =====================================================

SELECT 
  'companies' as table_name, COUNT(*) as row_count FROM companies
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'invoices', COUNT(*) FROM invoices
UNION ALL
SELECT 'payments', COUNT(*) FROM payments
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'tax_settings', COUNT(*) FROM tax_settings
UNION ALL
SELECT 'payment_methods', COUNT(*) FROM payment_methods
ORDER BY table_name;

-- =====================================================
-- 17. RESET DATABASE (CAUTION! - DELETES ALL DATA)
-- =====================================================

/*
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS quotations CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS tax_settings CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS units_of_measure CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
*/

-- =====================================================
-- 18. SOFT DELETE COMPANY (keeps data, marks inactive)
-- =====================================================

UPDATE companies
SET 
  is_active = false,
  status = 'archived',
  updated_at = NOW()
WHERE name = 'Medical Supplies Kenya Ltd';

-- =====================================================
-- 19. REACTIVATE COMPANY
-- =====================================================

UPDATE companies
SET 
  is_active = true,
  status = 'active',
  updated_at = NOW()
WHERE name = 'Medical Supplies Kenya Ltd';

-- =====================================================
-- 20. EXPORT COMPANY DATA (for backup/audit)
-- =====================================================

COPY (
  SELECT 
    c.id,
    c.name,
    c.email,
    c.phone,
    c.address,
    c.city,
    c.country,
    c.registration_number,
    c.currency,
    c.is_active,
    c.created_at
  FROM companies c
  WHERE c.is_active = true
  ORDER BY c.created_at DESC
) TO STDOUT WITH CSV HEADER;
