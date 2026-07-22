type HostingType = 'apache' | 'cloud';

interface EnvironmentConfig {
  apiBaseUrl: string;
  isLocal: boolean;
  hostingType: HostingType;
  hostname: string;
  protocol: string;
  port: string;
}

function isPrivateIP(hostname: string): boolean {
  const parts = hostname.split('.');
  if (parts.length !== 4 || !parts.every((part) => /^\d+$/.test(part))) return false;

  const [a, b] = parts.map(Number);
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a === 127 || a === 0;
}

function detectLocalHosting(): boolean {
  if (typeof window === 'undefined') return false;

  const { hostname } = window.location;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname === '::1' || hostname.endsWith('.local') || isPrivateIP(hostname);
}

function getEnvironmentConfig(): EnvironmentConfig {
  const isLocal = detectLocalHosting();

  return {
    apiBaseUrl: '/api.php',
    isLocal,
    hostingType: isLocal ? 'apache' : 'cloud',
    hostname: typeof window === 'undefined' ? 'unknown' : window.location.hostname,
    protocol: typeof window === 'undefined' ? 'https:' : window.location.protocol,
    port: typeof window === 'undefined' ? '' : window.location.port,
  };
}

export function isLocalHosting(): boolean {
  return getEnvironmentConfig().isLocal;
}

export function getHostingType(): HostingType {
  return getEnvironmentConfig().hostingType;
}

export function getAPIBaseURL(): string {
  return '/api.php';
}

export function logEnvironmentConfig(): void {
  console.log('API requests use the same-origin endpoint:', getEnvironmentConfig());
}
