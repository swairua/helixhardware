/**
 * Unified API Client
 * Direct integration with https://helixgeneralhardware.com/api.php
 * Replaces all Supabase calls
 */

// Import the shared adapter from the database manager
// This ensures all API operations use the same authenticated instance
import { getSharedExternalAdapter } from './database/shared-adapter';

/**
 * Get the shared API adapter instance
 * Uses the same instance for all parts of the application
 */
function getAdapterInstance() {
  return getSharedExternalAdapter();
}

export const api = {
  /**
   * Authentication methods
   */
  auth: {
    login: (email: string, password: string) => getAdapterInstance().login(email, password),
    logout: () => getAdapterInstance().logout(),
    checkAuth: () => getAdapterInstance().checkAuth(),
    getAuthToken: () => localStorage.getItem('med_api_token'),
    setAuthToken: (token: string) => getAdapterInstance().setAuthToken(token),
    clearAuthToken: () => getAdapterInstance().clearAuthToken(),
  },

  /**
   * Database query methods
   */
  from: (table: string) => ({
    select: async (fields?: string) => {
      // For now, we fetch all and return
      const result = await getAdapterInstance().select(table);
      return { data: result.data, error: result.error };
    },
    selectOne: async (id: string) => {
      const result = await getAdapterInstance().selectOne(table, id);
      return { data: result.data, error: result.error };
    },
    selectBy: async (filter: Record<string, any>) => {
      const result = await getAdapterInstance().selectBy(table, filter);
      return { data: result.data, error: result.error };
    },
    insert: async (data: any) => {
      const result = await getAdapterInstance().insert(table, data);
      return { data: result, error: result.error };
    },
    update: async (id: string, data: any) => {
      const result = await getAdapterInstance().update(table, id, data);
      return { data: null, error: result.error };
    },
    delete: async (id: string) => {
      const result = await getAdapterInstance().delete(table, id);
      return { data: null, error: result.error };
    },
  }),

  /**
   * Direct adapter access for advanced queries
   */
  get adapter() {
    return getAdapterInstance();
  },
};

// Helper to build filters from chainable calls
export class QueryBuilder {
  private table: string;
  private filters: Record<string, any> = {};
  private selectFields: string = '*';

  constructor(table: string) {
    this.table = table;
  }

  select(fields?: string) {
    if (fields) this.selectFields = fields;
    return this;
  }

  eq(column: string, value: any) {
    this.filters[column] = value;
    return this;
  }

  neq(column: string, value: any) {
    this.filters[`${column}_neq`] = value;
    return this;
  }

  in(column: string, values: any[]) {
    this.filters[`${column}_in`] = values;
    return this;
  }

  gt(column: string, value: any) {
    this.filters[`${column}_gt`] = value;
    return this;
  }

  lt(column: string, value: any) {
    this.filters[`${column}_lt`] = value;
    return this;
  }

  gte(column: string, value: any) {
    this.filters[`${column}_gte`] = value;
    return this;
  }

  lte(column: string, value: any) {
    this.filters[`${column}_lte`] = value;
    return this;
  }

  is(column: string, value: any) {
    this.filters[`${column}_is`] = value;
    return this;
  }

  like(column: string, pattern: string) {
    this.filters[`${column}_like`] = pattern;
    return this;
  }

  ilike(column: string, pattern: string) {
    this.filters[`${column}_ilike`] = pattern;
    return this;
  }

  or(query: string) {
    this.filters[`_or`] = query;
    return this;
  }

  order(column: string, direction: 'asc' | 'desc' = 'asc') {
    this.filters[`_order`] = { column, direction };
    return this;
  }

  limit(count: number) {
    this.filters[`_limit`] = count;
    return this;
  }

  async single() {
    const result = await getAdapterInstance().selectBy(this.table, this.filters);
    const data = Array.isArray(result.data) ? result.data[0] || null : result.data;
    return { data, error: result.error };
  }

  async maybeSingle() {
    const result = await getAdapterInstance().selectBy(this.table, this.filters);
    const data = Array.isArray(result.data) ? result.data[0] || null : result.data || null;
    return { data, error: result.error };
  }

  async execute() {
    const result = await getAdapterInstance().selectBy(this.table, this.filters);
    return { data: result.data, error: result.error };
  }
}

export const apiClient = {
  /**
   * Chainable query builder
   * Usage: apiClient.query('table').select().eq('id', 1).single()
   */
  query: (table: string) => new QueryBuilder(table),

  /**
   * Direct methods
   */
  select: async (table: string, filter?: Record<string, any>) => {
    const result = await getAdapterInstance().selectBy(table, filter || {});
    return { data: result.data, error: result.error };
  },

  selectOne: async (table: string, id: string) => {
    const result = await getAdapterInstance().selectOne(table, id);
    return { data: result.data, error: result.error };
  },

  insert: async (table: string, data: any) => {
    const result = await getAdapterInstance().insert(table, data);
    return { data: result.id, error: result.error };
  },

  insertMany: async (table: string, data: any[]) => {
    const result = await getAdapterInstance().insertMany(table, data);
    return { data: result.id, error: result.error };
  },

  update: async (table: string, id: string, data: any) => {
    const result = await getAdapterInstance().update(table, id, data);
    return { data: null, error: result.error };
  },

  updateMany: async (table: string, filter: Record<string, any>, data: any) => {
    const result = await getAdapterInstance().updateMany(table, filter, data);
    return { data: null, error: result.error };
  },

  delete: async (table: string, id: string) => {
    const result = await getAdapterInstance().delete(table, id);
    return { data: null, error: result.error };
  },

  deleteMany: async (table: string, filter: Record<string, any>) => {
    const result = await getAdapterInstance().deleteMany(table, filter);
    return { data: null, error: result.error };
  },

  /**
   * Authentication
   */
  auth: {
    login: (email: string, password: string) => getAdapterInstance().login(email, password),
    logout: () => getAdapterInstance().logout(),
    checkAuth: () => getAdapterInstance().checkAuth(),
    getToken: () => localStorage.getItem('med_api_token'),
    setToken: (token: string) => getAdapterInstance().setAuthToken(token),
    clearToken: () => getAdapterInstance().clearAuthToken(),
    getSession: async () => {
      const token = localStorage.getItem('med_api_token');
      const userId = localStorage.getItem('med_api_user_id');
      const email = localStorage.getItem('med_api_user_email');

      if (token && userId) {
        return {
          session: {
            user: { id: userId, email },
            access_token: token,
          },
        };
      }
      return { session: null };
    },
  },
};

/**
 * Backward-compatible Supabase-like interface
 * This allows existing code to work with minimal changes
 */

// Helper class for building queries
class QueryChain {
  private table: string;
  private filters: Record<string, any> = {};
  private selectedFields: string = '*';
  private inFilters: Record<string, any[]> = {};

  constructor(table: string) {
    this.table = table;
  }

  select(fields?: string) {
    if (fields) {
      this.selectedFields = fields;
    }
    return this;
  }

  eq(column: string, value: any) {
    this.filters[column] = value;
    return this;
  }

  neq(column: string, value: any) {
    this.filters[`${column}_neq`] = value;
    return this;
  }

  in(column: string, values: any[]) {
    this.inFilters[column] = values;
    return this;
  }

  or(query: string) {
    this.filters._or = query;
    return this;
  }

  ilike(column: string, pattern: string) {
    this.filters[`${column}_ilike`] = pattern;
    return this;
  }

  is(column: string, value: any) {
    this.filters[`${column}_is`] = value;
    return this;
  }

  gt(column: string, value: any) {
    this.filters[`${column}_gt`] = value;
    return this;
  }

  lt(column: string, value: any) {
    this.filters[`${column}_lt`] = value;
    return this;
  }

  gte(column: string, value: any) {
    this.filters[`${column}_gte`] = value;
    return this;
  }

  lte(column: string, value: any) {
    this.filters[`${column}_lte`] = value;
    return this;
  }

  order(column: string, opts?: any) {
    this.filters._order = { column, direction: opts?.ascending === false ? 'desc' : 'asc' };
    return this;
  }

  limit(count: number) {
    this.filters._limit = count;
    return this;
  }

  range(from: number, to: number) {
    this.filters._range = { from, to };
    return this;
  }

  private buildFinalFilters() {
    return { ...this.filters, ...this.inFilters };
  }

  async maybeSingle() {
    try {
      const finalFilters = this.buildFinalFilters();
      const result = await getAdapterInstance().selectBy(this.table, finalFilters);
      const data = Array.isArray(result.data) ? result.data[0] || null : result.data;
      return { data, error: result.error };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async single() {
    try {
      const finalFilters = this.buildFinalFilters();
      const result = await getAdapterInstance().selectBy(this.table, finalFilters);
      const data = Array.isArray(result.data) ? result.data[0] || null : result.data;
      return { data, error: result.error };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async execute() {
    try {
      const finalFilters = this.buildFinalFilters();
      const result = await getAdapterInstance().selectBy(this.table, finalFilters);
      return { data: result.data, error: result.error };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }
}

// Helper to create a chainable query builder that supports all methods and can be awaited
const createChainableQuery = (chain: QueryChain) => {
  const queryObject: any = {
    select: (fields?: string) => {
      chain.select(fields);
      return createChainableQuery(chain);
    },
    eq: (column: string, value: any) => {
      chain.eq(column, value);
      return createChainableQuery(chain);
    },
    neq: (column: string, value: any) => {
      chain.neq(column, value);
      return createChainableQuery(chain);
    },
    in: (column: string, values: any[]) => {
      chain.in(column, values);
      return createChainableQuery(chain);
    },
    or: (query: string) => {
      chain.or(query);
      return createChainableQuery(chain);
    },
    ilike: (column: string, pattern: string) => {
      chain.ilike(column, pattern);
      return createChainableQuery(chain);
    },
    is: (column: string, value: any) => {
      chain.is(column, value);
      return createChainableQuery(chain);
    },
    gt: (column: string, value: any) => {
      chain.gt(column, value);
      return createChainableQuery(chain);
    },
    lt: (column: string, value: any) => {
      chain.lt(column, value);
      return createChainableQuery(chain);
    },
    gte: (column: string, value: any) => {
      chain.gte(column, value);
      return createChainableQuery(chain);
    },
    lte: (column: string, value: any) => {
      chain.lte(column, value);
      return createChainableQuery(chain);
    },
    order: (column: string, opts?: any) => {
      chain.order(column, opts);
      return createChainableQuery(chain);
    },
    limit: (count: number) => {
      chain.limit(count);
      return createChainableQuery(chain);
    },
    range: (from: number, to: number) => {
      chain.range(from, to);
      return createChainableQuery(chain);
    },
    maybeSingle: () => chain.maybeSingle(),
    single: () => chain.single(),
    execute: () => chain.execute(),
    // Make the query object thenable so it can be awaited directly
    then: (onfulfilled?: any, onrejected?: any) => {
      return chain.execute().then(onfulfilled, onrejected);
    },
    catch: (onrejected?: any) => {
      return chain.execute().catch(onrejected);
    },
  };
  return queryObject;
};

export const supabaseCompat = {
  from: (table: string) => {
    const chain = new QueryChain(table);

    return {
      select: (fields?: string) => {
        chain.select(fields);
        return createChainableQuery(chain);
      },
      insert: (data: any) => {
        const insertChain = {
          select: () => ({
            single: async () => {
              console.log(`➕ [INSERT COMPAT] Inserting into ${table}:`, {
                dataKeys: Object.keys(data),
              });
              const result = await getAdapterInstance().insert(table, data);
              console.log(`📤 [INSERT COMPAT] Insert result:`, { id: result.id, error: result.error });
              return { data: result.id, error: result.error };
            },
          }),
        };
        return insertChain;
      },
      update: (data: any) => {
        const updateChain = {
          eq: (column: string, value: any) => {
            // Return an object that is awaitable and has select/execute methods
            const updatePromise = async () => {
              console.log(`🔄 [UPDATE COMPAT] Executing update for ${table} with id=${value}:`, {
                data,
                dataKeys: Object.keys(data),
              });
              const result = await getAdapterInstance().update(table, String(value), data);
              console.log(`📤 [UPDATE COMPAT] Update result:`, { error: result.error });
              return { data: null, error: result.error };
            };

            return {
              select: updatePromise,
              execute: updatePromise,
              // Make it thenable so it can be awaited directly
              then: (onfulfilled?: any, onrejected?: any) => {
                return updatePromise().then(onfulfilled, onrejected);
              },
              catch: (onrejected?: any) => {
                return updatePromise().catch(onrejected);
              },
            };
          },
        };
        return updateChain;
      },
      delete: () => {
        const deleteChain = {
          eq: (column: string, value: any) => {
            // Return an object that is awaitable and has execute method
            const deletePromise = async () => {
              console.log(`🗑️ [DELETE COMPAT] Executing delete for ${table} with id=${value}`);
              const result = await getAdapterInstance().delete(table, String(value));
              console.log(`📤 [DELETE COMPAT] Delete result:`, { error: result.error });
              return { data: null, error: result.error };
            };

            return {
              execute: deletePromise,
              // Make it thenable so it can be awaited directly
              then: (onfulfilled?: any, onrejected?: any) => {
                return deletePromise().then(onfulfilled, onrejected);
              },
              catch: (onrejected?: any) => {
                return deletePromise().catch(onrejected);
              },
            };
          },
        };
        return deleteChain;
      },
    };
  },

  auth: {
    getSession: async () => {
      const token = localStorage.getItem('med_api_token');
      const userId = localStorage.getItem('med_api_user_id');
      if (token && userId) {
        return {
          data: {
            session: {
              user: { id: userId },
              access_token: token,
            },
          },
        };
      }
      return { data: { session: null } };
    },

    signInWithPassword: async (credentials: { email: string; password: string }) => {
      const result = await getAdapterInstance().login(credentials.email, credentials.password);
      if (result.error) {
        return { error: result.error, data: null };
      }

      // Ensure user data is stored in localStorage
      if (result.user && result.user.id) {
        localStorage.setItem('med_api_user_id', result.user.id);
        localStorage.setItem('med_api_user_email', credentials.email);
      }

      const userData = result.user || { id: '', email: credentials.email };

      return {
        data: {
          session: {
            user: userData,
            access_token: result.token,
          },
          user: userData,
        },
        error: null,
      };
    },

    signUp: async (params: any) => {
      return {
        error: new Error('Sign up not supported - use admin invitation'),
        data: null,
      };
    },

    signOut: async () => {
      const result = await getAdapterInstance().logout();

      // Clear localStorage
      localStorage.removeItem('med_api_token');
      localStorage.removeItem('med_api_user_id');
      localStorage.removeItem('med_api_user_email');

      return { error: result.error };
    },

    getUser: async () => {
      const userId = localStorage.getItem('med_api_user_id');
      const email = localStorage.getItem('med_api_user_email');
      if (userId) {
        return {
          data: {
            user: { id: userId, email: email || undefined },
          },
        };
      }
      return { data: { user: null } };
    },

    // Return profile data when available (some code expects this)
    getProfile: async () => {
      const userId = localStorage.getItem('med_api_user_id');
      if (userId) {
        // Try to fetch the profile from the database
        const result = await getAdapterInstance().selectOne('profiles', userId);
        if (result.data) {
          return {
            data: {
              user: result.data,
            },
          };
        }
      }
      return { data: { user: null } };
    },

    onAuthStateChange: (callback: any) => {
      // Check initial auth state immediately
      const token = localStorage.getItem('med_api_token');
      const userId = localStorage.getItem('med_api_user_id');
      if (token && userId) {
        // Emit initial state on next tick
        setTimeout(() => {
          callback('SIGNED_IN', {
            user: { id: userId },
            access_token: token,
          });
        }, 0);
      }

      // Also listen for storage changes (for multi-tab sync)
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'med_api_token' || e.key === 'med_api_user_id') {
          const newToken = localStorage.getItem('med_api_token');
          const newUserId = localStorage.getItem('med_api_user_id');
          if (newToken && newUserId) {
            callback('SIGNED_IN', {
              user: { id: newUserId },
              access_token: newToken,
            });
          } else {
            callback('SIGNED_OUT', null);
          }
        }
      };

      window.addEventListener('storage', handleStorageChange);

      // Return proper subscription object that matches Supabase interface
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              window.removeEventListener('storage', handleStorageChange);
            },
          },
        },
      };
    },

    resetPasswordForEmail: async (email: string) => {
      return {
        error: new Error('Password reset not supported'),
        data: null,
      };
    },
  },
};

export default apiClient;
