import { toast } from 'sonner';

export interface TransportFinanceRecord {
  id: string;
  company_id: string;
  vehicle_id?: string;
  material_id?: string;
  buying_price?: number;
  fuel_cost?: number;
  driver_fees?: number;
  other_expenses?: number;
  selling_price?: number;
  profit_loss?: number;
  payment_status?: string;
  customer_name?: string;
  date?: string;
}

export interface TransportPaymentRecord {
  id: string;
  trip_id?: string;
  amount?: number;
  payment_date?: string;
  payment_method?: string;
  reference_number?: string;
}

export interface RepairResult {
  recordId: string;
  changes: Record<string, unknown>;
  fixed: boolean;
}

/**
 * Fix profit calculation for a finance record
 */
export function fixProfitCalculation(record: TransportFinanceRecord): TransportFinanceRecord {
  const expectedProfit =
    (record.selling_price || 0) -
    ((record.buying_price || 0) +
      (record.fuel_cost || 0) +
      (record.driver_fees || 0) +
      (record.other_expenses || 0));

  return {
    ...record,
    profit_loss: expectedProfit
  };
}

/**
 * Fix payment status based on related payments
 */
export function fixPaymentStatus(
  record: TransportFinanceRecord,
  payments: TransportPaymentRecord[] = []
): TransportFinanceRecord {
  const relatedPayments = payments.filter(p => p.trip_id === record.id);
  const totalPaid = relatedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const expectedStatus = totalPaid >= (record.selling_price || 0) ? 'paid' : 'unpaid';

  return {
    ...record,
    payment_status: expectedStatus
  };
}

/**
 * Ensure all required fields are present
 */
export function ensureRequiredFields(
  record: TransportFinanceRecord,
  defaultVehicleId?: string,
  defaultMaterialId?: string
): TransportFinanceRecord {
  return {
    ...record,
    vehicle_id: record.vehicle_id || defaultVehicleId || 'unknown',
    material_id: record.material_id || defaultMaterialId || 'unknown',
    buying_price: record.buying_price || 0,
    selling_price: record.selling_price || 0,
    date: record.date || new Date().toISOString().split('T')[0]
  };
}

/**
 * Apply all repairs to a finance record
 */
export function repairFinanceRecord(
  record: TransportFinanceRecord,
  payments: TransportPaymentRecord[] = [],
  defaultVehicleId?: string,
  defaultMaterialId?: string
): { repaired: TransportFinanceRecord; changes: Record<string, unknown> } {
  const changes: Record<string, unknown> = {};
  let repaired = { ...record };

  // Step 1: Ensure required fields
  const withRequired = ensureRequiredFields(record, defaultVehicleId, defaultMaterialId);
  if (JSON.stringify(withRequired) !== JSON.stringify(record)) {
    Object.keys(withRequired).forEach(key => {
      if (withRequired[key as keyof typeof withRequired] !== record[key as keyof typeof record]) {
        changes[key] = withRequired[key as keyof typeof withRequired];
      }
    });
    repaired = withRequired;
  }

  // Step 2: Fix profit calculation
  const withProfit = fixProfitCalculation(repaired);
  if (withProfit.profit_loss !== repaired.profit_loss) {
    changes['profit_loss'] = withProfit.profit_loss;
    repaired = withProfit;
  }

  // Step 3: Fix payment status
  const withPaymentStatus = fixPaymentStatus(repaired, payments);
  if (withPaymentStatus.payment_status !== repaired.payment_status) {
    changes['payment_status'] = withPaymentStatus.payment_status;
    repaired = withPaymentStatus;
  }

  return { repaired, changes };
}

/**
 * Repair all finance records
 */
export function repairAllFinanceRecords(
  records: TransportFinanceRecord[],
  payments: TransportPaymentRecord[] = [],
  defaultVehicleId?: string,
  defaultMaterialId?: string
): RepairResult[] {
  return records.map(record => {
    const { repaired, changes } = repairFinanceRecord(
      record,
      payments,
      defaultVehicleId,
      defaultMaterialId
    );

    return {
      recordId: record.id,
      changes,
      fixed: Object.keys(changes).length > 0
    };
  });
}

/**
 * Generate summary of repairs made
 */
export function generateRepairSummary(results: RepairResult[]): {
  totalRecords: number;
  fixedRecords: number;
  fixedIssues: number;
  summary: Record<string, number>;
} {
  const fixedRecords = results.filter(r => r.fixed).length;
  const summary: Record<string, number> = {};

  results.forEach(result => {
    Object.keys(result.changes).forEach(field => {
      summary[field] = (summary[field] || 0) + 1;
    });
  });

  return {
    totalRecords: results.length,
    fixedRecords,
    fixedIssues: Object.values(summary).reduce((a, b) => a + b, 0),
    summary
  };
}
