/**
 * Migration: Add valid_until column to proforma_invoices table
 * 
 * This migration adds the valid_until DATE column to the proforma_invoices table
 * to support expiry dates for proforma invoices.
 * 
 * For MySQL users: Execute this SQL directly in your database or via PHPMyAdmin
 * For Supabase users: This is handled automatically by ensureProformaSchema()
 */

export const VALID_UNTIL_MIGRATION_SQL = {
  // MySQL migration
  mysql: `
    ALTER TABLE proforma_invoices 
    ADD COLUMN IF NOT EXISTS valid_until DATE NULL 
    AFTER notes;
  `,
  
  // PostgreSQL/Supabase migration (already in ensureProformaSchema)
  postgresql: `
    ALTER TABLE IF EXISTS proforma_invoices
    ADD COLUMN IF NOT EXISTS valid_until DATE;
  `
};

/**
 * Get the migration SQL for the current database provider
 */
export function getMigrationSQL(provider: 'mysql' | 'postgresql' | string): string {
  if (provider === 'mysql') {
    return VALID_UNTIL_MIGRATION_SQL.mysql;
  }
  return VALID_UNTIL_MIGRATION_SQL.postgresql;
}

/**
 * Instructions for manual migration
 */
export const MIGRATION_INSTRUCTIONS = {
  mysql: `
    To add the valid_until column to your MySQL database:
    
    1. Connect to your MySQL database
    2. Run the following SQL command:
    
    ${VALID_UNTIL_MIGRATION_SQL.mysql}
    
    This will add a DATE column called 'valid_until' to the proforma_invoices table.
    The column is optional (NULL) to maintain backward compatibility.
  `,
  
  supabase: `
    Supabase databases are automatically updated by calling ensureProformaSchema()
    when the application initializes. No manual action is needed.
  `
};

/**
 * Auto-migrate for MySQL via API (if backend supports it)
 */
export async function migrateValidUntilColumnMySQL() {
  try {
    // This attempts to run the migration via the API
    // Requires backend support for raw SQL execution
    const response = await fetch('/api/db/migrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sql: VALID_UNTIL_MIGRATION_SQL.mysql,
        table: 'proforma_invoices'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return { success: true, message: 'valid_until column added successfully' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Migration failed:', errorMessage);
    return {
      success: false,
      message: 'Migration failed. Please execute the SQL manually or contact your database administrator.',
      error: errorMessage,
      sql: VALID_UNTIL_MIGRATION_SQL.mysql
    };
  }
}
