/**
 * Centralized API URL Resolution
 * 
 * Smart URL selection based on build mode and environment:
 * - Production build: Uses relative /api.php (works on any domain)
 * - Development with env var: Uses explicit VITE_EXTERNAL_API_URL
 * - Development local: Uses /api.php at current hostname
 * 
 * This ensures:
 * - Local builds upload to any domain without config
 * - Dev servers can point to any API
 * - Production builds are portable
 */

/**
 * Get API URL for client-side (browser) code
 * Uses intelligent detection: relative URL for prod, full URL for dev
 */
export function getClientApiUrl(): string {
  // If explicit env var is set, use it (highest priority)
  const explicitUrl = import.meta.env.VITE_EXTERNAL_API_URL;
  if (explicitUrl) {
    return ensureApiPhpSuffix(explicitUrl);
  }

  // Production build: use relative /api.php (works on any domain)
  if (import.meta.env.PROD) {
    return '/api.php';
  }

  // Development mode: use full URL from getAPIBaseURL() from environment detection
  // This is already handled by src/utils/environment-detection.ts
  // This function is just for explicit usage when needed
  const fullUrl = typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}/api.php`
    : 'https://helixgeneralhardware.com/api.php'; // Fallback for SSR
  
  return fullUrl;
}

/**
 * Get API URL for server-side code (Node.js backend)
 * Uses environment variables or fallback to relative /api.php
 */
export function getServerApiUrl(): string {
  // Priority 1: Explicit environment variable
  const envUrl = process.env.VITE_EXTERNAL_API_URL;
  if (envUrl) {
    return ensureApiPhpSuffix(envUrl);
  }

  // Priority 2: For server-side, fall back to production URL
  // (Server can't auto-detect from request, so we use sensible default)
  return '/api.php';
}

/**
 * Get upload base URL (without the /api.php endpoint)
 * Used for constructing file URLs
 */
export function getUploadBaseUrl(): string {
  const apiUrl = typeof window !== 'undefined' 
    ? getClientApiUrl()
    : getServerApiUrl();
  
  // Remove /api.php suffix to get base URL
  return apiUrl.replace(/\/api\.php$/, '');
}

/**
 * Ensure a URL ends with /api.php
 */
function ensureApiPhpSuffix(url: string): string {
  if (url.includes('/api.php')) {
    return url;
  }
  const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  return `${cleanUrl}/api.php`;
}

/**
 * Get API URL with optional action parameter
 * Useful for constructing complete API endpoints
 */
export function getApiEndpoint(action: string, baseUrl?: string): string {
  const apiUrl = baseUrl || (typeof window !== 'undefined' ? getClientApiUrl() : getServerApiUrl());
  const separator = apiUrl.includes('?') ? '&' : '?';
  return `${apiUrl}${separator}action=${action}`;
}
