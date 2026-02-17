import { adminCreateUser } from '../lib/adminCreateUser';
import { adminResetPassword } from '../lib/adminResetPassword';
import { fixProfileRls } from '../lib/fixProfileRls';
import { checkDatabaseStatus, initializeDatabase, getDatabaseStats } from '../lib/dbInitialize';
import { checkRolesStatus, createDefaultRoles, setupRolePermissions, completeRoleSetup } from '../lib/setupRoles';

// Get API URL from environment or use relative /api.php
const EXTERNAL_API_URL = process.env.VITE_EXTERNAL_API_URL || '/api.php';
const API_AUTH_TOKEN = process.env.API_AUTH_TOKEN || '';

/**
 * API Route Handler for creating users
 * Calls the external API (helixgeneralhardware.com/api.php)
 *
 * Usage:
 * POST /api/admin/users/create
 * Content-Type: application/json
 *
 * Body:
 * {
 *   "email": "user@example.com",
 *   "password": "securepassword123",
 *   "role": "admin|accountant|stock_manager|user",
 *   "company_id": "uuid",
 *   "full_name": "John Doe",
 *   "phone": "+1234567890",
 *   "department": "Sales",
 *   "position": "Manager",
 *   "invited_by": "admin-user-id"
 * }
 */
export async function handleCreateUser(body: any) {
  try {
    const result = await adminCreateUser(
      {
        email: body.email,
        password: body.password,
        role: body.role,
        company_id: body.company_id,
        full_name: body.full_name,
        phone: body.phone,
        department: body.department,
        position: body.position,
        invited_by: body.invited_by
      },
      EXTERNAL_API_URL,
      API_AUTH_TOKEN
    );

    return {
      status: result.success ? 200 : 400,
      body: result
    };
  } catch (error) {
    console.error('Error in handleCreateUser:', error);
    return {
      status: 500,
      body: {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      }
    };
  }
}

/**
 * API Route Handler for password reset
 * Calls the external API (helixgeneralhardware.com/api.php)
 *
 * Usage:
 * POST /api/admin/users/reset-password
 * Content-Type: application/json
 *
 * Body:
 * {
 *   "email": "user@example.com",
 *   "user_id": "uuid",
 *   "admin_id": "admin-user-id",
 *   "redirectUrl": "https://yourapp.com/reset-password" (optional)
 * }
 */
export async function handleResetPassword(body: any) {
  try {
    const result = await adminResetPassword(
      {
        email: body.email,
        user_id: body.user_id,
        admin_id: body.admin_id,
        redirectUrl: body.redirectUrl
      },
      EXTERNAL_API_URL,
      API_AUTH_TOKEN
    );

    return {
      status: result.success ? 200 : 400,
      body: result
    };
  } catch (error) {
    console.error('Error in handleResetPassword:', error);
    return {
      status: 500,
      body: {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      }
    };
  }
}

/**
 * API Route Handler for fixing profile RLS
 * Calls the external API (helixgeneralhardware.com/api.php)
 *
 * Usage:
 * POST /api/admin/database/fix-rls
 * Content-Type: application/json
 *
 * Body:
 * {} (no body needed)
 *
 * RLS management is handled by the external API
 */
export async function handleFixProfileRls() {
  try {
    const result = await fixProfileRls(EXTERNAL_API_URL, API_AUTH_TOKEN);

    return {
      status: result.success ? 200 : 400,
      body: result
    };
  } catch (error) {
    console.error('Error in handleFixProfileRls:', error);
    return {
      status: 500,
      body: {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      }
    };
  }
}

/**
 * API Route Handler for checking database status
 * Returns which tables exist and which are missing
 *
 * Usage:
 * POST /api/admin/database/check-status
 * Content-Type: application/json
 */
export async function handleCheckDatabaseStatus() {
  try {
    const result = await checkDatabaseStatus();
    return {
      status: result.connected ? 200 : 500,
      body: result
    };
  } catch (error) {
    console.error('Error checking database status:', error);
    return {
      status: 500,
      body: {
        error: error instanceof Error ? error.message : 'Error checking database status'
      }
    };
  }
}

/**
 * API Route Handler for initializing database
 * Creates all missing tables
 *
 * Usage:
 * POST /api/admin/database/initialize
 * Content-Type: application/json
 */
export async function handleInitializeDatabase() {
  try {
    const result = await initializeDatabase();
    return {
      status: result.success ? 200 : 500,
      body: result
    };
  } catch (error) {
    console.error('Error initializing database:', error);
    return {
      status: 500,
      body: {
        success: false,
        message: 'Error initializing database',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    };
  }
}

/**
 * API Route Handler for getting database statistics
 *
 * Usage:
 * POST /api/admin/database/stats
 * Content-Type: application/json
 */
export async function handleGetDatabaseStats() {
  try {
    const result = await getDatabaseStats();
    return {
      status: result.success ? 200 : 500,
      body: result
    };
  } catch (error) {
    console.error('Error getting database stats:', error);
    return {
      status: 500,
      body: {
        success: false,
        error: error instanceof Error ? error.message : 'Error getting database stats'
      }
    };
  }
}

/**
 * API Route Handler for checking roles status
 * Returns which default roles exist and which are missing
 *
 * Usage:
 * POST /api/admin/roles/check-status
 * Content-Type: application/json
 */
export async function handleCheckRolesStatus() {
  try {
    const result = await checkRolesStatus();
    return {
      status: result.success ? 200 : 500,
      body: result
    };
  } catch (error) {
    console.error('Error checking roles status:', error);
    return {
      status: 500,
      body: {
        success: false,
        error: error instanceof Error ? error.message : 'Error checking roles status'
      }
    };
  }
}

/**
 * API Route Handler for creating default roles
 *
 * Usage:
 * POST /api/admin/roles/create-default
 * Content-Type: application/json
 */
export async function handleCreateDefaultRoles() {
  try {
    const result = await createDefaultRoles();
    return {
      status: result.success ? 200 : 500,
      body: result
    };
  } catch (error) {
    console.error('Error creating default roles:', error);
    return {
      status: 500,
      body: {
        success: false,
        message: 'Error creating default roles',
        rolesCreated: [],
        rolesFailed: [],
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    };
  }
}

/**
 * API Route Handler for setting up role permissions
 *
 * Usage:
 * POST /api/admin/roles/setup-permissions
 * Content-Type: application/json
 */
export async function handleSetupRolePermissions() {
  try {
    const result = await setupRolePermissions();
    return {
      status: result.success ? 200 : 500,
      body: result
    };
  } catch (error) {
    console.error('Error setting up role permissions:', error);
    return {
      status: 500,
      body: {
        success: false,
        message: 'Error setting up role permissions',
        rolesCreated: [],
        rolesFailed: [],
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    };
  }
}

/**
 * API Route Handler for complete role setup (create roles + setup permissions)
 *
 * Usage:
 * POST /api/admin/roles/setup-complete
 * Content-Type: application/json
 */
export async function handleCompleteRoleSetup() {
  try {
    const result = await completeRoleSetup();
    return {
      status: result.success ? 200 : 500,
      body: result
    };
  } catch (error) {
    console.error('Error completing role setup:', error);
    return {
      status: 500,
      body: {
        success: false,
        message: 'Error completing role setup',
        rolesCreated: [],
        rolesFailed: [],
        permissionsSetup: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    };
  }
}

/**
 * Express-style route handler (if using Express/Node backend)
 * Import and use this if you have an Express server
 */
export function setupAdminUserRoutes(app: any) {
  // Create user endpoint
  app.post('/api/admin/users/create', async (req: any, res: any) => {
    const { status, body } = await handleCreateUser(req.body);
    res.status(status).json(body);
  });

  // Reset password endpoint
  app.post('/api/admin/users/reset-password', async (req: any, res: any) => {
    const { status, body } = await handleResetPassword(req.body);
    res.status(status).json(body);
  });

  // Fix RLS endpoint
  app.post('/api/admin/database/fix-rls', async (req: any, res: any) => {
    const { status, body } = await handleFixProfileRls();
    res.status(status).json(body);
  });

  // Database status endpoint
  app.post('/api/admin/database/check-status', async (req: any, res: any) => {
    const { status, body } = await handleCheckDatabaseStatus();
    res.status(status).json(body);
  });

  // Database initialization endpoint
  app.post('/api/admin/database/initialize', async (req: any, res: any) => {
    const { status, body } = await handleInitializeDatabase();
    res.status(status).json(body);
  });

  // Database stats endpoint
  app.post('/api/admin/database/stats', async (req: any, res: any) => {
    const { status, body } = await handleGetDatabaseStats();
    res.status(status).json(body);
  });

  // Roles check status endpoint
  app.post('/api/admin/roles/check-status', async (req: any, res: any) => {
    const { status, body } = await handleCheckRolesStatus();
    res.status(status).json(body);
  });

  // Create default roles endpoint
  app.post('/api/admin/roles/create-default', async (req: any, res: any) => {
    const { status, body } = await handleCreateDefaultRoles();
    res.status(status).json(body);
  });

  // Setup role permissions endpoint
  app.post('/api/admin/roles/setup-permissions', async (req: any, res: any) => {
    const { status, body } = await handleSetupRolePermissions();
    res.status(status).json(body);
  });

  // Complete role setup endpoint
  app.post('/api/admin/roles/setup-complete', async (req: any, res: any) => {
    const { status, body } = await handleCompleteRoleSetup();
    res.status(status).json(body);
  });
}

/**
 * Utility functions for frontend to call these endpoints
 */
export const adminUserAPI = {
  /**
   * Create a new user
   */
  async createUser(params: {
    email: string;
    password: string;
    role: 'admin' | 'accountant' | 'stock_manager' | 'user' | 'super_admin';
    company_id: string;
    full_name?: string;
    phone?: string;
    department?: string;
    position?: string;
    invited_by?: string;
  }) {
    const response = await fetch('/api/admin/users/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return response.json();
  },

  /**
   * Request a password reset for a user
   */
  async resetPassword(params: {
    email: string;
    user_id: string;
    admin_id: string;
    redirectUrl?: string;
  }) {
    const response = await fetch('/api/admin/users/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return response.json();
  },

  /**
   * Fix profile RLS issues
   */
  async fixProfileRls() {
    const response = await fetch('/api/admin/database/fix-rls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}'
    });
    return response.json();
  },

  /**
   * Check database status
   */
  async checkDatabaseStatus() {
    const response = await fetch('/api/admin/database/check-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}'
    });
    return response.json();
  },

  /**
   * Initialize database by creating missing tables
   */
  async initializeDatabase() {
    const response = await fetch('/api/admin/database/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}'
    });
    return response.json();
  },

  /**
   * Get database statistics
   */
  async getDatabaseStats() {
    const response = await fetch('/api/admin/database/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}'
    });
    return response.json();
  },

  /**
   * Check roles status
   */
  async checkRolesStatus() {
    const response = await fetch('/api/admin/roles/check-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}'
    });
    return response.json();
  },

  /**
   * Create default roles
   */
  async createDefaultRoles() {
    const response = await fetch('/api/admin/roles/create-default', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}'
    });
    return response.json();
  },

  /**
   * Setup role permissions
   */
  async setupRolePermissions() {
    const response = await fetch('/api/admin/roles/setup-permissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}'
    });
    return response.json();
  },

  /**
   * Complete role setup (create roles + setup permissions)
   */
  async completeRoleSetup() {
    const response = await fetch('/api/admin/roles/setup-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}'
    });
    return response.json();
  }
};
