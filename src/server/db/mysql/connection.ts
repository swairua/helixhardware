import mysql from 'mysql2/promise';
import { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

/**
 * MySQL Database Connection Manager
 * Provides connection pooling and query execution
 */

let pool: Pool | null = null;

interface MySQLConfig {
  host: string;
  user: string;
  password: string;
  database: string;
  port?: number;
  waitForConnections?: boolean;
  connectionLimit?: number;
  queueLimit?: number;
}

/**
 * Initialize MySQL connection pool
 */
export async function initializePool(config: MySQLConfig): Promise<Pool> {
  if (pool) {
    return pool;
  }

  pool = await mysql.createPool({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database,
    port: config.port || 3306,
    waitForConnections: config.waitForConnections !== false,
    connectionLimit: config.connectionLimit || 10,
    queueLimit: config.queueLimit || 0,
    enableKeepAlive: true,
    keepAliveInitialDelayMs: 0,
    decimalNumbers: true,
  });

  console.log('✅ MySQL connection pool initialized');
  return pool;
}

/**
 * Get the connection pool
 */
export function getPool(): Pool {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initializePool first.');
  }
  return pool;
}

/**
 * Execute a query and return results
 */
export async function query<T extends RowDataPacket[]>(
  sql: string,
  values?: any[]
): Promise<T> {
  const connection = await getPool().getConnection();
  try {
    const [rows] = await connection.query<T>(sql, values);
    return rows;
  } finally {
    connection.release();
  }
}

/**
 * Execute a query that returns multiple rows
 */
export async function queryAll<T extends RowDataPacket[]>(
  sql: string,
  values?: any[]
): Promise<T[]> {
  const results = await query<T>(sql, values);
  return Array.isArray(results) ? results : [results as T];
}

/**
 * Execute a query that returns a single row
 */
export async function queryOne<T extends RowDataPacket>(
  sql: string,
  values?: any[]
): Promise<T | null> {
  const results = await query<T>(sql, values);
  return results.length > 0 ? results[0] : null;
}

/**
 * Execute an insert query
 */
export async function insert(
  sql: string,
  values?: any[]
): Promise<{ insertId: number | bigint; affectedRows: number }> {
  const connection = await getPool().getConnection();
  try {
    const [result] = await connection.query<ResultSetHeader>(sql, values);
    return {
      insertId: result.insertId,
      affectedRows: result.affectedRows,
    };
  } finally {
    connection.release();
  }
}

/**
 * Execute an update/delete query
 */
export async function execute(
  sql: string,
  values?: any[]
): Promise<{ affectedRows: number; changedRows: number }> {
  const connection = await getPool().getConnection();
  try {
    const [result] = await connection.query<ResultSetHeader>(sql, values);
    return {
      affectedRows: result.affectedRows,
      changedRows: result.changedRows,
    };
  } finally {
    connection.release();
  }
}

/**
 * Execute a stored procedure
 */
export async function callProcedure<T extends RowDataPacket[]>(
  procedureName: string,
  params?: any[]
): Promise<T[]> {
  const connection = await getPool().getConnection();
  try {
    const [rows] = await connection.query<T>(
      `CALL ${procedureName}(${params?.map(() => '?').join(',') || ''})`,
      params
    );
    return Array.isArray(rows) ? rows : [rows as T];
  } finally {
    connection.release();
  }
}

/**
 * Execute a transaction
 */
export async function transaction<T>(
  callback: (connection: PoolConnection) => Promise<T>
): Promise<T> {
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Close the connection pool
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('✅ MySQL connection pool closed');
  }
}

/**
 * Health check - test database connection
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const connection = await getPool().getConnection();
    await connection.query('SELECT 1');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    return false;
  }
}
