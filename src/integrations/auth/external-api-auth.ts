/**
 * External API Authentication Handler
 * Manages JWT token-based authentication with smart URL resolution
 */

import { getClientApiUrl } from '@/utils/getApiUrl';

export interface AuthToken {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
  expiresAt: number;
}

class ExternalAPIAuthHandler {
  private apiUrl: string;
  private fetchUrl: string;
  private tokenKey = 'med_api_token';
  private userKey = 'med_api_user_id';

  constructor(apiUrl?: string) {
    // Use provided URL or fall back to smart detection
    this.apiUrl = apiUrl || getClientApiUrl();

    // Always use the direct URL (no proxy) for consistency across all environments
    this.fetchUrl = this.apiUrl.includes('/api.php') ? this.apiUrl : this.apiUrl + '/api.php';
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<{ token?: string; user?: any; error?: Error }> {
    try {
      const response = await fetch(`${this.fetchUrl}?action=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      // Defensively parse JSON - if response is not ok or invalid JSON, handle gracefully
      const result = await response.json().catch(() => {
        // If JSON parsing fails and response is not ok, server likely returned error page
        if (!response.ok) {
          throw new Error(`Server error: HTTP ${response.status}. The API server may be experiencing issues.`);
        }
        // If response is ok but JSON parsing failed, that's also an error
        throw new Error('Invalid response from server: Expected valid JSON');
      });

      if (!response.ok || result.status === 'error') {
        return { error: new Error(result.message || 'Login failed') };
      }

      const token = result.token;
      const user = result.user;

      if (token && user) {
        // Store token and user info - match the format used by external-api-adapter
        localStorage.setItem(this.tokenKey, token);
        localStorage.setItem(this.userKey, user.id);
        localStorage.setItem('med_api_user_email', email);

        return { token, user };
      }

      return { error: new Error('No token received') };
    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * Logout - clear stored credentials
   */
  async logout(): Promise<{ error?: Error }> {
    try {
      // Notify backend about logout (optional, for logging)
      const token = this.getToken();
      if (token) {
        await fetch(`${this.fetchUrl}?action=logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }).catch(() => {
          // Ignore errors during logout notification
        });
      }

      // Clear local storage - remove all auth-related keys
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
      localStorage.removeItem('med_api_user_email');

      return {};
    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * Get stored auth token
   */
  getToken(): string | null {
    try {
      const token = localStorage.getItem(this.tokenKey);
      if (!token) return null;

      // Token is stored as plain string, no expiration metadata
      return token;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get stored user info
   */
  getUser(): any {
    try {
      const userId = localStorage.getItem(this.userKey);
      const email = localStorage.getItem('med_api_user_email');
      if (userId) {
        return { id: userId, email: email || '' };
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Verify token with server
   */
  async verifyToken(): Promise<{ valid: boolean; user?: any; error?: Error }> {
    const token = this.getToken();
    if (!token) {
      return { valid: false, error: new Error('No token found') };
    }

    try {
      const response = await fetch(`${this.fetchUrl}?action=check_auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token }),
      });

      // Defensively parse JSON
      const result = await response.json().catch(() => {
        if (!response.ok) {
          throw new Error(`Server error: HTTP ${response.status}. Token verification failed.`);
        }
        throw new Error('Invalid response from server: Expected valid JSON');
      });

      if (!response.ok || result.status === 'error') {
        // Token is invalid, clear it
        this.logout().catch(() => {});
        return { valid: false, error: new Error(result.message || 'Token verification failed') };
      }

      return { valid: true, user: result };
    } catch (error) {
      return { valid: false, error: error as Error };
    }
  }

  /**
   * Create user (admin only)
   */
  async createUser(userData: {
    email: string;
    password: string;
    role: string;
    full_name?: string;
    phone?: string;
    department?: string;
    position?: string;
  }): Promise<{ user?: any; error?: Error }> {
    const token = this.getToken();
    if (!token) {
      return { error: new Error('Not authenticated') };
    }

    try {
      const response = await fetch(`${this.fetchUrl}?action=create&table=users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });

      // Defensively parse JSON
      const result = await response.json().catch(() => {
        if (!response.ok) {
          throw new Error(`Server error: HTTP ${response.status}. User creation failed.`);
        }
        throw new Error('Invalid response from server: Expected valid JSON');
      });

      if (!response.ok || result.status === 'error') {
        return { error: new Error(result.message || 'User creation failed') };
      }

      return { user: result.data };
    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * Reset password (admin only)
   */
  async resetPassword(email: string, newPassword: string): Promise<{ error?: Error }> {
    const token = this.getToken();
    if (!token) {
      return { error: new Error('Not authenticated') };
    }

    try {
      const response = await fetch(`${this.fetchUrl}?action=update&table=users`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email,
          password: newPassword,
        }),
      });

      // Defensively parse JSON
      const result = await response.json().catch(() => {
        if (!response.ok) {
          throw new Error(`Server error: HTTP ${response.status}. Password reset failed.`);
        }
        throw new Error('Invalid response from server: Expected valid JSON');
      });

      if (!response.ok || result.status === 'error') {
        return { error: new Error(result.message || 'Password reset failed') };
      }

      return {};
    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * Setup initial admin user
   */
  async setupAdmin(email: string, password: string): Promise<{ user?: any; error?: Error }> {
    try {
      const response = await fetch(`${this.fetchUrl}?action=setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      // Defensively parse JSON
      const result = await response.json().catch(() => {
        if (!response.ok) {
          throw new Error(`Server error: HTTP ${response.status}. Admin setup failed.`);
        }
        throw new Error('Invalid response from server: Expected valid JSON');
      });

      if (!response.ok || result.status === 'error') {
        return { error: new Error(result.message || 'Admin setup failed') };
      }

      return { user: result };
    } catch (error) {
      return { error: error as Error };
    }
  }
}

// Export singleton instance
export const externalApiAuth = new ExternalAPIAuthHandler();

/**
 * Convenience functions for use in components/hooks
 */
export function useExternalApiAuth() {
  return {
    login: (email: string, password: string) => externalApiAuth.login(email, password),
    logout: () => externalApiAuth.logout(),
    getToken: () => externalApiAuth.getToken(),
    getUser: () => externalApiAuth.getUser(),
    isAuthenticated: () => externalApiAuth.isAuthenticated(),
    verifyToken: () => externalApiAuth.verifyToken(),
  };
}
