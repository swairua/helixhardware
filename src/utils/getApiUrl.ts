export function getClientApiUrl(): string {
  return '/api.php';
}

export function getServerApiUrl(): string {
  return '/api.php';
}

export function getUploadBaseUrl(): string {
  return '';
}

export function getApiEndpoint(action: string, baseUrl?: string): string {
  const apiUrl = baseUrl || (typeof window !== 'undefined' ? getClientApiUrl() : getServerApiUrl());
  const separator = apiUrl.includes('?') ? '&' : '?';
  return `${apiUrl}${separator}action=${action}`;
}
