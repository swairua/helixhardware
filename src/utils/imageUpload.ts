/**
 * Upload image to /public/products directory
 * This utility handles local file uploads to the server
 */

export interface UploadResult {
  success: boolean;
  path?: string;
  url?: string;
  error?: string;
}

/**
 * Upload an image file to /public/products
 * Returns a public URL path to the image
 */
export const uploadProductImage = async (
  file: File,
  folder: 'categories' | 'products' = 'products'
): Promise<UploadResult> => {
  try {
    // Validate file
    if (!file || !file.type.startsWith('image/')) {
      return {
        success: false,
        error: 'Please select a valid image file'
      };
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'Image size must be less than 5MB'
      };
    }

    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    // Upload to server
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `Upload failed with status ${response.status}`
      };
    }

    // Defensively parse JSON for successful response
    const data = await response.json().catch(() => {
      throw new Error('Invalid response from server: Expected valid JSON');
    });

    return {
      success: true,
      path: data.path,
      url: data.url
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      error: `Upload error: ${errorMessage}`
    };
  }
};

/**
 * Delete an image from /public/products
 */
export const deleteProductImage = async (imagePath: string): Promise<UploadResult> => {
  try {
    const response = await fetch('/api/delete-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path: imagePath }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `Delete failed with status ${response.status}`
      };
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      error: `Delete error: ${errorMessage}`
    };
  }
};
