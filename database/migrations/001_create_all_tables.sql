-- MySQL Migration: Create all required tables for MEDPLUS application
-- Excludes: users table
-- Aligned with tableDefinitions.php and production database schema (INT AUTO_INCREMENT)

-- Core multi-tenancy tables
CREATE TABLE IF NOT EXISTS `companies` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL UNIQUE,
  `email` VARCHAR(255),
  `phone` VARCHAR(50),
  `address` TEXT,
  `city` VARCHAR(100),
  `state` VARCHAR(100),
  `postal_code` VARCHAR(20),
  `country` VARCHAR(100),
  `currency` VARCHAR(3) DEFAULT "USD",
  `website` VARCHAR(255),
  `logo_url` VARCHAR(500),
  `primary_color` VARCHAR(7) DEFAULT "#FF8C42",
  `status` VARCHAR(50) DEFAULT "active",
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `customers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255),
  `phone` VARCHAR(50),
  `address` TEXT,
  `city` VARCHAR(100),
  `state` VARCHAR(100),
  `postal_code` VARCHAR(20),
  `country` VARCHAR(100),
  `tax_id` VARCHAR(50),
  `customer_number` VARCHAR(50),
  `status` VARCHAR(50) DEFAULT "active",
  `credit_limit` DECIMAL(15,2) DEFAULT 0,
  `is_supplier` BOOLEAN DEFAULT FALSE,
  `payment_terms` VARCHAR(50),
  `is_active` VARCHAR(50) DEFAULT "1",
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_customers_company_id` (`company_id`),
  INDEX `idx_customers_email` (`email`),
  INDEX `idx_customers_status` (`status`),
  FOREIGN KEY `fk_customers_company` (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `suppliers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255),
  `phone` VARCHAR(50),
  `address` TEXT,
  `contact_person` VARCHAR(255),
  `payment_terms` VARCHAR(100),
  `status` VARCHAR(50) DEFAULT "active",
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_suppliers_company_id` (`company_id`),
  INDEX `idx_suppliers_status` (`status`),
  FOREIGN KEY `fk_suppliers_company` (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Products and Inventory
CREATE TABLE IF NOT EXISTS `product_categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `is_active` TINYINT DEFAULT 1,
  `product_code` VARCHAR(250),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_product_categories_company_id` (`company_id`),
  FOREIGN KEY `fk_product_categories_company` (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT NOT NULL,
  `category_id` INT,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `sku` VARCHAR(100) UNIQUE,
  `unit_of_measure` VARCHAR(50),
  `stock_quantity` DECIMAL(10,3) DEFAULT 0,
  `reorder_level` DECIMAL(10,3) DEFAULT 0,
  `unit_price` DECIMAL(15,2) NOT NULL,
  `cost_price` DECIMAL(15,2) DEFAULT 0,
  `status` VARCHAR(50) DEFAULT "active",
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_products_company_id` (`company_id`),
  INDEX `idx_products_category_id` (`category_id`),
  UNIQUE KEY `sku` (`sku`),
  INDEX `idx_products_status` (`status`),
  FOREIGN KEY `fk_products_company` (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
  FOREIGN KEY `fk_products_category` (`category_id`) REFERENCES `product_categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tax and Payments
CREATE TABLE IF NOT EXISTS `tax_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `rate` DECIMAL(6,3) DEFAULT 0,
  `is_active` TINYINT DEFAULT 1,
  `is_default` TINYINT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_tax_settings_company_id` (`company_id`),
  INDEX `idx_tax_settings_active` (`company_id`, `is_active`),
  FOREIGN KEY `fk_tax_settings_company` (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `payment_methods` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `is_active` TINYINT DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_payment_methods_company_id` (`company_id`),
  INDEX `idx_payment_methods_is_active` (`is_active`),
  FOREIGN KEY `fk_payment_methods_company` (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sales Documents
CREATE TABLE IF NOT EXISTS `quotations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT NOT NULL DEFAULT 0,
  `customer_id` INT,
  `portfolio_id` INT,
  `customer_name` VARCHAR(255),
  `customer_email` VARCHAR(255),
  `customer_phone` VARCHAR(20),
  `quotation_number` VARCHAR(255),
  `quotation_date` DATE,
  `valid_until` DATE,
  `project_description` TEXT,
  `budget_range` VARCHAR(100),
  `timeline` VARCHAR(100),
  `status` VARCHAR(50) DEFAULT "draft",
  `subtotal` DECIMAL(12,2) DEFAULT 0,
  `tax_amount` DECIMAL(12,2) DEFAULT 0,
  `total_amount` DECIMAL(12,2) DEFAULT 0,
  `notes` TEXT,
  `terms_and_conditions` TEXT,
  `created_by` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_company_id` (`company_id`),
  INDEX `idx_customer_id` (`customer_id`),
  INDEX `idx_status` (`status`),
  FOREIGN KEY `fk_quotations_company` (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
  FOREIGN KEY `fk_quotations_customer` (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `quotation_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `quotation_id` INT NOT NULL,
  `product_id` INT,
  `description` TEXT NOT NULL,
  `quantity` DECIMAL(10,3) NOT NULL,
  `unit_price` DECIMAL(15,2) NOT NULL,
  `tax_percentage` DECIMAL(5,2) DEFAULT 0,
  `tax_amount` DECIMAL(15,2) DEFAULT 0,
  `tax_inclusive` TINYINT DEFAULT 0,
  `tax_setting_id` INT,
  `line_total` DECIMAL(15,2) NOT NULL,
  `sort_order` INT DEFAULT 0,
  INDEX `idx_quotation_items_quotation_id` (`quotation_id`),
  INDEX `idx_quotation_items_product_id` (`product_id`),
  FOREIGN KEY `fk_quotation_items_quotation` (`quotation_id`) REFERENCES `quotations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY `fk_quotation_items_product` (`product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `invoices` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT NOT NULL,
  `customer_id` INT NOT NULL,
  `quotation_id` INT,
  `invoice_number` VARCHAR(100) NOT NULL UNIQUE,
  `invoice_date` DATE,
  `due_date` DATE,
  `subtotal` DECIMAL(15,2) DEFAULT 0,
  `tax_amount` DECIMAL(15,2) DEFAULT 0,
  `total_amount` DECIMAL(15,2) DEFAULT 0,
  `paid_amount` DECIMAL(15,2) DEFAULT 0,
  `balance_due` DECIMAL(15,2) DEFAULT 0,
  `lpo_number` VARCHAR(255),
  `status` VARCHAR(50) DEFAULT "draft",
  `created_by` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `invoice_number` (`invoice_number`),
  INDEX `idx_invoices_company_id` (`company_id`),
  INDEX `idx_invoices_customer_id` (`customer_id`),
  INDEX `idx_invoices_status` (`status`),
  INDEX `idx_invoices_due_date` (`due_date`),
  FOREIGN KEY `fk_invoices_company` (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
  FOREIGN KEY `fk_invoices_customer` (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `invoice_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `invoice_id` INT NOT NULL,
  `product_id` INT,
  `description` TEXT NOT NULL,
  `quantity` DECIMAL(10,3) NOT NULL,
  `unit_price` DECIMAL(15,2) NOT NULL,
  `tax_percentage` DECIMAL(5,2) DEFAULT 0,
  `tax_amount` DECIMAL(15,2) DEFAULT 0,
  `tax_inclusive` TINYINT DEFAULT 0,
  `discount_before_vat` DECIMAL(15,2) DEFAULT 0,
  `tax_setting_id` INT,
  `line_total` DECIMAL(15,2) NOT NULL,
  `notes` TEXT,
  `sort_order` INT DEFAULT 0,
  INDEX `idx_invoice_items_invoice_id` (`invoice_id`),
  INDEX `idx_invoice_items_product_id` (`product_id`),
  FOREIGN KEY `fk_invoice_items_invoice` (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE,
  FOREIGN KEY `fk_invoice_items_product` (`product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Proforma Invoices
CREATE TABLE IF NOT EXISTS `proforma_invoices` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT NOT NULL,
  `customer_id` INT NOT NULL,
  `proforma_number` VARCHAR(100) NOT NULL UNIQUE,
  `proforma_date` DATE,
  `subtotal` DECIMAL(15,2) DEFAULT 0,
  `tax_percentage` DECIMAL(5,2) DEFAULT 0,
  `tax_amount` DECIMAL(15,2) DEFAULT 0,
  `total_amount` DECIMAL(15,2) DEFAULT 0,
  `notes` TEXT,
  `valid_until` DATE,
  `terms_and_conditions` TEXT,
  `status` VARCHAR(50) DEFAULT "draft",
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `proforma_number` (`proforma_number`),
  INDEX `idx_proforma_invoices_company_id` (`company_id`),
  INDEX `idx_proforma_invoices_customer_id` (`customer_id`),
  FOREIGN KEY `fk_proforma_invoices_company` (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
  FOREIGN KEY `fk_proforma_invoices_customer` (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `proforma_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `proforma_id` INT NOT NULL,
  `product_id` INT,
  `description` TEXT NOT NULL,
  `quantity` DECIMAL(10,3) NOT NULL,
  `unit_price` DECIMAL(15,2) NOT NULL,
  `tax_percentage` DECIMAL(5,2) DEFAULT 0,
  `tax_amount` DECIMAL(15,2) DEFAULT 0,
  `tax_inclusive` TINYINT DEFAULT 0,
  `tax_setting_id` INT,
  `line_total` DECIMAL(15,2) NOT NULL,
  `sort_order` INT DEFAULT 0,
  INDEX `idx_proforma_items_proforma_id` (`proforma_id`),
  INDEX `idx_proforma_items_product_id` (`product_id`),
  FOREIGN KEY `fk_proforma_items_proforma` (`proforma_id`) REFERENCES `proforma_invoices`(`id`) ON DELETE CASCADE,
  FOREIGN KEY `fk_proforma_items_product` (`product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Delivery Notes
CREATE TABLE IF NOT EXISTS `delivery_notes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT NOT NULL,
  `customer_id` INT NOT NULL,
  `invoice_id` INT,
  `delivery_note_number` VARCHAR(100) NOT NULL UNIQUE,
  `delivery_date` DATE,
  `delivery_method` VARCHAR(50),
  `notes` TEXT,
  `status` VARCHAR(50) DEFAULT "draft",
  `created_by` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `delivery_note_number` (`delivery_note_number`),
  INDEX `idx_delivery_notes_company_id` (`company_id`),
  INDEX `idx_delivery_notes_customer_id` (`customer_id`),
  INDEX `idx_delivery_notes_invoice_id` (`invoice_id`),
  FOREIGN KEY `fk_delivery_notes_company` (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
  FOREIGN KEY `fk_delivery_notes_customer` (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE,
  FOREIGN KEY `fk_delivery_notes_invoice` (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `delivery_note_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `delivery_note_id` INT NOT NULL,
  `product_id` INT,
  `description` TEXT NOT NULL,
  `quantity` DECIMAL(10,3) NOT NULL,
  `unit_of_measure` VARCHAR(50) DEFAULT "pieces",
  `notes` TEXT,
  `sort_order` INT DEFAULT 0,
  INDEX `idx_delivery_note_items_delivery_note_id` (`delivery_note_id`),
  INDEX `idx_delivery_note_items_product_id` (`product_id`),
  FOREIGN KEY `fk_delivery_note_items_delivery_note` (`delivery_note_id`) REFERENCES `delivery_notes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY `fk_delivery_note_items_product` (`product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Credit Notes
CREATE TABLE IF NOT EXISTS `credit_notes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT NOT NULL,
  `customer_id` INT NOT NULL,
  `invoice_id` INT,
  `credit_note_number` VARCHAR(100) NOT NULL,
  `credit_note_date` DATE,
  `status` VARCHAR(50) DEFAULT "draft",
  `reason` TEXT,
  `subtotal` DECIMAL(15,2) DEFAULT 0,
  `tax_amount` DECIMAL(15,2) DEFAULT 0,
  `total_amount` DECIMAL(15,2) DEFAULT 0,
  `applied_amount` DECIMAL(15,2) DEFAULT 0,
  `balance` DECIMAL(15,2) DEFAULT 0,
  `affects_inventory` BOOLEAN DEFAULT FALSE,
  `notes` TEXT,
  `terms_and_conditions` TEXT,
  `created_by` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_credit_notes_company_id` (`company_id`),
  INDEX `idx_credit_notes_customer_id` (`customer_id`),
  INDEX `idx_credit_notes_invoice_id` (`invoice_id`),
  INDEX `idx_credit_notes_status` (`status`),
  FOREIGN KEY `fk_credit_notes_company` (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
  FOREIGN KEY `fk_credit_notes_customer` (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE,
  FOREIGN KEY `fk_credit_notes_invoice` (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `credit_note_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `credit_note_id` INT NOT NULL,
  `product_id` INT,
  `description` TEXT NOT NULL,
  `quantity` DECIMAL(10,3) DEFAULT 1,
  `unit_price` DECIMAL(15,2) DEFAULT 0,
  `tax_percentage` DECIMAL(5,2) DEFAULT 0,
  `tax_amount` DECIMAL(15,2) DEFAULT 0,
  `tax_inclusive` TINYINT DEFAULT 0,
  `tax_setting_id` INT,
  `line_total` DECIMAL(15,2) DEFAULT 0,
  `sort_order` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_credit_note_items_credit_note_id` (`credit_note_id`),
  INDEX `idx_credit_note_items_product_id` (`product_id`),
  FOREIGN KEY `fk_credit_note_items_credit_note` (`credit_note_id`) REFERENCES `credit_notes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY `fk_credit_note_items_product` (`product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `credit_note_allocations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `credit_note_id` INT NOT NULL,
  `invoice_id` INT NOT NULL,
  `allocated_amount` DECIMAL(15,2) DEFAULT 0,
  `allocation_date` DATE,
  `notes` TEXT,
  `created_by` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_credit_note_allocations_credit_note_id` (`credit_note_id`),
  INDEX `idx_credit_note_allocations_invoice_id` (`invoice_id`),
  FOREIGN KEY `fk_credit_note_allocations_credit_note` (`credit_note_id`) REFERENCES `credit_notes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY `fk_credit_note_allocations_invoice` (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payments
CREATE TABLE IF NOT EXISTS `payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT NOT NULL,
  `invoice_id` INT,
  `payment_date` DATE,
  `payment_method` VARCHAR(50),
  `amount` DECIMAL(15,2) NOT NULL,
  `reference_number` VARCHAR(255),
  `notes` TEXT,
  `created_by` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_payments_company_id` (`company_id`),
  INDEX `idx_payments_invoice_id` (`invoice_id`),
  INDEX `idx_payments_date` (`payment_date`),
  FOREIGN KEY `fk_payments_company` (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
  FOREIGN KEY `fk_payments_invoice` (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `payment_allocations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `payment_id` INT NOT NULL,
  `invoice_id` INT NOT NULL,
  `amount` DECIMAL(15,2) NOT NULL,
  INDEX `idx_payment_allocations_payment_id` (`payment_id`),
  INDEX `idx_payment_allocations_invoice_id` (`invoice_id`),
  FOREIGN KEY `fk_payment_allocations_payment` (`payment_id`) REFERENCES `payments`(`id`) ON DELETE CASCADE,
  FOREIGN KEY `fk_payment_allocations_invoice` (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `payment_audit_log` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `action` VARCHAR(50) NOT NULL,
  `payment_id` INT NOT NULL,
  `invoice_id` INT NOT NULL,
  `payment_amount` DECIMAL(15,2) NOT NULL,
  `old_paid_amount` DECIMAL(15,2),
  `new_paid_amount` DECIMAL(15,2),
  `old_balance_due` DECIMAL(15,2),
  `new_balance_due` DECIMAL(15,2),
  `old_status` VARCHAR(50),
  `new_status` VARCHAR(50),
  `payment_method` VARCHAR(50),
  `reference_number` VARCHAR(255),
  `performed_by` INT,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_payment_audit_log_payment_id` (`payment_id`),
  INDEX `idx_payment_audit_log_invoice_id` (`invoice_id`),
  INDEX `idx_payment_audit_log_action` (`action`),
  FOREIGN KEY `fk_payment_audit_log_payment` (`payment_id`) REFERENCES `payments`(`id`) ON DELETE CASCADE,
  FOREIGN KEY `fk_payment_audit_log_invoice` (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Stock Management
CREATE TABLE IF NOT EXISTS `stock_movements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `movement_type` VARCHAR(50) NOT NULL,
  `reference_type` VARCHAR(50),
  `reference_id` INT,
  `quantity` DECIMAL(10,3) NOT NULL,
  `cost_per_unit` DECIMAL(15,2),
  `notes` TEXT,
  `movement_date` DATE,
  `created_by` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_stock_movements_company_id` (`company_id`),
  INDEX `idx_stock_movements_product_id` (`product_id`),
  INDEX `idx_stock_movements_reference` (`reference_type`, `reference_id`),
  INDEX `idx_stock_movements_date` (`movement_date`),
  FOREIGN KEY `fk_stock_movements_company` (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
  FOREIGN KEY `fk_stock_movements_product` (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- LPOs (Local Purchase Orders)
CREATE TABLE IF NOT EXISTS `lpos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT NOT NULL,
  `supplier_id` INT,
  `lpo_number` VARCHAR(100) NOT NULL UNIQUE,
  `lpo_date` DATE NOT NULL DEFAULT CURRENT_DATE,
  `delivery_date` DATE,
  `status` ENUM("draft", "sent", "approved", "received", "cancelled") DEFAULT "draft",
  `subtotal` DECIMAL(15,2) DEFAULT 0,
  `tax_amount` DECIMAL(15,2) DEFAULT 0,
  `total_amount` DECIMAL(15,2) DEFAULT 0,
  `notes` TEXT,
  `terms_and_conditions` TEXT,
  `delivery_address` TEXT,
  `contact_person` VARCHAR(255),
  `contact_phone` VARCHAR(50),
  `created_by` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `lpo_number` (`lpo_number`),
  INDEX `idx_lpos_company_id` (`company_id`),
  INDEX `idx_lpos_supplier_id` (`supplier_id`),
  INDEX `idx_lpos_status` (`status`),
  FOREIGN KEY `fk_lpos_company` (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
  FOREIGN KEY `fk_lpos_supplier` (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lpo_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `lpo_id` INT NOT NULL,
  `product_id` INT,
  `description` TEXT NOT NULL,
  `quantity` DECIMAL(10,3) NOT NULL,
  `unit_price` DECIMAL(15,2) NOT NULL,
  `unit_of_measure` VARCHAR(50) DEFAULT "pieces",
  `tax_rate` DECIMAL(5,2) DEFAULT 0,
  `tax_amount` DECIMAL(15,2) DEFAULT 0,
  `line_total` DECIMAL(15,2) NOT NULL,
  `notes` TEXT,
  `sort_order` INT DEFAULT 0,
  INDEX `idx_lpo_items_lpo_id` (`lpo_id`),
  INDEX `idx_lpo_items_product_id` (`product_id`),
  FOREIGN KEY `fk_lpo_items_lpo` (`lpo_id`) REFERENCES `lpos`(`id`) ON DELETE CASCADE,
  FOREIGN KEY `fk_lpo_items_product` (`product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Remittance
CREATE TABLE IF NOT EXISTS `remittance_advice` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT NOT NULL,
  `supplier_id` INT NOT NULL,
  `remittance_number` VARCHAR(100) NOT NULL UNIQUE,
  `remittance_date` DATE,
  `total_amount` DECIMAL(15,2) DEFAULT 0,
  `payment_method` VARCHAR(50),
  `notes` TEXT,
  `created_by` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_remittance_advice_company_id` (`company_id`),
  INDEX `idx_remittance_advice_supplier_id` (`supplier_id`),
  FOREIGN KEY `fk_remittance_advice_company` (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
  FOREIGN KEY `fk_remittance_advice_supplier` (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `remittance_advice_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `remittance_id` INT NOT NULL,
  `invoice_number` VARCHAR(100),
  `invoice_date` DATE,
  `amount` DECIMAL(15,2) NOT NULL,
  `tax_percentage` DECIMAL(5,2) DEFAULT 0,
  `tax_amount` DECIMAL(15,2) DEFAULT 0,
  `tax_inclusive` TINYINT DEFAULT 0,
  `notes` TEXT,
  `sort_order` INT DEFAULT 0,
  INDEX `idx_remittance_advice_items_remittance_id` (`remittance_id`),
  FOREIGN KEY `fk_remittance_advice_items_remittance` (`remittance_id`) REFERENCES `remittance_advice`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Web Store
CREATE TABLE IF NOT EXISTS `web_categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL UNIQUE,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `icon` VARCHAR(50),
  `description` TEXT,
  `display_order` INT DEFAULT 0,
  `is_active` TINYINT DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `slug` (`slug`),
  INDEX `idx_web_categories_is_active` (`is_active`),
  INDEX `idx_web_categories_display_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `web_variants` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `category_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `sku` VARCHAR(100) NOT NULL UNIQUE,
  `slug` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `image_path` VARCHAR(500),
  `display_order` INT DEFAULT 0,
  `is_active` TINYINT DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `sku` (`sku`),
  INDEX `idx_web_variants_category_id` (`category_id`),
  INDEX `idx_web_variants_is_active` (`is_active`),
  FOREIGN KEY `fk_web_variants_category` (`category_id`) REFERENCES `web_categories`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users and Auth (excluding users table as requested)
CREATE TABLE IF NOT EXISTS `profiles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(255),
  `avatar_url` TEXT,
  `password_hash` VARCHAR(255),
  `role` VARCHAR(50) DEFAULT "user",
  `status` VARCHAR(50) DEFAULT "pending",
  `phone` VARCHAR(20),
  `company_id` INT,
  `department` VARCHAR(255),
  `position` VARCHAR(255),
  `password` TEXT,
  `auth_user_id` INT,
  `invited_by` INT,
  `invited_at` TIMESTAMP,
  `last_login` TIMESTAMP,
  `is_active` TINYINT DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_profiles_company_id` (`company_id`),
  INDEX `idx_profiles_role` (`role`),
  INDEX `idx_profiles_status` (`status`),
  INDEX `idx_profiles_email` (`email`),
  FOREIGN KEY `fk_profiles_company` (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_permissions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `permission_name` TEXT NOT NULL,
  `granted` TINYINT DEFAULT 1,
  `granted_by` INT,
  `granted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_permissions_user_id` (`user_id`),
  FOREIGN KEY `fk_user_permissions_user` (`user_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_invitations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` TEXT NOT NULL,
  `role` VARCHAR(50) DEFAULT "user",
  `company_id` INT NOT NULL,
  `invited_by` INT,
  `invited_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `expires_at` TIMESTAMP DEFAULT (DATE_ADD(NOW(), INTERVAL 7 DAY)),
  `accepted_at` TIMESTAMP,
  `is_approved` TINYINT DEFAULT 0,
  `approved_by` INT,
  `approved_at` TIMESTAMP,
  `status` VARCHAR(50) DEFAULT "pending",
  `invitation_token` VARCHAR(255),
  INDEX `idx_user_invitations_company_id` (`company_id`),
  INDEX `idx_user_invitations_status` (`status`),
  INDEX `idx_user_invitations_is_approved` (`is_approved`),
  INDEX `idx_user_invitations_token` (`invitation_token`),
  FOREIGN KEY `fk_user_invitations_company` (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT,
  `actor_user_id` INT,
  `action` VARCHAR(50) NOT NULL,
  `entity_type` VARCHAR(100) NOT NULL,
  `record_id` INT,
  `details` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_audit_logs_created_at` (`created_at` DESC),
  INDEX `idx_audit_logs_company_id` (`company_id`),
  INDEX `idx_audit_logs_entity_type` (`entity_type`),
  INDEX `idx_audit_logs_action` (`action`),
  INDEX `idx_audit_logs_actor_user_id` (`actor_user_id`),
  FOREIGN KEY `fk_audit_logs_company` (`company_id`) REFERENCES `companies`(`id`) ON DELETE SET NULL,
  FOREIGN KEY `fk_audit_logs_actor_user` (`actor_user_id`) REFERENCES `profiles`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `migration_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `migration_name` VARCHAR(255) NOT NULL,
  `executed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `status` VARCHAR(50) DEFAULT "completed",
  `notes` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `document_sequences` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `document_type` CHAR(3) NOT NULL,
  `year` INT NOT NULL,
  `sequence_number` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_type_year` (`document_type`, `year`),
  INDEX `idx_document_sequences_type` (`document_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Receipts - Using UUIDs (separate from main transaction tables)
CREATE TABLE IF NOT EXISTS `receipts` (
  `id` CHAR(36) PRIMARY KEY,
  `company_id` CHAR(36) NOT NULL,
  `payment_id` CHAR(36) NOT NULL,
  `invoice_id` CHAR(36),
  `receipt_number` VARCHAR(100) NOT NULL,
  `receipt_date` DATE NOT NULL,
  `receipt_type` VARCHAR(50) DEFAULT "payment_against_invoice",
  `total_amount` DECIMAL(15,2) NOT NULL,
  `excess_amount` DECIMAL(15,2) DEFAULT 0,
  `excess_handling` VARCHAR(50) DEFAULT "pending",
  `change_note_id` CHAR(36),
  `status` VARCHAR(50) DEFAULT "finalized",
  `void_reason` VARCHAR(255),
  `voided_by` CHAR(36),
  `voided_at` TIMESTAMP NULL,
  `notes` TEXT,
  `created_by` CHAR(36),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_receipt_number` (`company_id`, `receipt_number`),
  INDEX `idx_receipts_company_id` (`company_id`),
  INDEX `idx_receipts_payment_id` (`payment_id`),
  INDEX `idx_receipts_invoice_id` (`invoice_id`),
  INDEX `idx_receipts_created_at` (`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `receipt_items` (
  `id` CHAR(36) PRIMARY KEY,
  `receipt_id` CHAR(36) NOT NULL,
  `product_id` CHAR(36),
  `description` TEXT NOT NULL,
  `quantity` DECIMAL(10,3) NOT NULL,
  `unit_price` DECIMAL(15,2) NOT NULL,
  `tax_percentage` DECIMAL(5,2) DEFAULT 0,
  `tax_amount` DECIMAL(15,2) DEFAULT 0,
  `tax_inclusive` TINYINT DEFAULT 0,
  `discount_before_vat` DECIMAL(15,2) DEFAULT 0,
  `tax_setting_id` CHAR(36),
  `line_total` DECIMAL(15,2) NOT NULL,
  `notes` TEXT,
  `sort_order` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_receipt_items_receipt_id` (`receipt_id`),
  INDEX `idx_receipt_items_product_id` (`product_id`),
  INDEX `idx_receipt_items_created_at` (`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Legacy tables (for backward compatibility with external API)
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255),
  `password` TEXT,
  `role` VARCHAR(50),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `contacts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255),
  `email` VARCHAR(255),
  `phone` VARCHAR(20),
  `subject` VARCHAR(255),
  `message` TEXT,
  `status` VARCHAR(50) DEFAULT "new",
  `reply_notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `newsletter` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) UNIQUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `leads` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `business_name` VARCHAR(255),
  `contact_person` VARCHAR(255),
  `phone` VARCHAR(20),
  `email` VARCHAR(255),
  `business_category` VARCHAR(255),
  `location` VARCHAR(255),
  `website_url` VARCHAR(255),
  `website_status` VARCHAR(50),
  `lead_source` VARCHAR(50),
  `expressed_need` TEXT,
  `notes` TEXT,
  `status` VARCHAR(50),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `portfolios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `admin_id` INT,
  `title` VARCHAR(255),
  `description` TEXT,
  `website_url` VARCHAR(255) UNIQUE,
  `screenshot_url` VARCHAR(255),
  `status` VARCHAR(50) DEFAULT "pending",
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `website_url` (`website_url`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `opportunities` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `source` VARCHAR(2048),
  `snippet` TEXT,
  `url` VARCHAR(2048),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `message` TEXT,
  `level` VARCHAR(50),
  `source` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT,
  `message` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `web_app_leads` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255),
  `email` VARCHAR(255),
  `phone` VARCHAR(20),
  `message` TEXT,
  `source` VARCHAR(255),
  `status` VARCHAR(50) DEFAULT "new",
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `discovery_leads` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `business_name` VARCHAR(255),
  `location` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `roles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `role_type` VARCHAR(50) NOT NULL DEFAULT "custom",
  `description` TEXT,
  `permissions` JSON,
  `is_default` TINYINT DEFAULT 0,
  `is_active` TINYINT DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `fk_roles_company` (`company_id`),
  FOREIGN KEY `fk_roles_company` (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
