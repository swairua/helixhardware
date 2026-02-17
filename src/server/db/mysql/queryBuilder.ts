import { query, queryOne, queryAll, insert, execute } from './connection';
import { AuthContext, canWrite, canDelete, buildSecureQuery } from './authorization';
import { RowDataPacket } from 'mysql2/promise';

/**
 * MySQL Query Builder with Authorization
 * Provides a fluent interface for building secure queries
 */

export interface QueryOptions {
  auth?: AuthContext;
  includeCompanyFilter?: boolean;
  limit?: number;
  offset?: number;
  orderBy?: string;
}

/**
 * Query builder for SELECT operations
 */
export class SelectQuery {
  private table: string;
  private auth?: AuthContext;
  private whereConditions: string[] = [];
  private orderByClause: string = '';
  private limitClause: string = '';
  private selectFields: string = '*';
  private joinClauses: string = '';

  constructor(table: string, auth?: AuthContext) {
    this.table = table;
    this.auth = auth;

    // Auto-add company filter if auth context provided
    if (auth && auth.companyId) {
      this.where(`${table}.company_id = ?`, [auth.companyId]);
    }
  }

  select(...fields: string[]): this {
    this.selectFields = fields.join(', ');
    return this;
  }

  where(condition: string, values?: any[]): this {
    // Store condition as-is, will be handled in build()
    this.whereConditions.push(condition);
    return this;
  }

  join(joinClause: string): this {
    this.joinClauses += ' ' + joinClause;
    return this;
  }

  orderBy(orderByClause: string): this {
    this.orderByClause = orderByClause;
    return this;
  }

  limit(limit: number): this {
    this.limitClause = ` LIMIT ${limit}`;
    return this;
  }

  offset(offset: number): this {
    this.limitClause += ` OFFSET ${offset}`;
    return this;
  }

  async getMany<T extends RowDataPacket[]>(): Promise<T[]> {
    const sql = this.build();
    return queryAll<T>(sql);
  }

  async getOne<T extends RowDataPacket>(): Promise<T | null> {
    const sql = this.build();
    return queryOne<T>(sql);
  }

  private build(): string {
    let sql = `SELECT ${this.selectFields} FROM ${this.table}`;

    if (this.joinClauses) {
      sql += this.joinClauses;
    }

    const allConditions = this.whereConditions.filter(c => c);
    if (allConditions.length > 0) {
      sql += ' WHERE ' + allConditions.join(' AND ');
    }

    if (this.orderByClause) {
      sql += ` ORDER BY ${this.orderByClause}`;
    }

    sql += this.limitClause;

    return sql;
  }
}

/**
 * Query builder for INSERT operations
 */
export class InsertQuery {
  private table: string;
  private auth?: AuthContext;
  private values: Record<string, any> = {};

  constructor(table: string, auth?: AuthContext) {
    this.table = table;
    this.auth = auth;
  }

  set(data: Record<string, any>): this {
    this.values = { ...this.values, ...data };
    return this;
  }

  async execute(): Promise<{ insertId: number | bigint; affectedRows: number }> {
    // Auto-add company_id if auth context provided and not set
    if (this.auth?.companyId && !this.values.company_id) {
      this.values.company_id = this.auth.companyId;
    }

    // Auto-add created_by if auth context provided
    if (this.auth?.userId && !this.values.created_by) {
      this.values.created_by = this.auth.userId;
    }

    // Auto-generate UUID if not provided
    if (!this.values.id) {
      this.values.id = 'UUID()';
    }

    const fields = Object.keys(this.values).join(', ');
    const values = Object.values(this.values);
    const placeholders = values.map((v) => (v === 'UUID()' ? 'UUID()' : '?')).join(', ');

    const sql = `INSERT INTO ${this.table} (${fields}) VALUES (${placeholders})`;
    const actualValues = values.filter(v => v !== 'UUID()');

    return insert(sql, actualValues);
  }
}

/**
 * Query builder for UPDATE operations
 */
export class UpdateQuery {
  private table: string;
  private auth?: AuthContext;
  private whereConditions: string[] = [];
  private values: Record<string, any> = {};

  constructor(table: string, auth?: AuthContext) {
    this.table = table;
    this.auth = auth;
  }

  set(data: Record<string, any>): this {
    // Auto-add updated_at
    this.values = { ...this.values, ...data, updated_at: 'NOW()' };
    return this;
  }

  where(condition: string): this {
    this.whereConditions.push(condition);
    return this;
  }

  byId(id: string): this {
    this.where(`id = '${id}'`);
    return this;
  }

  async execute(): Promise<{ affectedRows: number; changedRows: number }> {
    const fieldUpdates = Object.entries(this.values)
      .map(([field, value]) => {
        if (value === 'NOW()') {
          return `${field} = NOW()`;
        }
        return `${field} = ?`;
      })
      .join(', ');

    const values = Object.values(this.values)
      .filter(v => v !== 'NOW()')
      .map(v => v);

    let sql = `UPDATE ${this.table} SET ${fieldUpdates}`;

    const allConditions = this.whereConditions.filter(c => c);
    if (allConditions.length > 0) {
      sql += ' WHERE ' + allConditions.join(' AND ');
    }

    return execute(sql, values);
  }
}

/**
 * Query builder for DELETE operations
 */
export class DeleteQuery {
  private table: string;
  private auth?: AuthContext;
  private whereConditions: string[] = [];

  constructor(table: string, auth?: AuthContext) {
    this.table = table;
    this.auth = auth;
  }

  where(condition: string): this {
    this.whereConditions.push(condition);
    return this;
  }

  byId(id: string): this {
    this.where(`id = '${id}'`);
    return this;
  }

  async execute(): Promise<{ affectedRows: number }> {
    let sql = `DELETE FROM ${this.table}`;

    const allConditions = this.whereConditions.filter(c => c);
    if (allConditions.length > 0) {
      sql += ' WHERE ' + allConditions.join(' AND ');
    } else {
      throw new Error('DELETE requires at least one WHERE condition');
    }

    const result = await execute(sql);
    return { affectedRows: result.affectedRows };
  }
}

/**
 * Helper function to select from a table with authorization
 */
export function selectFrom(table: string, auth?: AuthContext): SelectQuery {
  return new SelectQuery(table, auth);
}

/**
 * Helper function to insert into a table with authorization
 */
export function insertInto(table: string, auth?: AuthContext): InsertQuery {
  return new InsertQuery(table, auth);
}

/**
 * Helper function to update a table with authorization
 */
export function updateTable(table: string, auth?: AuthContext): UpdateQuery {
  return new UpdateQuery(table, auth);
}

/**
 * Helper function to delete from a table with authorization
 */
export function deleteFrom(table: string, auth?: AuthContext): DeleteQuery {
  return new DeleteQuery(table, auth);
}

/**
 * Example usage:
 * 
 * // Select with authorization
 * const customers = await selectFrom('customers', auth)
 *   .select('id', 'name', 'email')
 *   .where('status = ?', ['active'])
 *   .orderBy('name ASC')
 *   .limit(10)
 *   .getMany();
 * 
 * // Insert with authorization
 * const result = await insertInto('customers', auth)
 *   .set({ name: 'John Doe', email: 'john@example.com' })
 *   .execute();
 * 
 * // Update with authorization
 * await updateTable('customers', auth)
 *   .byId(customerId)
 *   .set({ name: 'Jane Doe' })
 *   .execute();
 * 
 * // Delete with authorization
 * await deleteFrom('customers', auth)
 *   .byId(customerId)
 *   .execute();
 */
