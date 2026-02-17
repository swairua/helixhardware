/**
 * MySQL Database Implementation Test Suite
 * Tests the MySQL adapter and all database operations
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  initializePool,
  closePool,
  query,
  queryOne,
  queryAll,
  insert,
  execute,
  healthCheck,
} from '@/server/db/mysql/connection';
import {
  getAuthContext,
  isAdmin,
  canRead,
  canWrite,
  canDelete,
} from '@/server/db/mysql/authorization';
import { MySQLAdapter } from '@/integrations/database/mysql-adapter';
import type { AuthContext } from '@/integrations/database';

// Test configuration
const testConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'password',
  database: process.env.MYSQL_DATABASE || 'app_database_test',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
};

describe('MySQL Connection', () => {
  beforeAll(async () => {
    // Initialize connection pool
    await initializePool(testConfig);
  });

  afterAll(async () => {
    // Close connection pool
    await closePool();
  });

  it('should establish connection pool', async () => {
    const healthy = await healthCheck();
    expect(healthy).toBe(true);
  });

  it('should execute simple query', async () => {
    const result = await query('SELECT 1 as test');
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('MySQL CRUD Operations', () => {
  const testCompanyId = 'test-company-' + Date.now();
  const testCustomerId = 'test-customer-' + Date.now();

  beforeAll(async () => {
    await initializePool(testConfig);
    
    // Create test company
    await insert(
      'INSERT INTO companies (id, name, status) VALUES (?, ?, ?)',
      [testCompanyId, 'Test Company', 'active']
    );
  });

  afterAll(async () => {
    // Cleanup test data
    await execute('DELETE FROM customers WHERE id = ?', [testCustomerId]);
    await execute('DELETE FROM companies WHERE id = ?', [testCompanyId]);
    await closePool();
  });

  it('should insert a record', async () => {
    const result = await insert(
      'INSERT INTO customers (id, company_id, name, email, status) VALUES (?, ?, ?, ?, ?)',
      [testCustomerId, testCompanyId, 'Test Customer', 'test@example.com', 'active']
    );

    expect(result.affectedRows).toBeGreaterThan(0);
  });

  it('should select all records', async () => {
    const results = await queryAll(
      'SELECT * FROM customers WHERE company_id = ?',
      [testCompanyId]
    );

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
  });

  it('should select one record', async () => {
    const result = await queryOne(
      'SELECT * FROM customers WHERE id = ?',
      [testCustomerId]
    );

    expect(result).toBeDefined();
    expect((result as any).id).toBe(testCustomerId);
    expect((result as any).name).toBe('Test Customer');
  });

  it('should update a record', async () => {
    const result = await execute(
      'UPDATE customers SET name = ? WHERE id = ?',
      ['Updated Customer', testCustomerId]
    );

    expect(result.affectedRows).toBeGreaterThan(0);

    // Verify update
    const updated = await queryOne(
      'SELECT * FROM customers WHERE id = ?',
      [testCustomerId]
    );

    expect((updated as any).name).toBe('Updated Customer');
  });

  it('should delete a record', async () => {
    // Insert a temporary record
    const tempId = 'temp-' + Date.now();
    await insert(
      'INSERT INTO customers (id, company_id, name, email, status) VALUES (?, ?, ?, ?, ?)',
      [tempId, testCompanyId, 'Temp Customer', 'temp@example.com', 'active']
    );

    // Delete it
    const result = await execute(
      'DELETE FROM customers WHERE id = ?',
      [tempId]
    );

    expect(result.affectedRows).toBeGreaterThan(0);

    // Verify deletion
    const deleted = await queryOne(
      'SELECT * FROM customers WHERE id = ?',
      [tempId]
    );

    expect(deleted).toBeNull();
  });
});

describe('MySQL Authorization', () => {
  const testUserId = 'test-user-' + Date.now();
  const testCompanyId = 'test-company-' + Date.now();

  const mockAuthContext: AuthContext = {
    userId: testUserId,
    email: 'test@example.com',
    role: 'admin',
    companyId: testCompanyId,
    status: 'active',
  };

  beforeAll(async () => {
    await initializePool(testConfig);

    // Create test company and user
    await insert(
      'INSERT INTO companies (id, name, status) VALUES (?, ?, ?)',
      [testCompanyId, 'Test Auth Company', 'active']
    );

    await insert(
      'INSERT INTO profiles (id, email, role, company_id, status) VALUES (?, ?, ?, ?, ?)',
      [testUserId, 'test@example.com', 'admin', testCompanyId, 'active']
    );
  });

  afterAll(async () => {
    // Cleanup
    await execute('DELETE FROM profiles WHERE id = ?', [testUserId]);
    await execute('DELETE FROM companies WHERE id = ?', [testCompanyId]);
    await closePool();
  });

  it('should get auth context', async () => {
    const context = await getAuthContext(testUserId);
    expect(context).toBeDefined();
    expect(context?.userId).toBe(testUserId);
    expect(context?.email).toBe('test@example.com');
    expect(context?.role).toBe('admin');
  });

  it('should check if user is admin', async () => {
    const result = isAdmin(mockAuthContext);
    expect(result).toBe(true);
  });

  it('should check read permission', async () => {
    // Create a test customer
    const customerId = 'test-cust-' + Date.now();
    await insert(
      'INSERT INTO customers (id, company_id, name, email, status) VALUES (?, ?, ?, ?, ?)',
      [customerId, testCompanyId, 'Test', 'test@example.com', 'active']
    );

    const canReadResult = await canRead(mockAuthContext, 'customers', customerId);
    expect(canReadResult).toBe(true);

    // Cleanup
    await execute('DELETE FROM customers WHERE id = ?', [customerId]);
  });

  it('should check write permission', async () => {
    const canWriteResult = await canWrite(
      mockAuthContext,
      'customers',
      null,
      testCompanyId
    );
    expect(canWriteResult).toBe(true);
  });

  it('should check delete permission', async () => {
    // Create a test customer
    const customerId = 'test-del-' + Date.now();
    await insert(
      'INSERT INTO customers (id, company_id, name, email, status) VALUES (?, ?, ?, ?, ?)',
      [customerId, testCompanyId, 'Test', 'test@example.com', 'active']
    );

    const canDeleteResult = await canDelete(mockAuthContext, 'customers', customerId);
    expect(canDeleteResult).toBe(true);

    // Cleanup
    await execute('DELETE FROM customers WHERE id = ?', [customerId]);
  });

  it('should deny access to other company', async () => {
    const otherCompanyContext: AuthContext = {
      userId: testUserId,
      email: 'test@example.com',
      role: 'user',
      companyId: 'other-company-id',
      status: 'active',
    };

    const canWriteResult = await canWrite(
      otherCompanyContext,
      'customers',
      null,
      testCompanyId
    );
    expect(canWriteResult).toBe(false);
  });
});

describe('MySQL Adapter', () => {
  const adapter = new MySQLAdapter();
  const testCompanyId = 'test-adapter-' + Date.now();

  beforeAll(async () => {
    await adapter.initialize();

    // Create test company
    await adapter.insert('companies', {
      id: testCompanyId,
      name: 'Test Adapter Company',
      status: 'active',
    });
  });

  afterAll(async () => {
    await adapter.delete('companies', testCompanyId);
    await adapter.close();
  });

  it('should select records from adapter', async () => {
    const result = await adapter.select('companies', { status: 'active' });
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.error).toBeNull();
  });

  it('should select one record from adapter', async () => {
    const result = await adapter.selectOne('companies', testCompanyId);
    expect(result.data).toBeDefined();
    expect((result.data as any)?.id).toBe(testCompanyId);
    expect(result.error).toBeNull();
  });

  it('should insert via adapter', async () => {
    const customerId = 'test-insert-' + Date.now();
    const result = await adapter.insert('customers', {
      id: customerId,
      company_id: testCompanyId,
      name: 'Test Customer',
      email: 'test@example.com',
      status: 'active',
    });

    expect(result.error).toBeNull();
    expect(result.id).toBeDefined();

    // Cleanup
    await adapter.delete('customers', customerId);
  });

  it('should update via adapter', async () => {
    const result = await adapter.update('companies', testCompanyId, {
      name: 'Updated Company Name',
    });

    expect(result.error).toBeNull();

    // Verify update
    const updated = await adapter.selectOne('companies', testCompanyId);
    expect((updated.data as any)?.name).toBe('Updated Company Name');
  });

  it('should check health', async () => {
    const healthy = await adapter.health();
    expect(healthy).toBe(true);
  });
});

describe('Data Integrity Tests', () => {
  const testConfig = {
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'password',
    database: process.env.MYSQL_DATABASE || 'app_database_test',
  };

  beforeAll(async () => {
    await initializePool(testConfig);
  });

  afterAll(async () => {
    await closePool();
  });

  it('should enforce foreign key constraints', async () => {
    // Attempt to insert customer with non-existent company
    const invalidInsert = insert(
      'INSERT INTO customers (id, company_id, name, email, status) VALUES (?, ?, ?, ?, ?)',
      [
        'invalid-customer',
        'non-existent-company',
        'Test',
        'test@example.com',
        'active',
      ]
    );

    // This should fail due to foreign key constraint
    expect(invalidInsert).rejects.toThrow();
  });

  it('should maintain email uniqueness in profiles', async () => {
    const testEmail = 'unique-test-' + Date.now() + '@example.com';
    const userId1 = 'user-1-' + Date.now();
    const userId2 = 'user-2-' + Date.now();

    // Insert first user
    await insert(
      'INSERT INTO profiles (id, email, role, status) VALUES (?, ?, ?, ?)',
      [userId1, testEmail, 'user', 'active']
    );

    // Attempt to insert second user with same email (should fail)
    const duplicateInsert = insert(
      'INSERT INTO profiles (id, email, role, status) VALUES (?, ?, ?, ?)',
      [userId2, testEmail, 'user', 'active']
    );

    expect(duplicateInsert).rejects.toThrow();

    // Cleanup
    await execute('DELETE FROM profiles WHERE id = ?', [userId1]);
  });

  it('should auto-update timestamp on record modification', async () => {
    const testId = 'test-timestamp-' + Date.now();
    const companyId = 'test-company-' + Date.now();

    // Create test company
    await insert(
      'INSERT INTO companies (id, name, status) VALUES (?, ?, ?)',
      [companyId, 'Test Company', 'active']
    );

    const selectBefore = await queryOne(
      'SELECT updated_at FROM companies WHERE id = ?',
      [companyId]
    );

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 100));

    // Update the record
    await execute('UPDATE companies SET name = ? WHERE id = ?', ['Updated Name', companyId]);

    const selectAfter = await queryOne(
      'SELECT updated_at FROM companies WHERE id = ?',
      [companyId]
    );

    expect((selectAfter as any)?.updated_at).not.toBe((selectBefore as any)?.updated_at);

    // Cleanup
    await execute('DELETE FROM companies WHERE id = ?', [companyId]);
  });
});
