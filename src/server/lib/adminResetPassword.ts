/**
 * Admin Reset Password - External API Version
 * Uses configured API endpoint for password reset operations
 */

import { getServerApiUrl } from '../../utils/getApiUrl';

interface ResetPasswordRequest {
  email: string;
  user_id: string;
  admin_id: string;
  redirectUrl?: string;
}

interface ResetPasswordResponse {
  success: boolean;
  error?: string;
}

/**
 * Sends a password reset email via external API
 * This function calls the configured API endpoint with the admin_reset_password action
 *
 * @param request - Password reset request with email, user_id, admin_id
 * @param apiUrl - External API URL (optional, defaults to configured API endpoint)
 * @param authToken - Admin authentication token for the API
 * @returns Response with success status or error message
 */
export async function adminResetPassword(
  request: ResetPasswordRequest,
  apiUrl?: string,
  authToken?: string
): Promise<ResetPasswordResponse> {
  const url = apiUrl || getServerApiUrl();
  // Validate required fields
  if (!request.email || !request.user_id || !request.admin_id) {
    return {
      success: false,
      error: 'Missing required fields: email, user_id, admin_id'
    };
  }

  try {
    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    // Call external API to reset password
    const response = await fetch(`${url}?action=admin_reset_password`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email: request.email,
        user_id: request.user_id,
        admin_id: request.admin_id,
        redirectUrl: request.redirectUrl || null
      })
    });

    // Defensively parse JSON
    const result = await response.json().catch(() => {
      if (!response.ok) {
        throw new Error(`Server error: HTTP ${response.status}. Failed to reset password.`);
      }
      throw new Error('Invalid response from server: Expected valid JSON');
    });

    if (!response.ok || result.status === 'error') {
      console.error('API password reset error:', result);
      return {
        success: false,
        error: result.message || `API error: ${response.status}`
      };
    }

    if (result.success) {
      return {
        success: true
      };
    }

    return {
      success: false,
      error: result.message || 'Failed to reset password'
    };
  } catch (error) {
    console.error('Password reset error:', error);
    return {
      success: false,
      error: `Error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
