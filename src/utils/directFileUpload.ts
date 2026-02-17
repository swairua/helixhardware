/**
 * Direct File Upload Handler
 * Uploads files via external API (intelligently chooses /api.php or full URL)
 * Replaces Supabase storage which is not available with external API
 */

import { getClientApiUrl, getUploadBaseUrl } from './getApiUrl';

export interface UploadOptions {
  table?: string;
  recordId?: string;
  onProgress?: (progress: number) => void;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
  message?: string;
}

/**
 * Upload a file directly to the server
 */
export async function uploadFile(
  file: File,
  options?: UploadOptions
): Promise<UploadResult> {
  try {
    // Validate file
    if (!file || file.size === 0) {
      return {
        success: false,
        error: 'File is empty or invalid'
      };
    }

    // Check file size (limit to 10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return {
        success: false,
        error: 'File size exceeds 10MB limit'
      };
    }

    // Create FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('table', options?.table || 'general');
    formData.append('record_id', options?.recordId || '');

    // Get API URL (uses smart detection: /api.php for prod, full URL for dev)
    const apiUrl = getClientApiUrl();
    const uploadBaseUrl = getUploadBaseUrl();

    // Upload to API
    const response = await fetch(`${apiUrl}?action=upload_file`, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type header - browser will set it with boundary
        'Authorization': `Bearer ${localStorage.getItem('med_api_token') || ''}`
      }
    });

    // Log response details
    console.log('📡 Upload response - status:', response.status, 'statusText:', response.statusText);
    console.log('📡 Response headers:', {
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length')
    });

    if (!response.ok) {
      console.error('❌ HTTP error response - status:', response.status);
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Error data:', errorData);
      return {
        success: false,
        error: errorData.message || `Upload failed with status ${response.status}`
      };
    }

    // Get raw response text before parsing
    const responseText = await response.text();
    console.log('📡 Raw response text:', responseText.substring(0, 500));

    // Parse JSON with detailed error logging
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('📡 Parsed JSON response:', data);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError instanceof Error ? parseError.message : String(parseError));
      console.error('❌ Full response was:', responseText);
      throw new Error('Invalid response from server: Expected valid JSON');
    }

    if (data.status === 'success') {
      console.log('✅ Upload successful, URL:', data.url || `${uploadBaseUrl}/${data.path}`);
      return {
        success: true,
        url: data.url || `${uploadBaseUrl}/${data.path}`,
        path: data.path,
        message: 'File uploaded successfully'
      };
    } else {
      console.error('❌ Server returned non-success status:', data.status);
      console.error('❌ Error message:', data.message);
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
 * Upload image file (with validation)
 */
export async function uploadImage(
  file: File,
  options?: UploadOptions
): Promise<UploadResult> {
  // Validate image
  const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!validImageTypes.includes(file.type)) {
    return {
      success: false,
      error: 'Invalid image format. Supported: JPEG, PNG, GIF, WebP'
    };
  }

  // Limit image size to 5MB
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_IMAGE_SIZE) {
    return {
      success: false,
      error: 'Image size exceeds 5MB limit'
    };
  }

  return uploadFile(file, { ...options, table: 'images' });
}

/**
 * Upload document file (PDF, DOC, etc)
 */
export async function uploadDocument(
  file: File,
  options?: UploadOptions
): Promise<UploadResult> {
  const validDocTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ];

  if (!validDocTypes.includes(file.type)) {
    return {
      success: false,
      error: 'Invalid document format. Supported: PDF, DOC, XLS, TXT, CSV'
    };
  }

  return uploadFile(file, { ...options, table: 'documents' });
}

/**
 * Get public URL for uploaded file
 */
export function getPublicUrl(path: string): string {
  if (path.startsWith('http')) {
    return path;
  }
  const uploadBaseUrl = getUploadBaseUrl();
  return `${uploadBaseUrl}/${path}`;
}

/**
 * Delete uploaded file (server-side - requires token)
 */
export async function deleteFile(path: string): Promise<UploadResult> {
  try {
    // Use centralized API URL resolver
    const apiUrl = getClientApiUrl();
    const response = await fetch(`${apiUrl}?action=delete_file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('med_api_token') || ''}`
      },
      body: JSON.stringify({ path })
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
