/**
 * Advanced API Diagnostics
 * Comprehensive testing and debugging for external API connectivity
 */

interface DiagnosticResult {
  category: string;
  test: string;
  status: 'success' | 'warning' | 'error' | 'info';
  message: string;
  details?: any;
  timestamp?: string;
}

interface APIResponseDetails {
  status: number;
  statusText: string;
  headers: {
    contentType?: string;
    contentLength?: string;
  };
  body?: string;
  parseError?: string;
}

const EXTERNAL_API_URL = import.meta.env.VITE_EXTERNAL_API_URL || 'https://med.wayrus.co.ke/api.php';

/**
 * Diagnose API basic connectivity
 */
export async function diagnoseAPIConnectivity(): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];

  // Test 1: DNS Resolution (via fetch attempt)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(new Error('API reachability test timeout: 5 seconds')), 5000);
    
    const response = await fetch(`${EXTERNAL_API_URL}?action=health`, {
      method: 'GET',
      signal: controller.signal,
    }).catch(err => {
      clearTimeout(timeoutId);
      throw err;
    });
    clearTimeout(timeoutId);

    results.push({
      category: 'Connectivity',
      test: 'API Reachability',
      status: response.ok ? 'success' : 'warning',
      message: `API responded with HTTP ${response.status}`,
      details: {
        url: EXTERNAL_API_URL,
        status: response.status,
        statusText: response.statusText,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    results.push({
      category: 'Connectivity',
      test: 'API Reachability',
      status: 'error',
      message: `Failed to reach API: ${message}`,
      details: {
        url: EXTERNAL_API_URL,
        error: message,
      },
      timestamp: new Date().toISOString(),
    });
  }

  return results;
}

/**
 * Capture detailed response information for debugging
 */
export async function captureAPIResponse(
  action: string,
  method: string = 'GET',
  body?: any
): Promise<DiagnosticResult> {
  const url = `${EXTERNAL_API_URL}?action=${action}`;
  
  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });

    const responseDetails: APIResponseDetails = {
      status: response.status,
      statusText: response.statusText,
      headers: {
        contentType: response.headers.get('content-type') || undefined,
        contentLength: response.headers.get('content-length') || undefined,
      },
    };

    // Try to capture response body
    try {
      const text = await response.clone().text();
      responseDetails.body = text.substring(0, 500); // First 500 chars
      
      // If it looks like JSON, try to parse it
      if (responseDetails.headers.contentType?.includes('application/json')) {
        try {
          const json = JSON.parse(text);
          responseDetails.body = JSON.stringify(json, null, 2).substring(0, 500);
        } catch (e) {
          responseDetails.parseError = 'Response claims to be JSON but is not valid JSON';
        }
      }
    } catch (e) {
      responseDetails.body = '[Unable to read response body]';
    }

    return {
      category: 'API Response',
      test: `${method} ${action}`,
      status: response.ok ? 'success' : 'error',
      message: response.ok 
        ? `Success: ${response.statusText}`
        : `Error: HTTP ${response.status} - ${response.statusText}`,
      details: responseDetails,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      category: 'API Response',
      test: `${method} ${action}`,
      status: 'error',
      message: `Request failed: ${message}`,
      details: { url, error: message },
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Test all critical API endpoints
 */
export async function diagnoseAPIEndpoints(): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];

  // Test health endpoint
  results.push(await captureAPIResponse('health', 'GET'));

  // Test setup endpoint
  results.push(await captureAPIResponse('setup', 'POST', {
    email: 'test@example.com',
    password: 'TestPass123!',
  }));

  // Test login with dummy credentials
  results.push(await captureAPIResponse('login', 'POST', {
    email: 'test@example.com',
    password: 'TestPass123!',
  }));

  // Test check_auth
  results.push(await captureAPIResponse('check_auth', 'POST', {
    token: 'test-token',
  }));

  return results;
}

/**
 * Test specific endpoint and return full details
 */
export async function testAPIEndpoint(
  action: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    data?: any;
    authToken?: string;
  } = {}
): Promise<DiagnosticResult> {
  const { method = 'GET', data, authToken } = options;
  const url = `${EXTERNAL_API_URL}?action=${action}`;

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(new Error('API request test timeout: 10 seconds')), 10000);

    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseText = await response.text();
    let bodyDetails: any = { raw: responseText.substring(0, 1000) };

    // Try to parse as JSON
    if (response.headers.get('content-type')?.includes('application/json')) {
      try {
        bodyDetails.parsed = JSON.parse(responseText);
      } catch (e) {
        bodyDetails.parseError = 'Response is not valid JSON';
      }
    } else if (responseText.toLowerCase().includes('<!doctype') || responseText.toLowerCase().includes('<html')) {
      bodyDetails.type = 'HTML response (likely server error page)';
      bodyDetails.preview = responseText.substring(0, 200);
    }

    return {
      category: 'Endpoint Test',
      test: `${method} ${action}`,
      status: response.ok ? 'success' : response.status >= 500 ? 'error' : 'warning',
      message: response.ok
        ? 'Request successful'
        : `HTTP ${response.status} ${response.statusText}`,
      details: {
        url,
        method,
        statusCode: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type'),
        responseLength: responseText.length,
        response: bodyDetails,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      category: 'Endpoint Test',
      test: `${method} ${action}`,
      status: 'error',
      message: `Request failed: ${errorMessage}`,
      details: {
        url,
        method,
        error: errorMessage,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Run comprehensive diagnostics
 */
export async function runComprehensiveDiagnostics(): Promise<DiagnosticResult[]> {
  const allResults: DiagnosticResult[] = [];

  // Phase 1: Connectivity
  allResults.push(...await diagnoseAPIConnectivity());

  // Phase 2: Endpoint Testing
  allResults.push(...await diagnoseAPIEndpoints());

  // Phase 3: Configuration Check
  allResults.push({
    category: 'Configuration',
    test: 'API URL',
    status: EXTERNAL_API_URL ? 'success' : 'error',
    message: EXTERNAL_API_URL 
      ? `API URL configured: ${EXTERNAL_API_URL}`
      : 'No API URL configured',
    details: {
      configuredUrl: EXTERNAL_API_URL,
      env: {
        VITE_EXTERNAL_API_URL: import.meta.env.VITE_EXTERNAL_API_URL,
      },
    },
    timestamp: new Date().toISOString(),
  });

  return allResults;
}

/**
 * Format diagnostic results for display
 */
export function formatDiagnosticResults(results: DiagnosticResult[]): string {
  let output = '\n=== API DIAGNOSTICS REPORT ===\n';
  
  const byCategory: Record<string, DiagnosticResult[]> = {};
  results.forEach(result => {
    if (!byCategory[result.category]) {
      byCategory[result.category] = [];
    }
    byCategory[result.category].push(result);
  });

  Object.entries(byCategory).forEach(([category, items]) => {
    output += `\n📋 ${category}\n`;
    output += '─'.repeat(40) + '\n';
    
    items.forEach(item => {
      const statusIcon = {
        success: '✅',
        warning: '⚠️',
        error: '❌',
        info: 'ℹ️',
      }[item.status];
      
      output += `${statusIcon} ${item.test}\n`;
      output += `   ${item.message}\n`;
      
      if (item.details) {
        output += `   Details: ${JSON.stringify(item.details, null, 2).split('\n').join('\n   ')}\n`;
      }
    });
  });

  output += '\n=== END REPORT ===\n';
  return output;
}
