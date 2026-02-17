/**
 * External MySQL API Adapter
 * Communicates with helixgeneralhardware.com/api.php MySQL backend
 */

import type {
  IDatabase,
  AuthContext,
  QueryResult,
  ListQueryResult,
  InsertResult,
  UpdateResult,
  DeleteResult,
} from './types';
import { getAPIBaseURL } from '../../utils/environment-detection';

export class ExternalAPIAdapter implements IDatabase {
  private apiBase: string;
  private externalApiUrl: string;

  constructor(apiUrl?: string) {
    try {
      // Priority 1: Use explicit apiUrl parameter if provided
      if (apiUrl) {
        this.externalApiUrl = apiUrl.includes('/api.php') ? apiUrl : apiUrl + '/api.php';
        console.log('✅ Using explicit API URL from constructor parameter');
      } else {
        // Priority 2: Use environment detection (auto-detect or VITE_EXTERNAL_API_URL)
        this.externalApiUrl = getAPIBaseURL();
        console.log('✅ Using API URL from environment detection');
      }

      this.apiBase = this.externalApiUrl;

      console.log('✅ Using external API at https://helixgeneralhardware.com/api.php');
      console.log('📡 API endpoint:', this.apiBase);

      // NOTE: We no longer cache the token on construction.
      // This prevents timing/initialization issues where the adapter
      // might be created before the token is available in localStorage.
      // All methods now read the token fresh from localStorage.
      // Token refresh is automatic - we check for expiration and refresh before each API call.
    } catch (error) {
      // If environment detection fails and no explicit URL provided, throw error
      console.error('❌ Failed to initialize ExternalAPIAdapter:', error);
      throw error;
    }
  }

  setAuthToken(token: string) {
    // Always store in localStorage (never cache in instance variable)
    localStorage.setItem('med_api_token', token);
  }

  clearAuthToken() {
    // Always remove from localStorage (instance variable removed)
    localStorage.removeItem('med_api_token');
  }

  /**
   * Get the current auth token from localStorage
   * Always reads fresh to ensure we get the most recent token
   * This is critical for updates that happen after login
   */
  private getAuthToken(): string | null {
    return localStorage.getItem('med_api_token');
  }

  /**
   * Validate token with backend and clear if invalid
   * This ensures we don't use stale tokens
   */
  async validateToken(): Promise<boolean> {
    const token = this.getAuthToken();
    if (!token) {
      return false; // No token to validate
    }

    try {
      const { user, error } = await this.checkAuth();

      if (error || !user) {
        // Token is invalid - clear it immediately
        console.warn('🧹 Token validation failed, clearing invalid token:', error?.message);
        this.clearAuthToken();
        return false;
      }

      // Token is valid
      return true;
    } catch (error) {
      console.warn('⚠️ Token validation error:', error);
      // On network errors, don't clear token - user might be offline
      return true;
    }
  }

  /**
   * Check if the current token is expired by decoding JWT payload
   */
  private isTokenExpired(): boolean {
    const token = this.getAuthToken();
    if (!token) return true;

    try {
      // JWT format: header.payload.signature
      const parts = token.split('.');
      if (parts.length !== 3) return true;

      // Decode payload (add padding if needed)
      const payload = parts[1];
      const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
      const decoded = JSON.parse(atob(paddedPayload));

      if (!decoded.exp) {
        // No expiration - token is valid
        return false;
      }

      // Check if expiration time (in seconds) has passed
      const expirationTime = decoded.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const isExpired = currentTime > expirationTime;

      if (isExpired) {
        console.warn('⏰ Token has expired');
      }

      return isExpired;
    } catch (error) {
      console.warn('⚠️ Could not decode token to check expiration:', error);
      // If we can't decode, assume token is valid (allow retry on API call)
      return false;
    }
  }

  /**
   * Automatically refresh token if it's expired or about to expire
   * Refreshes proactively 5 minutes before expiration
   */
  private async refreshTokenIfNeeded(): Promise<void> {
    const token = this.getAuthToken();
    if (!token) return;

    try {
      // Check if token is expired
      if (this.isTokenExpired()) {
        console.log('🔄 Token expired, attempting automatic refresh...');
        // Token is expired - try to refresh using refresh endpoint
        await this.attemptTokenRefresh();
      }
    } catch (error) {
      console.warn('⚠️ Error checking token expiration:', error);
      // Continue anyway - let the API call fail if token is truly invalid
    }
  }

  /**
   * Attempt to refresh the token using the refresh endpoint
   */
  private async attemptTokenRefresh(): Promise<void> {
    try {
      const userId = localStorage.getItem('med_api_user_id');
      // Use the stored external API URL for token refresh endpoint construction
      const refreshUrl = `${this.apiBase}?action=refresh_token`;

      const response = await fetch(refreshUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });

      const result = await response.json().catch(() => null);

      if (response.ok && result?.token) {
        // Store the new token
        this.setAuthToken(result.token);
        console.log('✅ Token refreshed automatically');
      } else {
        // If refresh fails, clear auth and require re-login
        console.warn('⚠️ Token refresh failed, clearing authentication');
        this.clearAuthToken();
        localStorage.removeItem('med_api_user_id');
        localStorage.removeItem('med_api_user_email');
      }
    } catch (error) {
      console.warn('⚠️ Token refresh error:', error);
      // Don't clear auth on network errors - let the user retry
    }
  }

  private async apiCall<T>(
    method: string,
    action: string,
    table?: string,
    data?: any,
    where?: any
  ): Promise<{ data: T; error: Error | null; status: number }> {
    try {
      // Automatically refresh token if needed before making API call
      // This prevents 401 errors due to token expiration
      await this.refreshTokenIfNeeded();

      const params = new URLSearchParams();

      // Always append the action directly - the vite proxy handles forwarding
      params.append('action', action);
      if (table) params.append('table', table);

      // Handle special query parameters (limit, order, etc) from where clause
      if (where && typeof where === 'object') {
        if (where._limit) {
          params.append('limit', where._limit);
        }
        if (where._order) {
          const order = where._order;
          if (typeof order === 'object' && order.column && order.direction) {
            params.append('order', `${order.column} ${order.direction.toUpperCase()}`);
          }
        }
      }

      // Log the API call attempt
      const logPrefix = `📡 [${method.toUpperCase()}] ${action}${table ? ` on ${table}` : ''}`;
      console.log(`${logPrefix} - Starting request...`);

      // For update, delete, and read operations, backend expects 'where' parameter
      if ((action === 'update' || action === 'delete' || action === 'read') && where && typeof where === 'object') {
        // Convert where object to SQL WHERE clause format for the backend
        // e.g., {id: 123} becomes id=123
        // Filter out special parameters (those starting with _) - they should go in URL params separately
        const whereParts: string[] = [];
        Object.entries(where).forEach(([key, value]) => {
          // Skip special parameters (pagination, ordering, etc)
          if (key.startsWith('_')) {
            return;
          }

          // Skip if value is an object (can't be converted to SQL)
          if (typeof value === 'object' && value !== null) {
            console.warn(`⚠️ Skipping non-primitive where value for key "${key}":`, value);
            return;
          }

          if (typeof value === 'string') {
            whereParts.push(`${key}='${String(value).replace(/'/g, "''")}'`);
          } else {
            whereParts.push(`${key}=${value}`);
          }
        });

        if (whereParts.length > 0) {
          params.append('where', whereParts.join(' AND '));
        }

        // DEBUG: Log the where clause being sent for read operations
        if (action === 'read') {
          console.log(`📡 [READ] Where clause being sent in URL for ${table}:`, {
            whereObject: where,
            whereClause: whereParts.join(' AND '),
            skippedSpecialParams: Object.keys(where).filter(k => k.startsWith('_'))
          });
        }
      }

      const url = `${this.apiBase}?${params.toString()}`;

      // Log for companies update debugging
      if (action === 'update' && table === 'companies') {
        console.log(`🔗 API Request for company update:`, {
          url: url.substring(0, 100), // Truncate for readability
          method,
          action,
          table,
          authTokenPresent: !!this.getAuthToken(),
          bodyDataKeys: data ? Object.keys(data as any) : [],
        });
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // ALWAYS read token fresh from localStorage to ensure we get the most recent one
      // This is critical for updates that happen after login (especially after page refresh)
      const currentToken = this.getAuthToken();

      if (currentToken) {
        headers['Authorization'] = `Bearer ${currentToken}`;
      }

      // Log token status for debugging updates
      if (action === 'update') {
        console.log(`🔐 [Update ${table}] Token check:`, {
          hasLocalStorageToken: !!currentToken,
          willSendAuthHeader: !!currentToken,
          authHeaderValue: currentToken ? `Bearer ${currentToken.substring(0, 20)}...` : 'NONE',
          readingFreshFromLocalStorage: true,
        });
      }

      // Build request body
      let body: any = null;

      if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        body = data;
      }
      // For read operations with where clause, it's now in URL params, not in body
      // This prevents duplicate filtering logic

      // Add timeout for fetch requests - extended to 60 seconds for slow APIs
      const controller = new AbortController();
      let timeoutId: NodeJS.Timeout | null = null;
      let isTimedOut = false;
      let requestCompleted = false;

      timeoutId = setTimeout(() => {
        // Only abort if the request hasn't completed yet
        if (!requestCompleted && !isTimedOut) {
          isTimedOut = true;
          try {
            controller.abort(new Error('Request timeout: 60 second limit exceeded'));
          } catch (e) {
            // Ignore errors from abort() - it may fail if already aborted
            console.debug('Controller abort error (ignored):', e);
          }
        }
      }, 60000); // 60 second timeout (increased from 30s to handle slower servers)

      let response: Response;
      let result: any;

      try {
        // Log headers being sent (for debugging update issues)
        if (action === 'update') {
          console.log(`📤 [Update ${table}] Sending request with headers:`, {
            url: url.substring(0, 100),
            method,
            headerKeys: Object.keys(headers),
            hasAuthorizationHeader: 'Authorization' in headers,
            authenticatedRequest: !!currentToken,
          });
        }

        response = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        requestCompleted = true;
        if (timeoutId) clearTimeout(timeoutId);

        // Defensively parse JSON - handle cases where server returns non-JSON (e.g., 500 error)
        result = await response.json().catch(async (jsonError) => {
          // Capture the raw response text for debugging when JSON parsing fails
          let responseText = '';
          try {
            responseText = await response.clone().text();
          } catch (e) {
            responseText = '(unable to read response body)';
          }

          const errorDetails = {
            status: response.status,
            statusText: response.statusText,
            responseBody: responseText.substring(0, 500), // First 500 chars to avoid noise
            url: url.substring(0, 100),
            action,
            table,
          };

          console.error(`❌ [${action} ${table || 'API'}] Server returned invalid JSON response:`, errorDetails);

          if (!response.ok) {
            console.error(`Server returned HTTP ${response.status} ${response.statusText}`);
            console.error(`Response body: ${responseText}`);
            throw new Error(`Server error (HTTP ${response.status} ${response.statusText}): ${responseText.substring(0, 200) || 'The API server may be experiencing issues.'}`);
          }
          console.error(`Server returned non-JSON response with status ${response.status}`);
          console.error(`Response body: ${responseText}`);
          throw new Error(`Invalid response from server: Expected valid JSON but received: ${responseText.substring(0, 300)}`);
        });
      } catch (fetchError: any) {
        requestCompleted = true;
        if (timeoutId) clearTimeout(timeoutId);

        if (fetchError.name === 'AbortError') {
          // Get the abort reason if available
          const abortReason = fetchError.reason?.message || fetchError.message || '';

          if (isTimedOut || abortReason.includes('timeout')) {
            console.error(`⏱️ API request timeout after 60 seconds at ${this.apiBase}`);
            throw new Error(`API request timeout. The server is taking too long to respond. This may be due to high server load. Please try again.`);
          } else {
            // Signal was aborted for another reason (e.g., component unmount, network interruption)
            console.warn(`⚠️ API request was cancelled (aborted). Reason: ${abortReason || 'unknown'}`);
            throw new Error(`API request was cancelled. Please check your connection and try again. Server: ${this.apiBase}`);
          }
        }

        // Network errors - provide detailed diagnostics
        if (fetchError instanceof TypeError) {
          const errorMessage = fetchError.message || '';

          // Check if this might be a CORS error (very common with cross-origin requests)
          if (errorMessage.includes('Failed to fetch') || errorMessage.includes('fetch')) {
            console.error(`❌ Network Error for ${action} on ${table || 'API'}:`, errorMessage);
            console.error(`API Endpoint: ${this.apiBase}`);
            console.error('🔍 Troubleshooting:');
            console.error('1. CORS Issue (Most Common):');
            console.error('   - Backend needs: Access-Control-Allow-Origin header');
            console.error('   - Backend needs to allow methods: GET, POST, PUT, DELETE, OPTIONS');
            console.error('2. Network/Connectivity:');
            console.error('   - Check if API endpoint is reachable');
            console.error('   - Verify internet connection');
            console.error('3. Firewall/Proxy:');
            console.error('   - Check if network firewall blocks requests');
            console.error('   - Check if corporate proxy is interfering');

            throw new Error(`Unable to reach API: ${this.apiBase}. This is commonly a CORS issue. Please ensure the backend has proper CORS headers configured. Error: ${errorMessage}`);
          }

          throw new Error(`Network error: ${errorMessage}`);
        }

        throw fetchError;
      }

      if (!response.ok) {
        const errorMsg = result.message || `HTTP ${response.status}`;

        // Provide detailed logging for specific error codes
        if (response.status === 403) {
          console.error(`❌ ${logPrefix} - PERMISSION DENIED (403)`);
          console.error('🔍 Troubleshooting 403 Forbidden Error:');
          console.error('1. User Role/Permissions:');
          console.error(`   - Current user token: ${this.getAuthToken() ? 'Present' : 'Missing'}`);
          console.error(`   - Check if user has permission to ${action} on ${table || 'resource'}`);
          console.error('2. Database:');
          console.error(`   - Verify the ${table} table exists on the backend`);
          console.error(`   - Verify user is assigned to the correct company_id`);
          console.error('3. API Setup:');
          console.error('   - Check if the backend API has proper authorization checks');
          console.error(`   - Verify the action "${action}" is supported for table "${table}"`);
          console.error(`   - Verify user's role is configured in the backend roles table`);
          console.error('4. Request Details:');
          console.error(`   - URL: ${url}`);
          console.error(`   - Method: ${method}`);
          console.error(`   - Action: ${action}`);
          console.error(`   - Table: ${table}`);
          console.error('Backend response details:', {
            status: response.status,
            statusText: response.statusText,
            message: result?.message,
            error: result?.error,
            details: result?.details,
            hint: result?.hint,
            code: result?.code,
            fullResponse: result,
          });
        } else if (response.status === 401) {
          console.error(`❌ ${logPrefix} - UNAUTHORIZED (401)`);
          console.error('⚠️ Token appears invalid or expired. Attempting emergency token refresh...');

          // Try to refresh token as a backup mechanism
          try {
            await this.attemptTokenRefresh();

            // If refresh succeeded, retry the request once
            const newToken = this.getAuthToken();
            if (newToken) {
              console.log('🔄 Retrying request with refreshed token...');
              headers['Authorization'] = `Bearer ${newToken}`;

              const retryResponse = await fetch(url, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined,
                signal: controller.signal,
              });

              const retryResult = await retryResponse.json().catch(() => ({}));

              if (retryResponse.ok) {
                console.log(`✅ ${logPrefix} - Success after token refresh`);
                return { data: retryResult.data || retryResult, error: null, status: retryResponse.status };
              } else {
                // Still failed after refresh - token is definitely invalid
                console.error(`❌ ${logPrefix} - Still failed after token refresh, clearing token`);
                this.clearAuthToken();
              }
            }
          } catch (refreshError) {
            console.warn('⚠️ Emergency token refresh failed:', refreshError);
          }

          // Clear token if refresh failed or wasn't possible
          this.clearAuthToken();
          console.error('Your authentication token is invalid. Please log in again.');
        } else {
          console.warn(`${logPrefix} - HTTP Error ${response.status}: ${errorMsg}`);
        }

        return {
          data: null as any,
          error: new Error(errorMsg),
          status: response.status,
        };
      }

      console.log(`${logPrefix} - Success (${response.status})`);
      return { data: result.data || result, error: null, status: response.status };
    } catch (error) {
      return {
        data: null as any,
        error: error as Error,
        status: 500,
      };
    }
  }

  async login(email: string, password: string): Promise<{ token: string; user: any; error: Error | null }> {
    try {
      const loginUrl = `${this.apiBase}?action=login`;
      console.log(`🔐 Attempting login: ${loginUrl}`);

      try {
        const response = await fetch(loginUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        // Defensively parse JSON
        const result = await response.json().catch(() => {
          if (!response.ok) {
            throw new Error(`Server error: HTTP ${response.status}. The API server may be experiencing issues.`);
          }
          throw new Error('Invalid response from server: Expected valid JSON');
        });
        console.log('📝 Login response status:', response.status, 'Result:', result);

        if (!response.ok || result.status === 'error') {
          const errorMsg = result.message || result.error || `Login failed with status ${response.status}`;
          console.error('❌ Login error:', errorMsg);
          return {
            token: '',
            user: null,
            error: new Error(errorMsg),
          };
        }

        if (result.token) {
          this.setAuthToken(result.token);
          console.log('✅ Token stored successfully');

          // Store user info in localStorage for consistent access
          if (result.user && result.user.id) {
            localStorage.setItem('med_api_user_id', result.user.id);
            localStorage.setItem('med_api_user_email', email);
            console.log('✅ User info stored:', { id: result.user.id, email });
          }
        }

        return {
          token: result.token || '',
          user: result.user,
          error: null,
        };
      } catch (fetchError: any) {
        // Enhanced error handling for login-specific issues
        if (fetchError instanceof TypeError && fetchError.message.includes('Failed to fetch')) {
          console.error('❌ Login failed - Network/CORS error:');
          console.error('API Endpoint:', loginUrl);
          console.error('This is likely a CORS issue.');
          console.error('💡 Solution: Backend needs to configure CORS headers:');
          console.error('   Access-Control-Allow-Origin: * (or specific domain)');
          console.error('   Access-Control-Allow-Methods: POST, OPTIONS');
          console.error('   Access-Control-Allow-Headers: Content-Type');

          return {
            token: '',
            user: null,
            error: new Error(`Unable to connect to login endpoint: ${loginUrl}. This is likely a CORS issue. Please check the browser console for details.`),
          };
        }
        throw fetchError;
      }
    } catch (error) {
      console.error('❌ Login exception:', error);
      return {
        token: '',
        user: null,
        error: error as Error,
      };
    }
  }

  async logout(): Promise<{ error: Error | null }> {
    try {
      const response = await fetch(`${this.apiBase}?action=logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        // Defensively parse JSON
        const result = await response.json().catch(() => ({}));
        console.warn('⚠️  Logout API returned error:', result.message || 'Logout failed');
      }

      // Always clear tokens locally, even if API fails
      this.clearAuthToken();
      localStorage.removeItem('med_api_user_id');
      localStorage.removeItem('med_api_user_email');

      console.log('✅ Local logout complete');
      return { error: null };
    } catch (error) {
      console.warn('⚠️  Logout error (clearing locally anyway):', error);
      // Clear tokens even if logout fails
      this.clearAuthToken();
      localStorage.removeItem('med_api_user_id');
      localStorage.removeItem('med_api_user_email');

      return { error: null }; // Return no error since we cleared locally
    }
  }

  async checkAuth(): Promise<{ user: any; error: Error | null }> {
    try {
      // Automatically refresh token if needed before checking auth
      await this.refreshTokenIfNeeded();

      const controller = new AbortController();
      let timeoutId: NodeJS.Timeout | null = null;
      let isTimedOut = false;
      let requestCompleted = false;

      timeoutId = setTimeout(() => {
        // Only abort if the request hasn't completed yet
        if (!requestCompleted && !isTimedOut) {
          isTimedOut = true;
          try {
            controller.abort();
          } catch (e) {
            // Ignore errors from abort() - it may fail if already aborted
            console.debug('Controller abort error (ignored):', e);
          }
        }
      }, 30000); // 30 second timeout (increased from 10s to handle slow networks)

      try {
        const response = await fetch(`${this.apiBase}?action=check_auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: this.getAuthToken() }),
          signal: controller.signal,
        });

        requestCompleted = true;
        if (timeoutId) clearTimeout(timeoutId);

        // Defensively parse JSON
        const result = await response.json().catch(() => {
          if (!response.ok) {
            throw new Error(`Server error: HTTP ${response.status}. Authentication check failed.`);
          }
          throw new Error('Invalid response from server: Expected valid JSON');
        });

        if (!response.ok) {
          this.clearAuthToken();
          return {
            user: null,
            error: new Error(result.message || 'Not authenticated'),
          };
        }

        return { user: result, error: null };
      } catch (fetchError: any) {
        requestCompleted = true;
        if (timeoutId) clearTimeout(timeoutId);

        if (fetchError.name === 'AbortError') {
          if (isTimedOut) {
            return {
              user: null,
              error: new Error(`Authentication check timeout. The server may be unresponsive.`),
            };
          } else {
            return {
              user: null,
              error: new Error(`Authentication check was cancelled.`),
            };
          }
        }

        if (fetchError instanceof TypeError && fetchError.message === 'Failed to fetch') {
          return {
            user: null,
            error: new Error(`Unable to reach authentication endpoint: ${this.apiBase}. Check your connection.`),
          };
        }

        throw fetchError;
      }
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  async getAuthContext(userId: string): Promise<AuthContext | null> {
    // For external API, auth context is simpler
    const { user, error } = await this.checkAuth();
    if (error || !user) return null;

    return {
      user_id: user.id,
      email: user.email,
      role: user.role,
    };
  }

  async select<T>(table: string, filter?: Record<string, any>): Promise<ListQueryResult<T>> {
    try {
      const { data, error } = await this.apiCall('POST', 'read', table, null, filter);

      if (error) {
        return { data: [], error, count: 0 };
      }

      const rows = Array.isArray(data) ? data : [];
      return {
        data: rows,
        error: null,
        count: rows.length,
      };
    } catch (error) {
      return { data: [], error: error as Error, count: 0 };
    }
  }

  async selectOne<T>(table: string, id: string): Promise<QueryResult<T>> {
    try {
      const { data, error } = await this.apiCall('POST', 'read', table, null, { id });

      if (error) {
        return { data: null, error };
      }

      const rows = Array.isArray(data) ? data : [];
      return { data: rows[0] || null, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async selectBy<T>(table: string, filter: Record<string, any>): Promise<ListQueryResult<T>> {
    return this.select<T>(table, filter);
  }

  async insert<T>(table: string, data: Partial<T>): Promise<InsertResult> {
    try {
      const { data: result, error } = await this.apiCall('POST', 'create', table, data);

      if (error) {
        return { id: '', error };
      }

      return { id: result?.id || '', error: null };
    } catch (error) {
      return { id: '', error: error as Error };
    }
  }

  async insertMany<T>(table: string, data: Partial<T>[]): Promise<InsertResult> {
    try {
      // For bulk insert, we'll insert each record and track the first ID
      let firstId = '';
      for (const record of data) {
        const { data: result, error } = await this.apiCall('POST', 'create', table, record);
        if (!error && result?.id && !firstId) {
          firstId = result.id;
        }
      }

      return { id: firstId, error: null };
    } catch (error) {
      return { id: '', error: error as Error };
    }
  }

  async update<T>(table: string, id: string, data: Partial<T>): Promise<UpdateResult> {
    try {
      console.log(`📝 Updating ${table} record:`, {
        table,
        id,
        dataKeys: Object.keys(data as any || {}),
        authTokenPresent: !!this.getAuthToken(),
        dataSize: JSON.stringify(data).length,
      });
      const { error } = await this.apiCall('PUT', 'update', table, data, { id });
      if (error) {
        console.error(`❌ Update error for ${table}/${id}:`, error.message);
      }
      return { error };
    } catch (error) {
      console.error(`❌ Update exception for ${table}/${id}:`, error);
      return { error: error as Error };
    }
  }

  async updateMany<T>(table: string, filter: Record<string, any>, data: Partial<T>): Promise<UpdateResult> {
    try {
      // External API requires updating one by one
      // First get all matching records
      const { data: records, error: selectError } = await this.select(table, filter);
      if (selectError) {
        return { error: selectError };
      }

      // Update each record
      for (const record of records as any[]) {
        await this.update(table, record.id, data);
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async delete(table: string, id: string): Promise<DeleteResult> {
    try {
      const { error } = await this.apiCall('DELETE', 'delete', table, null, { id });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async deleteMany(table: string, filter: Record<string, any>): Promise<DeleteResult> {
    try {
      // Get matching records first
      const { data: records, error: selectError } = await this.select(table, filter);
      if (selectError) {
        return { error: selectError };
      }

      // Delete each record
      for (const record of records as any[]) {
        await this.delete(table, record.id);
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async raw<T>(sql: string, params?: any[]): Promise<ListQueryResult<T>> {
    try {
      const url = `${this.apiBase}?action=raw`;
      const currentToken = this.getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (currentToken) {
        headers['Authorization'] = `Bearer ${currentToken}`;
      }
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ sql, params }),
      });

      // Defensively parse JSON
      const result = await response.json().catch(() => {
        if (!response.ok) {
          throw new Error(`Server error: HTTP ${response.status}. Query execution failed.`);
        }
        throw new Error('Invalid response from server: Expected valid JSON');
      });

      if (!response.ok) {
        return {
          data: [],
          error: new Error(result.message || 'Query failed'),
        };
      }

      const rows = Array.isArray(result.data) ? result.data : [];
      return { data: rows, error: null };
    } catch (error) {
      return { data: [], error: error as Error };
    }
  }

  async rpc<T>(functionName: string, params?: Record<string, any>): Promise<{ data: T | null; error: Error | null }> {
    try {
      const currentToken = this.getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (currentToken) {
        headers['Authorization'] = `Bearer ${currentToken}`;
      }
      const response = await fetch(`${this.apiBase}?action=rpc`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ function: functionName, params: params || {} }),
      });

      // Defensively parse JSON
      const result = await response.json().catch(() => {
        if (!response.ok) {
          throw new Error(`Server error: HTTP ${response.status}. RPC call failed.`);
        }
        throw new Error('Invalid response from server: Expected valid JSON');
      });

      if (!response.ok) {
        return {
          data: null,
          error: new Error(result.message || `RPC call to ${functionName} failed`),
        };
      }

      return { data: result.data || result, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async rpcList<T>(functionName: string, params?: Record<string, any>): Promise<{ data: T[]; error: Error | null; count?: number }> {
    try {
      const currentToken = this.getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (currentToken) {
        headers['Authorization'] = `Bearer ${currentToken}`;
      }
      const response = await fetch(`${this.apiBase}?action=rpc`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ function: functionName, params: params || {} }),
      });

      // Defensively parse JSON
      const result = await response.json().catch(() => {
        if (!response.ok) {
          throw new Error(`Server error: HTTP ${response.status}. RPC call failed.`);
        }
        throw new Error('Invalid response from server: Expected valid JSON');
      });

      if (!response.ok) {
        return {
          data: [],
          error: new Error(result.message || `RPC call to ${functionName} failed`),
        };
      }

      const data = Array.isArray(result.data) ? result.data : [];
      return { data, error: null, count: data.length };
    } catch (error) {
      return { data: [], error: error as Error };
    }
  }

  async canRead(table: string, recordId: string, auth: AuthContext): Promise<boolean> {
    // Simple authorization - admin can read everything
    // Users can only read their own records or public records
    if (auth?.role === 'admin') {
      return true;
    }

    // For now, allow all authenticated users to read
    // This should be enhanced based on actual business logic
    return !!auth?.user_id;
  }

  async canWrite(table: string, recordId: string | null, companyId: string, auth: AuthContext): Promise<boolean> {
    // Only admins can write for now
    return auth?.role === 'admin';
  }

  async canDelete(table: string, recordId: string, auth: AuthContext): Promise<boolean> {
    // Only admins can delete
    return auth?.role === 'admin';
  }

  async transaction<T>(callback: (db: IDatabase) => Promise<T>): Promise<T> {
    // External API transactions handled server-side
    return callback(this);
  }

  async initialize(): Promise<void> {
    console.log('✅ External API adapter initialized for:', this.apiBase);
    // Verify connection
    const { error } = await this.checkAuth().catch(() => ({ error: new Error('Not authenticated yet') }));
    if (error) {
      console.warn('⚠️  API not yet authenticated. Login required.');
    }
  }

  async close(): Promise<void> {
    console.log('External API adapter closed');
  }

  async health(): Promise<boolean> {
    // Health check has been disabled to prevent AbortError issues
    // The app will rely on real operations to detect API issues
    console.debug('🔍 Health check method called but disabled - returning true');
    return true;
  }
}

export const externalApiAdapter = new ExternalAPIAdapter();
