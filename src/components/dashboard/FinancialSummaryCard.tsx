import { useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';
import { useInvoicesFixed as useInvoices } from '@/hooks/useInvoicesFixed';
import { useTransportFinance } from '@/hooks/useTransport';
import { useCurrentCompanyId } from '@/contexts/CompanyContext';
import { 
  calculateTradingPLMetrics,
  formatCurrency,
  formatPercentage,
  type Invoice
} from '@/utils/tradingPLCalculator';
import { 
  calculateTransportPLMetrics,
  type TransportFinance
} from '@/utils/transportPLCalculator';

export function FinancialSummaryCard() {
  const companyId = useCurrentCompanyId();
  const { data: invoices, isLoading: invoicesLoading } = useInvoices(companyId);
  const { data: transportData, isLoading: transportLoading } = useTransportFinance(companyId);

  const isLoading = invoicesLoading || transportLoading;

  // Calculate metrics for current month
  const metrics = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    let tradingMetrics = null;
    let transportMetrics = null;

    if (invoices && invoices.length > 0) {
      tradingMetrics = calculateTradingPLMetrics(invoices, monthStart, monthEnd);
    }

    if (transportData && transportData.length > 0) {
      transportMetrics = calculateTransportPLMetrics(transportData, monthStart, monthEnd);
    }

    return {
      trading: tradingMetrics,
      transport: transportMetrics,
      totalRevenue: (tradingMetrics?.revenue || 0) + (transportMetrics?.revenue || 0),
      totalProfit: (tradingMetrics?.grossProfit || 0) + (transportMetrics?.operatingProfit || 0),
      totalExpenses: (tradingMetrics?.cogs || 0) + (transportMetrics?.totalExpenses || 0)
    };
  }, [invoices, transportData]);

  // Calculate monthly comparison (this month vs last month)
  const monthlyComparison = useMemo(() => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    let thisMonthProfit = 0;
    let lastMonthProfit = 0;

    if (invoices) {
      const thisMonth = calculateTradingPLMetrics(invoices, thisMonthStart, now);
      const lastMonth = calculateTradingPLMetrics(invoices, lastMonthStart, lastMonthEnd);
      thisMonthProfit += thisMonth.grossProfit;
      lastMonthProfit += lastMonth.grossProfit;
    }

    if (transportData) {
      const thisMonth = calculateTransportPLMetrics(transportData, thisMonthStart, now);
      const lastMonth = calculateTransportPLMetrics(transportData, lastMonthStart, lastMonthEnd);
      thisMonthProfit += thisMonth.operatingProfit;
      lastMonthProfit += lastMonth.operatingProfit;
    }

    let profitGrowth = 0;
    if (lastMonthProfit !== 0) {
      profitGrowth = ((thisMonthProfit - lastMonthProfit) / Math.abs(lastMonthProfit)) * 100;
    }

    return {
      thisMonth: thisMonthProfit,
      lastMonth: lastMonthProfit,
      growth: profitGrowth,
      isPositive: thisMonthProfit >= lastMonthProfit
    };
  }, [invoices, transportData]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading financial data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const profitColor = metrics.totalProfit >= 0 ? 'text-success' : 'text-destructive';
  const growthColor = monthlyComparison.isPositive ? 'text-success' : 'text-destructive';
  const growthIcon = monthlyComparison.isPositive ? TrendingUp : TrendingDown;
  const GrowthIcon = growthIcon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Financial Summary (Current Month)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4">
          {/* Total Revenue */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(metrics.totalRevenue)}
            </p>
            {metrics.trading && (
              <p className="text-xs text-muted-foreground mt-1">
                Trading: {formatCurrency(metrics.trading.revenue)}
              </p>
            )}
            {metrics.transport && (
              <p className="text-xs text-muted-foreground">
                Transport: {formatCurrency(metrics.transport.revenue)}
              </p>
            )}
          </div>

          {/* Total Expenses */}
          <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Total Expenses</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {formatCurrency(metrics.totalExpenses)}
            </p>
            {metrics.trading && (
              <p className="text-xs text-muted-foreground mt-1">
                COGS: {formatCurrency(metrics.trading.cogs)}
              </p>
            )}
            {metrics.transport && (
              <p className="text-xs text-muted-foreground">
                Op. Exp: {formatCurrency(metrics.transport.totalExpenses)}
              </p>
            )}
          </div>

          {/* Net Profit */}
          <div className={`p-4 bg-green-50 dark:bg-green-950 rounded-lg`}>
            <p className="text-sm text-muted-foreground mb-1">Net Profit</p>
            <p className={`text-2xl font-bold ${profitColor}`}>
              {formatCurrency(metrics.totalProfit)}
            </p>
            {metrics.trading && (
              <p className="text-xs text-muted-foreground mt-1">
                Trading: {formatCurrency(metrics.trading.grossProfit)}
              </p>
            )}
            {metrics.transport && (
              <p className="text-xs text-muted-foreground">
                Transport: {formatCurrency(metrics.transport.operatingProfit)}
              </p>
            )}
          </div>

          {/* Month-over-Month Growth */}
          <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Profit Growth</p>
            <div className="flex items-center gap-2">
              <GrowthIcon className={`h-5 w-5 ${growthColor}`} />
              <p className={`text-2xl font-bold ${growthColor}`}>
                {Math.abs(monthlyComparison.growth).toFixed(1)}%
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              vs Last Month
            </p>
            <p className="text-xs text-muted-foreground">
              Last: {formatCurrency(monthlyComparison.lastMonth)}
            </p>
          </div>
        </div>

        {/* Segment Breakdown */}
        {(metrics.trading || metrics.transport) && (
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm font-semibold mb-3">Segment Breakdown</p>
            <div className="grid gap-3 md:grid-cols-2">
              {metrics.trading && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Trading Operations</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Revenue:</span>
                      <span className="font-medium">{formatCurrency(metrics.trading.revenue)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Profit:</span>
                      <span className="font-medium text-success">{formatCurrency(metrics.trading.grossProfit)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Margin:</span>
                      <span className="font-medium">{formatPercentage(metrics.trading.grossMarginPercentage)}</span>
                    </div>
                  </div>
                </div>
              )}

              {metrics.transport && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Transport Operations</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Revenue:</span>
                      <span className="font-medium">{formatCurrency(metrics.transport.revenue)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Profit:</span>
                      <span className="font-medium text-success">{formatCurrency(metrics.transport.operatingProfit)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Margin:</span>
                      <span className="font-medium">{formatPercentage(metrics.transport.operatingMarginPercentage)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {!metrics.trading && !metrics.transport && (
          <div className="mt-6 pt-6 border-t flex items-center gap-3 text-muted-foreground">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">No financial data available for this period.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
