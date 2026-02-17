<?php
/**
 * Table Definitions Library
 * Comprehensive database table schemas for the MEDPLUS application
 * Synced with database/mysql/schema.sql
 */

/**
 * Get all table definitions
 */
function getTableDefinitions() {
    return [
        // Core multi-tenancy - Aligned with actual MySQL schema (INT ids)
        'companies' => 'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL UNIQUE, email VARCHAR(255), phone VARCHAR(50), address TEXT, city VARCHAR(100), state VARCHAR(100), postal_code VARCHAR(20), country VARCHAR(100), currency VARCHAR(3) DEFAULT "USD", website VARCHAR(255), logo_url VARCHAR(500), primary_color VARCHAR(7) DEFAULT "#FF8C42", status VARCHAR(50) DEFAULT "active", created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
        'customers' => 'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, company_id INT NOT NULL, name VARCHAR(255) NOT NULL, email VARCHAR(255), phone VARCHAR(50), address TEXT, city VARCHAR(100), state VARCHAR(100), postal_code VARCHAR(20), country VARCHAR(100), tax_id VARCHAR(50), customer_number VARCHAR(50), status VARCHAR(50) DEFAULT "active", credit_limit DECIMAL(15,2) DEFAULT 0, is_supplier TINYINT DEFAULT 0, payment_terms VARCHAR(50), is_active VARCHAR(50) DEFAULT "1", created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, KEY fk_customers_company (company_id), INDEX idx_customers_email (email), INDEX idx_customers_status (status)',
        'suppliers' => 'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, company_id INT NOT NULL, name VARCHAR(255) NOT NULL, email VARCHAR(255), phone VARCHAR(50), address TEXT, contact_person VARCHAR(255), payment_terms VARCHAR(100), status VARCHAR(50) DEFAULT "active", created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, INDEX idx_suppliers_company_id (company_id), INDEX idx_suppliers_status (status)',
        
        // Products and Inventory - Aligned with actual MySQL schema (INT ids)
        'product_categories' => 'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, company_id INT NOT NULL, name VARCHAR(255) NOT NULL, description TEXT, is_active TINYINT DEFAULT 1, product_code VARCHAR(250), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX idx_product_categories_company_id (company_id)',
        'products' => 'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, company_id INT NOT NULL, category_id INT, name VARCHAR(255) NOT NULL, description TEXT, sku VARCHAR(100) UNIQUE, unit_of_measure VARCHAR(50), stock_quantity DECIMAL(10,3) DEFAULT 0, reorder_level DECIMAL(10,3) DEFAULT 0, unit_price DECIMAL(15,2) NOT NULL, cost_price DECIMAL(15,2) DEFAULT 0, status VARCHAR(50) DEFAULT "active", created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, KEY fk_products_company (company_id), INDEX idx_products_category_id (category_id), UNIQUE KEY sku (sku), INDEX idx_products_status (status)',

        // Tax and Payments - Aligned with actual MySQL schema (INT ids)
        'tax_settings' => 'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, company_id INT NOT NULL, name VARCHAR(255) NOT NULL, rate DECIMAL(6,3) DEFAULT 0, is_active TINYINT DEFAULT 1, is_default TINYINT DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, INDEX idx_tax_settings_company_id (company_id), INDEX idx_tax_settings_active (company_id, is_active)',
        'payment_methods' => 'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, company_id INT NOT NULL, name VARCHAR(100) NOT NULL, code VARCHAR(50) NOT NULL, is_active TINYINT DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX idx_payment_methods_company_id (company_id), INDEX idx_payment_methods_is_active (is_active)',
        
        // Sales Documents - Aligned with actual MySQL schema (INT ids)
        'quotations' => 'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, company_id INT NOT NULL DEFAULT 0, customer_id INT, portfolio_id INT, customer_name VARCHAR(255), customer_email VARCHAR(255), customer_phone VARCHAR(20), quotation_number VARCHAR(255), quotation_date DATE, valid_until DATE, project_description TEXT, budget_range VARCHAR(100), timeline VARCHAR(100), status VARCHAR(50) DEFAULT "draft", subtotal DECIMAL(12,2) DEFAULT 0, tax_amount DECIMAL(12,2) DEFAULT 0, total_amount DECIMAL(12,2) DEFAULT 0, notes TEXT, terms_and_conditions TEXT, created_by INT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, KEY idx_company_id (company_id), KEY idx_customer_id (customer_id), KEY idx_status (status)',
        'quotation_items' => 'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, quotation_id INT NOT NULL, product_id INT, description TEXT NOT NULL, quantity DECIMAL(10,3) NOT NULL, unit_price DECIMAL(15,2) NOT NULL, tax_percentage DECIMAL(5,2) DEFAULT 0, tax_amount DECIMAL(15,2) DEFAULT 0, tax_inclusive TINYINT DEFAULT 0, tax_setting_id INT, line_total DECIMAL(15,2) NOT NULL, sort_order INT DEFAULT 0, INDEX idx_quotation_items_quotation_id (quotation_id)',
        'invoices' => 'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, company_id INT NOT NULL, customer_id INT NOT NULL, quotation_id INT, invoice_number VARCHAR(100) NOT NULL UNIQUE, invoice_date DATE, due_date DATE, subtotal DECIMAL(15,2) DEFAULT 0, tax_amount DECIMAL(15,2) DEFAULT 0, total_amount DECIMAL(15,2) DEFAULT 0, paid_amount DECIMAL(15,2) DEFAULT 0, balance_due DECIMAL(15,2) DEFAULT 0, lpo_number VARCHAR(255), status VARCHAR(50) DEFAULT "draft", created_by INT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, UNIQUE KEY invoice_number (invoice_number), KEY fk_invoices_customer (customer_id), INDEX idx_invoices_status (status)',
        'invoice_items' => 'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, invoice_id INT NOT NULL, product_id INT, description TEXT NOT NULL, quantity DECIMAL(10,3) NOT NULL, unit_price DECIMAL(15,2) NOT NULL, tax_percentage DECIMAL(5,2) DEFAULT 0, tax_amount DECIMAL(15,2) DEFAULT 0, tax_inclusive TINYINT DEFAULT 0, tax_setting_id INT, line_total DECIMAL(15,2) NOT NULL, sort_order INT DEFAULT 0, KEY fk_invoice_items_invoice (invoice_id)',
        
        // Proforma Invoices - Aligned with actual MySQL schema (INT ids)
        'proforma_invoices' => 'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, company_id INT NOT NULL, customer_id INT NOT NULL, proforma_number VARCHAR(100) NOT NULL UNIQUE, proforma_date DATE, subtotal DECIMAL(15,2) DEFAULT 0, tax_percentage DECIMAL(5,2) DEFAULT 0, tax_amount DECIMAL(15,2) DEFAULT 0, total_amount DECIMAL(15,2) DEFAULT 0, notes TEXT, valid_until DATE, terms_and_conditions TEXT, status VARCHAR(50) DEFAULT "draft", created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY proforma_number (proforma_number)',
        'proforma_items' => 'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, proforma_id INT NOT NULL, product_id INT, description TEXT NOT NULL, quantity DECIMAL(10,3) NOT NULL, unit_price DECIMAL(15,2) NOT NULL, line_total DECIMAL(15,2) NOT NULL',

        // Delivery Notes - Aligned with actual MySQL schema (INT ids)
        'delivery_notes' => 'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, company_id INT NOT NULL, customer_id INT NOT NULL, invoice_id INT, delivery_note_number VARCHAR(100) NOT NULL UNIQUE, delivery_date DATE, status VARCHAR(50) DEFAULT "draft", created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY delivery_note_number (delivery_note_number)',
        'delivery_note_items' => 'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, delivery_note_id INT NOT NULL, product_id INT, description TEXT NOT NULL, quantity DECIMAL(10,3) NOT NULL',

        // Credit Notes - Aligned with actual MySQL schema (INT ids)
        'credit_notes' => 'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, company_id INT NOT NULL, customer_id INT NOT NULL, invoice_id INT, credit_note_number VARCHAR(100) NOT NULL, total_amount DECIMAL(15,2) DEFAULT 0, status VARCHAR(50) DEFAULT "draft", created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        'credit_note_items' => 'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, credit_note_id INT NOT NULL, product_id INT, description TEXT NOT NULL, quantity DECIMAL(10,3) DEFAULT 1, unit_price DECIMAL(15,2) DEFAULT 0, line_total DECIMAL(15,2) DEFAULT 0',
        'credit_note_allocations' => 'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, credit_note_id INT NOT NULL, invoice_id INT NOT NULL, allocated_amount DECIMAL(15,2) DEFAULT 0',
        
        // Payments - Aligned with actual MySQL schema (INT ids)
        'payments' => 'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, company_id INT NOT NULL, invoice_id INT, payment_date DATE, payment_method VARCHAR(50), amount DECIMAL(15,2) NOT NULL, reference_number VARCHAR(255), created_by INT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        'payment_allocations' => 'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, payment_id INT NOT NULL, invoice_id INT NOT NULL, amount DECIMAL(15,2) NOT NULL',
        'payment_audit_log' => 'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, action VARCHAR(50) NOT NULL, payment_id INT NOT NULL, invoice_id INT NOT NULL, payment_amount DECIMAL(15,2) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',

        // Stock Management - Aligned with actual MySQL schema (INT ids)
        'stock_movements' => 'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, company_id INT NOT NULL, product_id INT NOT NULL, movement_type VARCHAR(50) NOT NULL, reference_type VARCHAR(50), reference_id INT, quantity DECIMAL(10,3) NOT NULL, cost_per_unit DECIMAL(15,2), notes TEXT, movement_date DATE, created_by INT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',

        // LPOs - Aligned with actual MySQL schema (INT ids)
        'lpos' => 'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, company_id INT NOT NULL, supplier_id INT, lpo_number VARCHAR(100) NOT NULL UNIQUE, total_amount DECIMAL(15,2) DEFAULT 0, status VARCHAR(50) DEFAULT "draft", created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY lpo_number (lpo_number)',
        'lpo_items' => 'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, lpo_id INT NOT NULL, product_id INT, description TEXT NOT NULL, quantity DECIMAL(10,3) NOT NULL, unit_price DECIMAL(15,2) NOT NULL, line_total DECIMAL(15,2) NOT NULL',
        
        // Remittance - Aligned with actual MySQL schema (INT ids)
        'remittance_advice' => 'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, company_id INT NOT NULL, supplier_id INT, remittance_number VARCHAR(100) NOT NULL UNIQUE, total_amount DECIMAL(15,2), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX idx_remittance_advice_company_id (company_id), INDEX idx_remittance_advice_supplier_id (supplier_id)',
        'remittance_advice_items' => 'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, remittance_id INT NOT NULL, invoice_number VARCHAR(100), amount DECIMAL(15,2) NOT NULL, INDEX idx_remittance_advice_items_remittance_id (remittance_id)',
        
        // Web Store - Aligned with actual MySQL schema (INT ids)
        'web_categories' => 'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL UNIQUE, slug VARCHAR(255) NOT NULL UNIQUE, is_active TINYINT DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY name (name), UNIQUE KEY slug (slug)',
        'web_variants' => 'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, category_id INT NOT NULL, name VARCHAR(255) NOT NULL, sku VARCHAR(100) NOT NULL UNIQUE, is_active TINYINT DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY sku (sku)',

        // Users and Auth - Aligned with actual MySQL schema (INT ids)
        'profiles' => 'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, email VARCHAR(255) NOT NULL, full_name VARCHAR(255), avatar_url TEXT, role VARCHAR(50) DEFAULT "user", status VARCHAR(50) DEFAULT "pending", phone VARCHAR(20), company_id INT, department VARCHAR(255), position VARCHAR(255), invited_by INT, invited_at TIMESTAMP, last_login TIMESTAMP, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, KEY fk_profiles_company (company_id)',
        'user_permissions' => 'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, permission_name TEXT NOT NULL, granted TINYINT DEFAULT 1, granted_by INT, granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        'user_invitations' => 'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, email TEXT NOT NULL, role VARCHAR(50) DEFAULT "user", company_id INT NOT NULL, invited_by INT, invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, expires_at TIMESTAMP, accepted_at TIMESTAMP, is_approved TINYINT DEFAULT 0, approved_by INT, approved_at TIMESTAMP, status VARCHAR(50) DEFAULT "pending", invitation_token VARCHAR(255)',

        // Audit - Aligned with actual MySQL schema (INT ids)
        'audit_logs' => 'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, company_id INT, actor_user_id INT, action VARCHAR(50) NOT NULL, entity_type VARCHAR(100) NOT NULL, record_id INT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        'migration_logs' => 'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, migration_name VARCHAR(255) NOT NULL, executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',

        // Document Numbering - Global sequential number tracking
        'document_sequences' => 'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, document_type CHAR(3) NOT NULL, year INT NOT NULL, sequence_number INT DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, UNIQUE KEY unique_type_year (document_type, year), INDEX idx_document_sequences_type (document_type)',

        // Receipts - Aligned with actual MySQL schema (CHAR(36) UUIDs)
        'receipts' => 'id CHAR(36) PRIMARY KEY, company_id CHAR(36) NOT NULL, payment_id CHAR(36) NOT NULL, invoice_id CHAR(36), receipt_number VARCHAR(100) NOT NULL, receipt_date DATE NOT NULL, receipt_type VARCHAR(50) DEFAULT "payment_against_invoice", total_amount DECIMAL(15,2) NOT NULL, excess_amount DECIMAL(15,2) DEFAULT 0, excess_handling VARCHAR(50) DEFAULT "pending", change_note_id CHAR(36), status VARCHAR(50) DEFAULT "finalized", void_reason VARCHAR(255), voided_by CHAR(36), voided_at TIMESTAMP NULL, notes TEXT, created_by CHAR(36), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, UNIQUE KEY unique_receipt_number (company_id, receipt_number), KEY idx_receipts_company_id (company_id), KEY idx_receipts_payment_id (payment_id), KEY idx_receipts_invoice_id (invoice_id), KEY idx_receipts_created_at (created_at DESC)',
        'receipt_items' => 'id CHAR(36) PRIMARY KEY, receipt_id CHAR(36) NOT NULL, product_id CHAR(36), description TEXT NOT NULL, quantity DECIMAL(10,3) NOT NULL, unit_price DECIMAL(15,2) NOT NULL, tax_percentage DECIMAL(5,2) DEFAULT 0, tax_amount DECIMAL(15,2) DEFAULT 0, tax_inclusive TINYINT DEFAULT 0, discount_before_vat DECIMAL(15,2) DEFAULT 0, tax_setting_id CHAR(36), line_total DECIMAL(15,2) NOT NULL, notes TEXT, sort_order INT DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, KEY idx_receipt_items_receipt_id (receipt_id), KEY idx_receipt_items_product_id (product_id), KEY idx_receipt_items_created_at (created_at DESC)',

        // Legacy tables (for backward compatibility with external API)
        'users' => 'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, email VARCHAR(255), password TEXT, role VARCHAR(50), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY email (email)',
        'contacts' => 'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), email VARCHAR(255), message TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        'newsletter' => 'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, email VARCHAR(255), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY email (email)',
        'leads' => 'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, business_name VARCHAR(255), contact_person VARCHAR(255), status VARCHAR(50), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        'portfolios' => 'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), website_url VARCHAR(255), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY website_url (website_url)',
        'opportunities' => 'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, source VARCHAR(2048), snippet TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        'logs' => 'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, message TEXT, level VARCHAR(50), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        'chat_messages' => 'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, user_id INT, message TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        'web_app_leads' => 'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), email VARCHAR(255), message TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        'discovery_leads' => 'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, business_name VARCHAR(255), location VARCHAR(255), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        'roles' => 'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, company_id INT NOT NULL, name VARCHAR(100) NOT NULL, role_type VARCHAR(50) NOT NULL DEFAULT "custom", description TEXT, permissions JSON, is_default TINYINT DEFAULT 0, is_active TINYINT DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, KEY fk_roles_company (company_id)'
    ];
}

/**
 * Check the status of all tables in the database
 */
function checkTableStatus($conn) {
    $tables = getTableDefinitions();
    $tableStatus = [];
    
    foreach (array_keys($tables) as $tableName) {
        $result = $conn->query("SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '$tableName'");
        $exists = $result && $result->num_rows > 0;
        
        $tableStatus[$tableName] = [
            'exists' => $exists,
            'name' => $tableName
        ];
    }
    
    return $tableStatus;
}

/**
 * Create all missing tables in the database
 */
function createMissingTables($conn, $requestedTables = null) {
    $allTables = getTableDefinitions();
    $tablesToCreate = $requestedTables ? array_intersect_key($allTables, array_flip($requestedTables)) : $allTables;
    
    $created = [];
    $failed = [];
    $skipped = [];
    
    foreach ($tablesToCreate as $tableName => $schema) {
        $result = $conn->query("SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '$tableName'");
        
        if ($result && $result->num_rows > 0) {
            $skipped[] = $tableName;
            continue;
        }
        
        $sql = "CREATE TABLE IF NOT EXISTS `$tableName` ($schema)";
        if ($conn->query($sql)) {
            $created[] = $tableName;
        } else {
            $failed[] = [
                'table' => $tableName,
                'error' => $conn->error
            ];
        }
    }
    
    return [
        'success' => count($failed) === 0,
        'created' => $created,
        'skipped' => $skipped,
        'failed' => $failed,
        'total_created' => count($created),
        'total_skipped' => count($skipped),
        'total_failed' => count($failed)
    ];
}

/**
 * Drop all tables from the database
 */
function dropAllTables($conn) {
    $tables = getTableDefinitions();
    $dropped = [];
    $failed = [];
    
    foreach (array_keys($tables) as $tableName) {
        $sql = "DROP TABLE IF EXISTS `$tableName`";
        if ($conn->query($sql)) {
            $dropped[] = $tableName;
        } else {
            $failed[] = [
                'table' => $tableName,
                'error' => $conn->error
            ];
        }
    }
    
    return [
        'success' => count($failed) === 0,
        'dropped' => $dropped,
        'failed' => $failed
    ];
}

/**
 * Reset the database - drop all tables and recreate them
 */
function resetDatabase($conn) {
    $dropResult = dropAllTables($conn);
    if (!$dropResult['success']) {
        return [
            'success' => false,
            'message' => 'Failed to drop tables',
            'details' => $dropResult
        ];
    }
    
    $createResult = createMissingTables($conn);
    return [
        'success' => $createResult['success'],
        'message' => 'Database reset successful',
        'dropped' => $dropResult['dropped'],
        'created' => $createResult['created'],
        'failed' => $createResult['failed']
    ];
}

?>
