/**
 * useAuth Hook
 * Provides authentication functions and current user state
 * Works with both Supabase and MySQL providers
 */

import { useEffect, useState, useCallback } from 'react';
import { authManager } from '@/integrations/database/auth-manager';
import type { AuthContext } from '@/integrations/database';

interface UseAuthReturn {
  user: AuthContext | null;
  isLoading: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, fullName?: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  updatePassword: (userId: string, newPassword: string) => Promise<boolean>;
}

/**
 * Main auth hook
 * Provides user state and auth functions
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Check initial session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const { user, error } = await authManager.getSession();
        setUser(user);
        setError(error);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }

    checkSession();

    // Subscribe to auth state changes
    const unsubscribe = authManager.onAuthStateChange((newUser) => {
      setUser(newUser);
    });

    return () => unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      const { user: newUser, error } = await authManager.signIn(email, password);
      
      if (error) {
        setError(error);
        return false;
      }

      setUser(newUser);
      return true;
    } catch (err) {
      const error = err as Error;
      setError(error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(async (
    email: string,
    password: string,
    fullName?: string
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      const { user: newUser, error } = await authManager.signUp(email, password, fullName);
      
      if (error) {
        setError(error);
        return false;
      }

      setUser(newUser);
      return true;
    } catch (err) {
      const error = err as Error;
      setError(error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      const { error } = await authManager.signOut();
      
      if (error) {
        setError(error);
        return;
      }

      setUser(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<boolean> => {
    try {
      setError(null);
      const { error } = await authManager.resetPassword(email);
      
      if (error) {
        setError(error);
        return false;
      }

      return true;
    } catch (err) {
      setError(err as Error);
      return false;
    }
  }, []);

  const updatePassword = useCallback(async (userId: string, newPassword: string): Promise<boolean> => {
    try {
      setError(null);
      const { error } = await authManager.updatePassword(userId, newPassword);
      
      if (error) {
        setError(error);
        return false;
      }

      return true;
    } catch (err) {
      setError(err as Error);
      return false;
    }
  }, []);

  return {
    user,
    isLoading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  };
}

/**
 * Hook to protect routes - redirects to login if not authenticated
 */
export function useAuthRequired() {
  const { user, isLoading } = useAuth();
  const [isProtected, setIsProtected] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      // Redirect to login
      window.location.href = '/login';
    } else if (user) {
      setIsProtected(true);
    }
  }, [user, isLoading]);

  return { isProtected, isLoading, user };
}

/**
 * Hook to check user role/permissions
 */
export function useUserRole() {
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isSuperAdmin = user?.role === 'super_admin';
  const isAccountant = user?.role === 'accountant';
  const isStockManager = user?.role === 'stock_manager';

  const hasRole = (role: string): boolean => user?.role === role;

  return {
    isAdmin,
    isSuperAdmin,
    isAccountant,
    isStockManager,
    hasRole,
    currentRole: user?.role,
  };
}

/**
 * Hook to check user permissions for a specific action
 */
export function usePermission() {
  const { user, isLoading } = useAuth();

  const canRead = async (table: string, recordId: string): Promise<boolean> => {
    if (!user) return false;
    // This would typically check with the database adapter
    // For now, assume users can read from their company
    return !!user.companyId;
  };

  const canWrite = async (table: string, recordId: string, companyId: string): Promise<boolean> => {
    if (!user) return false;
    // Check if user belongs to the company and has permission
    if (user.role === 'super_admin') return true;
    return user.companyId === companyId && (user.role === 'admin' || user.role === 'accountant');
  };

  const canDelete = async (table: string, recordId: string): Promise<boolean> => {
    if (!user) return false;
    // Only admins can delete
    return user.role === 'admin' || user.role === 'super_admin';
  };

  return {
    canRead,
    canWrite,
    canDelete,
    isLoading,
    isAuthenticated: !!user,
  };
}
