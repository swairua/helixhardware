/**
 * Database Initialization Library
 * Handles checking and creating missing database tables on the remote MySQL server
 */

// Get API URL from environment or use relative /api.php
const EXTERNAL_API_URL = process.env.VITE_EXTERNAL_API_URL || '/api.php';

// List of all required tables
const REQUIRED_TABLES = [
  'companies',
  'profiles',
  'customers',
  'suppliers',
  'product_categories',
  'products',
  'tax_settings',
  'quotations',
  'quotation_items',
  'invoices',
  'invoice_items',
  'proforma_invoices',
  'proforma_items',
  'delivery_notes',
  'delivery_note_items',
  'payments',
  'payment_allocations',
  'payment_audit_log',
  'payment_methods',
  'remittance_advice',
  'remittance_advice_items',
  'stock_movements',
  'lpos',
  'lpo_items',
  'web_categories',
  'web_variants',
  'user_permissions',
  'user_invitations',
  'audit_logs',
  'migration_logs',
  'credit_notes',
  'credit_note_items',
  'credit_note_allocations'
];

interface TableStatus {
  name: string;
  exists: boolean;
}

interface DatabaseStatus {
  connected: boolean;
  tablesFound: number;
  totalTables: number;
  missingTables: string[];
  tables: TableStatus[];
  timestamp: string;
  error?: string;
}

/**
 * Check which tables exist in the remote database
 */
export async function checkDatabaseStatus(): Promise<DatabaseStatus> {
  try {
    const response = await fetch(`${EXTERNAL_API_URL}?action=check_tables`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tables: REQUIRED_TABLES
      })
    });

    if (!response.ok) {
      return {
        connected: false,
        tablesFound: 0,
        totalTables: REQUIRED_TABLES.length,
        missingTables: REQUIRED_TABLES,
        tables: REQUIRED_TABLES.map(t => ({ name: t, exists: false })),
        timestamp: new Date().toISOString(),
        error: `API returned status ${response.status}`
      };
    }

    // Defensively parse JSON
    const data = await response.json().catch(() => {
      throw new Error('Invalid response from server: Expected valid JSON');
    });

    // If API supports returning table status
    if (data.status === 'ok' && data.tables) {
      const tables = data.tables as TableStatus[];
      const missingTables = tables
        .filter(t => !t.exists)
        .map(t => t.name);

      return {
        connected: true,
        tablesFound: tables.filter(t => t.exists).length,
        totalTables: REQUIRED_TABLES.length,
        missingTables,
        tables,
        timestamp: new Date().toISOString()
      };
    }

    // Fallback: assume all tables missing if check not supported
    return {
      connected: true,
      tablesFound: 0,
      totalTables: REQUIRED_TABLES.length,
      missingTables: REQUIRED_TABLES,
      tables: REQUIRED_TABLES.map(t => ({ name: t, exists: false })),
      timestamp: new Date().toISOString(),
      error: 'Table check endpoint not supported by API'
    };
  } catch (error) {
    return {
      connected: false,
      tablesFound: 0,
      totalTables: REQUIRED_TABLES.length,
      missingTables: REQUIRED_TABLES,
      tables: REQUIRED_TABLES.map(t => ({ name: t, exists: false })),
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error checking database'
    };
  }
}

/**
 * Initialize the database by creating missing tables
 * This would need to be called with admin privileges
 */
export async function initializeDatabase(): Promise<{
  success: boolean;
  message: string;
  tablesCreated: string[];
  errors: string[];
}> {
  try {
    // First check which tables exist
    const status = await checkDatabaseStatus();

    if (status.missingTables.length === 0) {
      return {
        success: true,
        message: 'All required tables already exist',
        tablesCreated: [],
        errors: []
      };
    }

    // Call API to initialize database with missing tables
    const response = await fetch(`${EXTERNAL_API_URL}?action=init_database`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tables: status.missingTables
      })
    });

    // Defensively parse JSON
    const data = await response.json().catch(() => {
      if (!response.ok) {
        throw new Error(`Server error: HTTP ${response.status}. Failed to initialize database.`);
      }
      throw new Error('Invalid response from server: Expected valid JSON');
    });

    if (data.status === 'ok') {
      return {
        success: true,
        message: `Successfully created ${status.missingTables.length} missing tables`,
        tablesCreated: status.missingTables,
        errors: []
      };
    }

    return {
      success: false,
      message: 'Failed to initialize database',
      tablesCreated: [],
      errors: [data.error || 'Unknown error']
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error initializing database',
      tablesCreated: [],
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

/**
 * Get detailed table structure information
 */
export async function getTableStructures(): Promise<{
  success: boolean;
  tables: Record<string, any>;
  error?: string;
}> {
  try {
    const response = await fetch(`${EXTERNAL_API_URL}?action=get_table_structures`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tables: REQUIRED_TABLES
      })
    });

    // Defensively parse JSON
    const data = await response.json().catch(() => {
      if (!response.ok) {
        throw new Error(`Server error: HTTP ${response.status}. Failed to get table structures.`);
      }
      throw new Error('Invalid response from server: Expected valid JSON');
    });

    if (data.status === 'ok') {
      return {
        success: true,
        tables: data.tables || {}
      };
    }

    return {
      success: false,
      tables: {},
      error: data.error || 'Failed to get table structures'
    };
  } catch (error) {
    return {
      success: false,
      tables: {},
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(): Promise<{
  success: boolean;
  stats: {
    totalTables: number;
    tablesWithData: number;
    totalRecords: number;
    databaseSize?: string;
  };
  error?: string;
}> {
  try {
    const response = await fetch(`${EXTERNAL_API_URL}?action=get_db_stats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    // Defensively parse JSON
    const data = await response.json().catch(() => {
      if (!response.ok) {
        throw new Error(`Server error: HTTP ${response.status}. Failed to get database stats.`);
      }
      throw new Error('Invalid response from server: Expected valid JSON');
    });

    if (data.status === 'ok') {
      return {
        success: true,
        stats: data.stats || {
          totalTables: 0,
          tablesWithData: 0,
          totalRecords: 0
        }
      };
    }

    return {
      success: false,
      stats: {
        totalTables: 0,
        tablesWithData: 0,
        totalRecords: 0
      },
      error: data.error || 'Failed to get database stats'
    };
  } catch (error) {
    return {
      success: false,
      stats: {
        totalTables: 0,
        tablesWithData: 0,
        totalRecords: 0
      },
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
