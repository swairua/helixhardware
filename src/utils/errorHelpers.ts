/**
 * Safely parse error messages from various error types (Error instances, Supabase errors, etc.)
 * Prevents "[object Object]" rendering and provides meaningful error messages
 */
export function parseErrorMessage(error: any): string {
  try {
    if (!error) return 'Unknown error occurred';

    // Defensive check for null or undefined
    if (error === null || error === undefined) return 'Unknown error occurred';

    // Handle standard Error instances
    if (error instanceof Error) {
      // Ensure message property is a string and safe
      const msg = typeof error.message === 'string' ? error.message : '';
      return msg || 'Error instance with no message';
    }

    // Handle string errors
    if (typeof error === 'string') {
      // Safely handle strings, checking that they're not empty
      return error.length > 0 ? error : 'Empty error string';
    }

    // Handle Supabase/PostgrestError objects
    if (error && typeof error === 'object') {
      // Try different properties in order of preference
      if (error.message && typeof error.message === 'string') {
        return error.message;
      }
      if (error.details && typeof error.details === 'string') {
        return error.details;
      }
      if (error.hint && typeof error.hint === 'string') {
        return error.hint;
      }
      if (error.code) {
        const msg = error.message || error.details || 'Unknown database error';
        return `Database error (${error.code}): ${msg}`;
      }

      // Try to extract meaningful information from nested objects
      if (error.error && typeof error.error === 'object') {
        return parseErrorMessage(error.error);
      }

      // Try JSON.stringify for complex objects
      try {
        const jsonStr = JSON.stringify(error);
        if (jsonStr && jsonStr !== '{}' && jsonStr !== 'null') {
          return `Error object: ${jsonStr}`;
        }
      } catch (jsonError) {
        // JSON.stringify failed, continue to other methods
      }

      // Final fallback - use toString but check if it's meaningful
      const stringified = String(error);
      if (stringified && stringified !== '[object Object]' && stringified !== 'null' && stringified !== 'undefined') {
        return stringified;
      }
    }

    return 'Unknown error occurred - unable to extract error message';
  } catch (parseError) {
    console.error('Error parsing error message:', parseError);
    return `Error parsing failed: ${parseError?.message || 'Unknown parsing error'}`;
  }
}

/**
 * Parse error message with specific handling for common database error codes
 */
export function parseErrorMessageWithCodes(error: any, context?: string): string {
  try {
    const baseMessage = parseErrorMessage(error);
    
    // If we have a Supabase error with a code, provide more specific messages
    if (error && typeof error === 'object' && error.code) {
      switch (error.code) {
        case '23505':
          return `Duplicate entry: ${context ? `${context} already exists` : 'This record already exists'}`;
        case '23503':
          // Foreign key violation - include any available details to help debugging
          let detail = '';
          let friendlyMessage = 'Referenced record not found';

          // Extract more meaningful information from the error
          if (error.details && typeof error.details === 'string') {
            detail = ` - ${error.details}`;

            // Try to provide more specific guidance based on the FK error
            if (error.details.includes('company')) {
              friendlyMessage = 'The associated company no longer exists or is invalid';
            } else if (error.details.includes('profile') || error.details.includes('user')) {
              friendlyMessage = 'The associated user profile no longer exists or is invalid';
            } else if (error.details.includes('invitation')) {
              friendlyMessage = 'The associated invitation no longer exists or is invalid';
            } else if (error.details.includes('product')) {
              friendlyMessage = 'One or more products in your request no longer exist';
            }
          } else if (error.message && typeof error.message === 'string') {
            detail = ` - ${error.message}`;
          } else if (error.hint && typeof error.hint === 'string') {
            detail = ` - ${error.hint}`;
          }

          return `Invalid reference: ${context ? `Invalid ${context} reference` : friendlyMessage}${detail}`;
        case '23514':
          return `Invalid data: ${context ? `Invalid ${context} data` : 'Data validation failed'}`;
        case '42703':
          return 'Database schema error: Missing column. Please contact support.';
        case '42P01':
          return 'Database schema error: Missing table. Please contact support.';
        case 'PGRST116':
          return 'No data found for the specified criteria.';
        default:
          return baseMessage;
      }
    }
    
    return baseMessage;
  } catch (parseError) {
    console.error('Error parsing error message with codes:', parseError);
    return parseErrorMessage(error);
  }
}
