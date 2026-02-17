import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, FileText, Package, Users, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboardStats, useCompanies } from '@/hooks/useDatabase';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  alert?: boolean;
}

function StatCard({ title, value, change, changeType, icon: Icon, alert }: StatCardProps) {
  return (
    <Card className={cn(
      "shadow-card hover:shadow-dropdown transition-smooth",
      alert && "border-l-4 border-l-warning"
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={cn(
          "h-4 w-4",
          alert ? "text-warning" : "text-muted-foreground"
        )} />
      </CardHeader>
      <CardContent>
        <div className="text-lg font-bold">{value}</div>
        {change && (
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            {changeType === 'increase' && (
              <TrendingUp className="mr-1 h-3 w-3 text-success" />
            )}
            {changeType === 'decrease' && (
              <TrendingDown className="mr-1 h-3 w-3 text-destructive" />
            )}
            <span className={cn(
              changeType === 'increase' && 'text-success',
              changeType === 'decrease' && 'text-destructive'
            )}>
              {change}
            </span>
            <span className="ml-1">from last month</span>
          </div>
        )}
        {alert && (
          <div className="flex items-center text-xs text-warning mt-1">
            <AlertTriangle className="mr-1 h-3 w-3" />
            <span>Requires attention</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardStats() {
  const { data: companies, error: companiesError } = useCompanies();
  const currentCompany = companies?.[0];
  const { data: stats, isLoading, error } = useDashboardStats(currentCompany?.id);

  // Show error message if there's an error fetching data
  if (error && !isLoading) {
    const errorMsg = error.message || 'Unable to fetch dashboard statistics';
    const isCorsError = errorMsg.includes('Failed to fetch') || errorMsg.includes('CORS');
    const isNetworkError = errorMsg.includes('Network') || errorMsg.includes('unreachable') || errorMsg.includes('timeout');

    return (
      <Alert className="border-destructive bg-destructive/10 mb-4">
        <AlertCircle className="h-4 w-4 text-destructive" />
        <AlertDescription className="text-destructive">
          <strong>Error loading dashboard data:</strong> {errorMsg}
          {isCorsError && (
            <div className="mt-2 text-xs">
              This might be a CORS issue. Check that your API server allows requests from this domain.
            </div>
          )}
          {isNetworkError && (
            <div className="mt-2 text-xs">
              This appears to be a network connectivity issue. Please check your internet connection and that the API server is accessible.
            </div>
          )}
          <div className="mt-2 text-xs">
            Try refreshing the page or contact your administrator if the problem persists.
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="shadow-card">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-muted rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded animate-pulse mb-2"></div>
                <div className="h-3 bg-muted rounded animate-pulse w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="shadow-card">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-muted rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded animate-pulse mb-2"></div>
                <div className="h-3 bg-muted rounded animate-pulse w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    // Ensure amount is a valid number, default to 0 if NaN or invalid
    const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(safeAmount);
  };

  const dashboardStats = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats?.totalRevenue || 0),
      change: '+12.3%',
      changeType: 'increase' as const,
      icon: DollarSign
    },
    {
      title: 'Total Invoices',
      value: (stats?.totalInvoices || 0).toString(),
      change: '+8.1%',
      changeType: 'increase' as const,
      icon: FileText
    },
    {
      title: 'Active Customers',
      value: (stats?.customerCount || 0).toString(),
      change: '+5.2%',
      changeType: 'increase' as const,
      icon: Users
    },
    {
      title: 'Products in Stock',
      value: (stats?.productCount || 0).toString(),
      change: (stats?.lowStockProducts || 0) > 0 ? `${stats?.lowStockProducts} low stock` : 'All stocked well',
      alert: (stats?.lowStockProducts || 0) > 0,
      icon: Package
    }
  ];

  // Additional stats row
  const secondaryStats = [
    {
      title: 'Total Payments Received',
      value: formatCurrency(stats?.totalPayments || 0),
      icon: CheckCircle
    },
    {
      title: 'Outstanding Invoices',
      value: (stats?.pendingInvoices || 0).toString(),
      alert: (stats?.pendingInvoices || 0) > 0,
      icon: AlertTriangle
    },
    {
      title: 'Outstanding Amount',
      value: formatCurrency((stats?.totalRevenue || 0) - (stats?.totalPayments || 0)),
      alert: ((stats?.totalRevenue || 0) - (stats?.totalPayments || 0)) > 0,
      icon: DollarSign
    },
    {
      title: 'Low Stock Alerts',
      value: (stats?.lowStockProducts || 0).toString(),
      alert: (stats?.lowStockProducts || 0) > 0,
      icon: Package
    }
  ];

  return (
    <div className="space-y-4">
      {/* Primary Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {secondaryStats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>
    </div>
  );
}
