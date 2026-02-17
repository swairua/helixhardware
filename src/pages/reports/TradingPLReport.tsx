import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  Package,
  Lock,
  TrendingDown
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useInvoicesFixed as useInvoices } from '@/hooks/useInvoicesFixed';
import { useCurrentCompanyId } from '@/contexts/CompanyContext';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';
import {
  calculateTradingPLMetrics,
  calculateProductPerformance,
  calculateMonthlySalesData,
  formatCurrency,
  formatPercentage,
  type TradingPLMetrics,
  type ProductPerformance,
  type MonthlySalesData,
  type Invoice
} from '@/utils/tradingPLCalculator';

export default function TradingPLReport() {
  const [dateRange, setDateRange] = useState('last_30_days');
  const [reportType, setReportType] = useState('overview');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const companyId = useCurrentCompanyId();
  const { can: canViewReports, loading: permissionsLoading } = usePermissions();
  const { data: invoices, isLoading: invoicesLoading, error: invoicesError } = useInvoices(companyId);

  console.log('[TradingPLReport] Component mounted/updated - companyId:', companyId, 'invoices loading:', invoicesLoading, 'invoices count:', invoices?.length);

  const isLoading = invoicesLoading;
  const hasError = invoicesError;

  useEffect(() => {
    if (!permissionsLoading && !canViewReports('view_sales_reports')) {
      toast.error('You do not have permission to view P&L reports');
    }
  }, [permissionsLoading, canViewReports]);

  // Get filtered invoices based on date range
  const getFilteredInvoices = (): Invoice[] => {
    if (!invoices) return [];

    const byDateRange = (() => {
      if (dateRange === 'custom' && startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return invoices.filter(invoice => {
          const invoiceDate = new Date(invoice.invoice_date);
          return invoiceDate >= start && invoiceDate <= end;
        });
      }

      const now = new Date();
      let filterStart = new Date();
      switch (dateRange) {
        case 'last_7_days':
          filterStart.setDate(now.getDate() - 7);
          break;
        case 'last_30_days':
          filterStart.setDate(now.getDate() - 30);
          break;
        case 'last_90_days':
          filterStart.setDate(now.getDate() - 90);
          break;
        case 'this_year':
          filterStart = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          filterStart.setDate(now.getDate() - 30);
      }
      return invoices.filter(invoice => new Date(invoice.invoice_date) >= filterStart);
    })();

    return byDateRange;
  };

  const getDateRange = () => {
    if (dateRange === 'custom' && startDate && endDate) {
      return { start: new Date(startDate), end: new Date(endDate) };
    }

    const now = new Date();
    let start = new Date();

    switch (dateRange) {
      case 'last_7_days':
        start.setDate(now.getDate() - 7);
        break;
      case 'last_30_days':
        start.setDate(now.getDate() - 30);
        break;
      case 'last_90_days':
        start.setDate(now.getDate() - 90);
        break;
      case 'this_year':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        start.setDate(now.getDate() - 30);
    }

    return { start, end: now };
  };

  const metrics = useMemo(() => {
    console.log('[TradingPLReport] Computing metrics - Invoices available:', !!invoices, 'Count:', invoices?.length);
    console.log('[TradingPLReport] Invoices sample:', invoices?.slice(0, 2));
    if (!invoices) {
      console.log('[TradingPLReport] No invoices, returning null metrics');
      return null;
    }
    const { start, end } = getDateRange();
    end.setHours(23, 59, 59, 999);
    console.log('[TradingPLReport] Computing metrics for date range:', start, 'to', end);
    const calculatedMetrics = calculateTradingPLMetrics(invoices, start, end);
    console.log('[TradingPLReport] Calculated metrics:', calculatedMetrics);
    return calculatedMetrics;
  }, [invoices, dateRange, startDate, endDate]);

  const productPerformance = useMemo(() => {
    console.log('[TradingPLReport] Computing product performance - Invoices:', invoices?.length);
    if (!invoices) return [];
    const { start, end } = getDateRange();
    end.setHours(23, 59, 59, 999);
    const performance = calculateProductPerformance(invoices, start, end);
    console.log('[TradingPLReport] Product performance calculated, count:', performance.length);
    return performance;
  }, [invoices, dateRange, startDate, endDate]);

  const monthlySalesData = useMemo(() => {
    console.log('[TradingPLReport] Computing monthly sales data');
    if (!invoices) return [];
    const data = calculateMonthlySalesData(invoices);
    console.log('[TradingPLReport] Monthly sales data calculated, months:', data.length);
    return data;
  }, [invoices]);

  const handleExport = () => {
    if (!metrics) return;

    const filteredInvoices = getFilteredInvoices();
    const headers = [
      'Invoice Number',
      'Invoice Date',
      'Customer',
      'Status',
      'Total Amount'
    ];
    const rows = filteredInvoices.map(inv => [
      inv.invoice_number,
      new Date(inv.invoice_date).toLocaleDateString(),
      inv.customers?.name || inv.customer_id || 'Unknown',
      inv.status || '',
      formatCurrency(inv.total_amount || 0)
    ]);

    const csvContent = [headers, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `trading-pl-report-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Trading P&L report exported successfully!');
  };

  const handleDateRangeChange = (value: string) => {
    setDateRange(value);
    if (value !== 'custom') {
      const now = new Date();
      let start = new Date();

      switch (value) {
        case 'last_7_days':
          start.setDate(now.getDate() - 7);
          break;
        case 'last_30_days':
          start.setDate(now.getDate() - 30);
          break;
        case 'last_90_days':
          start.setDate(now.getDate() - 90);
          break;
        case 'this_year':
          start = new Date(now.getFullYear(), 0, 1);
          break;
      }

      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    }
  };

  if (permissionsLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading P&L report...</p>
        </div>
      </div>
    );
  }

  if (!canViewReports('view_sales_reports')) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Trading Profit & Loss</h1>
            <p className="text-muted-foreground">Analyze trading profitability</p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="text-center">
                <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
                <p className="text-muted-foreground">You do not have permission to view P&L reports.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-destructive mb-4">Error loading P&L data</p>
          <p className="text-sm text-muted-foreground">{invoicesError?.message}</p>
        </div>
      </div>
    );
  }

  if (!companyId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">No company selected</p>
        </div>
      </div>
    );
  }

  const topProducts = productPerformance.slice(0, 5);
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Trading Profit & Loss</h1>
          <p className="text-muted-foreground">
            {dateRange === 'custom' && startDate && endDate
              ? `${startDate} to ${endDate}`
              : dateRange.replace('_', ' ')}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={dateRange} onValueChange={handleDateRangeChange}>
            <SelectTrigger className="w-48">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_7_days">Last 7 days</SelectItem>
              <SelectItem value="last_30_days">Last 30 days</SelectItem>
              <SelectItem value="last_90_days">Last 90 days</SelectItem>
              <SelectItem value="this_year">This year</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {dateRange === 'custom' && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {metrics && (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-8 w-8 text-success" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                    <p className="text-lg font-bold text-success">{formatCurrency(metrics?.revenue ?? 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <TrendingDown className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">COGS</p>
                    <p className="text-lg font-bold text-orange-500">{formatCurrency(metrics?.cogs ?? 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Gross Profit</p>
                    <p className="text-lg font-bold text-primary">{formatCurrency(metrics?.grossProfit ?? 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-8 w-8 text-success" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Margin %</p>
                    <p className="text-lg font-bold text-success">{formatPercentage(metrics?.grossMarginPercentage ?? 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Package className="h-8 w-8 text-info" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Invoices</p>
                    <p className="text-lg font-bold text-info">{metrics?.invoiceCount ?? 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Report Type Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Report Type</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Profitability Overview</SelectItem>
                  <SelectItem value="products">Product Analysis</SelectItem>
                  <SelectItem value="trends">Monthly Trends</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Charts */}
          {reportType === 'overview' && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue vs COGS</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[{
                      name: 'Amount',
                      Revenue: metrics?.revenue ?? 0,
                      COGS: metrics?.cogs ?? 0,
                      'Gross Profit': metrics?.grossProfit ?? 0
                    }]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                      <Bar dataKey="Revenue" fill="#8884d8" />
                      <Bar dataKey="COGS" fill="#ff7300" />
                      <Bar dataKey="Gross Profit" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Profitability Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 rounded">
                      <p className="text-sm text-muted-foreground">Total Invoices</p>
                      <p className="text-2xl font-bold">{metrics?.invoiceCount ?? 0}</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded">
                      <p className="text-sm text-muted-foreground">Unique Customers</p>
                      <p className="text-2xl font-bold">{metrics?.uniqueCustomers ?? 0}</p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded">
                      <p className="text-sm text-muted-foreground">Avg Order Value</p>
                      <p className="text-lg font-bold">{formatCurrency(metrics?.averageOrderValue ?? 0)}</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded">
                      <p className="text-sm text-muted-foreground">Avg Margin</p>
                      <p className="text-lg font-bold">{formatPercentage(metrics?.averageGrossMargin ?? 0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {reportType === 'products' && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Top Products by Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={topProducts}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ productName, revenue }) => `${productName}: ${formatCurrency(revenue)}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="revenue"
                      >
                        {topProducts.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Product Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Qty Sold</TableHead>
                        <TableHead>Gross Profit</TableHead>
                        <TableHead>Margin %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topProducts.map((product) => (
                        <TableRow key={product.productId}>
                          <TableCell className="font-medium">{product.productName}</TableCell>
                          <TableCell>{product.quantitySold}</TableCell>
                          <TableCell>{formatCurrency(product.grossProfit)}</TableCell>
                          <TableCell>{formatPercentage(product.grossMarginPercentage)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {reportType === 'trends' && (
            <Card>
              <CardHeader>
                <CardTitle>Monthly Profit & Loss Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={monthlySalesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="monthName" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Revenue" strokeWidth={2} />
                    <Line type="monotone" dataKey="cogs" stroke="#ff7300" name="COGS" strokeWidth={2} />
                    <Line type="monotone" dataKey="grossProfit" stroke="#82ca9d" name="Gross Profit" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
