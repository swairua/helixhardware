/**
 * Logo Upload Utilities
 * Handles URL validation, sanitization, and error messages for logo uploads
 */

/**
 * Check if a URL is a valid HTTP/HTTPS URL (not a data URL)
 */
export function isValidHttpUrl(url: string): boolean {
  if (!url) return false;
  
  // Reject data URLs and blob URLs
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return false;
  }
  
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    // If it's a relative path, check if it looks valid
    return url.startsWith('/') && !url.includes('data:');
  }
}

/**
 * Sanitize a logo URL by removing query parameters for caching
 */
export function sanitizeLogoUrl(url: string): string {
  if (!url) return '';
  
  // Remove existing cache-busting parameters
  return url.split('?')[0];
}

/**
 * Add cache-busting parameter to a URL
 */
export function addCacheBustingParam(url: string): string {
  if (!url) return '';
  
  const cleanUrl = sanitizeLogoUrl(url);
  return `${cleanUrl}?t=${Date.now()}`;
}

/**
 * Validate logo URL format and safety
 */
export function validateLogoUrl(url: string): { valid: boolean; error?: string } {
  if (!url) {
    return { valid: false, error: 'URL is empty' };
  }
  
  // Check for data URLs (corrupted uploads)
  if (url.startsWith('data:')) {
    return { 
      valid: false, 
      error: 'Invalid logo URL format. This appears to be a corrupted upload. Please re-upload your logo.' 
    };
  }
  
  // Check for blob URLs
  if (url.startsWith('blob:')) {
    return { 
      valid: false, 
      error: 'Temporary URL detected. Please upload your logo again.' 
    };
  }
  
  // Check if URL is properly formatted
  if (!isValidHttpUrl(url)) {
    return { 
      valid: false, 
      error: 'Invalid URL format. URL must be a valid HTTP/HTTPS link.' 
    };
  }
  
  // Check URL length (reasonable limit)
  if (url.length > 2048) {
    return { 
      valid: false, 
      error: 'URL is too long. This suggests a corrupted upload.' 
    };
  }
  
  return { valid: true };
}

/**
 * Get detailed error message for logo upload issues
 */
export function getLogoUploadErrorMessage(error: any): string {
  if (!error) return 'An unknown error occurred during logo upload.';
  
  const message = error instanceof Error ? error.message : String(error);
  
  if (message.includes('CORS')) {
    return 'Unable to reach the upload server. This is a CORS configuration issue. Please contact your administrator.';
  }
  
  if (message.includes('timeout') || message.includes('Timeout')) {
    return 'Upload took too long. Please check your internet connection and try again.';
  }
  
  if (message.includes('Failed to fetch')) {
    return 'Cannot reach the upload server. Please check your internet connection.';
  }
  
  if (message.includes('Invalid response')) {
    return 'The server returned an invalid response. The upload may have failed. Please try again.';
  }
  
  if (message.includes('No file URL')) {
    return 'The server did not return a valid file URL. Please try uploading again.';
  }
  
  return message;
}

/**
 * Extract filename from URL
 */
export function getFilenameFromUrl(url: string): string {
  try {
    const cleanUrl = sanitizeLogoUrl(url);
    const parts = cleanUrl.split('/');
    return parts[parts.length - 1] || 'logo';
  } catch {
    return 'logo';
  }
}
