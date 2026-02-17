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
  Lock,
  TrendingDown,
  Activity,
  ChevronDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Line
} from 'recharts';
import { useInvoicesFixed as useInvoices } from '@/hooks/useInvoicesFixed';
import { useCurrentCompanyId } from '@/contexts/CompanyContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useTransportFinance } from '@/hooks/useTransport';
import { toast } from 'sonner';
import { Document, Packer, Table as DocTable, TableCell as DocTableCell, TableRow as DocTableRow, Paragraph, AlignmentType, BorderStyle } from 'docx';
import {
  calculateTradingPLMetrics,
  calculateMonthlySalesData,
  formatCurrency,
  formatPercentage,
  type TradingPLMetrics,
  type Invoice
} from '@/utils/tradingPLCalculator';
import {
  calculateTransportPLMetrics,
  calculateMonthlyTransportData,
  type TransportPLMetrics,
  type TransportFinance
} from '@/utils/transportPLCalculator';

export interface ConsolidatedPLMetrics {
  tradingMetrics: TradingPLMetrics | null;
  transportMetrics: TransportPLMetrics | null;
  totalRevenue: number;
  totalCOGS: number;
  totalGrossProfit: number;
  grossMarginPercentage: number;
  transportExpenses: number;
  operatingProfit: number;
  netMarginPercentage: number;
}

export default function ConsolidatedPLReport() {
  const [dateRange, setDateRange] = useState('last_30_days');
  const [reportType, setReportType] = useState('overview');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const companyId = useCurrentCompanyId();
  const { can: canViewReports, loading: permissionsLoading } = usePermissions();

  const { data: invoices, isLoading: invoicesLoading } = useInvoices(companyId);
  const { data: transportData, isLoading: transportLoading } = useTransportFinance(companyId);

  const isLoading = invoicesLoading || transportLoading;

  useEffect(() => {
    if (!permissionsLoading && !canViewReports('view_sales_reports')) {
      toast.error('You do not have permission to view consolidated reports');
    }
  }, [permissionsLoading, canViewReports]);

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

  const metrics = useMemo<ConsolidatedPLMetrics | null>(() => {
    const { start, end } = getDateRange();
    end.setHours(23, 59, 59, 999);

    if (!invoices && !transportData) return null;

    const tradingMetrics = invoices ? calculateTradingPLMetrics(invoices, start, end) : null;
    const transportMetrics = transportData ? calculateTransportPLMetrics(transportData, start, end) : null;

    const totalRevenue = (tradingMetrics?.revenue || 0) + (transportMetrics?.revenue || 0);
    const totalCOGS = tradingMetrics?.cogs || 0;
    const totalGrossProfit = (tradingMetrics?.grossProfit || 0);
    const grossMarginPercentage = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;
    const transportExpenses = transportMetrics?.totalExpenses || 0;
    const operatingProfit = totalGrossProfit - transportExpenses;
    const netMarginPercentage = totalRevenue > 0 ? (operatingProfit / totalRevenue) * 100 : 0;

    return {
      tradingMetrics,
      transportMetrics,
      totalRevenue,
      totalCOGS,
      totalGrossProfit,
      grossMarginPercentage,
      transportExpenses,
      operatingProfit,
      netMarginPercentage
    };
  }, [invoices, transportData, dateRange, startDate, endDate]);

  const consolidatedMonthlyData = useMemo(() => {
    const tradingMonthly = invoices ? calculateMonthlySalesData(invoices) : [];
    const transportMonthly = transportData ? calculateMonthlyTransportData(transportData) : [];

    // Merge the two datasets by month
    const mergedMap = new Map<string, any>();

    tradingMonthly.forEach(month => {
      mergedMap.set(month.month, {
        month: month.month,
        monthName: month.monthName,
        tradingRevenue: month.revenue,
        tradingCOGS: month.cogs,
        tradingGrossProfit: month.grossProfit,
        transportRevenue: 0,
        transportExpenses: 0,
        transportProfit: 0
      });
    });

    transportMonthly.forEach(month => {
      if (mergedMap.has(month.month)) {
        const existing = mergedMap.get(month.month)!;
        existing.transportRevenue = month.revenue;
        existing.transportExpenses = month.totalExpenses;
        existing.transportProfit = month.operatingProfit;
      } else {
        mergedMap.set(month.month, {
          month: month.month,
          monthName: month.monthName,
          tradingRevenue: 0,
          tradingCOGS: 0,
          tradingGrossProfit: 0,
          transportRevenue: month.revenue,
          transportExpenses: month.totalExpenses,
          transportProfit: month.operatingProfit
        });
      }
    });

    return Array.from(mergedMap.values());
  }, [invoices, transportData]);

  const getReportData = () => {
    const data: any[] = [];

    if (metrics?.tradingMetrics) {
      data.push(['TRADING OPERATIONS', '', '']);
      data.push(['Revenue', formatCurrency(metrics.tradingMetrics.revenue), '100%']);
      data.push(['Cost of Goods Sold', formatCurrency(metrics.tradingMetrics.cogs), formatPercentage(metrics.tradingMetrics.cogs / metrics.tradingMetrics.revenue * 100)]);
      data.push(['Gross Profit', formatCurrency(metrics.tradingMetrics.grossProfit), formatPercentage(metrics.tradingMetrics.grossMarginPercentage)]);
      data.push(['', '', '']);
    }

    if (metrics?.transportMetrics) {
      data.push(['TRANSPORT OPERATIONS', '', '']);
      data.push(['Revenue', formatCurrency(metrics.transportMetrics.revenue), '100%']);
      data.push(['Operating Expenses', formatCurrency(metrics.transportMetrics.totalExpenses), formatPercentage(metrics.transportMetrics.totalExpenses / metrics.transportMetrics.revenue * 100)]);
      data.push(['Operating Profit', formatCurrency(metrics.transportMetrics.operatingProfit), formatPercentage(metrics.transportMetrics.operatingMarginPercentage)]);
      data.push(['', '', '']);
    }

    data.push(['CONSOLIDATED', '', '']);
    data.push(['Total Revenue', formatCurrency(metrics?.totalRevenue || 0), '100%']);
    data.push(['Total COGS', formatCurrency(metrics?.totalCOGS || 0), formatPercentage((metrics?.totalCOGS || 0) / (metrics?.totalRevenue || 1) * 100)]);
    data.push(['Gross Profit', formatCurrency(metrics?.totalGrossProfit || 0), formatPercentage(metrics?.grossMarginPercentage || 0)]);
    data.push(['Transport Expenses', formatCurrency(metrics?.transportExpenses || 0), formatPercentage((metrics?.transportExpenses || 0) / (metrics?.totalRevenue || 1) * 100)]);
    data.push(['Net Operating Profit', formatCurrency(metrics?.operatingProfit || 0), formatPercentage(metrics?.netMarginPercentage || 0)]);

    return data;
  };

  const handleExportCSV = () => {
    if (!metrics) return;

    const headers = [
      'Category',
      'Amount',
      'Percentage of Revenue'
    ];

    const rows = getReportData();

    const csvContent = [headers, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `consolidated-pl-report-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('CSV report exported successfully!');
  };

  const handleExportWord = async () => {
    if (!metrics) return;

    const rows = getReportData();
    const headerRow = new DocTableRow({
      children: [
        new DocTableCell({
          children: [new Paragraph('Category')],
          shading: { fill: '4472C4' }
        }),
        new DocTableCell({
          children: [new Paragraph('Amount')],
          shading: { fill: '4472C4' }
        }),
        new DocTableCell({
          children: [new Paragraph('Percentage of Revenue')],
          shading: { fill: '4472C4' }
        })
      ]
    });

    const tableRows = [headerRow, ...rows.map(row =>
      new DocTableRow({
        children: row.map(cell =>
          new DocTableCell({
            children: [new Paragraph(String(cell))],
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
              left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
              right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' }
            }
          })
        )
      })
    )];

    const table = new DocTable({
      rows: tableRows,
      width: { size: 100, type: 'pct' }
    });

    const dateRangeText = dateRange === 'custom' && startDate && endDate
      ? `${startDate} to ${endDate}`
      : dateRange.replace('_', ' ');

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            text: 'Consolidated P&L Report',
            heading: 'Heading1',
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
          }),
          new Paragraph({
            text: `Period: ${dateRangeText}`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
          }),
          table
        ]
      }]
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `consolidated-pl-report-${dateRange}-${new Date().toISOString().split('T')[0]}.docx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Word document exported successfully!');
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
          <p className="text-muted-foreground">Loading consolidated report...</p>
        </div>
      </div>
    );
  }

  if (!canViewReports('view_sales_reports')) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Consolidated P&L</h1>
            <p className="text-muted-foreground">Overall business profitability</p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="text-center">
                <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
                <p className="text-muted-foreground">You do not have permission to view consolidated reports.</p>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Consolidated P&L Report</h1>
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCSV}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportWord}>
                Export as Word
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
          {/* Main KPI Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-8 w-8 text-success" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                    <p className="text-lg font-bold text-success">{formatCurrency(metrics.totalRevenue)}</p>
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
                    <p className="text-lg font-bold text-orange-500">{formatCurrency(metrics.totalCOGS + metrics.transportExpenses)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Net Profit</p>
                    <p className="text-lg font-bold text-primary">{formatCurrency(metrics.operatingProfit)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Activity className="h-8 w-8 text-success" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Net Margin %</p>
                    <p className="text-lg font-bold text-success">{formatPercentage(metrics.netMarginPercentage)}</p>
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
                  <SelectItem value="overview">Financial Overview</SelectItem>
                  <SelectItem value="comparison">Trading vs Transport</SelectItem>
                  <SelectItem value="trends">Monthly Trends</SelectItem>
                  <SelectItem value="detailed">Detailed Breakdown</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Overview */}
          {reportType === 'overview' && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue & Profit Waterfall</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[{
                      name: 'Amount',
                      Revenue: metrics.totalRevenue,
                      'COGS': -metrics.totalCOGS,
                      'Gross Profit': metrics.totalGrossProfit,
                      'Op. Expenses': -metrics.transportExpenses,
                      'Net Profit': metrics.operatingProfit
                    }]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                      <Bar dataKey="Revenue" fill="#8884d8" />
                      <Bar dataKey="COGS" fill="#ff7300" />
                      <Bar dataKey="Gross Profit" fill="#82ca9d" />
                      <Bar dataKey="Op. Expenses" fill="#ffc658" />
                      <Bar dataKey="Net Profit" fill="#0ea5e9" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Financial Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Revenue</span>
                      <span className="font-bold">{formatCurrency(metrics.totalRevenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Cost of Goods Sold</span>
                      <span className="font-bold text-orange-500">-{formatCurrency(metrics.totalCOGS)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-sm font-medium">Gross Profit</span>
                      <span className="font-bold text-primary">{formatCurrency(metrics.totalGrossProfit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Operating Expenses</span>
                      <span className="font-bold text-orange-500">-{formatCurrency(metrics.transportExpenses)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-sm font-medium">Net Operating Profit</span>
                      <span className={`font-bold text-lg ${metrics.operatingProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatCurrency(metrics.operatingProfit)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Comparison */}
          {reportType === 'comparison' && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Trading vs Transport Profitability</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                      {
                        name: 'Trading',
                        Revenue: metrics.tradingMetrics?.revenue || 0,
                        COGS: metrics.tradingMetrics?.cogs || 0,
                        Profit: metrics.tradingMetrics?.grossProfit || 0
                      },
                      {
                        name: 'Transport',
                        Revenue: metrics.transportMetrics?.revenue || 0,
                        COGS: metrics.transportMetrics?.totalExpenses || 0,
                        Profit: metrics.transportMetrics?.operatingProfit || 0
                      }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                      <Bar dataKey="Revenue" fill="#8884d8" />
                      <Bar dataKey="COGS" fill="#ff7300" />
                      <Bar dataKey="Profit" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Segment Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Segment</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Profit</TableHead>
                        <TableHead>Margin %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {metrics.tradingMetrics && (
                        <TableRow>
                          <TableCell className="font-medium">Trading</TableCell>
                          <TableCell>{formatCurrency(metrics.tradingMetrics.revenue)}</TableCell>
                          <TableCell>{formatCurrency(metrics.tradingMetrics.grossProfit)}</TableCell>
                          <TableCell>{formatPercentage(metrics.tradingMetrics.grossMarginPercentage)}</TableCell>
                        </TableRow>
                      )}
                      {metrics.transportMetrics && (
                        <TableRow>
                          <TableCell className="font-medium">Transport</TableCell>
                          <TableCell>{formatCurrency(metrics.transportMetrics.revenue)}</TableCell>
                          <TableCell>{formatCurrency(metrics.transportMetrics.operatingProfit)}</TableCell>
                          <TableCell>{formatPercentage(metrics.transportMetrics.operatingMarginPercentage)}</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Trends */}
          {reportType === 'trends' && (
            <Card>
              <CardHeader>
                <CardTitle>Monthly Consolidated P&L Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={consolidatedMonthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="monthName" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                    <Line type="monotone" dataKey="tradingRevenue" stroke="#8884d8" name="Trading Revenue" strokeWidth={2} />
                    <Line type="monotone" dataKey="transportRevenue" stroke="#ffc658" name="Transport Revenue" strokeWidth={2} />
                    <Line type="monotone" dataKey="tradingGrossProfit" stroke="#82ca9d" name="Trading Profit" strokeWidth={2} />
                    <Line type="monotone" dataKey="transportProfit" stroke="#ff7300" name="Transport Profit" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Detailed Breakdown */}
          {reportType === 'detailed' && (
            <div className="space-y-6">
              {metrics.tradingMetrics && (
                <Card>
                  <CardHeader>
                    <CardTitle>Trading Operations Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Sales Revenue</TableCell>
                          <TableCell className="text-right">{formatCurrency(metrics.tradingMetrics.revenue)}</TableCell>
                          <TableCell className="text-right">100%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium text-orange-500">Cost of Goods Sold</TableCell>
                          <TableCell className="text-right text-orange-500">-{formatCurrency(metrics.tradingMetrics.cogs)}</TableCell>
                          <TableCell className="text-right text-orange-500">{formatPercentage(metrics.tradingMetrics.cogs / metrics.tradingMetrics.revenue * 100)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium border-t">Gross Profit</TableCell>
                          <TableCell className="text-right border-t font-bold">{formatCurrency(metrics.tradingMetrics.grossProfit)}</TableCell>
                          <TableCell className="text-right border-t font-bold">{formatPercentage(metrics.tradingMetrics.grossMarginPercentage)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {metrics.transportMetrics && (
                <Card>
                  <CardHeader>
                    <CardTitle>Transport Operations Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Transport Revenue</TableCell>
                          <TableCell className="text-right">{formatCurrency(metrics.transportMetrics.revenue)}</TableCell>
                          <TableCell className="text-right">100%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-sm text-muted-foreground">Driver Fees</TableCell>
                          <TableCell className="text-right text-orange-500">-{formatCurrency(metrics.transportMetrics.driverFees)}</TableCell>
                          <TableCell className="text-right text-orange-500">{formatPercentage(metrics.transportMetrics.driverFees / metrics.transportMetrics.revenue * 100)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-sm text-muted-foreground">Other Expenses</TableCell>
                          <TableCell className="text-right text-orange-500">-{formatCurrency(metrics.transportMetrics.otherExpenses)}</TableCell>
                          <TableCell className="text-right text-orange-500">{formatPercentage(metrics.transportMetrics.otherExpenses / metrics.transportMetrics.revenue * 100)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium border-t">Operating Profit</TableCell>
                          <TableCell className="text-right border-t font-bold">{formatCurrency(metrics.transportMetrics.operatingProfit)}</TableCell>
                          <TableCell className="text-right border-t font-bold">{formatPercentage(metrics.transportMetrics.operatingMarginPercentage)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Consolidated Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Total Revenue</TableCell>
                        <TableCell className="text-right">{formatCurrency(metrics.totalRevenue)}</TableCell>
                        <TableCell className="text-right">100%</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-sm text-muted-foreground">Less: Cost of Goods Sold</TableCell>
                        <TableCell className="text-right text-orange-500">-{formatCurrency(metrics.totalCOGS)}</TableCell>
                        <TableCell className="text-right text-orange-500">{formatPercentage(metrics.totalCOGS / metrics.totalRevenue * 100)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium border-t">Gross Profit</TableCell>
                        <TableCell className="text-right border-t font-bold">{formatCurrency(metrics.totalGrossProfit)}</TableCell>
                        <TableCell className="text-right border-t font-bold">{formatPercentage(metrics.grossMarginPercentage)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-sm text-muted-foreground">Less: Transport Expenses</TableCell>
                        <TableCell className="text-right text-orange-500">-{formatCurrency(metrics.transportExpenses)}</TableCell>
                        <TableCell className="text-right text-orange-500">{formatPercentage(metrics.transportExpenses / metrics.totalRevenue * 100)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium border-t">Net Operating Profit</TableCell>
                        <TableCell className="text-right border-t font-bold">{formatCurrency(metrics.operatingProfit)}</TableCell>
                        <TableCell className="text-right border-t font-bold">{formatPercentage(metrics.netMarginPercentage)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
