import { supabase } from '@/integrations/supabase/client';

export interface TableCheckResult {
  tableName: string;
  exists: boolean;
  error?: string;
}

export interface TableStatus {
  tables: TableCheckResult[];
  totalChecked: number;
  totalExists: number;
  allTablesExist: boolean;
}

/**
 * Check if specific tables exist in the Supabase database
 * Uses parallel requests instead of sequential to improve performance
 */
export async function checkDatabaseTables(): Promise<TableStatus> {
  const requiredTables = [
    'companies',
    'profiles',
    'user_permissions',
    'user_invitations',
    'customers',
    'product_categories',
    'products',
    'quotations',
    'quotation_items',
    'proforma_invoices',
    'proforma_items',
    'invoices',
    'invoice_items',
    'credit_notes',
    'credit_note_items',
    'payments',
    'payment_allocations',
    'delivery_notes',
    'delivery_note_items',
    'stock_movements',
    'tax_settings',
    'lpos',
    'lpo_items',
  ];

  // Check all tables in parallel using Promise.all instead of sequential awaits
  const checkTablePromises = requiredTables.map(async (tableName) => {
    try {
      const { error } = await supabase
        .from(tableName as any)
        .select('1', { count: 'exact', head: true })
        .limit(1);

      if (error) {
        // Check if it's a "relation does not exist" error
        if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
          return {
            tableName,
            exists: false,
            error: `Table "${tableName}" does not exist`
          };
        } else {
          return {
            tableName,
            exists: true,
            error: error.message
          };
        }
      } else {
        return {
          tableName,
          exists: true
        };
      }
    } catch (err) {
      return {
        tableName,
        exists: false,
        error: String(err)
      };
    }
  });

  // Execute all checks in parallel
  const results = await Promise.all(checkTablePromises);

  const totalExists = results.filter(r => r.exists).length;
  const allTablesExist = totalExists === requiredTables.length;

  return {
    tables: results,
    totalChecked: requiredTables.length,
    totalExists,
    allTablesExist
  };
}

/**
 * Create a test user with admin privileges
 */
export async function createTestUser(email: string, password: string) {
  try {
    console.log(`🔄 Creating test user: ${email}`);

    // Check API configuration
    const apiUrl = import.meta.env.VITE_EXTERNAL_API_URL || 'https://med.wayrus.co.ke/api.php';

    if (!apiUrl) {
      return {
        success: false,
        error: 'External API URL not configured'
      };
    }

    // Call the user creation API endpoint
    const response = await fetch(
      '/api/admin/users/create',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          full_name: 'Test User',
          role: 'admin',
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Failed to create test user:', data);
      return {
        success: false,
        error: data.error || data.message || 'Failed to create user',
        data
      };
    }

    console.log('✅ Test user created successfully:', data);
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    return {
      success: false,
      error: String(error)
    };
  }
}

/**
 * Check if any users exist in the system
 */
export async function checkUsersExist(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .limit(1);

    if (error) {
      console.warn('⚠️ Could not check users:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('⚠️ Error checking users:', err);
    return false;
  }
}

/**
 * Get database setup status summary
 */
export async function getDatabaseStatus() {
  const tableStatus = await checkDatabaseTables();
  const usersExist = tableStatus.allTablesExist ? await checkUsersExist() : false;

  return {
    tablesReady: tableStatus.allTablesExist,
    missingTables: tableStatus.tables.filter(t => !t.exists),
    usersExist,
    totalTablesFound: tableStatus.totalExists,
    totalTablesRequired: tableStatus.totalChecked,
    summary: {
      ready: tableStatus.allTablesExist && usersExist,
      status: tableStatus.allTablesExist 
        ? (usersExist ? '✅ Ready' : '⚠️ Tables ready, no users yet')
        : `❌ ${tableStatus.totalChecked - tableStatus.totalExists} tables missing`
    }
  };
}
