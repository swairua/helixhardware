/**
 * Supabase Database Adapter
 * Implements IDatabase interface for Supabase/PostgreSQL backend
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  IDatabase,
  AuthContext,
  QueryResult,
  ListQueryResult,
  InsertResult,
  UpdateResult,
  DeleteResult,
} from './types';

export class SupabaseAdapter implements IDatabase {
  async getAuthContext(userId: string): Promise<AuthContext | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role, company_id, status')
        .eq('id', userId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        userId: data.id,
        email: data.email,
        role: data.role as any,
        companyId: data.company_id,
        status: data.status as any,
      };
    } catch (error) {
      console.error('Error getting auth context:', error);
      return null;
    }
  }

  async select<T>(table: string, filter?: Record<string, any>): Promise<ListQueryResult<T>> {
    try {
      let query = supabase.from(table).select('*');

      if (filter) {
        Object.entries(filter).forEach(([key, value]) => {
          if (value !== undefined) {
            query = query.eq(key, value);
          }
        });
      }

      const { data, error, count } = await query;

      if (error) {
        return { data: [], error, count: 0 };
      }

      return { data: data as T[], error: null, count: count || data?.length || 0 };
    } catch (error) {
      return { data: [], error: error as Error, count: 0 };
    }
  }

  async selectOne<T>(table: string, id: string): Promise<QueryResult<T>> {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return { data: null, error };
      }

      return { data: data as T, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async selectBy<T>(table: string, filter: Record<string, any>): Promise<ListQueryResult<T>> {
    return this.select<T>(table, filter);
  }

  async insert<T>(table: string, data: Partial<T>): Promise<InsertResult> {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert([data])
        .select('id')
        .single();

      if (error || !result) {
        return { id: '', error };
      }

      return { id: (result as any).id, error: null };
    } catch (error) {
      return { id: '', error: error as Error };
    }
  }

  async insertMany<T>(table: string, data: Partial<T>[]): Promise<InsertResult> {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select('id');

      if (error || !result || result.length === 0) {
        return { id: '', error };
      }

      return { id: (result[0] as any).id, error: null };
    } catch (error) {
      return { id: '', error: error as Error };
    }
  }

  async update<T>(table: string, id: string, data: Partial<T>): Promise<UpdateResult> {
    try {
      const { error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id);

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async updateMany<T>(table: string, filter: Record<string, any>, data: Partial<T>): Promise<UpdateResult> {
    try {
      let query = supabase.from(table).update(data);

      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key, value);
        }
      });

      const { error } = await query;

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async delete(table: string, id: string): Promise<DeleteResult> {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async deleteMany(table: string, filter: Record<string, any>): Promise<DeleteResult> {
    try {
      let query = supabase.from(table).delete();

      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key, value);
        }
      });

      const { error } = await query;

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async rpc<T>(functionName: string, params?: Record<string, any>): Promise<{ data: T | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.rpc(functionName, params || {});
      return { data: data as T || null, error };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async rpcList<T>(functionName: string, params?: Record<string, any>): Promise<{ data: T[]; error: Error | null; count?: number }> {
    try {
      const { data, error, count } = await supabase.rpc(functionName, params || {});
      const resultData = Array.isArray(data) ? data : [];
      return { data: resultData as T[], error, count: count || resultData.length };
    } catch (error) {
      return { data: [], error: error as Error };
    }
  }

  async raw<T>(query: string, params?: any[]): Promise<ListQueryResult<T>> {
    try {
      // Supabase doesn't support raw queries directly via PostgREST
      // This should use RPC or SQL edge functions
      return { data: [], error: new Error('Raw queries not supported in Supabase adapter via PostgREST') };
    } catch (error) {
      return { data: [], error: error as Error };
    }
  }

  async canRead(table: string, recordId: string, auth: AuthContext): Promise<boolean> {
    try {
      // For Supabase, RLS policies handle authorization
      // This checks if the current user can read the record
      const { data } = await supabase
        .from(table)
        .select('id')
        .eq('id', recordId)
        .single();

      return !!data;
    } catch (error) {
      return false;
    }
  }

  async canWrite(table: string, recordId: string | null, companyId: string, auth: AuthContext): Promise<boolean> {
    // For Supabase, check if user belongs to the company
    if (auth.role === 'super_admin') {
      return true;
    }

    if (auth.companyId !== companyId) {
      return false;
    }

    if (recordId) {
      return this.canRead(table, recordId, auth);
    }

    return true;
  }

  async canDelete(table: string, recordId: string, auth: AuthContext): Promise<boolean> {
    // Only admins can delete
    if (auth.role !== 'admin' && auth.role !== 'super_admin') {
      return false;
    }

    return this.canRead(table, recordId, auth);
  }

  async transaction<T>(callback: (db: IDatabase) => Promise<T>): Promise<T> {
    // Supabase doesn't support transactions in client SDK
    // Execute the callback directly
    return callback(this);
  }

  async initialize(): Promise<void> {
    // Supabase client is initialized on import
    console.log('✅ Supabase adapter initialized');
  }

  async close(): Promise<void> {
    // No connection cleanup needed for Supabase
  }

  async health(): Promise<boolean> {
    try {
      const { data } = await supabase.from('companies').select('id').limit(1);
      return !!data;
    } catch (error) {
      console.error('Supabase health check failed:', error);
      return false;
    }
  }
}

export const supabaseAdapter = new SupabaseAdapter();
