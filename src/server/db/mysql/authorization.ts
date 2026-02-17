import { query, queryOne } from './connection';

/**
 * MySQL Authorization Layer
 * Replaces PostgreSQL RLS (Row Level Security) with application-level authorization
 * 
 * All queries must be authorized based on:
 * - User role
 * - User's company
 * - Specific record ownership
 */

export interface AuthContext {
  userId: string;
  email: string;
  role: 'admin' | 'accountant' | 'stock_manager' | 'user' | 'super_admin';
  companyId: string | null;
  status: 'active' | 'inactive' | 'pending';
}

/**
 * Get authorized user context from ID
 */
export async function getAuthContext(userId: string): Promise<AuthContext | null> {
  try {
    const user = await queryOne<{
      id: string;
      email: string;
      role: string;
      company_id: string;
      status: string;
    }>('SELECT id, email, role, company_id, status FROM profiles WHERE id = ?', [userId]);

    if (!user) {
      return null;
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role as any,
      companyId: user.company_id,
      status: user.status as any,
    };
  } catch (error) {
    console.error('Error getting auth context:', error);
    return null;
  }
}

/**
 * Check if user is admin
 */
export function isAdmin(auth: AuthContext): boolean {
  return auth.role === 'admin' || auth.role === 'super_admin';
}

/**
 * Check if user is active
 */
export function isActive(auth: AuthContext): boolean {
  return auth.status === 'active';
}

/**
 * Check if user belongs to a company
 * Super admins can access any company
 */
export function userBelongsToCompany(auth: AuthContext, companyId: string): boolean {
  if (auth.role === 'super_admin') {
    return true;
  }
  return auth.companyId === companyId;
}

/**
 * Add WHERE clause for company isolation
 * All queries should use this to ensure users only see their company's data
 */
export function addCompanyFilter(auth: AuthContext, tableAlias: string = ''): string {
  const field = tableAlias ? `${tableAlias}.company_id` : 'company_id';

  if (auth.role === 'super_admin' && !auth.companyId) {
    // Super admin without company can see all
    return '';
  }

  if (auth.companyId) {
    return `AND ${field} = '${auth.companyId}'`;
  }

  return '';
}

/**
 * Check if user can read a record
 */
export async function canRead(
  auth: AuthContext,
  table: string,
  recordId: string,
  companyIdField: string = 'company_id'
): Promise<boolean> {
  if (!isActive(auth)) {
    return false;
  }

  try {
    const record = await queryOne<{ [key: string]: string }>(
      `SELECT ${companyIdField} FROM ${table} WHERE id = ? LIMIT 1`,
      [recordId]
    );

    if (!record) {
      return false;
    }

    return userBelongsToCompany(auth, record[companyIdField]);
  } catch (error) {
    console.error('Error checking read permission:', error);
    return false;
  }
}

/**
 * Check if user can write a record (insert/update)
 */
export async function canWrite(
  auth: AuthContext,
  table: string,
  recordId: string | null,
  companyId: string,
  companyIdField: string = 'company_id'
): Promise<boolean> {
  if (!isActive(auth)) {
    return false;
  }

  // User must belong to the company
  if (!userBelongsToCompany(auth, companyId)) {
    return false;
  }

  // For updates, verify the record belongs to their company
  if (recordId) {
    return await canRead(auth, table, recordId, companyIdField);
  }

  return true;
}

/**
 * Check if user can delete a record
 */
export async function canDelete(
  auth: AuthContext,
  table: string,
  recordId: string,
  companyIdField: string = 'company_id'
): Promise<boolean> {
  if (!isAdmin(auth)) {
    return false;
  }

  return await canRead(auth, table, recordId, companyIdField);
}

/**
 * Verify user can create a user
 */
export function canCreateUser(auth: AuthContext): boolean {
  return isActive(auth) && isAdmin(auth);
}

/**
 * Verify user can reset another user's password
 */
export async function canResetPassword(
  auth: AuthContext,
  targetUserId: string
): Promise<boolean> {
  if (!isActive(auth) || !isAdmin(auth)) {
    return false;
  }

  // Get target user info
  const targetUser = await getAuthContext(targetUserId);
  if (!targetUser) {
    return false;
  }

  // Admin can reset password for users in their company
  return userBelongsToCompany(auth, targetUser.companyId || '');
}

/**
 * Verify user can manage company
 */
export function canManageCompany(auth: AuthContext, companyId: string): boolean {
  if (!isActive(auth) || !isAdmin(auth)) {
    return false;
  }

  return userBelongsToCompany(auth, companyId);
}

/**
 * Build secure query with company filter
 */
export function buildSecureQuery(
  auth: AuthContext,
  baseQuery: string,
  tableAlias: string = ''
): string {
  const companyFilter = addCompanyFilter(auth, tableAlias);
  if (companyFilter) {
    return baseQuery.includes('WHERE')
      ? baseQuery + ' ' + companyFilter
      : baseQuery + ' WHERE 1=1 ' + companyFilter;
  }
  return baseQuery;
}

/**
 * Log authorization check (for audit trail)
 */
export async function logAuthAction(
  auth: AuthContext,
  action: string,
  entityType: string,
  recordId: string | null,
  allowed: boolean,
  details?: Record<string, any>
): Promise<void> {
  try {
    const companyId = auth.companyId;
    const detailsJson = details ? JSON.stringify(details) : null;

    await query(
      `INSERT INTO audit_logs (
        id, created_at, action, entity_type, record_id, company_id, 
        actor_user_id, actor_email, details
      ) VALUES (UUID(), NOW(), ?, ?, ?, ?, ?, ?, ?)`,
      [
        `AUTH_CHECK_${action}`,
        entityType,
        recordId,
        companyId,
        auth.userId,
        auth.email,
        detailsJson || null,
      ]
    );
  } catch (error) {
    console.warn('Failed to log auth action:', error);
  }
}
