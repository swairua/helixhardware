/**
 * Roles and Permissions Setup Library
 * Handles creating and configuring default roles and permissions on the remote API
 */

import { getServerApiUrl } from '../../utils/getApiUrl';

const API_AUTH_TOKEN = process.env.API_AUTH_TOKEN || '';

// Default roles to be created
const DEFAULT_ROLES = [
  {
    name: 'super_admin',
    description: 'Super administrator with full system access',
    level: 1,
    permissions: [
      'all:*'
    ]
  },
  {
    name: 'admin',
    description: 'Administrator with full application access',
    level: 2,
    permissions: [
      'users:create',
      'users:read',
      'users:update',
      'users:delete',
      'roles:manage',
      'settings:manage',
      'reports:view',
      'audit:view'
    ]
  },
  {
    name: 'accountant',
    description: 'Accountant with financial access',
    level: 3,
    permissions: [
      'invoices:create',
      'invoices:read',
      'invoices:update',
      'invoices:delete',
      'payments:create',
      'payments:read',
      'payments:update',
      'payments:delete',
      'quotations:read',
      'reports:view',
      'customers:read'
    ]
  },
  {
    name: 'stock_manager',
    description: 'Stock manager with inventory access',
    level: 4,
    permissions: [
      'inventory:create',
      'inventory:read',
      'inventory:update',
      'inventory:delete',
      'stock_movements:create',
      'stock_movements:read',
      'stock_movements:update',
      'stock_movements:delete',
      'products:read',
      'reports:view'
    ]
  },
  {
    name: 'user',
    description: 'Regular user with basic access',
    level: 5,
    permissions: [
      'quotations:create',
      'quotations:read',
      'quotations:update',
      'quotations:delete',
      'customers:read',
      'products:read',
      'invoices:read',
      'delivery_notes:read'
    ]
  }
];

interface RoleSetupResult {
  success: boolean;
  message: string;
  rolesCreated: string[];
  rolesFailed: string[];
  errors: string[];
}

interface RoleCheckResult {
  success: boolean;
  rolesExist: string[];
  rolesMissing: string[];
  totalRoles: number;
  error?: string;
}

/**
 * Check which default roles exist in the system
 */
export async function checkRolesStatus(apiUrl?: string): Promise<RoleCheckResult> {
  const url = apiUrl || getServerApiUrl();
  try {
    const response = await fetch(`${url}?action=check_roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(API_AUTH_TOKEN && { 'Authorization': `Bearer ${API_AUTH_TOKEN}` })
      },
      body: JSON.stringify({
        roles: DEFAULT_ROLES.map(r => r.name)
      })
    });

    // Defensively parse JSON
    const data = await response.json().catch(() => {
      if (!response.ok) {
        throw new Error(`Server error: HTTP ${response.status}. Failed to check roles.`);
      }
      throw new Error('Invalid response from server: Expected valid JSON');
    });

    if (data.status === 'ok' && data.roles) {
      const rolesExist = data.roles
        .filter((role: any) => role.exists)
        .map((role: any) => role.name);
      
      const rolesMissing = data.roles
        .filter((role: any) => !role.exists)
        .map((role: any) => role.name);

      return {
        success: true,
        rolesExist,
        rolesMissing,
        totalRoles: DEFAULT_ROLES.length
      };
    }

    // Fallback: assume all roles missing if check not supported
    return {
      success: true,
      rolesExist: [],
      rolesMissing: DEFAULT_ROLES.map(r => r.name),
      totalRoles: DEFAULT_ROLES.length,
      error: data.error || 'Role check not supported by API'
    };
  } catch (error) {
    return {
      success: false,
      rolesExist: [],
      rolesMissing: DEFAULT_ROLES.map(r => r.name),
      totalRoles: DEFAULT_ROLES.length,
      error: error instanceof Error ? error.message : 'Unknown error checking roles'
    };
  }
}

/**
 * Create default roles in the system
 */
export async function createDefaultRoles(apiUrl?: string): Promise<RoleSetupResult> {
  const url = apiUrl || getServerApiUrl();
  try {
    // First check which roles exist
    const checkResult = await checkRolesStatus(url);
    
    if (!checkResult.success) {
      return {
        success: false,
        message: 'Failed to check existing roles',
        rolesCreated: [],
        rolesFailed: [],
        errors: [checkResult.error || 'Unknown error']
      };
    }

    if (checkResult.rolesMissing.length === 0) {
      return {
        success: true,
        message: 'All default roles already exist',
        rolesCreated: [],
        rolesFailed: [],
        errors: []
      };
    }

    // Create missing roles
    const rolesCreated: string[] = [];
    const rolesFailed: string[] = [];
    const errors: string[] = [];

    for (const role of DEFAULT_ROLES) {
      if (!checkResult.rolesMissing.includes(role.name)) {
        continue; // Role already exists
      }

      try {
        const response = await fetch(`${url}?action=create_role`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(API_AUTH_TOKEN && { 'Authorization': `Bearer ${API_AUTH_TOKEN}` })
          },
          body: JSON.stringify({
            name: role.name,
            description: role.description,
            level: role.level,
            permissions: role.permissions
          })
        });

        // Defensively parse JSON
        const data = await response.json().catch(() => {
          if (!response.ok) {
            throw new Error(`Server error: HTTP ${response.status}. Failed to create role.`);
          }
          throw new Error('Invalid response from server: Expected valid JSON');
        });

        if (data.status === 'ok' || data.success) {
          rolesCreated.push(role.name);
        } else {
          rolesFailed.push(role.name);
          errors.push(`${role.name}: ${data.error || 'Unknown error'}`);
        }
      } catch (error) {
        rolesFailed.push(role.name);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${role.name}: ${errorMsg}`);
      }
    }

    return {
      success: rolesFailed.length === 0,
      message: `Successfully created ${rolesCreated.length} roles${rolesFailed.length > 0 ? ` with ${rolesFailed.length} failures` : ''}`,
      rolesCreated,
      rolesFailed,
      errors
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error creating default roles',
      rolesCreated: [],
      rolesFailed: DEFAULT_ROLES.map(r => r.name),
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

/**
 * Setup permissions for roles
 */
export async function setupRolePermissions(apiUrl?: string): Promise<RoleSetupResult> {
  const url = apiUrl || getServerApiUrl();
  try {
    const response = await fetch(`${url}?action=setup_role_permissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(API_AUTH_TOKEN && { 'Authorization': `Bearer ${API_AUTH_TOKEN}` })
      },
      body: JSON.stringify({
        roles: DEFAULT_ROLES
      })
    });

    // Defensively parse JSON
    const data = await response.json().catch(() => {
      if (!response.ok) {
        throw new Error(`Server error: HTTP ${response.status}. Failed to configure role permissions.`);
      }
      throw new Error('Invalid response from server: Expected valid JSON');
    });

    if (data.status === 'ok' || data.success) {
      return {
        success: true,
        message: 'Role permissions configured successfully',
        rolesCreated: DEFAULT_ROLES.map(r => r.name),
        rolesFailed: [],
        errors: []
      };
    }

    return {
      success: false,
      message: 'Failed to setup role permissions',
      rolesCreated: [],
      rolesFailed: DEFAULT_ROLES.map(r => r.name),
      errors: [data.error || 'Unknown error']
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error setting up role permissions',
      rolesCreated: [],
      rolesFailed: DEFAULT_ROLES.map(r => r.name),
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

/**
 * Complete role setup including both role creation and permission setup
 */
export async function completeRoleSetup(apiUrl?: string): Promise<{
  success: boolean;
  message: string;
  rolesCreated: string[];
  rolesFailed: string[];
  permissionsSetup: boolean;
  errors: string[];
}> {
  const url = apiUrl || getServerApiUrl();
  try {
    // Step 1: Create default roles
    const rolesResult = await createDefaultRoles(url);

    if (!rolesResult.success && rolesResult.errors.length > 0) {
      return {
        success: false,
        message: rolesResult.message,
        rolesCreated: rolesResult.rolesCreated,
        rolesFailed: rolesResult.rolesFailed,
        permissionsSetup: false,
        errors: rolesResult.errors
      };
    }

    // Step 2: Setup permissions
    const permissionsResult = await setupRolePermissions(url);

    return {
      success: rolesResult.success && permissionsResult.success,
      message: `Roles created: ${rolesResult.rolesCreated.length}, Permissions configured: ${permissionsResult.success}`,
      rolesCreated: rolesResult.rolesCreated,
      rolesFailed: rolesResult.rolesFailed,
      permissionsSetup: permissionsResult.success,
      errors: [...rolesResult.errors, ...permissionsResult.errors]
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error completing role setup',
      rolesCreated: [],
      rolesFailed: DEFAULT_ROLES.map(r => r.name),
      permissionsSetup: false,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}
