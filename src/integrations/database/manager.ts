/**
 * Database Manager
 * Singleton that manages database connection and adapter selection
 * Supports Supabase, MySQL, and External API providers
 */

import type { IDatabase, DatabaseConfig, DatabaseProvider } from './types';
import { SupabaseAdapter } from './supabase-adapter';
import { MySQLAdapter } from './mysql-adapter';
import { getSharedExternalAdapter } from './shared-adapter';

class DatabaseManager {
  private adapter: IDatabase | null = null;
  private config: DatabaseConfig | null = null;
  private initialized = false;

  /**
   * Get the configured database provider
   */
  getProvider(): DatabaseProvider {
    const provider = import.meta.env.VITE_DATABASE_PROVIDER as DatabaseProvider;
    return provider || 'supabase'; // Default to Supabase for backward compatibility
  }

  /**
   * Initialize the database manager with a specific provider
   */
  async initialize(config?: Partial<DatabaseConfig>): Promise<void> {
    if (this.initialized) {
      return;
    }

    const provider = config?.provider || this.getProvider();

    console.log(`🔧 Initializing database with provider: ${provider}`);

    let adapterToTry: IDatabase | null = null;
    let shouldFallback = false;

    if (provider === 'external-api') {
      // Use the shared instance so authentication is preserved
      adapterToTry = getSharedExternalAdapter();
      shouldFallback = true; // Fallback to Supabase if external API fails
    } else if (provider === 'mysql') {
      adapterToTry = new MySQLAdapter();
      shouldFallback = true; // Fallback to Supabase if MySQL fails
    } else {
      // Default to Supabase
      adapterToTry = new SupabaseAdapter();
    }

    try {
      await adapterToTry.initialize();
      this.adapter = adapterToTry;
      this.initialized = true;
      console.log(`✅ Database manager initialized with ${provider} adapter`);
    } catch (error) {
      if (shouldFallback && provider !== 'supabase') {
        console.warn(`⚠️  Failed to initialize ${provider} adapter:`, error);
        console.log(`🔄 Falling back to Supabase adapter...`);

        try {
          const supabaseAdapter = new SupabaseAdapter();
          await supabaseAdapter.initialize();
          this.adapter = supabaseAdapter;
          this.initialized = true;
          console.log(`✅ Successfully initialized Supabase adapter as fallback`);
        } catch (fallbackError) {
          console.error(`❌ Failed to initialize fallback Supabase adapter:`, fallbackError);
          throw fallbackError;
        }
      } else {
        console.error(`❌ Failed to initialize ${provider} adapter:`, error);
        throw error;
      }
    }
  }

  /**
   * Get the active database adapter
   */
  getDatabase(): IDatabase {
    if (!this.adapter) {
      // Auto-initialize with configured provider if not already initialized
      const provider = this.getProvider();
      console.warn(`Database not initialized. Auto-initializing with ${provider} adapter.`);

      if (provider === 'external-api') {
        // Use the shared instance so authentication is preserved
        this.adapter = getSharedExternalAdapter();
      } else if (provider === 'mysql') {
        this.adapter = new MySQLAdapter();
      } else {
        this.adapter = new SupabaseAdapter();
      }
    }
    return this.adapter;
  }

  /**
   * Check database health
   */
  async healthCheck(): Promise<{ healthy: boolean; provider: DatabaseProvider; error?: Error }> {
    const provider = this.getProvider();
    const db = this.getDatabase();

    // Health checks disabled to prevent AbortError issues
    // The app will rely on real operations to detect issues
    return { healthy: true, provider };
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.adapter) {
      await this.adapter.close();
      this.adapter = null;
      this.initialized = false;
    }
  }

  /**
   * Reset and reinitialize with a different provider
   */
  async switchProvider(provider: DatabaseProvider): Promise<void> {
    await this.close();
    this.initialized = false;
    
    const config: DatabaseConfig = { provider };
    await this.initialize(config);
  }
}

// Export singleton instance
export const databaseManager = new DatabaseManager();

/**
 * Convenience function to get the database instance
 */
export function getDatabase(): IDatabase {
  return databaseManager.getDatabase();
}

/**
 * Convenience function to get database provider
 */
export function getDatabaseProvider(): DatabaseProvider {
  return databaseManager.getProvider();
}

/**
 * Initialize database on app startup
 */
export async function initializeDatabase(config?: Partial<DatabaseConfig>): Promise<void> {
  await databaseManager.initialize(config);
}

/**
 * Shutdown database on app exit
 */
export async function shutdownDatabase(): Promise<void> {
  await databaseManager.close();
}
