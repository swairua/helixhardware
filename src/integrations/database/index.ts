/**
 * Database Module Exports
 * Central entry point for database abstraction layer
 */

// Types
export type {
  DatabaseProvider,
  DatabaseConfig,
  AuthContext,
  QueryResult,
  ListQueryResult,
  InsertResult,
  UpdateResult,
  DeleteResult,
  IDatabase,
  IAuth,
} from './types';

// Adapters
export { SupabaseAdapter } from './supabase-adapter';
export { MySQLAdapter } from './mysql-adapter';

// Manager
export {
  databaseManager,
  getDatabase,
  getDatabaseProvider,
  initializeDatabase,
  shutdownDatabase,
} from './manager';

// Auth Manager
export {
  authManager,
  signIn,
  signUp,
  signOut,
  getSession,
  resetPassword,
  updatePassword,
  createUser,
  onAuthStateChange,
} from './auth-manager';

// Adapters
export { SupabaseAuthAdapter, MySQLAuthAdapter } from './auth-adapter';

// Re-export for convenience
export { supabaseAdapter } from './supabase-adapter';
export { mysqlAdapter } from './mysql-adapter';

/**
 * Quick start guide:
 * 
 * 1. Set environment variable to select provider:
 *    - VITE_DATABASE_PROVIDER=supabase (default)
 *    - VITE_DATABASE_PROVIDER=mysql
 * 
 * 2. Initialize on app startup:
 *    import { initializeDatabase } from '@/integrations/database';
 *    await initializeDatabase();
 * 
 * 3. Use the database:
 *    import { getDatabase } from '@/integrations/database';
 *    const db = getDatabase();
 *    const result = await db.select('users');
 * 
 * 4. For components:
 *    import { useDatabase } from '@/hooks/useDatabase';
 *    const { db, provider } = useDatabase();
 *    const users = await db.select('users');
 */
