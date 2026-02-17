/**
 * Table Recreation Utility
 * Checks for missing tables and recreates them via the external API
 */

import { mysqlTableDefinitions, allTableNames, requiredTables } from './mysqlTableDefinitions';
import { apiClient } from '@/integrations/api';

export interface TableCheckResult {
  tableName: string;
  exists: boolean;
  error?: string;
}

export interface RecreateResult {
  tableName: string;
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Check which tables exist in the database
 */
export async function checkTables(): Promise<TableCheckResult[]> {
  const results: TableCheckResult[] = [];

  for (const tableName of allTableNames) {
    try {
      // Try to query the table with a simple select
      const result = await apiClient.select(tableName, {});

      // If no error, table exists
      results.push({
        tableName,
        exists: !result.error,
        error: result.error?.message,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.push({
        tableName,
        exists: false,
        error: errorMessage,
      });
    }
  }

  return results;
}

/**
 * Get list of missing tables
 */
export async function getMissingTables(): Promise<string[]> {
  const results = await checkTables();
  return results.filter(r => !r.exists).map(r => r.tableName);
}

/**
 * Recreate a single table
 */
export async function recreateTable(tableName: string): Promise<RecreateResult> {
  try {
    if (!mysqlTableDefinitions[tableName as keyof typeof mysqlTableDefinitions]) {
      return {
        tableName,
        success: false,
        message: `Table definition not found for ${tableName}`,
      };
    }

    const createStatement = mysqlTableDefinitions[tableName as keyof typeof mysqlTableDefinitions];

    console.log(`🔨 Creating table ${tableName}...`);

    // Use the raw method to execute SQL directly
    const result = await apiClient.adapter.raw(createStatement, []);

    if (result.error) {
      // Check if error is because table already exists
      if (result.error.message?.includes('already exists')) {
        return {
          tableName,
          success: true,
          message: `Table ${tableName} already exists`,
        };
      }

      return {
        tableName,
        success: false,
        message: `Failed to create table ${tableName}`,
        error: result.error.message,
      };
    }

    return {
      tableName,
      success: true,
      message: `✅ Table ${tableName} created successfully`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      tableName,
      success: false,
      message: `Failed to create table ${tableName}`,
      error: errorMessage,
    };
  }
}

/**
 * Recreate all missing tables
 */
export async function recreateAllMissingTables(
  onProgress?: (update: { table: string; status: string; message: string }) => void
): Promise<RecreateResult[]> {
  const results: RecreateResult[] = [];

  try {
    // First check which tables are missing
    onProgress?.({ table: 'system', status: 'checking', message: 'Checking for missing tables...' });
    const checkResults = await checkTables();
    const missingTables = checkResults.filter(r => !r.exists).map(r => r.tableName);

    if (missingTables.length === 0) {
      onProgress?.({ table: 'system', status: 'complete', message: 'All tables exist' });
      return results;
    }

    onProgress?.({
      table: 'system',
      status: 'info',
      message: `Found ${missingTables.length} missing tables. Starting creation...`,
    });

    // Recreate missing tables
    for (const tableName of missingTables) {
      onProgress?.({
        table: tableName,
        status: 'creating',
        message: `Creating table: ${tableName}...`,
      });

      const result = await recreateTable(tableName);
      results.push(result);

      if (result.success) {
        onProgress?.({
          table: tableName,
          status: 'success',
          message: result.message,
        });
      } else {
        onProgress?.({
          table: tableName,
          status: 'error',
          message: result.error || result.message,
        });
      }

      // Add a small delay between table creations to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return results;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    onProgress?.({
      table: 'system',
      status: 'error',
      message: `Error during recreation: ${errorMessage}`,
    });
    throw error;
  }
}

/**
 * Recreate required tables only
 */
export async function recreateRequiredTables(
  onProgress?: (update: { table: string; status: string; message: string }) => void
): Promise<RecreateResult[]> {
  const results: RecreateResult[] = [];

  try {
    onProgress?.({
      table: 'system',
      status: 'checking',
      message: 'Checking required tables...',
    });

    // Check required tables
    const checkResults = await checkTables();
    const missingRequired = checkResults
      .filter(r => !r.exists && requiredTables.includes(r.tableName))
      .map(r => r.tableName);

    if (missingRequired.length === 0) {
      onProgress?.({
        table: 'system',
        status: 'complete',
        message: 'All required tables exist',
      });
      return results;
    }

    onProgress?.({
      table: 'system',
      status: 'info',
      message: `Found ${missingRequired.length} missing required tables`,
    });

    // Recreate required tables
    for (const tableName of missingRequired) {
      onProgress?.({
        table: tableName,
        status: 'creating',
        message: `Creating required table: ${tableName}...`,
      });

      const result = await recreateTable(tableName);
      results.push(result);

      if (result.success) {
        onProgress?.({
          table: tableName,
          status: 'success',
          message: result.message,
        });
      } else {
        onProgress?.({
          table: tableName,
          status: 'error',
          message: result.error || result.message,
        });
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return results;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    onProgress?.({
      table: 'system',
      status: 'error',
      message: `Error: ${errorMessage}`,
    });
    throw error;
  }
}

/**
 * Get a status summary of table health
 */
export async function getTableStatus(): Promise<{
  totalTables: number;
  existingTables: number;
  missingTables: number;
  requiredMissing: number;
  optionalMissing: number;
  details: TableCheckResult[];
}> {
  const results = await checkTables();
  const existing = results.filter(r => r.exists);
  const missing = results.filter(r => !r.exists);
  const requiredMissing = missing.filter(r => requiredTables.includes(r.tableName)).length;
  const optionalMissing = missing.filter(r => !requiredTables.includes(r.tableName)).length;

  return {
    totalTables: results.length,
    existingTables: existing.length,
    missingTables: missing.length,
    requiredMissing,
    optionalMissing,
    details: results,
  };
}
