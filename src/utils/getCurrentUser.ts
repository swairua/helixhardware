/**
 * Get current authenticated user ID from localStorage
 * Used throughout the app as replacement for supabase.auth.getUser()
 */
export function getCurrentUserId(): string | null {
  try {
    return localStorage.getItem('med_api_user_id');
  } catch {
    return null;
  }
}

/**
 * Get current authenticated user email from localStorage
 */
export function getCurrentUserEmail(): string | null {
  try {
    return localStorage.getItem('med_api_user_email');
  } catch {
    return null;
  }
}

/**
 * Get both user ID and email
 */
export function getCurrentUser(): { id: string | null; email: string | null } {
  return {
    id: getCurrentUserId(),
    email: getCurrentUserEmail(),
  };
}
