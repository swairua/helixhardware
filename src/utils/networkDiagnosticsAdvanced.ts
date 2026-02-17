/**
 * Advanced Network Diagnostics Utility
 * Detects firewall, proxy, DNS, and connectivity issues
 */

import { getClientApiUrl } from './getApiUrl';

interface NetworkDiagnostic {
  test: string;
  status: 'success' | 'warning' | 'error' | 'info';
  message: string;
  details?: any;
  recommendations?: string[];
}

/**
 * Test direct connectivity to API endpoint
 */
export async function testDirectConnectivity(
  apiUrl?: string
): Promise<NetworkDiagnostic> {
  const url = apiUrl || getClientApiUrl();
  const startTime = performance.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, {
      method: 'HEAD',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const duration = performance.now() - startTime;

    return {
      test: 'Direct Connectivity',
      status: 'success',
      message: `API is reachable (HTTP ${response.status}) in ${duration.toFixed(0)}ms`,
      details: {
        statusCode: response.status,
        responseTime: `${duration.toFixed(0)}ms`,
        headers: {
          'content-type': response.headers.get('content-type'),
          'server': response.headers.get('server'),
        },
      },
    };
  } catch (error: any) {
    const duration = performance.now() - startTime;

    let status = 'error';
    let message = '';
    const recommendations: string[] = [];

    if (error.name === 'AbortError') {
      message = `Connection timeout after 10 seconds (${duration.toFixed(0)}ms)`;
      recommendations.push('❌ API server is slow or unresponsive');
      recommendations.push('💡 Check if API server is online');
      recommendations.push('💡 Verify network connectivity to external internet');
      recommendations.push('💡 Check firewall rules blocking outbound HTTPS (port 443)');
    } else if (error.message.includes('Failed to fetch')) {
      message = 'Connection failed - likely CORS, firewall, or DNS issue';
      recommendations.push('❌ Frontend cannot reach backend directly');
      recommendations.push('💡 This is expected - using Vite proxy as workaround');
      recommendations.push('💡 Verify CORS headers are configured on backend');
      recommendations.push('💡 Check if corporate firewall blocks API server');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      message = 'DNS resolution failed for API server';
      recommendations.push('❌ Cannot resolve domain name');
      recommendations.push('💡 Check DNS server configuration');
      recommendations.push('💡 Verify API domain is valid');
      recommendations.push('💡 Try pinging domain from terminal');
    } else if (error.message.includes('ECONNREFUSED')) {
      message = 'Connection refused - server is not listening on that port';
      recommendations.push('❌ Server is down or port is closed');
      recommendations.push('💡 Verify API server is running');
      recommendations.push('💡 Check if port 443 is open');
    } else {
      message = `Connection error: ${error.message}`;
      recommendations.push(`💡 Error type: ${error.name || 'Unknown'}`);
    }

    return {
      test: 'Direct Connectivity',
      status,
      message,
      details: {
        errorType: error.name,
        errorMessage: error.message,
        responseTime: `${duration.toFixed(0)}ms`,
      },
      recommendations,
    };
  }
}

/**
 * Test if connection is using a proxy
 */
export async function testProxyDetection(
  apiUrl?: string
): Promise<NetworkDiagnostic> {
  const url = apiUrl || getClientApiUrl();
  try {
    // Try to fetch and check response headers for proxy indicators
    const response = await fetch(url, {
      method: 'OPTIONS',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    const viaHeader = response.headers.get('via');
    const xForwardedFor = response.headers.get('x-forwarded-for');
    const xForwardedProto = response.headers.get('x-forwarded-proto');

    if (viaHeader || xForwardedFor) {
      return {
        test: 'Proxy Detection',
        status: 'info',
        message: 'Request appears to be going through a proxy',
        details: {
          'via': viaHeader,
          'x-forwarded-for': xForwardedFor,
          'x-forwarded-proto': xForwardedProto,
        },
        recommendations: [
          'ℹ️ Your request is being proxied',
          '💡 If this is a corporate environment, contact IT about proxy settings',
          '💡 Verify proxy allows HTTPS connections to helixgeneralhardware.com',
        ],
      };
    }

    return {
      test: 'Proxy Detection',
      status: 'success',
      message: 'No proxy detected in response headers',
    };
  } catch (error) {
    return {
      test: 'Proxy Detection',
      status: 'warning',
      message: 'Could not determine proxy status',
      details: { error: error instanceof Error ? error.message : String(error) },
    };
  }
}

/**
 * Test DNS resolution
 */
export async function testDNSResolution(
  domain?: string
): Promise<NetworkDiagnostic> {
  // Extract domain from API URL if not provided
  let testDomain = domain;
  if (!testDomain) {
    const apiUrl = getClientApiUrl();
    try {
      const url = new URL(apiUrl, 'https://example.com');
      testDomain = url.hostname;
    } catch {
      testDomain = 'api.example.com'; // Fallback for relative URLs
    }
  }

  try {
    // Use public DNS API to resolve domain
    const response = await fetch(`https://dns.google/resolve?name=${testDomain}`, {
      signal: AbortSignal.timeout(5000),
    });

    const data = await response.json().catch(() => ({}));
    const answers = data.Answer || [];
    const hasAnswers = answers.length > 0;

    if (hasAnswers) {
      const ips = answers
        .filter((ans: any) => ans.type === 1) // A records
        .map((ans: any) => ans.data)
        .join(', ');

      return {
        test: 'DNS Resolution',
        status: 'success',
        message: `DNS resolved successfully for ${testDomain}`,
        details: {
          domain: testDomain,
          ips,
          recordCount: answers.length,
        },
      };
    } else {
      return {
        test: 'DNS Resolution',
        status: 'error',
        message: `Failed to resolve ${testDomain}`,
        details: { domain: testDomain, answerCount: 0 },
        recommendations: [
          '❌ Domain cannot be resolved',
          `💡 Verify domain ${testDomain} exists`,
          '💡 Check DNS server is accessible',
          '💡 Try flushing DNS cache: ipconfig /flushdns (Windows) or sudo dscacheutil -flushcache (Mac)',
        ],
      };
    }
  } catch (error) {
    return {
      test: 'DNS Resolution',
      status: 'warning',
      message: 'Could not test DNS (public DNS API unavailable)',
      details: { error: error instanceof Error ? error.message : String(error) },
    };
  }
}

/**
 * Test CORS configuration
 */
export async function testCORSConfiguration(
  apiUrl?: string
): Promise<NetworkDiagnostic> {
  const url = apiUrl || getClientApiUrl();
  try {
    const response = await fetch(`${url}?action=health`, {
      method: 'GET',
      headers: {
        'Origin': window.location.origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type, authorization',
      },
    });

    const allowOrigin = response.headers.get('access-control-allow-origin');
    const allowMethods = response.headers.get('access-control-allow-methods');
    const allowHeaders = response.headers.get('access-control-allow-headers');

    if (allowOrigin && allowMethods) {
      const corsConfigured = allowOrigin === '*' || allowOrigin.includes(window.location.origin);

      return {
        test: 'CORS Configuration',
        status: corsConfigured ? 'success' : 'warning',
        message: corsConfigured
          ? 'CORS headers are properly configured'
          : 'CORS headers present but may not allow this origin',
        details: {
          'Access-Control-Allow-Origin': allowOrigin,
          'Access-Control-Allow-Methods': allowMethods,
          'Access-Control-Allow-Headers': allowHeaders,
          'currentOrigin': window.location.origin,
        },
        recommendations: corsConfigured
          ? []
          : [
              '⚠️ CORS headers may not allow your origin',
              `💡 Backend should have: Access-Control-Allow-Origin: ${window.location.origin} or *`,
              '💡 During development, Vite proxy should bypass this issue',
            ],
      };
    } else {
      return {
        test: 'CORS Configuration',
        status: 'error',
        message: 'CORS headers not found - backend may not have CORS configured',
        details: {
          'Access-Control-Allow-Origin': allowOrigin || 'NOT SET',
          'Access-Control-Allow-Methods': allowMethods || 'NOT SET',
        },
        recommendations: [
          '❌ Backend is missing CORS headers',
          '💡 Add to backend: header("Access-Control-Allow-Origin: *");',
          '💡 Add to backend: header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");',
          '💡 Add to backend: header("Access-Control-Allow-Headers: Content-Type, Authorization");',
          '💡 For development, Vite proxy will bypass this',
        ],
      };
    }
  } catch (error) {
    return {
      test: 'CORS Configuration',
      status: 'error',
      message: 'Could not test CORS - connection failed',
      details: { error: error instanceof Error ? error.message : String(error) },
      recommendations: [
        '❌ Cannot reach backend to test CORS',
        '💡 Check if API is accessible',
        '💡 Verify firewall allows outbound HTTPS',
      ],
    };
  }
}

/**
 * Test connection to development proxy
 */
export async function testDevProxyConnectivity(
  proxyUrl: string = '/api?action=health'
): Promise<NetworkDiagnostic> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(proxyUrl, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return {
        test: 'Dev Proxy Connectivity',
        status: 'success',
        message: 'Development proxy is working',
        details: { status: response.status },
      };
    } else {
      return {
        test: 'Dev Proxy Connectivity',
        status: 'warning',
        message: `Dev proxy returned HTTP ${response.status}`,
        details: { status: response.status },
      };
    }
  } catch (error) {
    return {
      test: 'Dev Proxy Connectivity',
      status: 'error',
      message: 'Dev proxy is not responding',
      details: { error: error instanceof Error ? error.message : String(error) },
      recommendations: [
        '❌ Vite dev server proxy is not working',
        '💡 Ensure npm run dev is running',
        '💡 Check that dev server is on http://localhost:8080',
        '💡 Restart dev server: npm run dev',
      ],
    };
  }
}

/**
 * Run all network diagnostics
 */
export async function runFullNetworkDiagnostics(
  apiUrl?: string
): Promise<NetworkDiagnostic[]> {
  const url = apiUrl || getClientApiUrl();
  console.log('🔧 Running full network diagnostics...\n');

  const results: NetworkDiagnostic[] = [];

  // Test DNS resolution first
  results.push(await testDNSResolution());

  // Test direct connectivity
  results.push(await testDirectConnectivity(url));

  // Test CORS
  results.push(await testCORSConfiguration(url));

  // Test proxy detection
  results.push(await testProxyDetection(url));

  // Test dev proxy (if in development)
  if (import.meta.env.DEV) {
    results.push(await testDevProxyConnectivity());
  }

  return results;
}

/**
 * Generate detailed troubleshooting report
 */
export function generateNetworkDiagnosticReport(results: NetworkDiagnostic[]): string {
  let report = '\n╔════════════════════════════════════════════════════════════╗\n';
  report += '║           NETWORK DIAGNOSTIC REPORT                          ║\n';
  report += '║         helixgeneralhardware.com Connectivity              ║\n';
  report += '╚════════════════════════════════════════════════════════════╝\n\n';

  const errors = results.filter((r) => r.status === 'error');
  const warnings = results.filter((r) => r.status === 'warning');
  const successes = results.filter((r) => r.status === 'success');

  // Summary
  report += `📊 SUMMARY\n`;
  report += `   ✅ Passing: ${successes.length}\n`;
  report += `   ⚠️  Warnings: ${warnings.length}\n`;
  report += `   ❌ Errors: ${errors.length}\n\n`;

  // Detailed results
  report += `📋 DETAILED RESULTS\n`;
  report += '─'.repeat(60) + '\n\n';

  for (const result of results) {
    const icon =
      result.status === 'success'
        ? '✅'
        : result.status === 'warning'
        ? '⚠️'
        : result.status === 'error'
        ? '❌'
        : 'ℹ️';

    report += `${icon} ${result.test}\n`;
    report += `   Status: ${result.status.toUpperCase()}\n`;
    report += `   Message: ${result.message}\n`;

    if (result.details && Object.keys(result.details).length > 0) {
      report += `   Details:\n`;
      for (const [key, value] of Object.entries(result.details)) {
        report += `      • ${key}: ${JSON.stringify(value)}\n`;
      }
    }

    if (result.recommendations && result.recommendations.length > 0) {
      report += `   Recommendations:\n`;
      for (const rec of result.recommendations) {
        report += `      ${rec}\n`;
      }
    }

    report += '\n';
  }

  // Troubleshooting guide
  if (errors.length > 0) {
    report += `\n🔧 TROUBLESHOOTING GUIDE\n`;
    report += '─'.repeat(60) + '\n\n';

    const dnsError = errors.find((e) => e.test === 'DNS Resolution');
    const connectError = errors.find((e) => e.test === 'Direct Connectivity');
    const corsError = errors.find((e) => e.test === 'CORS Configuration');

    if (dnsError) {
      report += `🔴 DNS Issue Detected\n`;
      report += `   1. Check your DNS settings\n`;
      report += `   2. Flush DNS cache: ipconfig /flushdns (Windows) or sudo dscacheutil -flushcache (Mac)\n`;
      report += `   3. Try using public DNS: 8.8.8.8 or 1.1.1.1\n`;
      report += `   4. Verify domain helixgeneralhardware.com is correct\n\n`;
    }

    if (connectError) {
      report += `🔴 Connection Issue Detected\n`;
      report += `   1. Check if firewall allows HTTPS (port 443) to helixgeneralhardware.com\n`;
      report += `   2. If on corporate network, check with IT about proxy settings\n`;
      report += `   3. Verify internet connection is active\n`;
      report += `   4. Try connecting from different network (mobile hotspot) to isolate issue\n`;
      report += `   5. Check server status: is helixgeneralhardware.com online?\n\n`;
    }

    if (corsError && !connectError) {
      report += `🟡 CORS Issue Detected (But API is reachable)\n`;
      report += `   1. Frontend can reach backend but CORS headers are missing\n`;
      report += `   2. In production, backend must have CORS headers configured\n`;
      report += `   3. In development, Vite proxy should bypass this\n`;
      report += `   4. If still failing, restart dev server: npm run dev\n\n`;
    }
  }

  report += '═'.repeat(60) + '\n';
  report += `Generated: ${new Date().toLocaleString()}\n`;
  report += '═'.repeat(60) + '\n';

  return report;
}
