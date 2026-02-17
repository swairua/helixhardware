import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/types/permissions';
import { toast } from 'sonner';

/**
 * Hook to guard operations with permission checks
 * DISABLED: All permission checks pass - role enforcement is disabled
 */
export const usePermissionGuards = () => {
  const { isAdmin } = useAuth();
  const { can, canView, canDelete, canEdit, canCreate } = usePermissions();

  /**
   * Check if user has permission and show error toast if not
   * DISABLED: Always returns true - role enforcement disabled
   */
  const checkPermission = (permission: Permission, actionName: string): boolean => {
    // Role enforcement disabled - always allow
    return true;
  };

  /**
   * Check if user can delete an entity type
   * DISABLED: Always returns true - role enforcement disabled
   */
  const checkCanDelete = (
    entityType: 'quotation' | 'invoice' | 'credit_note' | 'proforma' | 'customer' | 'inventory' | 'delivery_note' | 'lpo' | 'remittance' | 'payment',
    entityName?: string
  ): boolean => {
    // Role enforcement disabled - always allow
    return true;
  };

  /**
   * Check if user can create an entity type
   * DISABLED: Always returns true - role enforcement disabled
   */
  const checkCanCreate = (
    entityType: 'quotation' | 'invoice' | 'credit_note' | 'proforma' | 'customer' | 'inventory' | 'delivery_note' | 'lpo' | 'remittance' | 'payment',
    entityName?: string
  ): boolean => {
    // Role enforcement disabled - always allow
    return true;
  };

  /**
   * Check if user can edit an entity type
   * DISABLED: Always returns true - role enforcement disabled
   */
  const checkCanEdit = (
    entityType: 'quotation' | 'invoice' | 'credit_note' | 'proforma' | 'customer' | 'inventory' | 'delivery_note' | 'lpo' | 'remittance' | 'payment',
    entityName?: string
  ): boolean => {
    // Role enforcement disabled - always allow
    return true;
  };

  /**
   * Check if user can view an entity type
   * DISABLED: Always returns true - role enforcement disabled
   */
  const checkCanView = (
    entityType: 'quotation' | 'invoice' | 'credit_note' | 'proforma' | 'customer' | 'inventory' | 'delivery_note' | 'lpo' | 'remittance' | 'payment' | 'reports',
    entityName?: string
  ): boolean => {
    // Role enforcement disabled - always allow
    return true;
  };

  return {
    isAdmin,
    checkPermission,
    checkCanDelete,
    checkCanCreate,
    checkCanEdit,
    checkCanView,
  };
};

export default usePermissionGuards;
