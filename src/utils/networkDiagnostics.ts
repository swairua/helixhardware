/**
 * Network Diagnostics Utility
 * Helps identify API connectivity, firewall, and proxy issues
 */

interface DiagnosticResult {
  test: string;
  status: 'success' | 'failed' | 'warning';
  message: string;
  details?: any;
}

/**
 * Test if API endpoint is reachable
 */
export async function testAPIConnectivity(apiUrl: string = '/api'): Promise<DiagnosticResult> {
  try {
    console.log(`🔍 Testing API connectivity to: ${apiUrl}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(new Error('Connectivity test timeout: 5 seconds')), 5000);

    const response = await fetch(`${apiUrl}?action=health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.ok) {
      return {
        test: 'API Connectivity',
        status: 'success',
        message: `✅ API is reachable (HTTP ${response.status})`,
        details: { url: apiUrl, status: response.status },
      };
    } else {
      return {
        test: 'API Connectivity',
        status: 'warning',
        message: `⚠️ API returned error (HTTP ${response.status})`,
        details: { url: apiUrl, status: response.status },
      };
    }
  } catch (error: any) {
    let message = '❌ API is unreachable';
    let details: any = { url: apiUrl };

    if (error.name === 'AbortError') {
      const abortReason = error.reason?.message || error.message || 'timeout';
      message = `❌ API request timed out (5 seconds) - Backend may be slow or unreachable. Reason: ${abortReason}`;
      details.reason = 'timeout';
      details.abortReason = abortReason;
    } else if (error instanceof TypeError && error.message === 'Failed to fetch') {
      message = '❌ Failed to fetch - Check firewall, corporate proxy, or network connectivity';
      details.reason = 'failed_to_fetch';
    } else if (error.message?.includes('Network request failed')) {
      message = '❌ Network request failed - Check your internet connection';
      details.reason = 'network_error';
    } else if (error.message?.includes('CORS')) {
      message = '❌ CORS error - Backend missing required headers';
      details.reason = 'cors_error';
    } else {
      details.reason = error.message || 'Unknown error';
    }

    return {
      test: 'API Connectivity',
      status: 'failed',
      message,
      details,
    };
  }
}

/**
 * Test CORS preflight request
 */
export async function testCORSPreflight(apiUrl: string = '/api'): Promise<DiagnosticResult> {
  try {
    console.log(`🔍 Testing CORS preflight to: ${apiUrl}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(new Error('CORS preflight test timeout: 5 seconds')), 5000);

    const response = await fetch(apiUrl, {
      method: 'OPTIONS',
      headers: {
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.ok) {
      const corsOrigin = response.headers.get('Access-Control-Allow-Origin');
      const corsMethods = response.headers.get('Access-Control-Allow-Methods');

      return {
        test: 'CORS Preflight',
        status: corsOrigin ? 'success' : 'warning',
        message: corsOrigin ? '✅ CORS headers present' : '⚠️ CORS headers missing',
        details: {
          'Access-Control-Allow-Origin': corsOrigin || 'Not set',
          'Access-Control-Allow-Methods': corsMethods || 'Not set',
        },
      };
    } else {
      return {
        test: 'CORS Preflight',
        status: 'warning',
        message: `⚠️ Preflight returned HTTP ${response.status}`,
        details: { status: response.status },
      };
    }
  } catch (error: any) {
    let errorMessage = error.message;
    if (error.name === 'AbortError') {
      const abortReason = error.reason?.message || 'timeout';
      errorMessage = `Timeout: ${abortReason}`;
    }
    return {
      test: 'CORS Preflight',
      status: 'failed',
      message: '❌ CORS preflight failed',
      details: { error: errorMessage },
    };
  }
}

/**
 * Test DNS resolution (via DNS API)
 */
export async function testDNSResolution(): Promise<DiagnosticResult> {
  try {
    console.log('🔍 Testing DNS resolution for helixgeneralhardware.com');

    // Use public DNS API
    const response = await fetch('https://dns.google/resolve?name=helixgeneralhardware.com', {
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const data = await response.json();
      const hasAnswers = data.Answer && data.Answer.length > 0;

      return {
        test: 'DNS Resolution',
        status: hasAnswers ? 'success' : 'failed',
        message: hasAnswers ? '✅ DNS resolved successfully' : '❌ DNS resolution failed',
        details: { domain: 'helixgeneralhardware.com', hasAnswers },
      };
    } else {
      return {
        test: 'DNS Resolution',
        status: 'warning',
        message: `⚠️ DNS API returned HTTP ${response.status}`,
        details: { status: response.status },
      };
    }
  } catch (error: any) {
    return {
      test: 'DNS Resolution',
      status: 'warning',
      message: '⚠️ Could not test DNS (DNS API unavailable)',
      details: { error: error.message },
    };
  }
}

/**
 * Run complete network diagnostics
 */
export async function runNetworkDiagnostics(): Promise<DiagnosticResult[]> {
  console.log('🔧 Running network diagnostics...');

  const results: DiagnosticResult[] = [];

  // Test API connectivity via proxy
  results.push(await testAPIConnectivity('/api'));

  // Test CORS preflight
  results.push(await testCORSPreflight('/api'));

  // Test DNS (optional, may fail due to restrictions)
  results.push(await testDNSResolution());

  // Log results
  console.log('📋 Diagnostic Results:');
  results.forEach((result) => {
    console.log(`  ${result.status.toUpperCase()}: ${result.test} - ${result.message}`);
    if (result.details) {
      console.log(`    Details:`, result.details);
    }
  });

  return results;
}

/**
 * Get user-friendly troubleshooting suggestions based on error type
 */
export function getTroubleshootingSuggestions(errorType: string): string[] {
  const suggestions: Record<string, string[]> = {
    failed_to_fetch: [
      '1. Check your internet connection',
      '2. Check if corporate firewall is blocking external connections',
      '3. Check if corporate proxy is interfering with HTTPS requests',
      '4. Try disabling VPN temporarily',
      '5. Check with IT/Network team about allowed domains',
      '6. Verify backend server is running at https://helixgeneralhardware.com',
    ],
    timeout: [
      '1. Backend server appears to be slow or unresponsive',
      '2. Network latency may be high',
      '3. Check if backend service is running',
      '4. Check server logs for errors',
      '5. Try again in a few moments',
    ],
    cors_error: [
      '1. Backend is missing CORS headers',
      '2. Check backend api.php for Access-Control-Allow-Origin header',
      '3. Ensure backend allows all required HTTP methods',
      '4. Check browser console for specific CORS error details',
    ],
    network_error: [
      '1. Check your internet connection',
      '2. Try refreshing the page',
      '3. Check if DNS is working',
      '4. Try using a different network',
    ],
  };

  return suggestions[errorType] || suggestions.failed_to_fetch;
}
