/**
 * External API Testing Utility
 * Use this to verify connectivity and test basic operations
 */

import { ExternalAPIAdapter } from './external-api-adapter';
import { externalApiAuth } from '../auth/external-api-auth';

export interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
  error?: string;
}

export class APITestSuite {
  private apiUrl: string;
  private results: TestResult[] = [];

  constructor(apiUrl: string = import.meta.env.VITE_EXTERNAL_API_URL || 'https://med.wayrus.co.ke/api.php') {
    this.apiUrl = apiUrl;
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<TestResult[]> {
    this.results = [];

    console.log('🧪 Starting API Test Suite...\n');

    // Basic connectivity
    await this.testHealthCheck();

    // Get current auth status (may be unauthenticated)
    await this.testAuthStatus();

    // Authentication tests (skip if already logged in with different creds)
    // Note: These require valid credentials to work

    // Database operations (requires authentication)
    // await this.testReadOperation();
    // await this.testCreateOperation();

    this.printResults();

    return this.results;
  }

  /**
   * Test 1: Health Check
   */
  private async testHealthCheck(): Promise<void> {
    const startTime = performance.now();

    try {
      const response = await fetch(`${this.apiUrl}?action=health`);
      const duration = Math.round(performance.now() - startTime);

      const passed = response.ok;
      this.addResult({
        name: 'Health Check',
        passed,
        message: passed ? `API is healthy (${response.status})` : `API returned ${response.status}`,
        duration,
      });
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      this.addResult({
        name: 'Health Check',
        passed: false,
        message: 'Failed to connect to API',
        duration,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Test 2: Auth Status Check
   */
  private async testAuthStatus(): Promise<void> {
    const startTime = performance.now();

    try {
      const { valid, user, error } = await externalApiAuth.verifyToken();
      const duration = Math.round(performance.now() - startTime);

      if (valid && user) {
        this.addResult({
          name: 'Auth Status',
          passed: true,
          message: `Authenticated as ${user.email} (${user.role})`,
          duration,
        });
      } else {
        this.addResult({
          name: 'Auth Status',
          passed: false,
          message: 'Not authenticated (expected if not logged in)',
          duration,
          error: error?.message,
        });
      }
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      this.addResult({
        name: 'Auth Status',
        passed: false,
        message: 'Failed to check auth status',
        duration,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Test 3: Read Operation (requires auth)
   */
  async testReadOperation(table: string = 'users'): Promise<void> {
    const startTime = performance.now();

    try {
      const adapter = new ExternalAPIAdapter(this.apiUrl);
      const { data, error } = await adapter.select(table);
      const duration = Math.round(performance.now() - startTime);

      const passed = !error && data !== null;
      this.addResult({
        name: `Read Operation (${table})`,
        passed,
        message: passed ? `Retrieved ${data.length} records from ${table}` : 'Read operation failed',
        duration,
        error: error?.message,
      });
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      this.addResult({
        name: `Read Operation (${table})`,
        passed: false,
        message: 'Read operation failed',
        duration,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Test 4: Create Operation (requires auth)
   */
  async testCreateOperation(table: string = 'contacts', data: any = {}): Promise<void> {
    const startTime = performance.now();

    try {
      // Provide default test data for contacts table
      const testData = data || {
        name: 'Test Contact',
        email: 'test@example.com',
        phone: '1234567890',
        subject: 'API Test',
        message: 'This is a test contact',
        status: 'new',
      };

      const adapter = new ExternalAPIAdapter(this.apiUrl);
      const { id, error } = await adapter.insert(table, testData);
      const duration = Math.round(performance.now() - startTime);

      const passed = !error && id;
      this.addResult({
        name: `Create Operation (${table})`,
        passed,
        message: passed ? `Created record with ID ${id}` : 'Create operation failed',
        duration,
        error: error?.message,
      });
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      this.addResult({
        name: `Create Operation (${table})`,
        passed: false,
        message: 'Create operation failed',
        duration,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Test 5: Update Operation (requires auth)
   */
  async testUpdateOperation(table: string = 'contacts', id: string = '1', data: any = {}): Promise<void> {
    const startTime = performance.now();

    try {
      const testData = data || {
        status: 'updated',
      };

      const adapter = new ExternalAPIAdapter(this.apiUrl);
      const { error } = await adapter.update(table, id, testData);
      const duration = Math.round(performance.now() - startTime);

      const passed = !error;
      this.addResult({
        name: `Update Operation (${table})`,
        passed,
        message: passed ? `Updated record ${id}` : 'Update operation failed',
        duration,
        error: error?.message,
      });
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      this.addResult({
        name: `Update Operation (${table})`,
        passed: false,
        message: 'Update operation failed',
        duration,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Test 6: Delete Operation (requires auth)
   */
  async testDeleteOperation(table: string = 'contacts', id: string = '1'): Promise<void> {
    const startTime = performance.now();

    try {
      const adapter = new ExternalAPIAdapter(this.apiUrl);
      const { error } = await adapter.delete(table, id);
      const duration = Math.round(performance.now() - startTime);

      const passed = !error;
      this.addResult({
        name: `Delete Operation (${table})`,
        passed,
        message: passed ? `Deleted record ${id}` : 'Delete operation failed',
        duration,
        error: error?.message,
      });
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      this.addResult({
        name: `Delete Operation (${table})`,
        passed: false,
        message: 'Delete operation failed',
        duration,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Test login functionality
   */
  async testLogin(email: string, password: string): Promise<void> {
    const startTime = performance.now();

    try {
      const { token, user, error } = await externalApiAuth.login(email, password);
      const duration = Math.round(performance.now() - startTime);

      const passed = token && user && !error;
      this.addResult({
        name: 'Login Operation',
        passed,
        message: passed ? `Logged in as ${user?.email}` : 'Login failed',
        duration,
        error: error?.message,
      });
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      this.addResult({
        name: 'Login Operation',
        passed: false,
        message: 'Login failed',
        duration,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Add a test result
   */
  private addResult(result: TestResult): void {
    this.results.push(result);
  }

  /**
   * Print test results to console
   */
  private printResults(): void {
    console.log('\n📊 Test Results:\n');

    const passed = this.results.filter((r) => r.passed).length;
    const failed = this.results.filter((r) => !r.passed).length;

    this.results.forEach((result) => {
      const icon = result.passed ? '✅' : '❌';
      const status = result.passed ? 'PASS' : 'FAIL';

      console.log(
        `${icon} ${result.name.padEnd(30)} [${status}] (${result.duration}ms)`
      );

      if (result.message) {
        console.log(`   📝 ${result.message}`);
      }

      if (result.error) {
        console.log(`   ⚠️  ${result.error}`);
      }

      console.log('');
    });

    console.log(
      `\n📈 Summary: ${passed} passed, ${failed} failed out of ${this.results.length} tests\n`
    );
  }

  /**
   * Get test results
   */
  getResults(): TestResult[] {
    return this.results;
  }
}

/**
 * Convenience function for use in browser console
 */
export async function testExternalAPI(): Promise<TestResult[]> {
  const suite = new APITestSuite();
  return suite.runAllTests();
}

/**
 * Test specific operations
 */
export async function testAPILogin(email: string, password: string): Promise<void> {
  const suite = new APITestSuite();
  await suite.testLogin(email, password);
  suite['printResults']();
}

export async function testAPIRead(table: string = 'users'): Promise<void> {
  const suite = new APITestSuite();
  await suite.testReadOperation(table);
  suite['printResults']();
}

export async function testAPICreate(table: string, data: any): Promise<void> {
  const suite = new APITestSuite();
  await suite.testCreateOperation(table, data);
  suite['printResults']();
}
