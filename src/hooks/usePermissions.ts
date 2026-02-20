import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RoleDefinition, Permission, DEFAULT_ROLE_PERMISSIONS } from '@/types/permissions';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getMissingPermissions,
} from '@/utils/permissionChecker';

/**
 * Hook to check permissions for the current user
 * Fetches the user's role and provides permission checking utilities
 */
export const usePermissions = () => {
  const { profile: currentUser } = useAuth();
  const [role, setRole] = useState<RoleDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Normalize role permissions to ensure they're always arrays
   */
  const normalizeRole = (roleData: any): RoleDefinition => {
    let permissions: any[] = [];

    if (Array.isArray(roleData.permissions)) {
      permissions = roleData.permissions;
    } else if (typeof roleData.permissions === 'string') {
      // Handle JSON string stored in database
      try {
        const parsed = JSON.parse(roleData.permissions);
        permissions = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error('Failed to parse permissions string:', roleData.permissions, e);
        permissions = [];
      }
    } else if (roleData.permissions === null || roleData.permissions === undefined) {
      permissions = [];
    }

    return {
      ...roleData,
      permissions,
    };
  };

  /**
   * Fetch the user's role definition
   */
  const fetchUserRole = useCallback(async () => {
    if (!currentUser) {
      setRole(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First, get the user's role string
      const userRole = currentUser.role;

      if (!userRole) {
        setRole(null);
        setLoading(false);
        return;
      }

      // Guard: Cannot fetch role without company_id
      if (!currentUser.company_id) {
        console.warn('⚠️ Cannot fetch role - company_id is missing from user profile');
        // Use fallback permissions based on role type
        const roleType = (userRole in DEFAULT_ROLE_PERMISSIONS)
          ? userRole as keyof typeof DEFAULT_ROLE_PERMISSIONS
          : 'user';
        const fallbackRole: RoleDefinition = {
          id: `fallback-${userRole}`,
          name: userRole,
          role_type: roleType,
          description: `Fallback ${userRole} role`,
          permissions: DEFAULT_ROLE_PERMISSIONS[roleType],
          company_id: '',
          is_default: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setRole(fallbackRole);
        setLoading(false);
        return;
      }

      // Fetch the full role definition from the roles table
      const { data, error: fetchError } = await supabase
        .from('roles')
        .select('*')
        .eq('name', userRole)
        .eq('company_id', currentUser.company_id)
        .maybeSingle();

      if (fetchError) {
        const errorMessage = fetchError instanceof Error ? fetchError.message : JSON.stringify(fetchError);
        console.error('Error fetching user role:', errorMessage);
        setError(errorMessage);

        // Fallback: Use default permissions based on role type if available
        // Try exact match first, then case-insensitive match
        let roleType: keyof typeof DEFAULT_ROLE_PERMISSIONS | null = null;
        if (userRole in DEFAULT_ROLE_PERMISSIONS) {
          roleType = userRole as keyof typeof DEFAULT_ROLE_PERMISSIONS;
        } else {
          // Try case-insensitive match for roles like "Administrator" → "admin"
          const normalizedRole = userRole.toLowerCase();
          const matchedRole = Object.keys(DEFAULT_ROLE_PERMISSIONS).find(
            r => r.toLowerCase() === normalizedRole
          );
          if (matchedRole) {
            roleType = matchedRole as keyof typeof DEFAULT_ROLE_PERMISSIONS;
          }
        }

        if (roleType) {
          const fallbackRole: RoleDefinition = {
            id: `fallback-${userRole}`,
            name: userRole,
            role_type: roleType,
            description: `Fallback ${userRole} role`,
            permissions: DEFAULT_ROLE_PERMISSIONS[roleType],
            company_id: currentUser.company_id || '',
            is_default: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setRole(fallbackRole);
        } else {
          setRole(null);
        }
      } else if (data) {
        setRole(normalizeRole(data));
      } else {
        // Role not found in roles table, use default permissions as fallback
        console.warn(`Role ${userRole} not found in roles table, using default fallback`);

        // Try exact match first, then case-insensitive match
        let roleType: keyof typeof DEFAULT_ROLE_PERMISSIONS | null = null;
        if (userRole in DEFAULT_ROLE_PERMISSIONS) {
          roleType = userRole as keyof typeof DEFAULT_ROLE_PERMISSIONS;
        } else {
          // Try case-insensitive match for roles like "Administrator" → "admin"
          const normalizedRole = userRole.toLowerCase();
          const matchedRole = Object.keys(DEFAULT_ROLE_PERMISSIONS).find(
            r => r.toLowerCase() === normalizedRole
          );
          if (matchedRole) {
            roleType = matchedRole as keyof typeof DEFAULT_ROLE_PERMISSIONS;
          }
        }

        if (roleType) {
          const fallbackRole: RoleDefinition = {
            id: `fallback-${userRole}`,
            name: userRole,
            role_type: roleType,
            description: `Fallback ${userRole} role`,
            permissions: DEFAULT_ROLE_PERMISSIONS[roleType],
            company_id: currentUser.company_id || '',
            is_default: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setRole(fallbackRole);
        } else {
          setRole(null);
        }
      }
    } catch (err) {
      console.error('Error fetching user role:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');

      // Fallback: Use default permissions if user role type is recognized
      const userRole = currentUser?.role;
      if (userRole) {
        // Try exact match first, then case-insensitive match
        let roleType: keyof typeof DEFAULT_ROLE_PERMISSIONS | null = null;
        if (userRole in DEFAULT_ROLE_PERMISSIONS) {
          roleType = userRole as keyof typeof DEFAULT_ROLE_PERMISSIONS;
        } else {
          // Try case-insensitive match for roles like "Administrator" → "admin"
          const normalizedRole = userRole.toLowerCase();
          const matchedRole = Object.keys(DEFAULT_ROLE_PERMISSIONS).find(
            r => r.toLowerCase() === normalizedRole
          );
          if (matchedRole) {
            roleType = matchedRole as keyof typeof DEFAULT_ROLE_PERMISSIONS;
          }
        }

        if (roleType) {
          const fallbackRole: RoleDefinition = {
            id: `fallback-${userRole}`,
            name: userRole,
            role_type: roleType,
            description: `Fallback ${userRole} role`,
            permissions: DEFAULT_ROLE_PERMISSIONS[roleType],
            company_id: currentUser?.company_id || '',
            is_default: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setRole(fallbackRole);
        } else {
          setRole(null);
        }
      } else {
        setRole(null);
      }
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Fetch user role on mount or when user changes
  // Only fetch if user is actually authenticated (has an id)
  useEffect(() => {
    if (currentUser?.id) {
      fetchUserRole();
    } else {
      setRole(null);
      setLoading(false);
    }
  }, [fetchUserRole, currentUser?.id]);

  /**
   * Check if current user has a specific permission
   * DISABLED: Role enforcement disabled - always returns true
   */
  const can = useCallback(
    (permission: Permission): boolean => {
      // Role enforcement disabled - allow all permissions
      return true;
    },
    []
  );

  /**
   * Check if current user has any of the specified permissions
   * DISABLED: Role enforcement disabled - always returns true
   */
  const canAny = useCallback(
    (permissions: Permission[]): boolean => {
      // Role enforcement disabled - allow all permissions
      return true;
    },
    []
  );

  /**
   * Check if current user has all specified permissions
   * DISABLED: Role enforcement disabled - always returns true
   */
  const canAll = useCallback(
    (permissions: Permission[]): boolean => {
      // Role enforcement disabled - allow all permissions
      return true;
    },
    []
  );

  /**
   * Get permissions missing from current user's role
   */
  const getMissing = useCallback(
    (requiredPermissions: Permission[]): Permission[] => {
      return getMissingPermissions(role, requiredPermissions);
    },
    [role]
  );

  /**
   * Check if user can delete a specific entity type
   * DISABLED: Role enforcement disabled - always returns true
   */
  const canDelete = useCallback(
    (entityType: 'quotation' | 'invoice' | 'credit_note' | 'proforma' | 'customer' | 'inventory' | 'delivery_note' | 'lpo' | 'remittance' | 'payment'): boolean => {
      // Role enforcement disabled - allow all delete operations
      return true;
    },
    []
  );

  /**
   * Check if user can create a specific entity type
   * DISABLED: Role enforcement disabled - always returns true
   */
  const canCreate = useCallback(
    (entityType: 'quotation' | 'invoice' | 'credit_note' | 'proforma' | 'customer' | 'inventory' | 'delivery_note' | 'lpo' | 'remittance' | 'payment'): boolean => {
      // Role enforcement disabled - allow all create operations
      return true;
    },
    []
  );

  /**
   * Check if user can edit a specific entity type
   * DISABLED: Role enforcement disabled - always returns true
   */
  const canEdit = useCallback(
    (entityType: 'quotation' | 'invoice' | 'credit_note' | 'proforma' | 'customer' | 'inventory' | 'delivery_note' | 'lpo' | 'remittance' | 'payment'): boolean => {
      // Role enforcement disabled - allow all edit operations
      return true;
    },
    []
  );

  /**
   * Check if user can view a specific entity type
   * DISABLED: Role enforcement disabled - always returns true
   */
  const canView = useCallback(
    (entityType: 'quotation' | 'invoice' | 'credit_note' | 'proforma' | 'customer' | 'inventory' | 'delivery_note' | 'lpo' | 'remittance' | 'payment' | 'reports'): boolean => {
      // Role enforcement disabled - allow all view operations
      return true;
    },
    []
  );

  return {
    role,
    loading,
    error,
    can,
    canAny,
    canAll,
    canDelete,
    canCreate,
    canEdit,
    canView,
    getMissing,
    refetch: fetchUserRole,
  };
};

export default usePermissions;
