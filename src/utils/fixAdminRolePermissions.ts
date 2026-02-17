/**
 * Utility to fix admin role permissions
 * Ensures the admin role has all necessary permissions including view_inventory
 */

import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_ROLE_PERMISSIONS } from '@/types/permissions';

export interface FixRolePermissionsResult {
  success: boolean;
  message: string;
  role?: any;
  addedPermissions?: string[];
  error?: string;
}

/**
 * Retry logic with exponential backoff for API calls
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxAttempts) {
        // Calculate delay with exponential backoff: 1s, 2s, 4s
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.warn(
          `Attempt ${attempt} failed, retrying in ${delay}ms:`,
          lastError.message
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Fix admin role permissions - add missing permissions
 */
export async function fixAdminRolePermissions(companyId: string): Promise<FixRolePermissionsResult> {
  try {
    // Fetch with retry logic to handle timeouts
    const adminRole = await retryWithBackoff(async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('name', 'admin')
        .eq('company_id', companyId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    });

    if (!adminRole) {
      return {
        success: false,
        message: 'Admin role not found in database',
        error: `No admin role found for company ${companyId}`,
      };
    }

    // Get default admin permissions
    const defaultPermissions = DEFAULT_ROLE_PERMISSIONS.admin;

    // Get current permissions (handle both array and JSONB formats)
    let currentPermissions = adminRole.permissions || [];
    if (typeof currentPermissions === 'string') {
      try {
        currentPermissions = JSON.parse(currentPermissions);
      } catch {
        currentPermissions = [];
      }
    }

    // Find missing permissions
    const missingPermissions = defaultPermissions.filter(
      (perm) => !currentPermissions.includes(perm)
    );

    if (missingPermissions.length === 0) {
      return {
        success: true,
        message: 'Admin role already has all permissions',
        role: adminRole,
        addedPermissions: [],
      };
    }

    // Add missing permissions with retry logic
    const updatedRole = await retryWithBackoff(async () => {
      const { data, error } = await supabase
        .from('roles')
        .update({
          permissions: [...currentPermissions, ...missingPermissions],
          updated_at: new Date().toISOString(),
        })
        .eq('id', adminRole.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    });

    return {
      success: true,
      message: `Successfully added ${missingPermissions.length} missing permissions to admin role`,
      role: updatedRole,
      addedPermissions: missingPermissions,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Provide helpful guidance for timeout errors
    let userMessage = 'Unexpected error while fixing admin role permissions';
    if (errorMessage.includes('timeout') || errorMessage.includes('unresponsive')) {
      userMessage = 'The server is taking too long to respond. This may be a temporary issue. Please try again.';
    }

    return {
      success: false,
      message: userMessage,
      error: errorMessage,
    };
  }
}

/**
 * Check if admin role has view_inventory permission
 */
export async function checkAdminInventoryPermission(companyId: string): Promise<{
  hasPermission: boolean;
  role: any | null;
  error?: string;
}> {
  try {
    // Fetch with retry logic
    const adminRole = await retryWithBackoff(async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('name', 'admin')
        .eq('company_id', companyId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    });

    if (!adminRole) {
      return {
        hasPermission: false,
        role: null,
        error: 'Admin role not found',
      };
    }

    let permissions = adminRole.permissions || [];
    if (typeof permissions === 'string') {
      try {
        permissions = JSON.parse(permissions);
      } catch {
        permissions = [];
      }
    }

    const hasPermission = Array.isArray(permissions) && permissions.includes('view_inventory');

    return {
      hasPermission,
      role: adminRole,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      hasPermission: false,
      role: null,
      error: errorMessage,
    };
  }
}
