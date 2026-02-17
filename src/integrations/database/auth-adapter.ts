/**
 * Database-Agnostic Authentication Adapter
 * Provides unified authentication interface for both Supabase and MySQL
 */

import type { IAuth, AuthContext } from './types';
import { supabase } from '@/integrations/supabase/client';

/**
 * Supabase Authentication Implementation
 */
class SupabaseAuthAdapter implements IAuth {
  async signIn(
    email: string,
    password: string
  ): Promise<{ user: AuthContext | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        return { user: null, error };
      }

      // Fetch profile information
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profile) {
        return {
          user: {
            userId: profile.id,
            email: profile.email,
            role: profile.role,
            companyId: profile.company_id,
            status: profile.status,
          },
          error: null,
        };
      }

      return { user: null, error: new Error('Profile not found') };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  async signUp(
    email: string,
    password: string,
    fullName?: string
  ): Promise<{ user: AuthContext | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error || !data.user) {
        return { user: null, error };
      }

      // Create profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        full_name: fullName,
        status: 'pending',
      });

      if (profileError) {
        return { user: null, error: profileError };
      }

      return {
        user: {
          userId: data.user.id,
          email,
          role: 'user',
          companyId: null,
          status: 'pending',
        },
        error: null,
      };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  async signOut(): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async getSession(): Promise<{ user: AuthContext | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session?.user) {
        return { user: null, error };
      }

      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.session.user.id)
        .single();

      if (profile) {
        return {
          user: {
            userId: profile.id,
            email: profile.email,
            role: profile.role,
            companyId: profile.company_id,
            status: profile.status,
          },
          error: null,
        };
      }

      return { user: null, error: null };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  async resetPassword(email: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async updatePassword(userId: string, newPassword: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async createUser(
    email: string,
    password: string,
    role: string,
    companyId: string
  ): Promise<{ user: AuthContext | null; error: Error | null }> {
    try {
      // This would typically be done via an Edge Function with service role
      // For now, return an error indicating this should be done server-side
      return {
        user: null,
        error: new Error('User creation should be done via server-side admin API'),
      };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  onAuthStateChange(callback: (user: AuthContext | null) => void): () => void {
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          callback({
            userId: profile.id,
            email: profile.email,
            role: profile.role,
            companyId: profile.company_id,
            status: profile.status,
          });
        }
      } else {
        callback(null);
      }
    });

    return () => {
      data?.subscription.unsubscribe();
    };
  }
}

/**
 * MySQL Authentication Implementation (client-side stub)
 * For MySQL, authentication would typically be handled server-side via API
 */
class MySQLAuthAdapter implements IAuth {
  async signIn(
    email: string,
    password: string
  ): Promise<{ user: AuthContext | null; error: Error | null }> {
    try {
      // This would call a backend API endpoint
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        return { user: null, error: new Error('Sign in failed') };
      }

      const data = await response.json();
      return { user: data.user, error: null };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  async signUp(
    email: string,
    password: string,
    fullName?: string
  ): Promise<{ user: AuthContext | null; error: Error | null }> {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName }),
      });

      if (!response.ok) {
        return { user: null, error: new Error('Sign up failed') };
      }

      const data = await response.json();
      return { user: data.user, error: null };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  async signOut(): Promise<{ error: Error | null }> {
    try {
      const response = await fetch('/api/auth/signout', { method: 'POST' });
      if (!response.ok) {
        return { error: new Error('Sign out failed') };
      }
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async getSession(): Promise<{ user: AuthContext | null; error: Error | null }> {
    try {
      const response = await fetch('/api/auth/session');
      if (!response.ok) {
        return { user: null, error: null };
      }
      const data = await response.json();
      return { user: data.user, error: null };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  async resetPassword(email: string): Promise<{ error: Error | null }> {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        return { error: new Error('Password reset failed') };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async updatePassword(userId: string, newPassword: string): Promise<{ error: Error | null }> {
    try {
      const response = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newPassword }),
      });

      if (!response.ok) {
        return { error: new Error('Password update failed') };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async createUser(
    email: string,
    password: string,
    role: string,
    companyId: string
  ): Promise<{ user: AuthContext | null; error: Error | null }> {
    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role, companyId }),
      });

      if (!response.ok) {
        return { user: null, error: new Error('User creation failed') };
      }

      const data = await response.json();
      return { user: data.user, error: null };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  onAuthStateChange(callback: (user: AuthContext | null) => void): () => void {
    // This would typically use server-sent events or polling
    // For now, just check session on mount
    this.getSession().then(({ user }) => callback(user));
    
    // Return unsubscribe function (no-op for now)
    return () => {};
  }
}

export { SupabaseAuthAdapter, MySQLAuthAdapter };
