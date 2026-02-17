/**
 * MySQL Database Adapter (Client-Side)
 * Implements IDatabase interface for MySQL backend via REST API
 *
 * NOTE: This adapter communicates with MySQL through backend API endpoints.
 * The server-side MySQL connection and authorization layers are in:
 * - src/server/db/mysql/connection.ts (backend only)
 * - src/server/db/mysql/authorization.ts (backend only)
 */

import type {
  IDatabase,
  AuthContext,
  QueryResult,
  ListQueryResult,
  InsertResult,
  UpdateResult,
  DeleteResult,
} from './types';

export class MySQLAdapter implements IDatabase {
  private apiBase = '/api/db';

  private async apiCall<T>(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<{ data: T; error: Error | null }> {
    try {
      const response = await fetch(`${this.apiBase}${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        const error = await response.json();
        return { data: null as any, error: new Error(error.message || 'API error') };
      }

      const result = await response.json();
      return { data: result.data, error: null };
    } catch (error) {
      return { data: null as any, error: error as Error };
    }
  }

  async getAuthContext(userId: string): Promise<AuthContext | null> {
    try {
      const { data, error } = await this.apiCall(
        'GET',
        `/auth-context/${userId}`
      );
      return error ? null : data;
    } catch (error) {
      console.error('Error getting auth context:', error);
      return null;
    }
  }

  async select<T>(table: string, filter?: Record<string, any>): Promise<ListQueryResult<T>> {
    try {
      const { data, error } = await this.apiCall(
        'POST',
        `/select/${table}`,
        { filter }
      );

      if (error) {
        return { data: [], error, count: 0 };
      }

      return {
        data: Array.isArray(data) ? data : [],
        error: null,
        count: Array.isArray(data) ? data.length : 0
      };
    } catch (error) {
      return { data: [], error: error as Error, count: 0 };
    }
  }

  async selectOne<T>(table: string, id: string): Promise<QueryResult<T>> {
    try {
      const { data, error } = await this.apiCall(
        'GET',
        `/select-one/${table}/${id}`
      );

      return { data: error ? null : data, error };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async selectBy<T>(table: string, filter: Record<string, any>): Promise<ListQueryResult<T>> {
    return this.select<T>(table, filter);
  }

  async insert<T>(table: string, data: Partial<T>): Promise<InsertResult> {
    try {
      const { data: result, error } = await this.apiCall(
        'POST',
        `/insert/${table}`,
        data
      );

      if (error) {
        return { id: '', error };
      }

      return { id: result?.id || '', error: null };
    } catch (error) {
      return { id: '', error: error as Error };
    }
  }

  async insertMany<T>(table: string, data: Partial<T>[]): Promise<InsertResult> {
    try {
      // Insert items one by one since batch insert endpoint may not exist
      let lastId = '';
      let lastError: Error | null = null;

      for (const item of data) {
        const { data: result, error } = await this.apiCall(
          'POST',
          `/insert/${table}`,
          item
        );

        if (error) {
          lastError = error;
          console.warn(`Failed to insert item into ${table}:`, error);
          // Continue with next item instead of failing completely
          continue;
        }

        lastId = result?.id || '';
      }

      // Return the last ID (or error if all failed)
      return { id: lastId, error: lastError };
    } catch (error) {
      return { id: '', error: error as Error };
    }
  }

  async update<T>(table: string, id: string, data: Partial<T>): Promise<UpdateResult> {
    try {
      const { error } = await this.apiCall(
        'PUT',
        `/update/${table}/${id}`,
        data
      );

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async updateMany<T>(table: string, filter: Record<string, any>, data: Partial<T>): Promise<UpdateResult> {
    try {
      const { error } = await this.apiCall(
        'PUT',
        `/update-many/${table}`,
        { filter, data }
      );

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async delete(table: string, id: string): Promise<DeleteResult> {
    try {
      const { error } = await this.apiCall(
        'DELETE',
        `/delete/${table}/${id}`
      );

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async deleteMany(table: string, filter: Record<string, any>): Promise<DeleteResult> {
    try {
      const { error } = await this.apiCall(
        'POST',
        `/delete-many/${table}`,
        { filter }
      );

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async rpc<T>(functionName: string, params?: Record<string, any>): Promise<{ data: T | null; error: Error | null }> {
    try {
      const { data, error } = await this.apiCall(
        'POST',
        '/rpc',
        { function: functionName, params }
      );

      return { data: error ? null : (data as T), error };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async rpcList<T>(functionName: string, params?: Record<string, any>): Promise<{ data: T[]; error: Error | null; count?: number }> {
    try {
      const { data, error } = await this.apiCall(
        'POST',
        '/rpc',
        { function: functionName, params }
      );

      if (error) {
        return { data: [], error };
      }

      const resultData = Array.isArray(data) ? data : [];
      return { data: resultData as T[], error: null, count: resultData.length };
    } catch (error) {
      return { data: [], error: error as Error };
    }
  }

  async raw<T>(sql: string, params?: any[]): Promise<ListQueryResult<T>> {
    try {
      const { data, error } = await this.apiCall(
        'POST',
        '/raw',
        { sql, params }
      );

      if (error) {
        return { data: [], error };
      }

      return { data: Array.isArray(data) ? data : [], error: null };
    } catch (error) {
      return { data: [], error: error as Error };
    }
  }

  async canRead(table: string, recordId: string, auth: AuthContext): Promise<boolean> {
    try {
      const { data, error } = await this.apiCall(
        'POST',
        '/auth/can-read',
        { table, recordId, auth }
      );

      return error ? false : (data?.allowed || false);
    } catch (error) {
      console.error('Error checking read permission:', error);
      return false;
    }
  }

  async canWrite(table: string, recordId: string | null, companyId: string, auth: AuthContext): Promise<boolean> {
    try {
      const { data, error } = await this.apiCall(
        'POST',
        '/auth/can-write',
        { table, recordId, companyId, auth }
      );

      return error ? false : (data?.allowed || false);
    } catch (error) {
      console.error('Error checking write permission:', error);
      return false;
    }
  }

  async canDelete(table: string, recordId: string, auth: AuthContext): Promise<boolean> {
    try {
      const { data, error } = await this.apiCall(
        'POST',
        '/auth/can-delete',
        { table, recordId, auth }
      );

      return error ? false : (data?.allowed || false);
    } catch (error) {
      console.error('Error checking delete permission:', error);
      return false;
    }
  }

  async transaction<T>(callback: (db: IDatabase) => Promise<T>): Promise<T> {
    // For API-based adapter, transactions are handled server-side
    return callback(this);
  }

  async initialize(): Promise<void> {
    // MySQL pool initialization is handled by the backend API
    console.log('✅ MySQL adapter initialized (API-based)');
  }

  async close(): Promise<void> {
    // Connection cleanup handled by backend
  }

  async health(): Promise<boolean> {
    try {
      const { error } = await this.apiCall('GET', '/health');
      return !error;
    } catch (error) {
      console.error('MySQL health check failed:', error);
      return false;
    }
  }
}

export const mysqlAdapter = new MySQLAdapter();

/**
 * MySQL Adapter Architecture
 *
 * This adapter uses a REST API approach for client-side communication:
 *
 * 1. Client-side (Browser):
 *    - MySQLAdapter makes HTTP requests to backend API endpoints
 *    - Uses /api/db/* endpoints for database operations
 *    - Cannot directly import Node.js packages (mysql2/promise)
 *
 * 2. Server-side (Backend API):
 *    - Backend API receives HTTP requests from client
 *    - Uses actual MySQL connection via src/server/db/mysql/connection.ts
 *    - Uses authorization layer: src/server/db/mysql/authorization.ts
 *    - Returns JSON responses to client
 *
 * Backend API Endpoints Required:
 * - GET  /api/db/health                  - Health check
 * - GET  /api/db/auth-context/:userId    - Get auth context
 * - POST /api/db/select/:table           - Select records
 * - GET  /api/db/select-one/:table/:id   - Select single record
 * - POST /api/db/insert/:table           - Insert record
 * - POST /api/db/insert-many/:table      - Insert multiple records
 * - PUT  /api/db/update/:table/:id       - Update record
 * - PUT  /api/db/update-many/:table      - Update multiple records
 * - DEL  /api/db/delete/:table/:id       - Delete record
 * - POST /api/db/delete-many/:table      - Delete multiple records
 * - POST /api/db/rpc                     - Execute RPC function
 * - POST /api/db/raw                     - Execute raw SQL
 * - POST /api/db/auth/can-read           - Check read permission
 * - POST /api/db/auth/can-write          - Check write permission
 * - POST /api/db/auth/can-delete         - Check delete permission
 *
 * To use MySQL with this application:
 * 1. Create backend API endpoints that use src/server/db/mysql/
 * 2. Set VITE_DATABASE_PROVIDER=mysql
 * 3. The adapter will make REST calls to your backend
 *
 * Note: If not using a backend, Supabase is the recommended option
 * as it provides these endpoints out-of-the-box via PostgREST.
 */
