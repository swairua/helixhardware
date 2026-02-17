/**
 * MySQL Table Definitions
 * Contains CREATE TABLE statements for all application tables
 * Used by admin tools to recreate missing tables
 */

export const mysqlTableDefinitions = {
  companies: `
    CREATE TABLE IF NOT EXISTS companies (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      registration_number VARCHAR(100),
      tax_number VARCHAR(100),
      email VARCHAR(255),
      phone VARCHAR(50),
      address TEXT,
      city VARCHAR(100),
      state VARCHAR(100),
      postal_code VARCHAR(20),
      country VARCHAR(100) DEFAULT 'Kenya',
      logo_url TEXT,
      currency VARCHAR(3) DEFAULT 'KES',
      fiscal_year_start INT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_name (name),
      KEY idx_tax_number (tax_number)
    )
  `,

  profiles: `
    CREATE TABLE IF NOT EXISTS profiles (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      full_name VARCHAR(255),
      avatar_url TEXT,
      role VARCHAR(50) DEFAULT 'user',
      status VARCHAR(50) DEFAULT 'pending',
      phone VARCHAR(50),
      company_id VARCHAR(36),
      department VARCHAR(100),
      position VARCHAR(100),
      invited_by VARCHAR(36),
      invited_at TIMESTAMP NULL,
      last_login TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_email (email),
      KEY idx_company_id (company_id),
      KEY idx_role (role),
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
    )
  `,

  customers: `
    CREATE TABLE IF NOT EXISTS customers (
      id VARCHAR(36) PRIMARY KEY,
      company_id VARCHAR(36),
      customer_code VARCHAR(50),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(50),
      address TEXT,
      city VARCHAR(100),
      state VARCHAR(100),
      postal_code VARCHAR(20),
      country VARCHAR(100) DEFAULT 'Kenya',
      tax_number VARCHAR(100),
      credit_limit DECIMAL(15,2) DEFAULT 0,
      payment_terms INT DEFAULT 30,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_company_id (company_id),
      KEY idx_customer_code (customer_code),
      KEY idx_name (name),
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    )
  `,

  product_categories: `
    CREATE TABLE IF NOT EXISTS product_categories (
      id VARCHAR(36) PRIMARY KEY,
      company_id VARCHAR(36),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      parent_id VARCHAR(36),
      is_active BOOLEAN DEFAULT TRUE,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_company_id (company_id),
      KEY idx_name (name),
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES product_categories(id) ON DELETE SET NULL
    )
  `,

  products: `
    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(36) PRIMARY KEY,
      company_id VARCHAR(36),
      category_id VARCHAR(36),
      product_code VARCHAR(100),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      unit_of_measure VARCHAR(50) DEFAULT 'pcs',
      cost_price DECIMAL(15,2) DEFAULT 0,
      selling_price DECIMAL(15,2) DEFAULT 0,
      stock_quantity INT DEFAULT 0,
      minimum_stock_level INT DEFAULT 0,
      maximum_stock_level INT,
      reorder_point INT DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      track_inventory BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_company_id (company_id),
      KEY idx_category_id (category_id),
      KEY idx_product_code (product_code),
      KEY idx_name (name),
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE SET NULL
    )
  `,

  tax_settings: `
    CREATE TABLE IF NOT EXISTS tax_settings (
      id VARCHAR(36) PRIMARY KEY,
      company_id VARCHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      rate DECIMAL(6,3) NOT NULL DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      is_default BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_company_id (company_id),
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    )
  `,

  quotations: `
    CREATE TABLE IF NOT EXISTS quotations (
      id VARCHAR(36) PRIMARY KEY,
      company_id VARCHAR(36),
      customer_id VARCHAR(36),
      quotation_number VARCHAR(100),
      status VARCHAR(50) DEFAULT 'draft',
      currency VARCHAR(3) DEFAULT 'KES',
      subtotal DECIMAL(15,2) DEFAULT 0,
      tax_amount DECIMAL(15,2) DEFAULT 0,
      total DECIMAL(15,2) DEFAULT 0,
      notes TEXT,
      valid_until TIMESTAMP NULL,
      created_by VARCHAR(36),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_company_id (company_id),
      KEY idx_customer_id (customer_id),
      KEY idx_quotation_number (quotation_number),
      KEY idx_status (status),
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
    )
  `,

  quotation_items: `
    CREATE TABLE IF NOT EXISTS quotation_items (
      id VARCHAR(36) PRIMARY KEY,
      quotation_id VARCHAR(36),
      product_id VARCHAR(36),
      quantity INT,
      unit_price DECIMAL(15,2),
      tax_rate DECIMAL(6,3) DEFAULT 0,
      subtotal DECIMAL(15,2),
      tax_amount DECIMAL(15,2) DEFAULT 0,
      total DECIMAL(15,2),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_quotation_id (quotation_id),
      KEY idx_product_id (product_id),
      FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    )
  `,

  proforma_invoices: `
    CREATE TABLE IF NOT EXISTS proforma_invoices (
      id VARCHAR(36) PRIMARY KEY,
      company_id VARCHAR(36),
      customer_id VARCHAR(36),
      quotation_id VARCHAR(36),
      invoice_number VARCHAR(100),
      status VARCHAR(50) DEFAULT 'draft',
      currency VARCHAR(3) DEFAULT 'KES',
      subtotal DECIMAL(15,2) DEFAULT 0,
      tax_amount DECIMAL(15,2) DEFAULT 0,
      total DECIMAL(15,2) DEFAULT 0,
      notes TEXT,
      valid_until DATE NULL,
      due_date TIMESTAMP NULL,
      created_by VARCHAR(36),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_company_id (company_id),
      KEY idx_customer_id (customer_id),
      KEY idx_invoice_number (invoice_number),
      KEY idx_status (status),
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
      FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE SET NULL
    )
  `,

  proforma_items: `
    CREATE TABLE IF NOT EXISTS proforma_items (
      id VARCHAR(36) PRIMARY KEY,
      proforma_id VARCHAR(36),
      product_id VARCHAR(36),
      quantity INT,
      unit_price DECIMAL(15,2),
      tax_rate DECIMAL(6,3) DEFAULT 0,
      subtotal DECIMAL(15,2),
      tax_amount DECIMAL(15,2) DEFAULT 0,
      total DECIMAL(15,2),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_proforma_id (proforma_id),
      KEY idx_product_id (product_id),
      FOREIGN KEY (proforma_id) REFERENCES proforma_invoices(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    )
  `,

  invoices: `
    CREATE TABLE IF NOT EXISTS invoices (
      id VARCHAR(36) PRIMARY KEY,
      company_id VARCHAR(36),
      customer_id VARCHAR(36),
      proforma_id VARCHAR(36),
      invoice_number VARCHAR(100),
      status VARCHAR(50) DEFAULT 'draft',
      currency VARCHAR(3) DEFAULT 'KES',
      subtotal DECIMAL(15,2) DEFAULT 0,
      tax_amount DECIMAL(15,2) DEFAULT 0,
      total DECIMAL(15,2) DEFAULT 0,
      amount_paid DECIMAL(15,2) DEFAULT 0,
      balance DECIMAL(15,2) DEFAULT 0,
      notes TEXT,
      due_date TIMESTAMP NULL,
      payment_terms INT DEFAULT 30,
      created_by VARCHAR(36),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_company_id (company_id),
      KEY idx_customer_id (customer_id),
      KEY idx_invoice_number (invoice_number),
      KEY idx_status (status),
      KEY idx_balance (balance),
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
      FOREIGN KEY (proforma_id) REFERENCES proforma_invoices(id) ON DELETE SET NULL
    )
  `,

  invoice_items: `
    CREATE TABLE IF NOT EXISTS invoice_items (
      id VARCHAR(36) PRIMARY KEY,
      invoice_id VARCHAR(36),
      product_id VARCHAR(36),
      quantity INT,
      unit_price DECIMAL(15,2),
      tax_rate DECIMAL(6,3) DEFAULT 0,
      subtotal DECIMAL(15,2),
      tax_amount DECIMAL(15,2) DEFAULT 0,
      total DECIMAL(15,2),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_invoice_id (invoice_id),
      KEY idx_product_id (product_id),
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    )
  `,

  delivery_notes: `
    CREATE TABLE IF NOT EXISTS delivery_notes (
      id VARCHAR(36) PRIMARY KEY,
      company_id VARCHAR(36),
      customer_id VARCHAR(36),
      invoice_id VARCHAR(36),
      delivery_number VARCHAR(100),
      status VARCHAR(50) DEFAULT 'draft',
      delivery_date TIMESTAMP NULL,
      notes TEXT,
      created_by VARCHAR(36),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_company_id (company_id),
      KEY idx_customer_id (customer_id),
      KEY idx_invoice_id (invoice_id),
      KEY idx_delivery_number (delivery_number),
      KEY idx_status (status),
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL
    )
  `,

  delivery_note_items: `
    CREATE TABLE IF NOT EXISTS delivery_note_items (
      id VARCHAR(36) PRIMARY KEY,
      delivery_note_id VARCHAR(36),
      product_id VARCHAR(36),
      quantity INT,
      quantity_delivered INT DEFAULT 0,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_delivery_note_id (delivery_note_id),
      KEY idx_product_id (product_id),
      FOREIGN KEY (delivery_note_id) REFERENCES delivery_notes(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    )
  `,

  payments: `
    CREATE TABLE IF NOT EXISTS payments (
      id VARCHAR(36) PRIMARY KEY,
      company_id VARCHAR(36),
      customer_id VARCHAR(36),
      amount DECIMAL(15,2),
      payment_method VARCHAR(100),
      payment_date TIMESTAMP NULL,
      reference VARCHAR(255),
      notes TEXT,
      created_by VARCHAR(36),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_company_id (company_id),
      KEY idx_customer_id (customer_id),
      KEY idx_payment_date (payment_date),
      KEY idx_reference (reference),
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
    )
  `,

  payment_allocations: `
    CREATE TABLE IF NOT EXISTS payment_allocations (
      id VARCHAR(36) PRIMARY KEY,
      payment_id VARCHAR(36),
      invoice_id VARCHAR(36),
      amount DECIMAL(15,2),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_payment_id (payment_id),
      KEY idx_invoice_id (invoice_id),
      FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    )
  `,

  credit_notes: `
    CREATE TABLE IF NOT EXISTS credit_notes (
      id VARCHAR(36) PRIMARY KEY,
      company_id VARCHAR(36),
      customer_id VARCHAR(36),
      invoice_id VARCHAR(36),
      credit_note_number VARCHAR(100),
      status VARCHAR(50) DEFAULT 'draft',
      reason VARCHAR(255),
      currency VARCHAR(3) DEFAULT 'KES',
      subtotal DECIMAL(15,2) DEFAULT 0,
      tax_amount DECIMAL(15,2) DEFAULT 0,
      total DECIMAL(15,2) DEFAULT 0,
      notes TEXT,
      created_by VARCHAR(36),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_company_id (company_id),
      KEY idx_customer_id (customer_id),
      KEY idx_invoice_id (invoice_id),
      KEY idx_credit_note_number (credit_note_number),
      KEY idx_status (status),
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL
    )
  `,

  credit_note_items: `
    CREATE TABLE IF NOT EXISTS credit_note_items (
      id VARCHAR(36) PRIMARY KEY,
      credit_note_id VARCHAR(36),
      product_id VARCHAR(36),
      quantity INT,
      unit_price DECIMAL(15,2),
      tax_rate DECIMAL(6,3) DEFAULT 0,
      subtotal DECIMAL(15,2),
      tax_amount DECIMAL(15,2) DEFAULT 0,
      total DECIMAL(15,2),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_credit_note_id (credit_note_id),
      KEY idx_product_id (product_id),
      FOREIGN KEY (credit_note_id) REFERENCES credit_notes(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    )
  `,

  lpos: `
    CREATE TABLE IF NOT EXISTS lpos (
      id VARCHAR(36) PRIMARY KEY,
      company_id VARCHAR(36),
      supplier_id VARCHAR(36),
      lpo_number VARCHAR(100),
      status VARCHAR(50) DEFAULT 'draft',
      currency VARCHAR(3) DEFAULT 'KES',
      subtotal DECIMAL(15,2) DEFAULT 0,
      tax_amount DECIMAL(15,2) DEFAULT 0,
      total DECIMAL(15,2) DEFAULT 0,
      notes TEXT,
      created_by VARCHAR(36),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_company_id (company_id),
      KEY idx_supplier_id (supplier_id),
      KEY idx_lpo_number (lpo_number),
      KEY idx_status (status),
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY (supplier_id) REFERENCES customers(id) ON DELETE SET NULL
    )
  `,

  lpo_items: `
    CREATE TABLE IF NOT EXISTS lpo_items (
      id VARCHAR(36) PRIMARY KEY,
      lpo_id VARCHAR(36),
      product_id VARCHAR(36),
      quantity INT,
      unit_price DECIMAL(15,2),
      tax_rate DECIMAL(6,3) DEFAULT 0,
      subtotal DECIMAL(15,2),
      tax_amount DECIMAL(15,2) DEFAULT 0,
      total DECIMAL(15,2),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_lpo_id (lpo_id),
      KEY idx_product_id (product_id),
      FOREIGN KEY (lpo_id) REFERENCES lpos(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    )
  `,

  stock_movements: `
    CREATE TABLE IF NOT EXISTS stock_movements (
      id VARCHAR(36) PRIMARY KEY,
      company_id VARCHAR(36),
      product_id VARCHAR(36),
      movement_type VARCHAR(50),
      quantity INT,
      reference_type VARCHAR(50),
      reference_id VARCHAR(36),
      notes TEXT,
      created_by VARCHAR(36),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_company_id (company_id),
      KEY idx_product_id (product_id),
      KEY idx_reference (reference_type, reference_id),
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `,

  audit_logs: `
    CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36),
      action VARCHAR(100),
      entity_type VARCHAR(100),
      entity_id VARCHAR(36),
      old_values JSON,
      new_values JSON,
      ip_address VARCHAR(50),
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      KEY idx_user_id (user_id),
      KEY idx_action (action),
      KEY idx_created_at (created_at)
    )
  `,

  payment_methods: `
    CREATE TABLE IF NOT EXISTS payment_methods (
      id VARCHAR(36) PRIMARY KEY,
      company_id VARCHAR(36),
      code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_company_id (company_id),
      KEY idx_code (code),
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    )
  `,
};

// List of all table names
export const allTableNames = Object.keys(mysqlTableDefinitions);

// List of core required tables (must exist)
export const requiredTables = [
  'companies',
  'profiles',
  'customers',
  'products',
  'product_categories',
  'tax_settings',
];

// List of optional tables (nice to have, but not required)
export const optionalTables = [
  'quotations',
  'quotation_items',
  'proforma_invoices',
  'proforma_items',
  'invoices',
  'invoice_items',
  'delivery_notes',
  'delivery_note_items',
  'payments',
  'payment_allocations',
  'credit_notes',
  'credit_note_items',
  'lpos',
  'lpo_items',
  'stock_movements',
  'audit_logs',
  'payment_methods',
];
