import { toast } from 'sonner';
import { parseErrorMessage } from './errorHelpers';

export interface AuthErrorInfo {
  type: 'invalid_credentials' | 'email_not_confirmed' | 'not_approved' | 'network_error' | 'rate_limit' | 'server_error' | 'unknown';
  message: string;
  action?: string;
  retry?: boolean;
}

export function analyzeAuthError(error: Error | any): AuthErrorInfo {
  // Safely extract error message with fallback
  let errorMessage = '';

  try {
    if (!error) {
      errorMessage = 'An authentication error occurred';
    } else if (error && typeof error === 'object') {
      if ('message' in error && typeof error.message === 'string' && error.message) {
        errorMessage = error.message;
      } else if ('error_description' in error && typeof (error as any).error_description === 'string') {
        errorMessage = (error as any).error_description;
      } else if ('details' in error && typeof (error as any).details === 'string') {
        errorMessage = (error as any).details;
      } else if ('error' in error && typeof (error as any).error === 'string') {
        errorMessage = (error as any).error;
      } else if ('msg' in error && typeof (error as any).msg === 'string') {
        errorMessage = (error as any).msg;
      } else {
        // Try to serialize the object to extract any useful information
        try {
          const serialized = JSON.stringify(error, null, 2);
          if (serialized && serialized !== '{}' && serialized !== 'null') {
            errorMessage = serialized;
          } else {
            errorMessage = 'An authentication error occurred';
          }
        } catch {
          errorMessage = 'An authentication error occurred';
        }
      }
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else {
      errorMessage = 'An unexpected authentication error occurred';
    }
  } catch (e) {
    errorMessage = 'An authentication error occurred';
  }

  const message = errorMessage.toLowerCase();

  if (message.includes('invalid login credentials') || message.includes('invalid email or password')) {
    return {
      type: 'invalid_credentials',
      message: 'Invalid email or password',
      action: 'Check your credentials or contact your administrator'
    };
  }

  if (message.includes('email not confirmed')) {
    return {
      type: 'email_not_confirmed',
      message: 'Email address needs to be confirmed',
      action: 'Check your email for a confirmation link'
    };
  }

  if (message.includes('pending approval') || message.includes('not approved')) {
    return {
      type: 'not_approved',
      message: 'Your account is pending admin approval',
      action: 'Please contact your administrator to activate your account'
    };
  }

  if (message.includes('network') || message.includes('fetch') || message.includes('cors')) {
    // Provide more specific guidance for CORS errors
    if (message.includes('cors') || message.includes('unable to reach api')) {
      return {
        type: 'network_error',
        message: 'API Server Connection Error (CORS)',
        action: 'The API server may not be configured for cross-origin requests. Check the CORS_SETUP_GUIDE.md or contact your administrator.',
        retry: true
      };
    }

    return {
      type: 'network_error',
      message: 'Network connection error',
      action: 'Check your internet connection and try again. If the problem persists, the API server may be down.',
      retry: true
    };
  }

  if (message.includes('rate limit') || message.includes('too many')) {
    return {
      type: 'rate_limit',
      message: 'Too many login attempts',
      action: 'Please wait a few minutes before trying again',
      retry: true
    };
  }

  if (message.includes('server') || message.includes('500')) {
    return {
      type: 'server_error',
      message: 'Server error occurred',
      action: 'The API server is experiencing issues. Try again or check diagnostics at /debug/api',
      retry: true
    };
  }

  return {
    type: 'unknown',
    message: errorMessage || 'An unexpected error occurred',
    action: 'Please try again or contact support if the problem persists',
    retry: true
  };
}

export function handleAuthError(error: Error | any): AuthErrorInfo {
  const errorInfo = analyzeAuthError(error);

  // Log for debugging with proper serialization
  try {
    const original = parseErrorMessage(error);
    // Use JSON.stringify to safely serialize the log object
    const logObject = {
      type: errorInfo.type,
      message: errorInfo.message,
      originalError: original,
      timestamp: new Date().toISOString()
    };
    console.error('Authentication error:', JSON.stringify(logObject, null, 2));
  } catch (logErr) {
    // Fallback logging with safe error serialization
    try {
      const fallbackLog = {
        type: errorInfo.type,
        message: errorInfo.message,
        originalError: String(error),
        error: error instanceof Error ? error.message : 'Unknown error',
        parseError: logErr instanceof Error ? logErr.message : 'Unknown parse error',
        timestamp: new Date().toISOString()
      };
      console.error('Authentication error:', JSON.stringify(fallbackLog, null, 2));
    } catch {
      // Last resort logging
      console.error('Authentication error occurred - unable to fully serialize:', {
        type: errorInfo.type,
        message: errorInfo.message
      });
    }
  }

  // Show appropriate toast
  if (errorInfo.retry) {
    toast.error(errorInfo.message, {
      description: errorInfo.action,
      duration: 5000
    });
  } else {
    toast.error(errorInfo.message, {
      description: errorInfo.action,
      duration: 8000
    });
  }

  return errorInfo;
}

export const DEFAULT_ADMIN_CREDENTIALS = {
  email: 'admin@medplusafrica.com',
  password: 'Medplus#2025!'
};

export function getAdminCredentialsHelp(): string {
  return `Default admin credentials:\nEmail: ${DEFAULT_ADMIN_CREDENTIALS.email}\nPassword: ${DEFAULT_ADMIN_CREDENTIALS.password}`;
}
