/**
 * Transport P&L (Profit & Loss) Calculator
 * Computes revenue, operational expenses, and profit metrics from transport operations
 */

export interface TransportRevenue {
  id: string;
  date: string;
  description: string;
  sellingPrice: number;
  route?: string;
  vehicleId?: string;
}

export interface TransportExpense {
  id: string;
  type: 'driver_fee' | 'vehicle_maintenance' | 'fuel' | 'other';
  amount: number;
  date: string;
  description?: string;
  vehicleId?: string;
  driverId?: string;
}

export interface TransportFinance {
  id: string;
  date: string;
  selling_price: number;
  driver_fees: number;
  other_expenses: number;
  vehicle_id?: string;
  route?: string;
}

export interface TransportPLMetrics {
  periodStart: string;
  periodEnd: string;
  revenue: number;
  driverFees: number;
  otherExpenses: number;
  totalExpenses: number;
  operatingProfit: number;
  operatingMarginPercentage: number;
  tripCount: number;
  averageRevenuePerTrip: number;
  averageExpensePerTrip: number;
  profitPerTrip: number;
}

export interface VehiclePerformance {
  vehicleId: string;
  vehicleName: string;
  tripCount: number;
  revenue: number;
  driverFees: number;
  otherExpenses: number;
  totalExpenses: number;
  operatingProfit: number;
  profitMarginPercentage: number;
  averageRevenuePerTrip: number;
}

export interface MonthlyTransportData {
  month: string;
  monthName: string;
  revenue: number;
  driverFees: number;
  otherExpenses: number;
  totalExpenses: number;
  operatingProfit: number;
  tripCount: number;
}

/**
 * Calculate total revenue from transport operations
 */
export const calculateTransportRevenue = (
  transports: TransportFinance[],
  startDate?: Date,
  endDate?: Date
): number => {
  return transports
    .filter(t => {
      if (!startDate || !endDate) return true;
      const tDate = new Date(t.date);
      return tDate >= startDate && tDate <= endDate;
    })
    .reduce((sum, t) => sum + (t.selling_price || 0), 0);
};

/**
 * Calculate total driver fees
 */
export const calculateDriverFees = (
  transports: TransportFinance[],
  startDate?: Date,
  endDate?: Date
): number => {
  return transports
    .filter(t => {
      if (!startDate || !endDate) return true;
      const tDate = new Date(t.date);
      return tDate >= startDate && tDate <= endDate;
    })
    .reduce((sum, t) => sum + (t.driver_fees || 0), 0);
};

/**
 * Calculate total other expenses
 */
export const calculateOtherExpenses = (
  transports: TransportFinance[],
  startDate?: Date,
  endDate?: Date
): number => {
  return transports
    .filter(t => {
      if (!startDate || !endDate) return true;
      const tDate = new Date(t.date);
      return tDate >= startDate && tDate <= endDate;
    })
    .reduce((sum, t) => sum + (t.other_expenses || 0), 0);
};

/**
 * Calculate total operating expenses (driver fees + other expenses)
 */
export const calculateTotalExpenses = (
  transports: TransportFinance[],
  startDate?: Date,
  endDate?: Date
): number => {
  const driverFees = calculateDriverFees(transports, startDate, endDate);
  const otherExpenses = calculateOtherExpenses(transports, startDate, endDate);
  return driverFees + otherExpenses;
};

/**
 * Calculate operating profit (Revenue - Total Expenses)
 */
export const calculateOperatingProfit = (revenue: number, expenses: number): number => {
  return revenue - expenses;
};

/**
 * Calculate operating margin percentage
 */
export const calculateOperatingMarginPercentage = (
  revenue: number,
  expenses: number
): number => {
  if (revenue === 0) return 0;
  return ((revenue - expenses) / revenue) * 100;
};

/**
 * Count total trips
 */
export const getTripCount = (
  transports: TransportFinance[],
  startDate?: Date,
  endDate?: Date
): number => {
  return transports.filter(t => {
    if (!startDate || !endDate) return true;
    const tDate = new Date(t.date);
    return tDate >= startDate && tDate <= endDate;
  }).length;
};

/**
 * Calculate average revenue per trip
 */
export const calculateAverageRevenuePerTrip = (
  transports: TransportFinance[],
  startDate?: Date,
  endDate?: Date
): number => {
  const filtered = transports.filter(t => {
    if (!startDate || !endDate) return true;
    const tDate = new Date(t.date);
    return tDate >= startDate && tDate <= endDate;
  });

  if (filtered.length === 0) return 0;

  const totalRevenue = filtered.reduce((sum, t) => sum + (t.selling_price || 0), 0);
  return totalRevenue / filtered.length;
};

/**
 * Calculate average expense per trip
 */
export const calculateAverageExpensePerTrip = (
  transports: TransportFinance[],
  startDate?: Date,
  endDate?: Date
): number => {
  const filtered = transports.filter(t => {
    if (!startDate || !endDate) return true;
    const tDate = new Date(t.date);
    return tDate >= startDate && tDate <= endDate;
  });

  if (filtered.length === 0) return 0;

  const totalExpenses = filtered.reduce(
    (sum, t) => sum + (t.driver_fees || 0) + (t.other_expenses || 0),
    0
  );
  return totalExpenses / filtered.length;
};

/**
 * Calculate profit per trip
 */
export const calculateProfitPerTrip = (
  averageRevenue: number,
  averageExpense: number
): number => {
  return averageRevenue - averageExpense;
};

/**
 * Calculate complete transport P&L metrics
 */
export const calculateTransportPLMetrics = (
  transports: TransportFinance[],
  startDate: Date,
  endDate: Date
): TransportPLMetrics => {
  const revenue = calculateTransportRevenue(transports, startDate, endDate);
  const driverFees = calculateDriverFees(transports, startDate, endDate);
  const otherExpenses = calculateOtherExpenses(transports, startDate, endDate);
  const totalExpenses = driverFees + otherExpenses;
  const operatingProfit = calculateOperatingProfit(revenue, totalExpenses);
  const operatingMarginPercentage = calculateOperatingMarginPercentage(revenue, totalExpenses);
  const tripCount = getTripCount(transports, startDate, endDate);
  const averageRevenuePerTrip = calculateAverageRevenuePerTrip(transports, startDate, endDate);
  const averageExpensePerTrip = calculateAverageExpensePerTrip(transports, startDate, endDate);
  const profitPerTrip = calculateProfitPerTrip(averageRevenuePerTrip, averageExpensePerTrip);

  return {
    periodStart: startDate.toISOString().split('T')[0],
    periodEnd: endDate.toISOString().split('T')[0],
    revenue,
    driverFees,
    otherExpenses,
    totalExpenses,
    operatingProfit,
    operatingMarginPercentage,
    tripCount,
    averageRevenuePerTrip,
    averageExpensePerTrip,
    profitPerTrip
  };
};

/**
 * Calculate vehicle-level performance metrics
 */
export const calculateVehiclePerformance = (
  transports: TransportFinance[],
  startDate?: Date,
  endDate?: Date
): VehiclePerformance[] => {
  const vehicleMap = new Map<string, VehiclePerformance>();

  transports.forEach(t => {
    if (startDate && endDate) {
      const tDate = new Date(t.date);
      if (tDate < startDate || tDate > endDate) return;
    }

    const vehicleId = t.vehicle_id || 'unknown';
    const vehicleName = t.vehicle_id || `Vehicle ${vehicleId}`;

    if (vehicleMap.has(vehicleId)) {
      const existing = vehicleMap.get(vehicleId)!;
      existing.tripCount += 1;
      existing.revenue += t.selling_price || 0;
      existing.driverFees += t.driver_fees || 0;
      existing.otherExpenses += t.other_expenses || 0;
      existing.totalExpenses = existing.driverFees + existing.otherExpenses;
      existing.operatingProfit = existing.revenue - existing.totalExpenses;
      existing.profitMarginPercentage =
        existing.revenue > 0 ? (existing.operatingProfit / existing.revenue) * 100 : 0;
      existing.averageRevenuePerTrip = existing.revenue / existing.tripCount;
    } else {
      const revenue = t.selling_price || 0;
      const driverFees = t.driver_fees || 0;
      const otherExpenses = t.other_expenses || 0;
      const totalExpenses = driverFees + otherExpenses;
      const operatingProfit = revenue - totalExpenses;

      vehicleMap.set(vehicleId, {
        vehicleId,
        vehicleName,
        tripCount: 1,
        revenue,
        driverFees,
        otherExpenses,
        totalExpenses,
        operatingProfit,
        profitMarginPercentage:
          revenue > 0 ? (operatingProfit / revenue) * 100 : 0,
        averageRevenuePerTrip: revenue
      });
    }
  });

  return Array.from(vehicleMap.values()).sort((a, b) => b.revenue - a.revenue);
};

/**
 * Calculate monthly transport data for chart visualization
 */
export const calculateMonthlyTransportData = (transports: TransportFinance[]): MonthlyTransportData[] => {
  const monthlyData = new Map<string, MonthlyTransportData>();
  const last6Months = [];
  const today = new Date();

  // Generate last 6 months
  for (let i = 5; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    last6Months.push({ monthKey, monthName });
  }

  // Initialize data structure
  last6Months.forEach(({ monthKey, monthName }) => {
    monthlyData.set(monthKey, {
      month: monthKey,
      monthName,
      revenue: 0,
      driverFees: 0,
      otherExpenses: 0,
      totalExpenses: 0,
      operatingProfit: 0,
      tripCount: 0
    });
  });

  // Populate with transport data
  transports.forEach(t => {
    const tDate = new Date(t.date);
    const monthKey = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyData.has(monthKey)) {
      const monthName = tDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthlyData.set(monthKey, {
        month: monthKey,
        monthName,
        revenue: 0,
        driverFees: 0,
        otherExpenses: 0,
        totalExpenses: 0,
        operatingProfit: 0,
        tripCount: 0
      });
    }

    const monthData = monthlyData.get(monthKey)!;
    monthData.revenue += t.selling_price || 0;
    monthData.driverFees += t.driver_fees || 0;
    monthData.otherExpenses += t.other_expenses || 0;
    monthData.totalExpenses = monthData.driverFees + monthData.otherExpenses;
    monthData.operatingProfit = monthData.revenue - monthData.totalExpenses;
    monthData.tripCount += 1;
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
