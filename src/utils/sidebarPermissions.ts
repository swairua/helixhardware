import { Permission } from '@/types/permissions';

/**
 * Maps sidebar menu items to their required permissions
 * Used to control sidebar visibility based on role permissions
 */
export const SIDEBAR_PERMISSION_MAP: Record<string, Permission | Permission[]> = {
  // Sales submenu items
  'Quotations': 'view_quotation',
  'Proforma Invoices': 'view_proforma',
  'Invoices': 'view_invoice',
  'Direct Receipts': 'view_invoice', // Direct receipts are related to invoices
  'Credit Notes': 'view_credit_note',

  // Payments submenu items
  'Payments': 'view_payment',
  'Remittance Advice': 'view_remittance',

  // Inventory submenu items
  'Inventory': 'view_inventory',
  'Stock Movements': 'view_inventory',

  // Delivery Notes submenu items
  'Delivery Notes': 'view_delivery_note',

  // Transport submenu items
  'Drivers': 'view_inventory', // Transport uses inventory permissions
  'Vehicles': 'view_inventory',
  'Materials': 'view_inventory',
  'Finance': 'view_payment',

  // Customers
  'Customers': 'view_customer',

  // Reports submenu items
  'Sales Reports': 'view_sales_reports',
  'Inventory Reports': 'view_inventory_reports',
  'Customer Statements': 'view_customer_reports',
  'Trading P&L': 'view_reports',
  'Transport P&L': 'view_reports',
  'Consolidated P&L': 'view_reports',

  // Settings - handled via allowedRoles (admin only)
  // Admin - handled via allowedRoles (admin only)
};
