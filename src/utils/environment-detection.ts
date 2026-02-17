/**
 * Environment Detection Module
 * Automatically detects hosting environment (local/Apache vs. cloud) and configures API routing accordingly
 */

type HostingType = 'apache' | 'cloud';

interface EnvironmentConfig {
  apiBaseUrl: string;
  isLocal: boolean;
  hostingType: HostingType;
  hostname: string;
  protocol: string;
  port: string;
}

/**
 * Check if a hostname is a private/local IP address
 */
function isPrivateIP(hostname: string): boolean {
  // IPv4 private ranges:
  // - 10.0.0.0/8 (10.0.0.0 - 10.255.255.255)
  // - 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
  // - 192.168.0.0/16 (192.168.0.0 - 192.168.255.255)
  // - 127.0.0.0/8 (localhost)

  const parts = hostname.split('.');

  // Check for IPv4 format
  if (parts.length === 4 && parts.every((part) => /^\d+$/.test(part))) {
    const [a, b, c, d] = parts.map(Number);

    // 10.x.x.x
    if (a === 10) return true;

    // 172.16-31.x.x
    if (a === 172 && b >= 16 && b <= 31) return true;

    // 192.168.x.x
    if (a === 192 && b === 168) return true;

    // 127.x.x.x (loopback)
    if (a === 127) return true;

    // 0.0.0.0/8
    if (a === 0) return true;
  }

  return false;
}

/**
 * Check if a hostname is localhost or loopback
 */
function isLocalhost(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname === '::1' ||
    hostname.startsWith('localhost:')
  );
}

/**
 * Check if a hostname is a .local domain (common for local networks)
 */
function isLocalDomain(hostname: string): boolean {
  return hostname.endsWith('.local');
}

/**
 * Determine if the current environment is local/Apache-based or cloud-based
 */
function detectLocalHosting(): boolean {
  // If running in SSR context (no window), assume cloud
  if (typeof window === 'undefined') {
    return false;
  }

  const hostname = window.location.hostname;

  return isLocalhost(hostname) || isPrivateIP(hostname) || isLocalDomain(hostname);
}

/**
 * Get the API base URL based on environment detection
 *
 * Priority order:
 * 1. Explicit VITE_EXTERNAL_API_URL environment variable (if set at build time)
 * 2. Production builds: use relative /api.php (works on any domain)
 * 3. Development mode: auto-detect based on hostname
 */
function getAPIBaseURLInternal(): string {
  console.log('[ENV_DETECT] 🔵 getAPIBaseURLInternal called');
  console.log('[ENV_DETECT] Build mode - PROD:', import.meta.env.PROD, 'DEV:', import.meta.env.DEV);
  console.log('[ENV_DETECT] typeof window:', typeof window);

  // If running in SSR context, require explicit config
  if (typeof window === 'undefined') {
    console.log('[ENV_DETECT] SSR context detected');
    const envUrl = import.meta.env.VITE_EXTERNAL_API_URL;
    console.log('[ENV_DETECT] VITE_EXTERNAL_API_URL in SSR:', envUrl);
    if (!envUrl) {
      throw new Error('VITE_EXTERNAL_API_URL is required for non-browser environments');
    }
    return ensureApiPhpSuffix(envUrl);
  }

  console.log('[ENV_DETECT] Browser context detected');

  // Priority 1: Explicit environment variable (overrides all auto-detection)
  const explicitUrl = import.meta.env.VITE_EXTERNAL_API_URL;
  if (explicitUrl) {
    console.log('[ENV_DETECT] ✅ Using explicit VITE_EXTERNAL_API_URL:', explicitUrl);
    return ensureApiPhpSuffix(explicitUrl);
  }

  // Priority 2: Production build - use relative /api.php (works on any domain)
  if (import.meta.env.PROD) {
    console.log('[ENV_DETECT] 🏭 Production build detected - using relative /api.php');
    console.log('[ENV_DETECT] 📍 Current domain: ', window.location.hostname);
    console.log('[ENV_DETECT] ℹ️  API will be called at:', window.location.origin + '/api.php');
    return '/api.php';
  }

  // Priority 3: Development mode - auto-detect based on hostname
  console.log('[ENV_DETECT] 🔧 Development mode detected - auto-detecting...');
  const isLocal = detectLocalHosting();
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = window.location.port ? `:${window.location.port}` : '';

  console.log('[ENV_DETECT] Hostname:', hostname);
  console.log('[ENV_DETECT] Protocol:', protocol);
  console.log('[ENV_DETECT] Port:', port || '(default)');
  console.log('[ENV_DETECT] isLocal:', isLocal);

  if (isLocal) {
    // Local/Apache mode: use /api.php endpoint at root
    const localUrl = `${protocol}//${hostname}${port}/api.php`;
    console.log('[ENV_DETECT] 🏠 Local hosting detected - using /api.php endpoint:', localUrl);
    return localUrl;
  }

  // Cloud hostname in development mode: require explicit env var
  const errorMsg = `
🚨 Development mode with cloud hostname (${hostname}) detected!

To fix this, you have two options:

Option A (Recommended): Set the API URL when building for production
  VITE_EXTERNAL_API_URL=https://your-domain.com npm run build
  Then the app will use relative /api.php when deployed.

Option B: Set VITE_EXTERNAL_API_URL in .env file or when running dev server
  VITE_EXTERNAL_API_URL=https://api.example.com npm run dev

For local development: Use localhost or a private IP (192.168.x.x, 10.x.x.x, etc)
  `;
  console.error('[ENV_DETECT] ❌ Error:', errorMsg);
  throw new Error(errorMsg);
}

/**
 * Ensure API URL ends with /api.php
 */
function ensureApiPhpSuffix(url: string): string {
  if (url.includes('/api.php')) {
    return url;
  }
  // Remove trailing slash if present
  const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  return `${cleanUrl}/api.php`;
}

/**
 * Get complete environment configuration
 */
function getEnvironmentConfig(): EnvironmentConfig {
  const apiBaseUrl = getAPIBaseURLInternal();
  const isLocal = detectLocalHosting();
  const hostingType: HostingType = isLocal ? 'apache' : 'cloud';
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'https:';
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'unknown';
  const port = typeof window !== 'undefined' && window.location.port ? window.location.port : '';

  return {
    apiBaseUrl,
    isLocal,
    hostingType,
    hostname,
    protocol,
    port,
  };
}

/**
 * Check if current deployment is local/Apache hosting
 */
export function isLocalHosting(): boolean {
  try {
    const config = getEnvironmentConfig();
    return config.isLocal;
  } catch (error) {
    // If error (likely cloud without explicit config), it's not local
    return false;
  }
}

/**
 * Get the hosting type
 */
export function getHostingType(): HostingType {
  try {
    const config = getEnvironmentConfig();
    return config.hostingType;
  } catch (error) {
    // Default to cloud if error
    return 'cloud';
  }
}

/**
 * Get the API base URL for the current environment
 * This is the main export used by the database adapter
 */
export function getAPIBaseURL(): string {
  return getAPIBaseURLInternal();
}

/**
 * Log environment detection info (useful for debugging)
 */
export function logEnvironmentConfig(): void {
  if (typeof window === 'undefined') {
    console.log('📍 Environment detection: SSR mode');
    return;
  }

  const config = getEnvironmentConfig();
  const buildMode = import.meta.env.PROD ? 'Production' : 'Development';
  console.log('📍 Environment Configuration:', {
    buildMode,
    apiBaseUrl: config.apiBaseUrl,
    isLocal: config.isLocal,
    hostingType: config.hostingType,
    hostname: config.hostname,
    protocol: config.protocol,
    port: config.port || '(default)',
  });
}
