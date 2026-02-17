/**
 * API Helper Functions
 * Centralizes common patterns of external API calls
 * These helpers abstract the underlying API call details
 */

import { apiClient } from '@/integrations/api';

/**
 * Get the current authenticated user ID
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    return localStorage.getItem('med_api_user_id');
  } catch (error) {
    console.warn('Failed to get current user:', error);
    return null;
  }
}

/**
 * Get the current session
 */
export async function getCurrentSession() {
  try {
    return await apiClient.auth.getSession();
  } catch (error) {
    console.warn('Failed to get session:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const userId = await getCurrentUserId();
  return !!userId;
}

/**
 * Generic query builder for database operations
 */
export async function queryOne<T>(
  table: string,
  column: string,
  value: any
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const result = await apiClient.select(table, { [column]: value });
    const data = Array.isArray(result.data) ? result.data[0] || null : result.data;
    return { data, error: result.error };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Query multiple rows
 */
export async function queryMany<T>(
  table: string,
  filters?: Record<string, any>
): Promise<{ data: T[] | null; error: Error | null }> {
  try {
    const result = await apiClient.select(table, filters || {});
    const data = Array.isArray(result.data) ? result.data : null;
    return { data: data as T[], error: result.error };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Insert a single record
 */
export async function insertOne<T>(
  table: string,
  data: any
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const result = await apiClient.insert(table, data);
    return { data: result.data as T, error: result.error };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Insert multiple records
 */
export async function insertMany<T>(
  table: string,
  data: any[]
): Promise<{ data: T[] | null; error: Error | null }> {
  try {
    const result = await apiClient.insertMany(table, data);
    return { data: result.data as T[], error: result.error };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Update a single record by ID
 */
export async function updateOne(
  table: string,
  id: string | number,
  data: any
): Promise<{ error: Error | null }> {
  try {
    const result = await apiClient.update(table, String(id), data);
    return { error: result.error };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Update multiple records by filter
 */
export async function updateMany(
  table: string,
  filters: Record<string, any>,
  data: any
): Promise<{ error: Error | null }> {
  try {
    const result = await apiClient.updateMany(table, filters, data);
    return { error: result.error };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Delete a single record by ID
 */
export async function deleteOne(
  table: string,
  id: string | number
): Promise<{ error: Error | null }> {
  try {
    const result = await apiClient.delete(table, String(id));
    return { error: result.error };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Delete multiple records by filter
 */
export async function deleteMany(
  table: string,
  filters: Record<string, any>
): Promise<{ error: Error | null }> {
  try {
    const result = await apiClient.deleteMany(table, filters);
    return { error: result.error };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Check if a table exists
 */
export async function tableExists(table: string): Promise<boolean> {
  try {
    const result = await apiClient.select(table);
    return !result.error;
  } catch {
    return false;
  }
}

/**
 * Check if a record exists
 */
export async function recordExists(
  table: string,
  column: string,
  value: any
): Promise<boolean> {
  try {
    const result = await apiClient.select(table, { [column]: value });
    const data = Array.isArray(result.data) ? result.data : [];
    return !result.error && data.length > 0;
  } catch {
    return false;
  }
}

/**
 * Count records matching a filter
 */
export async function countRecords(
  table: string,
  filters?: Record<string, any>
): Promise<number> {
  try {
    const result = await apiClient.select(table, filters || {});
    const data = Array.isArray(result.data) ? result.data : [];
    return !result.error ? data.length : 0;
  } catch {
    return 0;
  }
}

/**
 * Batch operation helper with error handling
 */
export async function batchOperation<T>(
  operations: Array<() => Promise<{ data?: T; error?: Error | null }>>,
  stopOnError: boolean = false
): Promise<{ results: any[]; errors: Error[] }> {
  const results: any[] = [];
  const errors: Error[] = [];

  for (const operation of operations) {
    try {
      const result = await operation();
      results.push(result.data);
      if (result.error && stopOnError) {
        errors.push(result.error);
        break;
      }
    } catch (error) {
      errors.push(error as Error);
      if (stopOnError) break;
    }
  }

  return { results, errors };
}

/**
 * Retry helper for transient failures
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError || new Error('Operation failed after retries');
}
