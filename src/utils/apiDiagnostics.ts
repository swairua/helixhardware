/**
 * API Diagnostics Utility
 * Helps diagnose issues with the external API
 */

import { getClientApiUrl } from './getApiUrl';

interface DiagnosticResult {
  name: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: any;
}

export async function runApiDiagnostics(
  apiUrl: string = getClientApiUrl()
): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];

  // Test 1: API Connectivity
  results.push(await testApiConnectivity(apiUrl));

  // Test 2: Setup Endpoint
  results.push(await testSetupEndpoint(apiUrl));

  // Test 3: Login Endpoint
  results.push(await testLoginEndpoint(apiUrl));

  // Test 4: Health Check
  results.push(await testHealthCheck(apiUrl));

  // Test 5: Database Connection
  results.push(await testDatabaseConnection(apiUrl));

  return results;
}

async function testApiConnectivity(apiUrl: string): Promise<DiagnosticResult> {
  try {
    const response = await fetch(apiUrl, {
      method: 'OPTIONS',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok || response.status === 405) {
      return {
        name: 'API Connectivity',
        status: 'success',
        message: `API is reachable (HTTP ${response.status})`,
      };
    }

    return {
      name: 'API Connectivity',
      status: 'error',
      message: `API returned HTTP ${response.status}`,
      details: await response.text(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      name: 'API Connectivity',
      status: 'error',
      message: `Cannot reach API: ${message}`,
    };
  }
}

async function testSetupEndpoint(apiUrl: string): Promise<DiagnosticResult> {
  try {
    const response = await fetch(`${apiUrl}?action=setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test-setup-check@example.com',
        password: 'TestPassword123!',
      }),
    });

    // Defensively parse JSON
    const data = await response.json().catch(() => {
      if (!response.ok) {
        throw new Error(`Server error: HTTP ${response.status}. Setup endpoint failed.`);
      }
      throw new Error('Invalid response from server: Expected valid JSON');
    });

    if (response.ok && data.status === 'success') {
      return {
        name: 'Setup Endpoint',
        status: 'success',
        message: 'Setup endpoint is working',
        details: data.message,
      };
    }

    return {
      name: 'Setup Endpoint',
      status: 'warning',
      message: `Setup endpoint returned: ${data.message || data.status}`,
      details: data,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      name: 'Setup Endpoint',
      status: 'error',
      message: `Setup endpoint error: ${message}`,
    };
  }
}

async function testLoginEndpoint(apiUrl: string): Promise<DiagnosticResult> {
  try {
    const response = await fetch(`${apiUrl}?action=login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@mail.com',
        password: 'Pass123',
      }),
    });

    // Defensively parse JSON
    const data = await response.json().catch(() => {
      if (!response.ok) {
        throw new Error(`Server error: HTTP ${response.status}. Login endpoint failed.`);
      }
      throw new Error('Invalid response from server: Expected valid JSON');
    });

    if (response.ok && data.token) {
      return {
        name: 'Login Endpoint',
        status: 'success',
        message: 'Admin user exists and login works',
        details: { email: data.user?.email, hasToken: !!data.token },
      };
    }

    if (response.status === 401 || data.message?.includes('Invalid')) {
      return {
        name: 'Login Endpoint',
        status: 'warning',
        message: 'Admin user does not exist yet (setup required)',
        details: data.message,
      };
    }

    return {
      name: 'Login Endpoint',
      status: 'error',
      message: `Login test failed: ${data.message || response.statusText}`,
      details: { status: response.status, data },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      name: 'Login Endpoint',
      status: 'error',
      message: `Login endpoint error: ${message}`,
    };
  }
}

async function testHealthCheck(apiUrl: string): Promise<DiagnosticResult> {
  try {
    const response = await fetch(`${apiUrl}?action=health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const text = await response.text();

    if (response.ok) {
      try {
        const data = JSON.parse(text);
        return {
          name: 'Health Check',
          status: 'success',
          message: 'API health check passed',
          details: data,
        };
      } catch {
        return {
          name: 'Health Check',
          status: 'success',
          message: `API health check passed (HTTP ${response.status})`,
        };
      }
    }

    return {
      name: 'Health Check',
      status: 'warning',
      message: `Health check returned HTTP ${response.status}`,
    };
  } catch (error) {
    // Health endpoint might not exist, which is okay
    return {
      name: 'Health Check',
      status: 'warning',
      message: 'Health endpoint not available (this may be normal)',
    };
  }
}

async function testDatabaseConnection(apiUrl: string): Promise<DiagnosticResult> {
  try {
    // Try to read from users table to verify database connection
    const response = await fetch(`${apiUrl}?action=read&table=users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    // Defensively parse JSON
    const data = await response.json().catch(() => {
      if (!response.ok) {
        throw new Error(`Server error: HTTP ${response.status}. Database connection check failed.`);
      }
      throw new Error('Invalid response from server: Expected valid JSON');
    });

    if (response.ok) {
      const userCount = Array.isArray(data.data) ? data.data.length : 0;
      return {
        name: 'Database Connection',
        status: 'success',
        message: `Database is accessible (${userCount} users found)`,
        details: { userCount },
      };
    }

    if (response.status === 401) {
      return {
        name: 'Database Connection',
        status: 'warning',
        message: 'Database accessible but auth required',
      };
    }

    return {
      name: 'Database Connection',
      status: 'error',
      message: `Database query failed: ${data.message || response.statusText}`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      name: 'Database Connection',
      status: 'error',
      message: `Cannot query database: ${message}`,
    };
  }
}

/**
 * Generate a diagnostic report
 */
export function generateDiagnosticReport(results: DiagnosticResult[]): string {
  let report = '\n═══════════════════════════════════════════════════════════\n';
  report += 'API DIAGNOSTIC REPORT\n';
  report += '═══════════════════════════════════════════════════════════\n\n';

  for (const result of results) {
    const icon = result.status === 'success' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
    report += `${icon} ${result.name}\n`;
    report += `   ${result.message}\n`;

    if (result.details) {
      report += `   Details: ${JSON.stringify(result.details, null, 2).split('\n').join('\n   ')}\n`;
    }
    report += '\n';
  }

  report += '═══════════════════════════════════════════════════════════\n';

  return report;
}
