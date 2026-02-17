import { supabase } from '@/integrations/supabase/client';
import { Permission } from '@/types/permissions';

/**
 * Sales Audit Role - Limited access for sales team
 * Can view and create quotations, invoices, proforma
 * Cannot delete anything
 * Limited menu access (no payments, inventory, settings)
 */
export const SALES_AUDIT_ROLE_PERMISSIONS: Permission[] = [
  // Quotations - full access except delete
  'create_quotation', 'view_quotation', 'edit_quotation', 'export_quotation',

  // Invoices - view and export only
  'view_invoice', 'export_invoice',

  // Proforma - full access except delete
  'create_proforma', 'view_proforma', 'edit_proforma', 'export_proforma',

  // Credit Notes - view only
  'view_credit_note',

  // Customers - full access except delete
  'create_customer', 'view_customer', 'edit_customer',

  // Delivery Notes - view only
  'view_delivery_note',

  // Reports - view only
  'view_reports', 'view_customer_reports', 'view_sales_reports',

  // LPO - view only
  'view_lpo',

  // Payment - view only
  'view_payment',
];

/**
 * Accounts Audit Role - Limited access for accounts team
 * Can work with payments, invoices, credit notes
 * Cannot delete anything
 * Limited menu access (no quotations edit, inventory, user management)
 */
export const ACCOUNTS_AUDIT_ROLE_PERMISSIONS: Permission[] = [
  // Invoices - full access except delete
  'create_invoice', 'view_invoice', 'edit_invoice', 'export_invoice',

  // Payments - full access except delete
  'create_payment', 'view_payment', 'edit_payment',

  // Credit Notes - full access except delete
  'create_credit_note', 'view_credit_note', 'edit_credit_note', 'export_credit_note',

  // Proforma - view and export only
  'view_proforma', 'export_proforma',

  // Quotations - view only
  'view_quotation', 'export_quotation',

  // Customers - view only
  'view_customer',

  // Remittance - full access except delete
  'create_remittance', 'view_remittance', 'edit_remittance',

  // LPO - view only
  'view_lpo',

  // Reports - full access
  'view_reports', 'export_reports', 'view_customer_reports', 'view_sales_reports',

  // Delivery Notes - view only
  'view_delivery_note',

  // Audit logs - view only
  'view_audit_logs',
];

interface SetupAuditRolesResult {
  success: boolean;
  message: string;
  rolesCreated?: {
    sales?: string;
    accounts?: string;
  };
  error?: string;
}

/**
 * Setup audit roles for a company
 * Creates Sales and Accounts audit roles if they don't exist
 */
export const setupAuditRoles = async (companyId: string): Promise<SetupAuditRolesResult> => {
  try {
    // Check if roles already exist
    const { data: existingRoles, error: checkError } = await supabase
      .from('roles')
      .select('id, name')
      .eq('company_id', companyId)
      .in('name', ['Sales Audit', 'Accounts Audit']);

    if (checkError) {
      throw checkError;
    }

    const existingRoleNames = new Set(existingRoles?.map(r => r.name) || []);
    const rolesCreated: { sales?: string; accounts?: string } = {};

    // Create Sales Audit role if it doesn't exist
    if (!existingRoleNames.has('Sales Audit')) {
      const { data: salesRole, error: salesError } = await supabase
        .from('roles')
        .insert({
          name: 'Sales Audit',
          description: 'Sales team member with limited access - can create and view quotations, invoices, and proforma without delete permissions',
          permissions: SALES_AUDIT_ROLE_PERMISSIONS,
          company_id: companyId,
          role_type: 'custom',
          is_default: false,
        })
        .select('id')
        .single();

      if (salesError) {
        throw new Error(`Failed to create Sales Audit role: ${salesError.message}`);
      }

      if (salesRole) {
        rolesCreated.sales = salesRole.id;
      }
    }

    // Create Accounts Audit role if it doesn't exist
    if (!existingRoleNames.has('Accounts Audit')) {
      const { data: accountsRole, error: accountsError } = await supabase
        .from('roles')
        .insert({
          name: 'Accounts Audit',
          description: 'Accounts team member with limited access - can manage payments, invoices, and credit notes without delete permissions',
          permissions: ACCOUNTS_AUDIT_ROLE_PERMISSIONS,
          company_id: companyId,
          role_type: 'custom',
          is_default: false,
        })
        .select('id')
        .single();

      if (accountsError) {
        throw new Error(`Failed to create Accounts Audit role: ${accountsError.message}`);
      }

      if (accountsRole) {
        rolesCreated.accounts = accountsRole.id;
      }
    }

    return {
      success: true,
      message: 'Audit roles setup completed successfully',
      rolesCreated,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      message: 'Failed to setup audit roles',
      error: errorMessage,
    };
  }
};

/**
 * Verify that audit roles exist and have correct permissions
 */
export const verifyAuditRolesSetup = async (companyId: string): Promise<{
  success: boolean;
  salesRoleExists: boolean;
  accountsRoleExists: boolean;
  salesCorrect: boolean;
  accountsCorrect: boolean;
  issues: string[];
}> => {
  try {
    const { data: roles, error } = await supabase
      .from('roles')
      .select('name, permissions')
      .eq('company_id', companyId)
      .in('name', ['Sales Audit', 'Accounts Audit']);

    if (error) {
      throw error;
    }

    const issues: string[] = [];
    let salesRoleExists = false;
    let accountsRoleExists = false;
    let salesCorrect = false;
    let accountsCorrect = false;

    roles?.forEach(role => {
      if (role.name === 'Sales Audit') {
        salesRoleExists = true;
        const expectedPermissions = new Set(SALES_AUDIT_ROLE_PERMISSIONS);
        const actualPermissions = new Set(role.permissions || []);

        if (expectedPermissions.size !== actualPermissions.size ||
            Array.from(expectedPermissions).some(p => !actualPermissions.has(p))) {
          issues.push('Sales Audit role has incorrect permissions');
        } else {
          salesCorrect = true;
        }
      }

      if (role.name === 'Accounts Audit') {
        accountsRoleExists = true;
        const expectedPermissions = new Set(ACCOUNTS_AUDIT_ROLE_PERMISSIONS);
        const actualPermissions = new Set(role.permissions || []);

        if (expectedPermissions.size !== actualPermissions.size ||
            Array.from(expectedPermissions).some(p => !actualPermissions.has(p))) {
          issues.push('Accounts Audit role has incorrect permissions');
        } else {
          accountsCorrect = true;
        }
      }
    });

    if (!salesRoleExists) {
      issues.push('Sales Audit role does not exist');
    }
    if (!accountsRoleExists) {
      issues.push('Accounts Audit role does not exist');
    }

    return {
      success: issues.length === 0,
      salesRoleExists,
      accountsRoleExists,
      salesCorrect,
      accountsCorrect,
      issues,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      salesRoleExists: false,
      accountsRoleExists: false,
      salesCorrect: false,
      accountsCorrect: false,
      issues: [errorMessage],
    };
  }
};
