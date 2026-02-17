-- ============================================================================
-- MYSQL DATABASE SCHEMA
-- This is the MySQL equivalent of the PostgreSQL/Supabase schema
-- ============================================================================

-- Set MySQL mode for compatibility
SET SQL_MODE='STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';
SET FOREIGN_KEY_CHECKS=1;
SET UNIQUE_CHECKS=1;

-- ============================================================================
-- 1. CREATE DATABASE
-- ============================================================================

DROP DATABASE IF EXISTS app_database;
CREATE DATABASE app_database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE app_database;

-- ============================================================================
-- 2. CREATE ENUMS (MySQL ENUM type)
-- ============================================================================

-- Note: In MySQL, ENUM is defined inline in CREATE TABLE
-- The values are: 'admin', 'accountant', 'stock_manager', 'user', 'super_admin'
-- The values are: 'active', 'inactive', 'pending'
-- The values are: 'draft', 'sent', 'approved', 'received', 'cancelled'
-- The values are: 'draft', 'sent', 'approved', 'partial', 'paid', 'overdue', 'cancelled'

-- ============================================================================
-- 3. CREATE CORE TABLES
-- ============================================================================

-- Companies table (Multi-company support)
CREATE TABLE companies (
    id CHAR(36) PRIMARY KEY COMMENT 'UUID identifier',
    name VARCHAR(255) NOT NULL UNIQUE COMMENT 'Company name',
    email VARCHAR(255) COMMENT 'Company email',
    phone VARCHAR(50) COMMENT 'Company phone',
    address TEXT COMMENT 'Street address',
    city VARCHAR(100) COMMENT 'City',
    state VARCHAR(100) COMMENT 'State/Province',
    postal_code VARCHAR(20) COMMENT 'Postal code',
    country VARCHAR(100) COMMENT 'Country',
    website VARCHAR(255) COMMENT 'Website URL',
    logo_url VARCHAR(500) COMMENT 'Logo image URL',
    primary_color VARCHAR(7) DEFAULT '#FF8C42' COMMENT 'Brand primary color in hex',
    status VARCHAR(50) DEFAULT 'active' COMMENT 'active, inactive',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_companies_name (name),
    INDEX idx_companies_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Customers table
CREATE TABLE customers (
    id CHAR(36) PRIMARY KEY COMMENT 'UUID identifier',
    company_id CHAR(36) NOT NULL COMMENT 'Foreign key to companies',
    name VARCHAR(255) NOT NULL COMMENT 'Customer name',
    email VARCHAR(255) COMMENT 'Customer email',
    phone VARCHAR(50) COMMENT 'Customer phone',
    address TEXT COMMENT 'Street address',
    city VARCHAR(100) COMMENT 'City',
    state VARCHAR(100) COMMENT 'State/Province',
    postal_code VARCHAR(20) COMMENT 'Postal code',
    country VARCHAR(100) COMMENT 'Country',
    tax_id VARCHAR(50) COMMENT 'Tax ID',
    customer_number VARCHAR(50) COMMENT 'Customer reference number',
    status VARCHAR(50) DEFAULT 'active' COMMENT 'active, inactive',
    credit_limit DECIMAL(15,2) DEFAULT 0,
    is_supplier BOOLEAN DEFAULT FALSE COMMENT 'Whether this customer is also a supplier',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    UNIQUE KEY unique_customer_number (company_id, customer_number),
    INDEX idx_customers_company_id (company_id),
    INDEX idx_customers_email (email),
    INDEX idx_customers_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Suppliers table
CREATE TABLE suppliers (
    id CHAR(36) PRIMARY KEY COMMENT 'UUID identifier',
    company_id CHAR(36) NOT NULL COMMENT 'Foreign key to companies',
    name VARCHAR(255) NOT NULL COMMENT 'Supplier name',
    email VARCHAR(255) COMMENT 'Supplier email',
    phone VARCHAR(50) COMMENT 'Supplier phone',
    address TEXT COMMENT 'Street address',
    contact_person VARCHAR(255) COMMENT 'Contact person name',
    payment_terms VARCHAR(100) COMMENT 'Payment terms',
    status VARCHAR(50) DEFAULT 'active' COMMENT 'active, inactive',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    INDEX idx_suppliers_company_id (company_id),
    INDEX idx_suppliers_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product categories
CREATE TABLE product_categories (
    id CHAR(36) PRIMARY KEY COMMENT 'UUID identifier',
    company_id CHAR(36) NOT NULL COMMENT 'Foreign key to companies',
    name VARCHAR(255) NOT NULL COMMENT 'Category name',
    description TEXT COMMENT 'Category description',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    UNIQUE KEY unique_category_name (company_id, name),
    INDEX idx_product_categories_company_id (company_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Products/Inventory table
CREATE TABLE products (
    id CHAR(36) PRIMARY KEY COMMENT 'UUID identifier',
    company_id CHAR(36) NOT NULL COMMENT 'Foreign key to companies',
    category_id CHAR(36) COMMENT 'Foreign key to product_categories',
    name VARCHAR(255) NOT NULL COMMENT 'Product name',
    description TEXT COMMENT 'Product description',
    sku VARCHAR(100) UNIQUE COMMENT 'Stock keeping unit',
    unit_of_measure VARCHAR(50) COMMENT 'Unit of measure (pieces, kg, etc)',
    stock_quantity DECIMAL(10,3) DEFAULT 0 COMMENT 'Current stock quantity',
    reorder_level DECIMAL(10,3) DEFAULT 0 COMMENT 'Reorder level',
    unit_price DECIMAL(15,2) NOT NULL COMMENT 'Selling price',
    cost_price DECIMAL(15,2) DEFAULT 0 COMMENT 'Cost price',
    status VARCHAR(50) DEFAULT 'active' COMMENT 'active, inactive',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE SET NULL,
    INDEX idx_products_company_id (company_id),
    INDEX idx_products_category_id (category_id),
    INDEX idx_products_sku (sku),
    INDEX idx_products_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tax settings table
CREATE TABLE tax_settings (
    id CHAR(36) PRIMARY KEY COMMENT 'UUID identifier',
    company_id CHAR(36) NOT NULL COMMENT 'Foreign key to companies',
    name VARCHAR(255) NOT NULL COMMENT 'Tax name (VAT, GST, etc)',
    rate DECIMAL(6,3) NOT NULL DEFAULT 0 COMMENT 'Tax rate percentage',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Whether this tax is active',
    is_default BOOLEAN DEFAULT FALSE COMMENT 'Default tax for this company',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    UNIQUE KEY unique_tax_name (company_id, name),
    UNIQUE KEY unique_default_tax (company_id, is_default) COMMENT 'Only one default tax per company',
    INDEX idx_tax_settings_company_id (company_id),
    INDEX idx_tax_settings_active (company_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Quotations table
CREATE TABLE quotations (
    id CHAR(36) PRIMARY KEY COMMENT 'UUID identifier',
    company_id CHAR(36) NOT NULL COMMENT 'Foreign key to companies',
    customer_id CHAR(36) NOT NULL COMMENT 'Foreign key to customers',
    quotation_number VARCHAR(100) UNIQUE NOT NULL COMMENT 'Quotation reference number',
    quotation_date DATE DEFAULT CURDATE() COMMENT 'Date of quotation',
    validity_date DATE COMMENT 'Quotation validity end date',
    subtotal DECIMAL(15,2) DEFAULT 0 COMMENT 'Subtotal before tax',
    tax_amount DECIMAL(15,2) DEFAULT 0 COMMENT 'Total tax amount',
    total_amount DECIMAL(15,2) DEFAULT 0 COMMENT 'Total after tax',
    notes TEXT COMMENT 'Internal notes',
    terms_and_conditions TEXT COMMENT 'Terms and conditions',
    status VARCHAR(50) DEFAULT 'draft' COMMENT 'draft, sent, approved, partial, paid, overdue, cancelled',
    created_by CHAR(36) COMMENT 'User who created this',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_quotations_company_id (company_id),
    INDEX idx_quotations_customer_id (customer_id),
    INDEX idx_quotations_number (quotation_number),
    INDEX idx_quotations_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Quotation items
CREATE TABLE quotation_items (
    id CHAR(36) PRIMARY KEY COMMENT 'UUID identifier',
    quotation_id CHAR(36) NOT NULL COMMENT 'Foreign key to quotations',
    product_id CHAR(36) COMMENT 'Foreign key to products',
    description TEXT NOT NULL COMMENT 'Line item description',
    quantity DECIMAL(10,3) NOT NULL COMMENT 'Quantity',
    unit_price DECIMAL(15,2) NOT NULL COMMENT 'Unit price',
    tax_percentage DECIMAL(5,2) DEFAULT 0 COMMENT 'Tax percentage',
    tax_amount DECIMAL(15,2) DEFAULT 0 COMMENT 'Calculated tax amount',
    tax_inclusive BOOLEAN DEFAULT FALSE COMMENT 'Whether unit_price includes tax',
    tax_setting_id CHAR(36) COMMENT 'Foreign key to tax_settings',
    line_total DECIMAL(15,2) NOT NULL COMMENT 'Line total (qty * unit_price)',
    notes TEXT COMMENT 'Line notes',
    sort_order INT DEFAULT 0 COMMENT 'Display order',
    FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    FOREIGN KEY (tax_setting_id) REFERENCES tax_settings(id),
    INDEX idx_quotation_items_quotation_id (quotation_id),
    INDEX idx_quotation_items_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invoices table
CREATE TABLE invoices (
    id CHAR(36) PRIMARY KEY COMMENT 'UUID identifier',
    company_id CHAR(36) NOT NULL COMMENT 'Foreign key to companies',
    customer_id CHAR(36) NOT NULL COMMENT 'Foreign key to customers',
    quotation_id CHAR(36) COMMENT 'Source quotation if any',
    invoice_number VARCHAR(100) UNIQUE NOT NULL COMMENT 'Invoice reference number',
    invoice_date DATE DEFAULT CURDATE() COMMENT 'Invoice date',
    due_date DATE COMMENT 'Payment due date',
    subtotal DECIMAL(15,2) DEFAULT 0 COMMENT 'Subtotal before tax',
    tax_amount DECIMAL(15,2) DEFAULT 0 COMMENT 'Total tax amount',
    total_amount DECIMAL(15,2) DEFAULT 0 COMMENT 'Total after tax',
    paid_amount DECIMAL(15,2) DEFAULT 0 COMMENT 'Amount paid so far',
    balance_due DECIMAL(15,2) DEFAULT 0 COMMENT 'Remaining balance',
    notes TEXT COMMENT 'Internal notes',
    terms_and_conditions TEXT COMMENT 'Terms and conditions',
    lpo_number VARCHAR(255) COMMENT 'Associated LPO number',
    status VARCHAR(50) DEFAULT 'draft' COMMENT 'draft, sent, approved, partial, paid, overdue, cancelled',
    created_by CHAR(36) COMMENT 'User who created this',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE SET NULL,
    INDEX idx_invoices_company_id (company_id),
    INDEX idx_invoices_customer_id (customer_id),
    INDEX idx_invoices_number (invoice_number),
    INDEX idx_invoices_status (status),
    INDEX idx_invoices_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invoice items
CREATE TABLE invoice_items (
    id CHAR(36) PRIMARY KEY COMMENT 'UUID identifier',
    invoice_id CHAR(36) NOT NULL COMMENT 'Foreign key to invoices',
    product_id CHAR(36) COMMENT 'Foreign key to products',
    description TEXT NOT NULL COMMENT 'Line item description',
    quantity DECIMAL(10,3) NOT NULL COMMENT 'Quantity',
    unit_price DECIMAL(15,2) NOT NULL COMMENT 'Unit price',
    tax_percentage DECIMAL(5,2) DEFAULT 0 COMMENT 'Tax percentage',
    tax_amount DECIMAL(15,2) DEFAULT 0 COMMENT 'Calculated tax amount',
    tax_inclusive BOOLEAN DEFAULT FALSE COMMENT 'Whether unit_price includes tax',
    discount_before_vat DECIMAL(15,2) DEFAULT 0 COMMENT 'Discount amount before VAT',
    tax_setting_id CHAR(36) COMMENT 'Foreign key to tax_settings',
    line_total DECIMAL(15,2) NOT NULL COMMENT 'Line total',
    notes TEXT COMMENT 'Line notes',
    sort_order INT DEFAULT 0 COMMENT 'Display order',
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    FOREIGN KEY (tax_setting_id) REFERENCES tax_settings(id),
    INDEX idx_invoice_items_invoice_id (invoice_id),
    INDEX idx_invoice_items_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payment methods table
CREATE TABLE payment_methods (
    id CHAR(36) PRIMARY KEY COMMENT 'UUID identifier',
    company_id CHAR(36) NOT NULL COMMENT 'Foreign key to companies',
    name VARCHAR(100) NOT NULL COMMENT 'Payment method name',
    code VARCHAR(50) NOT NULL COMMENT 'Payment method code',
    description TEXT COMMENT 'Payment method description',
    icon_name VARCHAR(50) COMMENT 'Icon name or identifier',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Whether payment method is active',
    sort_order INT DEFAULT 0 COMMENT 'Display order',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    UNIQUE KEY unique_payment_method (company_id, name),
    INDEX idx_payment_methods_company_id (company_id),
    INDEX idx_payment_methods_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Credit notes table
CREATE TABLE credit_notes (
    id CHAR(36) PRIMARY KEY COMMENT 'UUID identifier',
    company_id CHAR(36) NOT NULL COMMENT 'Foreign key to companies',
    customer_id CHAR(36) NOT NULL COMMENT 'Foreign key to customers',
    invoice_id CHAR(36) COMMENT 'Associated invoice if any',
    credit_note_number VARCHAR(100) NOT NULL COMMENT 'Credit note reference number',
    credit_note_date DATE DEFAULT CURDATE() COMMENT 'Date of credit note',
    status VARCHAR(50) DEFAULT 'draft' COMMENT 'draft, sent, applied, cancelled',
    reason TEXT COMMENT 'Reason for credit note',
    subtotal DECIMAL(15,2) DEFAULT 0 COMMENT 'Subtotal before tax',
    tax_amount DECIMAL(15,2) DEFAULT 0 COMMENT 'Total tax amount',
    total_amount DECIMAL(15,2) DEFAULT 0 COMMENT 'Total after tax',
    applied_amount DECIMAL(15,2) DEFAULT 0 COMMENT 'Amount applied to invoices',
    balance DECIMAL(15,2) DEFAULT 0 COMMENT 'Remaining balance',
    affects_inventory BOOLEAN DEFAULT FALSE COMMENT 'Whether this affects inventory',
    notes TEXT COMMENT 'Internal notes',
    terms_and_conditions TEXT COMMENT 'Terms and conditions',
    created_by CHAR(36) COMMENT 'User who created this',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
    UNIQUE KEY unique_credit_note_number (company_id, credit_note_number),
    INDEX idx_credit_notes_company_id (company_id),
    INDEX idx_credit_notes_customer_id (customer_id),
    INDEX idx_credit_notes_invoice_id (invoice_id),
    INDEX idx_credit_notes_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Credit note items
CREATE TABLE credit_note_items (
    id CHAR(36) PRIMARY KEY COMMENT 'UUID identifier',
    credit_note_id CHAR(36) NOT NULL COMMENT 'Foreign key to credit_notes',
    product_id CHAR(36) COMMENT 'Foreign key to products',
    description TEXT NOT NULL COMMENT 'Line item description',
    quantity DECIMAL(10,3) DEFAULT 1 COMMENT 'Quantity',
    unit_price DECIMAL(15,2) DEFAULT 0 COMMENT 'Unit price',
    tax_percentage DECIMAL(5,2) DEFAULT 0 COMMENT 'Tax percentage',
    tax_amount DECIMAL(15,2) DEFAULT 0 COMMENT 'Calculated tax amount',
    tax_inclusive BOOLEAN DEFAULT FALSE COMMENT 'Whether unit_price includes tax',
    tax_setting_id CHAR(36) COMMENT 'Foreign key to tax_settings',
    line_total DECIMAL(15,2) DEFAULT 0 COMMENT 'Line total',
    sort_order INT DEFAULT 0 COMMENT 'Display order',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (credit_note_id) REFERENCES credit_notes(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    FOREIGN KEY (tax_setting_id) REFERENCES tax_settings(id),
    INDEX idx_credit_note_items_credit_note_id (credit_note_id),
    INDEX idx_credit_note_items_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Credit note allocations (linking credit notes to invoices)
CREATE TABLE credit_note_allocations (
    id CHAR(36) PRIMARY KEY COMMENT 'UUID identifier',
    credit_note_id CHAR(36) NOT NULL COMMENT 'Foreign key to credit_notes',
    invoice_id CHAR(36) NOT NULL COMMENT 'Foreign key to invoices',
    allocated_amount DECIMAL(15,2) DEFAULT 0 COMMENT 'Amount allocated to this invoice',
    allocation_date DATE DEFAULT CURDATE() COMMENT 'Date of allocation',
    notes TEXT COMMENT 'Allocation notes',
    created_by CHAR(36) COMMENT 'User who created this',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (credit_note_id) REFERENCES credit_notes(id) ON DELETE CASCADE,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    UNIQUE KEY unique_credit_note_invoice (credit_note_id, invoice_id),
    INDEX idx_credit_note_allocations_credit_note_id (credit_note_id),
    INDEX idx_credit_note_allocations_invoice_id (invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Proforma invoices table
CREATE TABLE proforma_invoices (
    id CHAR(36) PRIMARY KEY COMMENT 'UUID identifier',
    company_id CHAR(36) NOT NULL COMMENT 'Foreign key to companies',
    customer_id CHAR(36) NOT NULL COMMENT 'Foreign key to customers',
    proforma_number VARCHAR(100) UNIQUE NOT NULL COMMENT 'Proforma reference number',
    proforma_date DATE DEFAULT CURDATE() COMMENT 'Date of proforma',
    subtotal DECIMAL(15,2) DEFAULT 0 COMMENT 'Subtotal before tax',
    tax_amount DECIMAL(15,2) DEFAULT 0 COMMENT 'Total tax amount',
    total_amount DECIMAL(15,2) DEFAULT 0 COMMENT 'Total after tax',
    notes TEXT COMMENT 'Internal notes',
    terms_and_conditions TEXT COMMENT 'Terms and conditions',
    status VARCHAR(50) DEFAULT 'draft' COMMENT 'draft, sent, approved, partial, paid, overdue, cancelled',
    created_by CHAR(36) COMMENT 'User who created this',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_proforma_invoices_company_id (company_id),
    INDEX idx_proforma_invoices_customer_id (customer_id),
    INDEX idx_proforma_invoices_number (proforma_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Proforma invoice items
CREATE TABLE proforma_items (
    id CHAR(36) PRIMARY KEY COMMENT 'UUID identifier',
    proforma_id CHAR(36) NOT NULL COMMENT 'Foreign key to proforma_invoices',
    product_id CHAR(36) COMMENT 'Foreign key to products',
    description TEXT NOT NULL COMMENT 'Line item description',
    quantity DECIMAL(10,3) NOT NULL COMMENT 'Quantity',
    unit_price DECIMAL(15,2) NOT NULL COMMENT 'Unit price',
    tax_percentage DECIMAL(5,2) DEFAULT 0 COMMENT 'Tax percentage',
    tax_amount DECIMAL(15,2) DEFAULT 0 COMMENT 'Calculated tax amount',
    tax_inclusive BOOLEAN DEFAULT FALSE COMMENT 'Whether unit_price includes tax',
    tax_setting_id CHAR(36) COMMENT 'Foreign key to tax_settings',
    line_total DECIMAL(15,2) NOT NULL COMMENT 'Line total',
    notes TEXT COMMENT 'Line notes',
    sort_order INT DEFAULT 0 COMMENT 'Display order',
    FOREIGN KEY (proforma_id) REFERENCES proforma_invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    FOREIGN KEY (tax_setting_id) REFERENCES tax_settings(id),
    INDEX idx_proforma_items_proforma_id (proforma_id),
    INDEX idx_proforma_items_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Delivery notes table
CREATE TABLE delivery_notes (
    id CHAR(36) PRIMARY KEY COMMENT 'UUID identifier',
    company_id CHAR(36) NOT NULL COMMENT 'Foreign key to companies',
    customer_id CHAR(36) NOT NULL COMMENT 'Foreign key to customers',
    invoice_id CHAR(36) COMMENT 'Associated invoice if any',
    delivery_note_number VARCHAR(100) UNIQUE NOT NULL COMMENT 'Delivery note reference number',
    delivery_date DATE DEFAULT CURDATE() COMMENT 'Date of delivery',
    delivery_method VARCHAR(50) COMMENT 'Delivery method',
    notes TEXT COMMENT 'Delivery notes',
    status VARCHAR(50) DEFAULT 'draft' COMMENT 'draft, sent, delivered',
    created_by CHAR(36) COMMENT 'User who created this',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
    INDEX idx_delivery_notes_company_id (company_id),
    INDEX idx_delivery_notes_customer_id (customer_id),
    INDEX idx_delivery_notes_invoice_id (invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Delivery note items
CREATE TABLE delivery_note_items (
    id CHAR(36) PRIMARY KEY COMMENT 'UUID identifier',
    delivery_note_id CHAR(36) NOT NULL COMMENT 'Foreign key to delivery_notes',
    product_id CHAR(36) COMMENT 'Foreign key to products',
    description TEXT NOT NULL COMMENT 'Line item description',
    quantity DECIMAL(10,3) NOT NULL COMMENT 'Quantity delivered',
    unit_of_measure VARCHAR(50) DEFAULT 'pieces' COMMENT 'Unit of measure',
    notes TEXT COMMENT 'Line notes',
    sort_order INT DEFAULT 0 COMMENT 'Display order',
    FOREIGN KEY (delivery_note_id) REFERENCES delivery_notes(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    INDEX idx_delivery_note_items_delivery_note_id (delivery_note_id),
    INDEX idx_delivery_note_items_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payments table
CREATE TABLE payments (
    id CHAR(36) PRIMARY KEY COMMENT 'UUID identifier',
    company_id CHAR(36) NOT NULL COMMENT 'Foreign key to companies',
    invoice_id CHAR(36) COMMENT 'Associated invoice',
    payment_date DATE DEFAULT CURDATE() COMMENT 'Date of payment',
    payment_method VARCHAR(50) COMMENT 'Payment method (cash, check, transfer, etc)',
    amount DECIMAL(15,2) NOT NULL COMMENT 'Payment amount',
    reference_number VARCHAR(255) COMMENT 'Payment reference',
    notes TEXT COMMENT 'Payment notes',
    created_by CHAR(36) COMMENT 'User who recorded this payment',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
    INDEX idx_payments_company_id (company_id),
    INDEX idx_payments_invoice_id (invoice_id),
    INDEX idx_payments_date (payment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payment allocations (linking payments to invoices)
CREATE TABLE payment_allocations (
    id CHAR(36) PRIMARY KEY COMMENT 'UUID identifier',
    payment_id CHAR(36) NOT NULL COMMENT 'Foreign key to payments',
    invoice_id CHAR(36) NOT NULL COMMENT 'Foreign key to invoices',
    amount DECIMAL(15,2) NOT NULL COMMENT 'Amount allocated to this invoice',
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    UNIQUE KEY unique_payment_invoice (payment_id, invoice_id),
    INDEX idx_payment_allocations_payment_id (payment_id),
    INDEX idx_payment_allocations_invoice_id (invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payment audit log
CREATE TABLE payment_audit_log (
    id CHAR(36) PRIMARY KEY COMMENT 'UUID identifier',
    action VARCHAR(50) NOT NULL COMMENT 'create, update, delete',
    payment_id CHAR(36) NOT NULL COMMENT 'Foreign key to payments',
    invoice_id CHAR(36) NOT NULL COMMENT 'Foreign key to invoices',
    old_paid_amount DECIMAL(15,2) COMMENT 'Previous paid amount',
    new_paid_amount DECIMAL(15,2) COMMENT 'New paid amount',
    old_balance_due DECIMAL(15,2) COMMENT 'Previous balance',
    new_balance_due DECIMAL(15,2) COMMENT 'New balance',
    old_status VARCHAR(50) COMMENT 'Previous invoice status',
    new_status VARCHAR(50) COMMENT 'New invoice status',
    payment_amount DECIMAL(15,2) NOT NULL COMMENT 'Payment amount',
    payment_method VARCHAR(50) COMMENT 'Payment method',
    reference_number VARCHAR(255) COMMENT 'Payment reference',
    performed_by CHAR(36) COMMENT 'User who performed the action',
    notes TEXT COMMENT 'Audit notes',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    INDEX idx_payment_audit_log_payment_id (payment_id),
    INDEX idx_payment_audit_log_invoice_id (invoice_id),
    INDEX idx_payment_audit_log_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Remittance advice table
CREATE TABLE remittance_advice (
    id CHAR(36) PRIMARY KEY COMMENT 'UUID identifier',
    company_id CHAR(36) NOT NULL COMMENT 'Foreign key to companies',
    supplier_id CHAR(36) NOT NULL COMMENT 'Foreign key to suppliers',
    remittance_number VARCHAR(100) UNIQUE NOT NULL COMMENT 'Remittance reference number',
    remittance_date DATE DEFAULT CURDATE() COMMENT 'Date of remittance',
    total_amount DECIMAL(15,2) DEFAULT 0 COMMENT 'Total remittance amount',
    payment_method VARCHAR(50) COMMENT 'Payment method',
    notes TEXT COMMENT 'Remittance notes',
    created_by CHAR(36) COMMENT 'User who created this',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
    INDEX idx_remittance_advice_company_id (company_id),
    INDEX idx_remittance_advice_supplier_id (supplier_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Remittance advice items
CREATE TABLE remittance_advice_items (
    id CHAR(36) PRIMARY KEY COMMENT 'UUID identifier',
    remittance_id CHAR(36) NOT NULL COMMENT 'Foreign key to remittance_advice',
    invoice_number VARCHAR(100) COMMENT 'Reference invoice number',
    invoice_date DATE COMMENT 'Reference invoice date',
    amount DECIMAL(15,2) NOT NULL COMMENT 'Amount',
    tax_percentage DECIMAL(5,2) DEFAULT 0 COMMENT 'Tax percentage',
    tax_amount DECIMAL(15,2) DEFAULT 0 COMMENT 'Tax amount',
    tax_inclusive BOOLEAN DEFAULT FALSE COMMENT 'Whether amount includes tax',
    notes TEXT COMMENT 'Line notes',
    sort_order INT DEFAULT 0 COMMENT 'Display order',
    FOREIGN KEY (remittance_id) REFERENCES remittance_advice(id) ON DELETE CASCADE,
    INDEX idx_remittance_advice_items_remittance_id (remittance_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Stock movements table
CREATE TABLE stock_movements (
    id CHAR(36) PRIMARY KEY COMMENT 'UUID identifier',
    company_id CHAR(36) NOT NULL COMMENT 'Foreign key to companies',
    product_id CHAR(36) NOT NULL COMMENT 'Foreign key to products',
    movement_type VARCHAR(50) NOT NULL COMMENT 'IN, OUT, ADJUSTMENT',
    reference_type VARCHAR(50) COMMENT 'INVOICE, DELIVERY_NOTE, RESTOCK, ADJUSTMENT, CREDIT_NOTE, PURCHASE',
    reference_id CHAR(36) COMMENT 'ID of the reference document',
    quantity DECIMAL(10,3) NOT NULL COMMENT 'Movement quantity',
    cost_per_unit DECIMAL(15,2) COMMENT 'Cost per unit',
    notes TEXT COMMENT 'Movement notes',
    movement_date DATE DEFAULT CURDATE() COMMENT 'Date of movement',
    created_by CHAR(36) COMMENT 'User who recorded this',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT check_movement_type CHECK (movement_type IN ('IN', 'OUT', 'ADJUSTMENT')),
    INDEX idx_stock_movements_company_id (company_id),
    INDEX idx_stock_movements_product_id (product_id),
    INDEX idx_stock_movements_reference (reference_type, reference_id),
    INDEX idx_stock_movements_date (movement_date),
    INDEX idx_stock_movements_company_product_date (company_id, product_id, movement_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- LPOs (Local Purchase Orders) table
CREATE TABLE lpos (
    id CHAR(36) PRIMARY KEY COMMENT 'UUID identifier',
    company_id CHAR(36) NOT NULL COMMENT 'Foreign key to companies',
    supplier_id CHAR(36) COMMENT 'Foreign key to customers (used as suppliers)',
    lpo_number VARCHAR(100) UNIQUE NOT NULL COMMENT 'LPO reference number',
    lpo_date DATE NOT NULL DEFAULT CURDATE() COMMENT 'Date of LPO',
    delivery_date DATE COMMENT 'Expected delivery date',
    status ENUM('draft', 'sent', 'approved', 'received', 'cancelled') DEFAULT 'draft' COMMENT 'LPO status',
    subtotal DECIMAL(15,2) DEFAULT 0 COMMENT 'Subtotal before tax',
    tax_amount DECIMAL(15,2) DEFAULT 0 COMMENT 'Total tax amount',
    total_amount DECIMAL(15,2) DEFAULT 0 COMMENT 'Total after tax',
    notes TEXT COMMENT 'LPO notes',
    terms_and_conditions TEXT COMMENT 'Terms and conditions',
    delivery_address TEXT COMMENT 'Delivery address',
    contact_person VARCHAR(255) COMMENT 'Contact person',
    contact_phone VARCHAR(50) COMMENT 'Contact phone',
    created_by CHAR(36) COMMENT 'User who created this',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_lpos_company_id (company_id),
    INDEX idx_lpos_supplier_id (supplier_id),
    INDEX idx_lpos_lpo_number (lpo_number),
    INDEX idx_lpos_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- LPO items table
CREATE TABLE lpo_items (
    id CHAR(36) PRIMARY KEY COMMENT 'UUID identifier',
    lpo_id CHAR(36) NOT NULL COMMENT 'Foreign key to lpos',
    product_id CHAR(36) COMMENT 'Foreign key to products',
    description TEXT NOT NULL COMMENT 'Line item description',
    quantity DECIMAL(10,3) NOT NULL COMMENT 'Quantity',
    unit_price DECIMAL(15,2) NOT NULL COMMENT 'Unit price',
    unit_of_measure VARCHAR(50) DEFAULT 'pieces' COMMENT 'Unit of measure',
    tax_rate DECIMAL(5,2) DEFAULT 0 COMMENT 'Tax rate',
    tax_amount DECIMAL(15,2) DEFAULT 0 COMMENT 'Tax amount',
    line_total DECIMAL(15,2) NOT NULL COMMENT 'Line total',
    notes TEXT COMMENT 'Line notes',
    sort_order INT DEFAULT 0 COMMENT 'Display order',
    FOREIGN KEY (lpo_id) REFERENCES lpos(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    INDEX idx_lpo_items_lpo_id (lpo_id),
    INDEX idx_lpo_items_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Web categories table (for public store)
CREATE TABLE web_categories (
    id CHAR(36) PRIMARY KEY COMMENT 'UUID identifier',
    name VARCHAR(255) NOT NULL UNIQUE COMMENT 'Category name',
    slug VARCHAR(255) NOT NULL UNIQUE COMMENT 'URL-friendly slug',
    icon VARCHAR(50) COMMENT 'Icon emoji or name',
    description TEXT COMMENT 'Category description',
    display_order INT DEFAULT 0 COMMENT 'Display order',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Whether category is active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_web_categories_slug (slug),
    INDEX idx_web_categories_is_active (is_active),
    INDEX idx_web_categories_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Web variants table (for public store)
CREATE TABLE web_variants (
    id CHAR(36) PRIMARY KEY COMMENT 'UUID identifier',
    category_id CHAR(36) NOT NULL COMMENT 'Foreign key to web_categories',
    name VARCHAR(255) NOT NULL COMMENT 'Variant name',
    sku VARCHAR(100) NOT NULL UNIQUE COMMENT 'Stock keeping unit',
    slug VARCHAR(255) NOT NULL COMMENT 'URL-friendly slug',
    description TEXT COMMENT 'Variant description',
    image_path VARCHAR(500) COMMENT 'Image path/URL',
    display_order INT DEFAULT 0 COMMENT 'Display order',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Whether variant is active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES web_categories(id) ON DELETE CASCADE,
    UNIQUE KEY unique_category_sku (category_id, sku),
    INDEX idx_web_variants_category_id (category_id),
    INDEX idx_web_variants_slug (slug),
    INDEX idx_web_variants_sku (sku),
    INDEX idx_web_variants_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Profiles table (user accounts - replace Supabase auth)
CREATE TABLE profiles (
    id CHAR(36) PRIMARY KEY COMMENT 'UUID identifier - links to auth system',
    email TEXT NOT NULL COMMENT 'User email address',
    full_name TEXT COMMENT 'User full name',
    avatar_url TEXT COMMENT 'Avatar image URL',
    password_hash VARCHAR(255) COMMENT 'Bcrypt password hash - if using local auth',
    role ENUM('admin', 'accountant', 'stock_manager', 'user', 'super_admin') DEFAULT 'user' COMMENT 'User role',
    status ENUM('active', 'inactive', 'pending') DEFAULT 'pending' COMMENT 'User status',
    phone TEXT COMMENT 'Phone number',
    company_id CHAR(36) COMMENT 'Foreign key to companies',
    department TEXT COMMENT 'Department name',
    position TEXT COMMENT 'Job position',
    password TEXT COMMENT 'Encrypted password if stored',
    auth_user_id CHAR(36) COMMENT 'Link to external auth system',
    invited_by CHAR(36) COMMENT 'User who invited this user',
    invited_at TIMESTAMP COMMENT 'When user was invited',
    last_login TIMESTAMP COMMENT 'Last login timestamp',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Whether user is active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
    FOREIGN KEY (invited_by) REFERENCES profiles(id) ON DELETE SET NULL,
    INDEX idx_profiles_company_id (company_id),
    INDEX idx_profiles_role (role),
    INDEX idx_profiles_status (status),
    INDEX idx_profiles_email (email(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User permissions table
CREATE TABLE user_permissions (
    id CHAR(36) PRIMARY KEY COMMENT 'UUID identifier',
    user_id CHAR(36) NOT NULL COMMENT 'Foreign key to profiles',
    permission_name TEXT NOT NULL COMMENT 'Permission name',
    granted BOOLEAN DEFAULT TRUE COMMENT 'Whether permission is granted',
    granted_by CHAR(36) COMMENT 'User who granted permission',
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When permission was granted',
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES profiles(id) ON DELETE SET NULL,
    UNIQUE KEY unique_user_permission (user_id, permission_name),
    INDEX idx_user_permissions_user_id (user_id),
    INDEX idx_user_permissions_permission_name (permission_name(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User invitations table
CREATE TABLE user_invitations (
    id CHAR(36) PRIMARY KEY COMMENT 'UUID identifier',
    email TEXT NOT NULL COMMENT 'Email to invite',
    role ENUM('admin', 'accountant', 'stock_manager', 'user', 'super_admin') DEFAULT 'user' COMMENT 'Role for invited user',
    company_id CHAR(36) NOT NULL COMMENT 'Foreign key to companies',
    invited_by CHAR(36) COMMENT 'User who sent invitation',
    invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When invitation was sent',
    expires_at TIMESTAMP DEFAULT (DATE_ADD(NOW(), INTERVAL 7 DAY)) COMMENT 'When invitation expires',
    accepted_at TIMESTAMP COMMENT 'When invitation was accepted',
    is_approved BOOLEAN DEFAULT FALSE COMMENT 'Whether admin approved this invitation',
    approved_by CHAR(36) COMMENT 'Admin who approved',
    approved_at TIMESTAMP COMMENT 'When approval happened',
    status VARCHAR(50) DEFAULT 'pending' COMMENT 'pending, accepted, expired, revoked',
    invitation_token CHAR(36) DEFAULT (UUID()) COMMENT 'Unique token for invitation',
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (invited_by) REFERENCES profiles(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES profiles(id) ON DELETE SET NULL,
    UNIQUE KEY unique_email_company (email(100), company_id),
    INDEX idx_user_invitations_email (email(100)),
    INDEX idx_user_invitations_company_id (company_id),
    INDEX idx_user_invitations_status (status),
    INDEX idx_user_invitations_is_approved (is_approved),
    INDEX idx_user_invitations_token (invitation_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit logs table
CREATE TABLE audit_logs (
    id CHAR(36) PRIMARY KEY COMMENT 'UUID identifier',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    action VARCHAR(50) NOT NULL COMMENT 'CREATE, UPDATE, DELETE, APPROVE, etc',
    entity_type VARCHAR(100) NOT NULL COMMENT 'Table or entity type',
    record_id CHAR(36) COMMENT 'ID of the affected record',
    company_id CHAR(36) COMMENT 'Foreign key to companies',
    actor_user_id CHAR(36) COMMENT 'User who performed action',
    actor_email TEXT COMMENT 'Email of user who performed action',
    details JSON COMMENT 'Additional details as JSON',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (actor_user_id) REFERENCES profiles(id) ON DELETE SET NULL,
    INDEX idx_audit_logs_created_at (created_at DESC),
    INDEX idx_audit_logs_company_id (company_id),
    INDEX idx_audit_logs_entity_type (entity_type),
    INDEX idx_audit_logs_action (action),
    INDEX idx_audit_logs_actor_user_id (actor_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migration logs table
CREATE TABLE migration_logs (
    id CHAR(36) PRIMARY KEY COMMENT 'UUID identifier',
    migration_name VARCHAR(255) NOT NULL COMMENT 'Migration name',
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'completed' COMMENT 'completed, failed, pending',
    notes TEXT COMMENT 'Migration notes'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. CREATE TRIGGERS FOR UPDATED_AT
-- ============================================================================

DELIMITER $$

CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON companies
FOR EACH ROW
BEGIN
    SET NEW.updated_at = NOW();
END$$

CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON customers
FOR EACH ROW
BEGIN
    SET NEW.updated_at = NOW();
END$$

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
BEGIN
    SET NEW.updated_at = NOW();
END$$

CREATE TRIGGER update_tax_settings_updated_at
BEFORE UPDATE ON tax_settings
FOR EACH ROW
BEGIN
    SET NEW.updated_at = NOW();
END$$

CREATE TRIGGER update_quotations_updated_at
BEFORE UPDATE ON quotations
FOR EACH ROW
BEGIN
    SET NEW.updated_at = NOW();
END$$

CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON invoices
FOR EACH ROW
BEGIN
    SET NEW.updated_at = NOW();
END$$

CREATE TRIGGER update_proforma_invoices_updated_at
BEFORE UPDATE ON proforma_invoices
FOR EACH ROW
BEGIN
    SET NEW.updated_at = NOW();
END$$

CREATE TRIGGER update_delivery_notes_updated_at
BEFORE UPDATE ON delivery_notes
FOR EACH ROW
BEGIN
    SET NEW.updated_at = NOW();
END$$

CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON payments
FOR EACH ROW
BEGIN
    SET NEW.updated_at = NOW();
END$$

CREATE TRIGGER update_remittance_advice_updated_at
BEFORE UPDATE ON remittance_advice
FOR EACH ROW
BEGIN
    SET NEW.updated_at = NOW();
END$$

CREATE TRIGGER update_stock_movements_updated_at
BEFORE UPDATE ON stock_movements
FOR EACH ROW
BEGIN
    SET NEW.updated_at = NOW();
END$$

CREATE TRIGGER update_lpos_updated_at
BEFORE UPDATE ON lpos
FOR EACH ROW
BEGIN
    SET NEW.updated_at = NOW();
END$$

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
BEGIN
    SET NEW.updated_at = NOW();
END$$

CREATE TRIGGER update_web_categories_updated_at
BEFORE UPDATE ON web_categories
FOR EACH ROW
BEGIN
    SET NEW.updated_at = NOW();
END$$

CREATE TRIGGER update_web_variants_updated_at
BEFORE UPDATE ON web_variants
FOR EACH ROW
BEGIN
    SET NEW.updated_at = NOW();
END$$

CREATE TRIGGER update_audit_logs_updated_at
BEFORE UPDATE ON audit_logs
FOR EACH ROW
BEGIN
    SET NEW.updated_at = NOW();
END$$

CREATE TRIGGER update_payment_methods_updated_at
BEFORE UPDATE ON payment_methods
FOR EACH ROW
BEGIN
    SET NEW.updated_at = NOW();
END$$

CREATE TRIGGER update_credit_notes_updated_at
BEFORE UPDATE ON credit_notes
FOR EACH ROW
BEGIN
    SET NEW.updated_at = NOW();
END$$

CREATE TRIGGER update_credit_note_items_updated_at
BEFORE UPDATE ON credit_note_items
FOR EACH ROW
BEGIN
    SET NEW.updated_at = NOW();
END$$

DELIMITER ;

-- ============================================================================
-- 5. CREATE STORED PROCEDURES
-- ============================================================================

DELIMITER $$

-- @DEPRECATED: Procedure to generate proforma number
-- MIGRATION STATUS: This stored procedure has been DEPRECATED in favor of API-based generation
-- NEW SYSTEM: Use the centralized API endpoint /backend/api.php?action=get_next_document_number
-- REFERENCE: See src/utils/documentNumbering.ts for generateDocumentNumberAPI() function
-- STATUS: Kept for schema compatibility and potential rollback scenarios
-- All new code should use: generateDocumentNumberAPI('proforma')
-- NOTE: Old format 'PF-' is now 'PRO-' in the new system
CREATE PROCEDURE generate_proforma_number(
    IN p_company_id CHAR(36),
    OUT p_proforma_number VARCHAR(100)
)
BEGIN
    DECLARE v_next_number INT;
    DECLARE v_year_part VARCHAR(4);

    SET v_year_part = YEAR(CURDATE());

    SELECT COALESCE(MAX(CAST(SUBSTRING(proforma_number, -3) AS UNSIGNED)), 0) + 1
    INTO v_next_number
    FROM proforma_invoices
    WHERE company_id = p_company_id
    AND proforma_number LIKE CONCAT('PF-', v_year_part, '-%');

    SET p_proforma_number = CONCAT('PF-', v_year_part, '-', LPAD(v_next_number, 3, '0'));
END$$

-- @DEPRECATED: Procedure to generate LPO number
-- MIGRATION STATUS: This stored procedure has been DEPRECATED in favor of API-based generation
-- NEW SYSTEM: Use the centralized API endpoint /backend/api.php?action=get_next_document_number
-- REFERENCE: See src/utils/documentNumbering.ts for generateDocumentNumberAPI() function
-- STATUS: Kept for schema compatibility and potential rollback scenarios
-- All new code should use: generateDocumentNumberAPI('lpo')
CREATE PROCEDURE generate_lpo_number(
    IN p_company_id CHAR(36),
    OUT p_lpo_number VARCHAR(100)
)
BEGIN
    DECLARE v_company_code VARCHAR(10);
    DECLARE v_lpo_count INT;

    SELECT COALESCE(UPPER(LEFT(name, 3)), 'LPO')
    INTO v_company_code
    FROM companies
    WHERE id = p_company_id;

    SELECT COUNT(*) + 1
    INTO v_lpo_count
    FROM lpos
    WHERE company_id = p_company_id;

    SET p_lpo_number = CONCAT(v_company_code, '-LPO-', YEAR(CURDATE()), '-', LPAD(v_lpo_count, 4, '0'));
END$$

-- Procedure to update product stock
CREATE PROCEDURE update_product_stock(
    IN p_product_id CHAR(36),
    IN p_movement_type VARCHAR(50),
    IN p_quantity DECIMAL(10,3)
)
BEGIN
    DECLARE v_movement_type VARCHAR(50);
    SET v_movement_type = UPPER(p_movement_type);
    
    IF v_movement_type NOT IN ('IN', 'OUT', 'ADJUSTMENT') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid movement_type';
    END IF;
    
    IF v_movement_type = 'IN' THEN
        UPDATE products
        SET stock_quantity = COALESCE(stock_quantity, 0) + p_quantity,
            updated_at = NOW()
        WHERE id = p_product_id;
    ELSEIF v_movement_type = 'OUT' THEN
        UPDATE products
        SET stock_quantity = GREATEST(COALESCE(stock_quantity, 0) - p_quantity, 0),
            updated_at = NOW()
        WHERE id = p_product_id;
    ELSEIF v_movement_type = 'ADJUSTMENT' THEN
        UPDATE products
        SET stock_quantity = p_quantity,
            updated_at = NOW()
        WHERE id = p_product_id;
    END IF;
END$$

DELIMITER ;

-- ============================================================================
-- 6. INSERT DEFAULT DATA
-- ============================================================================

-- Insert default web categories
INSERT INTO web_categories (id, name, slug, icon, description, display_order, is_active) VALUES
(UUID(), 'Bandages, Tapes and Dressings', 'bandages-tapes-and-dressings', '🩹', 'Medical dressings and bandages', 1, TRUE),
(UUID(), 'Bottles and Containers', 'bottles-and-containers', '🔵', 'Storage bottles and containers', 2, TRUE),
(UUID(), 'Catheters and Tubes', 'catheters-and-tubes', '🧪', 'Medical catheters and tubes', 3, TRUE),
(UUID(), 'Cotton Wool', 'cotton-wool', '☁️', 'Premium cotton wool products', 4, TRUE),
(UUID(), 'Diapers and Sanitary', 'diapers-and-sanitary', '👶', 'Diaper and sanitary products', 5, TRUE),
(UUID(), 'Gloves', 'gloves', '🧤', 'Medical gloves', 6, TRUE),
(UUID(), 'Hospital Equipments', 'hospital-equipments', '🖥️', 'Medical equipment', 7, TRUE),
(UUID(), 'Hospital Furniture', 'hospital-furniture', '🛏️', 'Hospital beds and furniture', 8, TRUE),
(UUID(), 'Hospital Instruments', 'hospital-instruments', '🔧', 'Surgical instruments', 9, TRUE),
(UUID(), 'Hospital Linen', 'hospital-linen', '👕', 'Hospital linens', 10, TRUE),
(UUID(), 'Infection Control', 'infection-control', '🛡️', 'Infection control products', 11, TRUE),
(UUID(), 'PPE', 'ppe', '⚠️', 'Personal protective equipment', 12, TRUE),
(UUID(), 'Spirits, Detergents and Disinfectants', 'spirits-detergents-disinfectants', '💧', 'Cleaning and disinfectant products', 13, TRUE),
(UUID(), 'Syringes and Needles', 'syringes-and-needles', '💉', 'Syringes and needles', 14, TRUE),
(UUID(), 'Others', 'others', '⋯', 'Other products', 15, TRUE);

-- Log migration
INSERT INTO migration_logs (id, migration_name, executed_at, status, notes)
VALUES (UUID(), 'mysql_schema_creation', NOW(), 'completed', 'Initial MySQL schema created - all tables, triggers, and procedures');

-- ============================================================================
-- 7. FINAL STATEMENTS
-- ============================================================================

-- Show completion message
SELECT 'MySQL Database Schema Successfully Created!' AS status;

-- Display table count
SELECT COUNT(*) AS total_tables FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'app_database' AND TABLE_TYPE = 'BASE TABLE';
