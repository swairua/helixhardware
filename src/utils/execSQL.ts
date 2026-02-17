/**
 * EXEC SQL - DISABLED
 * 
 * This module attempted to execute arbitrary SQL using Supabase RPC,
 * which is not available with external MySQL API.
 * 
 * For direct SQL execution:
 * 1. Connect to MySQL database directly
 * 2. Use PHPMyAdmin or similar tool
 * 3. Implement custom API endpoints in PHP backend
 */

export async function executeSQL(sql: string) {
  console.warn('⚠️ executeSQL is disabled');
  return {
    success: false,
    error: 'Direct SQL execution not available via API'
  };
}

export async function testConnection() {
  console.warn('⚠️ testConnection is disabled');
  return {
    success: false,
    error: 'Connection test not available'
  };
}
