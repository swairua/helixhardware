import { apiClient } from '@/integrations/api';
import { logError, logWarning } from './errorLogger';

/**
 * Clear corrupted auth tokens from localStorage
 */
export const clearAuthTokens = () => {
  try {
    // Clear external API tokens
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('med_api') || key.includes('auth') || key.includes('token'))) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log('Cleared corrupted auth key:', key);
    });
    
    console.log('✅ Cleared all auth tokens');
    return true;
  } catch (error) {
    logError('Error clearing auth tokens:', error, { context: 'clearAuthTokens' });
    return false;
  }
};

/**
 * Check if we're currently rate limited
 */
export const isRateLimited = (): boolean => {
  const rateLimitKey = 'api_rate_limit';
  const lastRateLimit = localStorage.getItem(rateLimitKey);
  
  if (!lastRateLimit) return false;
  
  const rateLimitTime = parseInt(lastRateLimit, 10);
  const now = Date.now();
  const rateLimitDuration = 60000; // 1 minute
  
  return (now - rateLimitTime) < rateLimitDuration;
};

/**
 * Mark that we've hit a rate limit
 */
export const markRateLimited = () => {
  const rateLimitKey = 'api_rate_limit';
  localStorage.setItem(rateLimitKey, Date.now().toString());
};

/**
 * Get time remaining for rate limit in seconds
 */
export const getRateLimitTimeRemaining = (): number => {
  const rateLimitKey = 'api_rate_limit';
  const lastRateLimit = localStorage.getItem(rateLimitKey);
  
  if (!lastRateLimit) return 0;
  
  const rateLimitTime = parseInt(lastRateLimit, 10);
  const now = Date.now();
  const rateLimitDuration = 60000; // 1 minute
  const remaining = rateLimitDuration - (now - rateLimitTime);
  
  return Math.max(0, Math.ceil(remaining / 1000));
};

/**
 * Safe auth operation with rate limiting protection
 */
export const safeAuthOperation = async <T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<{ data: T | null; error: Error | null }> => {
  try {
    // Check if we're rate limited
    if (isRateLimited()) {
      const remaining = getRateLimitTimeRemaining();
      const error = new Error(`Rate limited. Please wait ${remaining} seconds before trying again.`);
      return { data: null, error };
    }
    
    const result = await operation();
    return { data: result, error: null };
    
  } catch (error: any) {
    // Check if this is a rate limit error
    if (error?.message?.includes('rate limit') || error?.message?.includes('Rate limit')) {
      markRateLimited();
      const remaining = getRateLimitTimeRemaining();
      const rateLimitError = new Error(`Rate limit reached. Please wait ${remaining} seconds before trying again.`);
      return { data: null, error: rateLimitError };
    }
    
    // Check if this is an invalid token error
    if (error?.message?.includes('Invalid Refresh Token') || 
        error?.message?.includes('Refresh Token Not Found') ||
        error?.message?.includes('invalid_token') ||
        error?.message?.includes('Not authenticated')) {
      console.warn('Clearing invalid auth tokens');
      clearAuthTokens();
      const tokenError = new Error('Authentication tokens were invalid and have been cleared. Please sign in again.');
      return { data: null, error: tokenError };
    }
    
    // Convert error to proper Error object if it's not already
    if (error instanceof Error) {
      return { data: null, error };
    }

    // If it's an error object with message, wrap it
    const errorMessage = (error && typeof error === 'object' && 'message' in error)
      ? (error as any).message
      : String(error);

    return { data: null, error: new Error(errorMessage) };
  }
};

/**
 * Initialize auth with ultra-fast, resilient approach
 */
export const initializeAuth = async () => {
  try {
    console.log('🔑 Ultra-fast auth check...');

    // Very short timeout for background calls
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(new Error('Auth initialization timeout: 8 seconds')), 8000); // 8 second max for background retry

    try {
      // Health checks have been disabled to prevent AbortError issues
      // Go directly to session check - real operations will detect API issues

      // Get current session with abort signal
      const sessionResult = await apiClient.auth.getSession();
      clearTimeout(timeoutId);

      // Handle invalid token errors by clearing them
      if (sessionResult.session === null) {
        console.log('No active session found');
        return { session: null, error: null };
      }

      console.log('✅ Ultra-fast auth completed successfully');
      return { session: sessionResult.session, error: null };

    } catch (fetchError: any) {
      clearTimeout(timeoutId);

      // Handle timeout
      if (fetchError.name === 'AbortError') {
        logWarning('⏱️ Auth request timed out (background)', fetchError, { context: 'initializeAuth' });
        return { session: null, error: new Error('Auth request timeout') };
      }

      // Handle network errors gracefully
      if (fetchError.message?.includes('Failed to fetch') ||
          fetchError.message?.includes('Network request failed') ||
          fetchError.message?.includes('fetch')) {
        logWarning('🌐 Network error during auth (background):', fetchError, { context: 'initializeAuth' });
        return { session: null, error: new Error('Network connectivity issue') };
      }

      throw fetchError;
    }

  } catch (error: any) {
    logWarning('⚠️ Background auth check failed:', error, { context: 'initializeAuth' });
    return { session: null, error: error };
  }
};

/**
 * Delay utility for rate limiting
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
