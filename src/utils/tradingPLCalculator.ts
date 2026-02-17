/**
 * Trading P&L (Profit & Loss) Calculator
 * Computes revenue, cost of goods sold, and profit metrics from invoices and products
 */

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  line_total?: number;
  products?: {
    id: string;
    name: string;
    cost_price: number;
    unit_price: number;
  };
}

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  invoice_date: string;
  total_amount: number;
  status: string;
  invoice_items?: InvoiceItem[];
  customers?: {
    id: string;
    name: string;
  };
}

export interface Product {
  id: string;
  name: string;
  cost_price: number;
  unit_price: number;
  stock_quantity: number;
}

export interface TradingPLMetrics {
  periodStart: string;
  periodEnd: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMarginPercentage: number;
  invoiceCount: number;
  uniqueCustomers: number;
  averageOrderValue: number;
  averageGrossMargin: number;
}

export interface ProductPerformance {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMarginPercentage: number;
  unitsSold?: number;
}

export interface MonthlySalesData {
  month: string;
  monthName: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  invoiceCount: number;
  uniqueCustomers: number;
}

/**
 * Calculate revenue from invoices within a date range
 */
export const calculateRevenue = (
  invoices: Invoice[],
  startDate?: Date,
  endDate?: Date
): number => {
  return invoices
    .filter(inv => {
      if (!startDate || !endDate) return true;
      const invDate = new Date(inv.invoice_date);
      return invDate >= startDate && invDate <= endDate;
    })
    .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
};

/**
 * Calculate Cost of Goods Sold (COGS) from invoice items and product costs
 */
export const calculateCOGS = (
  invoices: Invoice[],
  startDate?: Date,
  endDate?: Date
): number => {
  let totalCOGS = 0;

  invoices.forEach(inv => {
    if (startDate && endDate) {
      const invDate = new Date(inv.invoice_date);
      if (invDate < startDate || invDate > endDate) return;
    }

    if (inv.invoice_items && Array.isArray(inv.invoice_items)) {
      inv.invoice_items.forEach(item => {
        const cost = item.products?.cost_price || 0;
        totalCOGS += (item.quantity || 0) * cost;
      });
    }
  });

  return totalCOGS;
};

/**
 * Calculate gross profit (Revenue - COGS)
 */
export const calculateGrossProfit = (revenue: number, cogs: number): number => {
  return revenue - cogs;
};

/**
 * Calculate gross margin percentage
 */
export const calculateGrossMarginPercentage = (
  revenue: number,
  cogs: number
): number => {
  if (revenue === 0) return 0;
  return ((revenue - cogs) / revenue) * 100;
};

/**
 * Get unique customer count from invoices
 */
export const getUniqueCustomerCount = (
  invoices: Invoice[],
  startDate?: Date,
  endDate?: Date
): number => {
  const customers = new Set<string>();

  invoices.forEach(inv => {
    if (startDate && endDate) {
      const invDate = new Date(inv.invoice_date);
      if (invDate < startDate || invDate > endDate) return;
    }
    if (inv.customer_id) {
      customers.add(inv.customer_id);
    }
  });

  return customers.size;
};

/**
 * Calculate average order value
 */
export const calculateAverageOrderValue = (
  invoices: Invoice[],
  startDate?: Date,
  endDate?: Date
): number => {
  const filtered = invoices.filter(inv => {
    if (!startDate || !endDate) return true;
    const invDate = new Date(inv.invoice_date);
    return invDate >= startDate && invDate <= endDate;
  });

  if (filtered.length === 0) return 0;

  const totalRevenue = filtered.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  return totalRevenue / filtered.length;
};

/**
 * Calculate complete trading P&L metrics
 */
export const calculateTradingPLMetrics = (
  invoices: Invoice[],
  startDate: Date,
  endDate: Date
): TradingPLMetrics => {
  const revenue = calculateRevenue(invoices, startDate, endDate);
  const cogs = calculateCOGS(invoices, startDate, endDate);
  const grossProfit = calculateGrossProfit(revenue, cogs);
  const grossMarginPercentage = calculateGrossMarginPercentage(revenue, cogs);

  const filteredInvoices = invoices.filter(inv => {
    const invDate = new Date(inv.invoice_date);
    return invDate >= startDate && invDate <= endDate;
  });

  const uniqueCustomers = getUniqueCustomerCount(invoices, startDate, endDate);
  const averageOrderValue = calculateAverageOrderValue(invoices, startDate, endDate);

  return {
    periodStart: startDate.toISOString().split('T')[0],
    periodEnd: endDate.toISOString().split('T')[0],
    revenue,
    cogs,
    grossProfit,
    grossMarginPercentage,
    invoiceCount: filteredInvoices.length,
    uniqueCustomers,
    averageOrderValue,
    averageGrossMargin: grossMarginPercentage
  };
};

/**
 * Calculate product-level performance metrics
 */
export const calculateProductPerformance = (
  invoices: Invoice[],
  startDate?: Date,
  endDate?: Date
): ProductPerformance[] => {
  const productMap = new Map<string, ProductPerformance>();

  invoices.forEach(inv => {
    if (startDate && endDate) {
      const invDate = new Date(inv.invoice_date);
      if (invDate < startDate || invDate > endDate) return;
    }

    if (inv.invoice_items && Array.isArray(inv.invoice_items)) {
      inv.invoice_items.forEach(item => {
        const productId = item.product_id;
        const productName = item.products?.name || 'Unknown Product';
        const costPrice = item.products?.cost_price || 0;
        const quantity = item.quantity || 0;
        const lineRevenue = (item.line_total || item.quantity * item.unit_price) || 0;
        const lineCOGS = quantity * costPrice;

        if (productMap.has(productId)) {
          const existing = productMap.get(productId)!;
          existing.quantitySold += quantity;
          existing.revenue += lineRevenue;
          existing.cogs += lineCOGS;
          existing.grossProfit = existing.revenue - existing.cogs;
          existing.grossMarginPercentage =
            existing.revenue > 0 ? (existing.grossProfit / existing.revenue) * 100 : 0;
        } else {
          productMap.set(productId, {
            productId,
            productName,
            quantitySold: quantity,
            unitsSold: quantity,
            revenue: lineRevenue,
            cogs: lineCOGS,
            grossProfit: lineRevenue - lineCOGS,
            grossMarginPercentage:
              lineRevenue > 0 ? ((lineRevenue - lineCOGS) / lineRevenue) * 100 : 0
          });
        }
      });
    }
  });

  return Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue);
};

/**
 * Calculate monthly P&L data for chart visualization
 */
export const calculateMonthlySalesData = (invoices: Invoice[]): MonthlySalesData[] => {
  const monthlyData = new Map<string, MonthlySalesData>();
  const last6Months = [];
  const today = new Date();

  // Generate last 6 months
  for (let i = 5; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    last6Months.push({ monthKey, monthName, date });
  }

  // Initialize data structure
  last6Months.forEach(({ monthKey, monthName }) => {
    monthlyData.set(monthKey, {
      month: monthKey,
      monthName,
      revenue: 0,
      cogs: 0,
      grossProfit: 0,
      invoiceCount: 0,
      uniqueCustomers: 0
    });
  });

  // Populate with invoice data
  invoices.forEach(inv => {
    const invDate = new Date(inv.invoice_date);
    const monthKey = `${invDate.getFullYear()}-${String(invDate.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyData.has(monthKey)) {
      const monthName = invDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthlyData.set(monthKey, {
        month: monthKey,
        monthName,
        revenue: 0,
        cogs: 0,
        grossProfit: 0,
        invoiceCount: 0,
        uniqueCustomers: 0
      });
    }

    const monthData = monthlyData.get(monthKey)!;
    monthData.revenue += inv.total_amount || 0;
    monthData.invoiceCount += 1;

    // Add customer if not already counted
    if (inv.customer_id) {
      const customersSet = new Set(monthData.uniqueCustomers.toString().split(',').filter(Boolean));
      customersSet.add(inv.customer_id);
      monthData.uniqueCustomers = customersSet.size;
    }

    // Calculate COGS for this invoice
    if (inv.invoice_items && Array.isArray(inv.invoice_items)) {
      inv.invoice_items.forEach(item => {
        const cost = item.products?.cost_price || 0;
        monthData.cogs += (item.quantity || 0) * cost;
      });
    }

    monthData.grossProfit = monthData.revenue - monthData.cogs;
  });

  // Return only last 6 months in order
  return last6Months
    .map(({ monthKey }) => monthlyData.get(monthKey)!)
    .filter(data => data !== undefined);
};

/**
 * Format currency to KES (Kenyan Shillings)
 */
export const formatCurrency = (amount: number): string => {
  // Handle NaN, Infinity, undefined, or null values
  if (!isFinite(amount)) {
    return 'Ksh 0';
  }

  const validAmount = typeof amount === 'number' ? amount : 0;

  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(validAmount);
};

/**
 * Format percentage to string
 */
export const formatPercentage = (value: number, decimals: number = 2): string => {
  // Handle NaN, Infinity, undefined, or null values
  if (!isFinite(value)) {
    return '0%';
  }

  const validValue = typeof value === 'number' ? value : 0;
  return `${validValue.toFixed(decimals)}%`;
};
