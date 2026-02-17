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
  Truck,
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
import { useCurrentCompanyId } from '@/contexts/CompanyContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useTransportFinance } from '@/hooks/useTransport';
import { toast } from 'sonner';
import {
  calculateTransportPLMetrics,
  calculateVehiclePerformance,
  calculateMonthlyTransportData,
  formatCurrency,
  formatPercentage,
  type TransportPLMetrics,
  type VehiclePerformance,
  type MonthlyTransportData,
  type TransportFinance
} from '@/utils/transportPLCalculator';

export default function TransportPLReport() {
  const [dateRange, setDateRange] = useState('last_30_days');
  const [reportType, setReportType] = useState('overview');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const companyId = useCurrentCompanyId();
  const { can: canViewReports, loading: permissionsLoading } = usePermissions();

  // Fetch transport finance data
  const { data: transportData, isLoading: transportLoading } = useTransportFinance(companyId);

  console.log('[TransportPLReport] Component mounted/updated - companyId:', companyId, 'transport loading:', transportLoading, 'transport data count:', transportData?.length);
  console.log('[TransportPLReport] Transport data sample:', transportData?.slice(0, 2));

  const isLoading = transportLoading;
  const hasError = false;

  useEffect(() => {
    if (!permissionsLoading && !canViewReports('view_sales_reports')) {
      toast.error('You do not have permission to view transport reports');
    }
  }, [permissionsLoading, canViewReports]);

  // Get filtered transports based on date range
  const getFilteredTransports = (): TransportFinance[] => {
    if (!transportData) return [];

    const byDateRange = (() => {
      if (dateRange === 'custom' && startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return transportData.filter(t => {
          const tDate = new Date(t.date);
          return tDate >= start && tDate <= end;
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
      return transportData.filter(t => new Date(t.date) >= filterStart);
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
    console.log('[TransportPLReport] Computing metrics - Transport data available:', !!transportData, 'Count:', transportData?.length);
    console.log('[TransportPLReport] Transport data sample:', transportData?.slice(0, 2));
    if (!transportData) {
      console.log('[TransportPLReport] No transport data, returning null metrics');
      return null;
    }
    const { start, end } = getDateRange();
    end.setHours(23, 59, 59, 999);
    console.log('[TransportPLReport] Computing metrics for date range:', start, 'to', end);
    const calculatedMetrics = calculateTransportPLMetrics(transportData, start, end);
    console.log('[TransportPLReport] Calculated metrics:', calculatedMetrics);
    return calculatedMetrics;
  }, [transportData, dateRange, startDate, endDate]);

  const vehiclePerformance = useMemo(() => {
    console.log('[TransportPLReport] Computing vehicle performance - Transport data:', transportData?.length);
    if (!transportData) return [];
    const { start, end } = getDateRange();
    end.setHours(23, 59, 59, 999);
    const performance = calculateVehiclePerformance(transportData, start, end);
    console.log('[TransportPLReport] Vehicle performance calculated, count:', performance.length);
    return performance;
  }, [transportData, dateRange, startDate, endDate]);

  const monthlyData = useMemo(() => {
    console.log('[TransportPLReport] Computing monthly transport data');
    if (!transportData) return [];
    const data = calculateMonthlyTransportData(transportData);
    console.log('[TransportPLReport] Monthly transport data calculated, months:', data.length);
    return data;
  }, [transportData]);

  const handleExport = () => {
    if (!metrics) return;

    const filteredTransports = getFilteredTransports();
    const headers = [
      'Date',
      'Vehicle ID',
      'Material',
      'Buying Price',
      'Fuel Cost',
      'Driver Fees',
      'Other Expenses',
      'Selling Price',
      'Profit',
      'Payment Status',
      'Customer'
    ];
    const rows = filteredTransports.map(t => [
      new Date(t.date).toLocaleDateString(),
      t.vehicle_id || 'Unknown',
      t.materials || '-',
      formatCurrency(t.buying_price || 0),
      formatCurrency(t.fuel_cost || 0),
      formatCurrency(t.driver_fees || 0),
      formatCurrency(t.other_expenses || 0),
      formatCurrency(t.selling_price || 0),
      formatCurrency((t.selling_price || 0) - (t.buying_price || 0) - (t.fuel_cost || 0) - (t.driver_fees || 0) - (t.other_expenses || 0)),
      t.payment_status || '-',
      t.customer_name || '-'
    ]);

    const csvContent = [headers, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `transport-pl-report-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Transport P&L report exported successfully!');
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
          <p className="text-muted-foreground">Loading transport report...</p>
        </div>
      </div>
    );
  }

  if (!canViewReports('view_sales_reports')) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Transport P&L</h1>
            <p className="text-muted-foreground">Analyze transport profitability</p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="text-center">
                <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
                <p className="text-muted-foreground">You do not have permission to view transport reports.</p>
              </div>
            </div>
          </CardContent>
        </Card>
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

  const topVehicles = vehiclePerformance.slice(0, 5);
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Transport Profit & Loss</h1>
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
                    <p className="text-lg font-bold text-success">{formatCurrency(metrics.revenue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <TrendingDown className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                    <p className="text-lg font-bold text-orange-500">{formatCurrency(metrics.totalExpenses)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Operating Profit</p>
                    <p className="text-lg font-bold text-primary">{formatCurrency(metrics.operatingProfit)}</p>
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
                    <p className="text-lg font-bold text-success">{formatPercentage(metrics.operatingMarginPercentage)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Truck className="h-8 w-8 text-info" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Trips</p>
                    <p className="text-lg font-bold text-info">{metrics.tripCount}</p>
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
                  <SelectItem value="vehicles">Vehicle Analysis</SelectItem>
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
                  <CardTitle>Revenue vs Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[{
                      name: 'Amount',
                      Revenue: metrics.revenue,
                      'Driver Fees': metrics.driverFees,
                      'Other Expenses': metrics.otherExpenses,
                      Profit: metrics.operatingProfit
                    }]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                      <Bar dataKey="Revenue" fill="#8884d8" />
                      <Bar dataKey="Driver Fees" fill="#ff7300" />
                      <Bar dataKey="Other Expenses" fill="#ffc658" />
                      <Bar dataKey="Profit" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Trip Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 rounded">
                      <p className="text-sm text-muted-foreground">Total Trips</p>
                      <p className="text-2xl font-bold">{metrics.tripCount}</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded">
                      <p className="text-sm text-muted-foreground">Avg Revenue/Trip</p>
                      <p className="text-lg font-bold">{formatCurrency(metrics.averageRevenuePerTrip)}</p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded">
                      <p className="text-sm text-muted-foreground">Avg Expense/Trip</p>
                      <p className="text-lg font-bold">{formatCurrency(metrics.averageExpensePerTrip)}</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded">
                      <p className="text-sm text-muted-foreground">Profit/Trip</p>
                      <p className="text-lg font-bold">{formatCurrency(metrics.profitPerTrip)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {reportType === 'vehicles' && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Top Vehicles by Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={topVehicles}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ vehicleName, revenue }) => `${vehicleName}: ${formatCurrency(revenue)}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="revenue"
                      >
                        {topVehicles.map((entry, index) => (
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
                  <CardTitle>Vehicle Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Trips</TableHead>
                        <TableHead>Profit</TableHead>
                        <TableHead>Margin %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topVehicles.map((vehicle) => (
                        <TableRow key={vehicle.vehicleId}>
                          <TableCell className="font-medium">{vehicle.vehicleName}</TableCell>
                          <TableCell>{vehicle.tripCount}</TableCell>
                          <TableCell>{formatCurrency(vehicle.operatingProfit)}</TableCell>
                          <TableCell>{formatPercentage(vehicle.profitMarginPercentage)}</TableCell>
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
                <CardTitle>Monthly Transport P&L Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="monthName" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Revenue" strokeWidth={2} />
                    <Line type="monotone" dataKey="totalExpenses" stroke="#ff7300" name="Expenses" strokeWidth={2} />
                    <Line type="monotone" dataKey="operatingProfit" stroke="#82ca9d" name="Profit" strokeWidth={2} />
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
