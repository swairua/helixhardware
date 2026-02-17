/**
 * Fallback Logo Upload & Management Utility
 * Handles uploading, retrieving, and deleting the global fallback logo
 * The fallback logo resides in the public folder as `/fallback-logo.png`
 */

export interface FallbackLogoResult {
  success: boolean;
  path?: string;
  error?: string;
  message?: string;
}

const API_URL = '/api';
const FALLBACK_LOGO_PATH = '/fallback-logo.png';

/**
 * Check if the fallback logo exists
 */
export async function checkFallbackLogoExists(): Promise<boolean> {
  try {
    // Try to fetch the image with a HEAD request to check if it exists
    const response = await fetch(FALLBACK_LOGO_PATH, {
      method: 'HEAD'
    });
    return response.ok;
  } catch {
    // If fetch fails, try loading it as an image to verify it exists
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = `${FALLBACK_LOGO_PATH}?t=${Date.now()}`; // Add cache buster
    });
  }
}

/**
 * Upload a new fallback logo
 * Replaces the existing `/fallback-logo.png` file
 */
export async function uploadFallbackLogo(file: File): Promise<FallbackLogoResult> {
  try {
    // Validate file
    if (!file || file.size === 0) {
      return {
        success: false,
        error: 'File is empty or invalid'
      };
    }

    // Validate image type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Invalid image format. Supported: PNG, JPG, GIF, WebP'
      };
    }

    // Validate file size (limit to 5MB, same as company logo)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return {
        success: false,
        error: `File size exceeds 5MB limit. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB`
      };
    }

    // Create FormData
    const formData = new FormData();
    formData.append('file', file);

    // Upload to API endpoint
    const response = await fetch(`${API_URL}?action=upload_fallback_logo`, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type header - browser will set it with boundary
        'Authorization': `Bearer ${localStorage.getItem('med_api_token') || ''}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `Upload failed with status ${response.status}`
      };
    }

    // Parse response
    const data = await response.json().catch(() => {
      throw new Error('Invalid response from server: Expected valid JSON');
    });

    if (data.status === 'success') {
      return {
        success: true,
        path: FALLBACK_LOGO_PATH,
        message: 'Fallback logo uploaded successfully'
      };
    } else {
      return {
        success: false,
        error: data.message || 'Upload failed'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error'
    };
  }
}

/**
 * Delete the fallback logo
 */
export async function deleteFallbackLogo(): Promise<FallbackLogoResult> {
  try {
    const response = await fetch(`${API_URL}?action=delete_fallback_logo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('med_api_token') || ''}`
      },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Delete failed with status ${response.status}`
      };
    }

    const data = await response.json();
    return {
      success: data.status === 'success',
      message: data.message,
      error: data.message && data.status !== 'success' ? data.message : undefined
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed'
    };
  }
}

/**
 * Get the fallback logo URL with cache busting
 */
export function getFallbackLogoUrl(): string {
  return `${FALLBACK_LOGO_PATH}?t=${Date.now()}`;
}
