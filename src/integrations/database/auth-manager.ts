/**
 * Unified Authentication Manager
 * Manages authentication with support for both Supabase and MySQL providers
 */

import type { IAuth, AuthContext } from './types';
import { getDatabaseProvider } from './manager';
import { SupabaseAuthAdapter, MySQLAuthAdapter } from './auth-adapter';

class AuthManager {
  private authAdapter: IAuth | null = null;

  /**
   * Initialize the auth manager with the appropriate adapter
   */
  initialize(): IAuth {
    if (this.authAdapter) {
      return this.authAdapter;
    }

    const provider = getDatabaseProvider();

    if (provider === 'mysql') {
      this.authAdapter = new MySQLAuthAdapter();
    } else {
      this.authAdapter = new SupabaseAuthAdapter();
    }

    console.log(`✅ Auth manager initialized with ${provider} provider`);
    return this.authAdapter;
  }

  /**
   * Get the active auth adapter
   */
  getAuth(): IAuth {
    if (!this.authAdapter) {
      return this.initialize();
    }
    return this.authAdapter;
  }

  /**
   * Sign in user
   */
  async signIn(email: string, password: string) {
    return this.getAuth().signIn(email, password);
  }

  /**
   * Sign up user
   */
  async signUp(email: string, password: string, fullName?: string) {
    return this.getAuth().signUp(email, password, fullName);
  }

  /**
   * Sign out user
   */
  async signOut() {
    return this.getAuth().signOut();
  }

  /**
   * Get current session
   */
  async getSession() {
    return this.getAuth().getSession();
  }

  /**
   * Reset password
   */
  async resetPassword(email: string) {
    return this.getAuth().resetPassword(email);
  }

  /**
   * Update password
   */
  async updatePassword(userId: string, newPassword: string) {
    return this.getAuth().updatePassword(userId, newPassword);
  }

  /**
   * Create user (admin only)
   */
  async createUser(email: string, password: string, role: string, companyId: string) {
    return this.getAuth().createUser(email, password, role, companyId);
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (user: AuthContext | null) => void) {
    return this.getAuth().onAuthStateChange(callback);
  }
}

// Export singleton instance
export const authManager = new AuthManager();

/**
 * Convenience functions for auth operations
 */
export async function signIn(email: string, password: string) {
  return authManager.signIn(email, password);
}

export async function signUp(email: string, password: string, fullName?: string) {
  return authManager.signUp(email, password, fullName);
}

export async function signOut() {
  return authManager.signOut();
}

export async function getSession() {
  return authManager.getSession();
}

export async function resetPassword(email: string) {
  return authManager.resetPassword(email);
}

export async function updatePassword(userId: string, newPassword: string) {
  return authManager.updatePassword(userId, newPassword);
}

export async function createUser(email: string, password: string, role: string, companyId: string) {
  return authManager.createUser(email, password, role, companyId);
}

export function onAuthStateChange(callback: (user: AuthContext | null) => void) {
  return authManager.onAuthStateChange(callback);
}
