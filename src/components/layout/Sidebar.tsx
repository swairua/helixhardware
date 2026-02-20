import { useState, useMemo, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Building2,
  FileText,
  Receipt,
  Package,
  DollarSign,
  Truck,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Home,
  Users,
  FileCheck,
  CreditCard,
  FileSpreadsheet,
  ShoppingCart,
  RotateCcw,
  Database,
  TrendingUp,
  Banknote,
  TrendingDown,
  Image as ImageIcon,
  LogOut
} from 'lucide-react';
import { BiolegendLogo } from '@/components/ui/biolegend-logo';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentCompany } from '@/contexts/CompanyContext';
import { usePermissions } from '@/hooks/usePermissions';
import { hasPermission } from '@/utils/permissionChecker';
import { SIDEBAR_PERMISSION_MAP } from '@/utils/sidebarPermissions';

interface SidebarItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  children?: SidebarItem[];
  allowedRoles?: string[]; // Roles that can see this item
}

const sidebarItems: SidebarItem[] = [
  {
    title: 'Dashboard',
    icon: Home,
    href: '/app'
  },
  {
    title: 'Sales',
    icon: Receipt,
    children: [
      { title: 'Quotations', icon: FileText, href: '/app/quotations' },
      { title: 'Proforma Invoices', icon: FileCheck, href: '/app/proforma' },
      { title: 'Invoices', icon: Receipt, href: '/app/invoices' },
      { title: 'Direct Receipts', icon: Banknote, href: '/app/direct-receipts' },
      { title: 'Credit Notes', icon: RotateCcw, href: '/app/credit-notes' }
    ]
  },
  {
    title: 'Payments',
    icon: DollarSign,
    children: [
      { title: 'Payments', icon: DollarSign, href: '/app/payments' },
      { title: 'Remittance Advice', icon: CreditCard, href: '/app/remittance' }
    ]
  },
  {
    title: 'Inventory',
    icon: Package,
    children: [
      { title: 'Inventory', icon: Package, href: '/app/inventory' },
      { title: 'Stock Movements', icon: TrendingUp, href: '/app/stock-movements' }
    ]
  },
  {
    title: 'Delivery Notes',
    icon: Truck,
    children: [
      { title: 'Delivery Notes', icon: Truck, href: '/app/delivery-notes' }
    ]
  },
  {
    title: 'Transport',
    icon: TrendingDown,
    children: [
      { title: 'Drivers', icon: Users, href: '/app/transport/drivers' },
      { title: 'Vehicles', icon: Truck, href: '/app/transport/vehicles' },
      { title: 'Materials', icon: Package, href: '/app/transport/materials' },
      { title: 'Finance', icon: DollarSign, href: '/app/transport/finance' }
    ]
  },
  {
    title: 'Customers',
    icon: Users,
    href: '/app/customers'
  },
  {
    title: 'Purchase Orders',
    icon: ShoppingCart,
    children: [
      { title: 'Local Purchase Orders', icon: ShoppingCart, href: '/app/lpos' },
      { title: 'Suppliers', icon: Building2, href: '/app/suppliers' }
    ]
  },
  {
    title: 'Reports',
    icon: BarChart3,
    children: [
      { title: 'Sales Reports', icon: BarChart3, href: '/app/reports/sales' },
      { title: 'Inventory Reports', icon: Package, href: '/app/reports/inventory' },
      { title: 'Customer Statements', icon: FileSpreadsheet, href: '/app/reports/statements' },
      { title: 'Trading P&L', icon: TrendingUp, href: '/app/reports/trading-pl' },
      { title: 'Transport P&L', icon: Truck, href: '/app/reports/transport-pl' },
      { title: 'Consolidated P&L', icon: BarChart3, href: '/app/reports/consolidated-pl' }
    ]
  },
  {
    title: 'Settings',
    icon: Settings,
    allowedRoles: ['admin'],
    children: [
      { title: 'Company Settings', icon: Building2, href: '/app/settings/company', allowedRoles: ['admin'] },
      { title: 'User Management', icon: Users, href: '/app/settings/users', allowedRoles: ['admin'] },
      { title: 'Payment Methods', icon: Banknote, href: '/app/settings/payment-methods', allowedRoles: ['admin'] },
      { title: 'Database & Roles', icon: Database, href: '/app/settings/database-roles', allowedRoles: ['admin'] }
    ]
  },
  {
    title: 'Admin',
    icon: LogOut,
    allowedRoles: ['admin'],
    children: [
      { title: 'Image Management', icon: ImageIcon, href: '/app/admin/images', allowedRoles: ['admin'] },
      { title: 'Audit Logs', icon: FileText, href: '/app/admin/audit-logs', allowedRoles: ['admin'] },
      { title: 'Database', icon: Database, href: '/app/admin/database', allowedRoles: ['admin'] }
    ]
  }
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const location = useLocation();
  const { profile } = useAuth();
  const { currentCompany } = useCurrentCompany();
  const { role } = usePermissions();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const isItemVisible = useCallback((item: SidebarItem): boolean => {
    // First check allowedRoles for backward compatibility (admin-only sections)
    if (item.allowedRoles && item.allowedRoles.length > 0) {
      if (!item.allowedRoles.includes(profile?.role || '')) {
        return false;
      }
    }

    // Then check granular permissions
    const requiredPermission = SIDEBAR_PERMISSION_MAP[item.title];
    if (requiredPermission) {
      // Handle both single permission and array of permissions
      if (Array.isArray(requiredPermission)) {
        // If an array is provided, check if role has any of the permissions
        return requiredPermission.some(permission => hasPermission(role, permission));
      } else {
        // Check single permission
        return hasPermission(role, requiredPermission);
      }
    }

    // If no specific permission mapping, allow by default
    return true;
  }, [role, profile?.role]);

  const isItemActive = useCallback((href?: string) => {
    if (!href) return false;
    return location.pathname === href;
  }, [location.pathname]);

  const isParentActive = useCallback((children?: SidebarItem[]) => {
    if (!children) return false;
    return children.some(child => isItemActive(child.href));
  }, [isItemActive]);

  const renderSidebarItem = (item: SidebarItem) => {
    // Don't render if not visible to current user
    if (!isItemVisible(item)) {
      return null;
    }

    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.title);
    const isActive = isItemActive(item.href);
    const isChildActive = isParentActive(item.children);

    // Filter children based on visibility
    const visibleChildren = item.children?.filter(isItemVisible) || [];

    if (hasChildren) {
      return (
        <div key={item.title} className="space-y-1">
          <button
            onClick={() => toggleExpanded(item.title)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-smooth hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              (isChildActive || isExpanded) 
                ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                : "text-sidebar-foreground"
            )}
          >
            <div className="flex items-center space-x-3">
              <item.icon className="h-5 w-5" />
              <span>{item.title}</span>
            </div>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          
          {isExpanded && visibleChildren.length > 0 && (
            <div className="pl-4 space-y-1">
              {visibleChildren.map(child => (
                <Link
                  key={child.title}
                  to={child.href!}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-smooth hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isItemActive(child.href)
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground"
                  )}
                >
                  <child.icon className="h-4 w-4" />
                  <span>{child.title}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.title}
        to={item.href!}
        className={cn(
          "flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-smooth hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground"
            : "text-sidebar-foreground"
        )}
      >
        <item.icon className="h-5 w-5" />
        <span>{item.title}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Overlay/Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border">
        {/* Company Logo/Header */}
        <div className="flex h-16 items-center border-b border-sidebar-border px-6">
          <BiolegendLogo size="md" showText={true} className="text-sidebar-foreground" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 p-4 custom-scrollbar overflow-y-auto">
          {sidebarItems.map(item => renderSidebarItem(item)).filter(Boolean)}
        </nav>

        {/* Company Info */}
        <div className="border-t border-sidebar-border p-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-3 px-3 py-2 text-sm text-sidebar-foreground">
              <Building2 className="h-4 w-4 text-sidebar-primary" />
              <div>
                <div className="font-medium text-sm">{currentCompany?.name || '>> Medical Supplies'}</div>
                <div className="text-xs text-sidebar-foreground/60">{currentCompany?.country || 'Kenya'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen w-64 flex flex-col bg-sidebar border-r border-sidebar-border z-40 md:hidden transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Company Logo/Header */}
        <div className="flex h-16 items-center border-b border-sidebar-border px-6">
          <BiolegendLogo size="md" showText={true} className="text-sidebar-foreground" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 p-4 custom-scrollbar overflow-y-auto">
          {sidebarItems.map(item => renderSidebarItem(item)).filter(Boolean)}
        </nav>

        {/* Company Info */}
        <div className="border-t border-sidebar-border p-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-3 px-3 py-2 text-sm text-sidebar-foreground">
              <Building2 className="h-4 w-4 text-sidebar-primary" />
              <div>
                <div className="font-medium text-sm">{currentCompany?.name || '>> Medical Supplies'}</div>
                <div className="text-xs text-sidebar-foreground/60">{currentCompany?.country || 'Kenya'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
