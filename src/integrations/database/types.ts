/**
 * Database Abstraction Layer Types
 * Defines interfaces for database operations that work with both Supabase and MySQL
 */

export type DatabaseProvider = 'supabase' | 'mysql' | 'external-api';

export interface DatabaseConfig {
  provider: DatabaseProvider;
  supabase?: {
    url: string;
    anonKey: string;
  };
  mysql?: {
    host: string;
    user: string;
    password: string;
    database: string;
    port?: number;
  };
  externalApi?: {
    url: string;
  };
}

export interface AuthContext {
  user_id?: string;
  userId?: string;
  email?: string;
  role?: 'admin' | 'accountant' | 'stock_manager' | 'user' | 'super_admin';
  companyId?: string | null;
  status?: 'active' | 'inactive' | 'pending';
  [key: string]: any; // Allow other properties for flexibility
}

export interface QueryResult<T> {
  data: T | null;
  error: Error | null;
}

export interface ListQueryResult<T> {
  data: T[];
  error: Error | null;
  count?: number;
}

export interface InsertResult {
  id: string;
  error: Error | null;
}

export interface UpdateResult {
  error: Error | null;
  affectedRows?: number;
}

export interface DeleteResult {
  error: Error | null;
  affectedRows?: number;
}

/**
 * Database connection interface
 * All database implementations must implement these methods
 */
export interface IDatabase {
  // Authentication
  getAuthContext(userId: string): Promise<AuthContext | null>;

  // Select operations
  select<T>(table: string, filter?: Record<string, any>): Promise<ListQueryResult<T>>;
  selectOne<T>(table: string, id: string): Promise<QueryResult<T>>;
  selectBy<T>(table: string, filter: Record<string, any>): Promise<ListQueryResult<T>>;

  // Insert operations
  insert<T>(table: string, data: Partial<T>): Promise<InsertResult>;
  insertMany<T>(table: string, data: Partial<T>[]): Promise<InsertResult>;

  // Update operations
  update<T>(table: string, id: string, data: Partial<T>): Promise<UpdateResult>;
  updateMany<T>(table: string, filter: Record<string, any>, data: Partial<T>): Promise<UpdateResult>;

  // Delete operations
  delete(table: string, id: string): Promise<DeleteResult>;
  deleteMany(table: string, filter: Record<string, any>): Promise<DeleteResult>;

  // RPC calls (Remote Procedure Calls)
  rpc<T>(functionName: string, params?: Record<string, any>): Promise<QueryResult<T>>;
  rpcList<T>(functionName: string, params?: Record<string, any>): Promise<ListQueryResult<T>>;

  // Raw queries (with authorization)
  raw<T>(query: string, params?: any[]): Promise<ListQueryResult<T>>;

  // Authorization checks
  canRead(table: string, recordId: string, auth: AuthContext): Promise<boolean>;
  canWrite(table: string, recordId: string | null, companyId: string, auth: AuthContext): Promise<boolean>;
  canDelete(table: string, recordId: string, auth: AuthContext): Promise<boolean>;

  // Transactions
  transaction<T>(callback: (db: IDatabase) => Promise<T>): Promise<T>;

  // Connection management
  initialize(): Promise<void>;
  close(): Promise<void>;
  health(): Promise<boolean>;
}

export interface IAuth {
  // Authentication methods
  signIn(email: string, password: string): Promise<{ user: AuthContext | null; error: Error | null }>;
  signUp(email: string, password: string, fullName?: string): Promise<{ user: AuthContext | null; error: Error | null }>;
  signOut(): Promise<{ error: Error | null }>;
  getSession(): Promise<{ user: AuthContext | null; error: Error | null }>;
  
  // Password management
  resetPassword(email: string): Promise<{ error: Error | null }>;
  updatePassword(userId: string, newPassword: string): Promise<{ error: Error | null }>;

  // User management (admin only)
  createUser(email: string, password: string, role: string, companyId: string): Promise<{ user: AuthContext | null; error: Error | null }>;
  
  // Auth state listener
  onAuthStateChange(callback: (user: AuthContext | null) => void): () => void;
}
