export interface AuditIssue {
  recordId: string;
  type: 'profit_calculation' | 'payment_status' | 'missing_reference' | 'null_field' | 'duplicate';
  severity: 'error' | 'warning';
  field?: string;
  message: string;
  expectedValue?: unknown;
  actualValue?: unknown;
}

export interface AuditReport {
  totalRecords: number;
  issuesFound: number;
  issues: AuditIssue[];
  summary: {
    profitCalculationErrors: number;
    paymentStatusMismatches: number;
    missingReferences: number;
    nullFieldErrors: number;
    duplicateErrors: number;
  };
}

interface TransportFinanceRecord {
  id: string;
  vehicle_id?: string;
  material_id?: string;
  buying_price?: number;
  fuel_cost?: number;
  driver_fees?: number;
  other_expenses?: number;
  selling_price?: number;
  profit_loss?: number;
  payment_status?: 'paid' | 'unpaid' | 'pending';
  customer_name?: string;
  date?: string;
}

interface TransportPaymentRecord {
  id: string | number;
  trip_id: string | number;
  amount?: number;
  payment_amount?: number;
  payment_status?: string;
  date?: string;
  payment_date?: string;
}

export function validateFinanceRecord(
  record: TransportFinanceRecord,
  payments: TransportPaymentRecord[] = [],
  vehicles: { id: string }[] = [],
  materials: { id: string }[] = []
): AuditIssue[] {
  const issues: AuditIssue[] = [];

  // Check 1: Validate profit calculation
  const expectedProfit =
    (record.selling_price || 0) -
    ((record.buying_price || 0) +
      (record.fuel_cost || 0) +
      (record.driver_fees || 0) +
      (record.other_expenses || 0));

  if (record.profit_loss !== undefined && Math.abs(record.profit_loss - expectedProfit) > 0.01) {
    issues.push({
      recordId: record.id,
      type: 'profit_calculation',
      severity: 'error',
      field: 'profit_loss',
      message: `Profit calculation error: expected ${expectedProfit.toFixed(2)}, got ${record.profit_loss.toFixed(2)}`,
      expectedValue: expectedProfit,
      actualValue: record.profit_loss
    });
  }

  // Check 2: Validate vehicle reference exists
  if (record.vehicle_id && !vehicles.some(v => v.id === record.vehicle_id)) {
    issues.push({
      recordId: record.id,
      type: 'missing_reference',
      severity: 'error',
      field: 'vehicle_id',
      message: `Vehicle reference not found: ${record.vehicle_id}`,
      actualValue: record.vehicle_id
    });
  }

  // Check 4: Validate material reference exists
  if (record.material_id && !materials.some(m => m.id === record.material_id)) {
    issues.push({
      recordId: record.id,
      type: 'missing_reference',
      severity: 'error',
      field: 'material_id',
      message: `Material reference not found: ${record.material_id}`,
      actualValue: record.material_id
    });
  }

  // Check 5: Required fields
  const requiredFields = ['vehicle_id', 'material_id', 'buying_price', 'selling_price'];
  for (const field of requiredFields) {
    const value = record[field as keyof TransportFinanceRecord];
    if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
      issues.push({
        recordId: record.id,
        type: 'null_field',
        severity: 'error',
        field,
        message: `Required field is missing: ${field}`,
        actualValue: value
      });
    }
  }

  return issues;
}

export function generateAuditReport(
  finances: TransportFinanceRecord[],
  payments: TransportPaymentRecord[] = [],
  vehicles: { id: string }[] = [],
  materials: { id: string }[] = []
): AuditReport {
  const allIssues: AuditIssue[] = [];

  // Validate each finance record
  for (const finance of finances) {
    const recordIssues = validateFinanceRecord(finance, payments, vehicles, materials);
    allIssues.push(...recordIssues);
  }

  // Count issues by type
  const summary = {
    profitCalculationErrors: allIssues.filter(i => i.type === 'profit_calculation').length,
    paymentStatusMismatches: allIssues.filter(i => i.type === 'payment_status').length,
    missingReferences: allIssues.filter(i => i.type === 'missing_reference').length,
    nullFieldErrors: allIssues.filter(i => i.type === 'null_field').length,
    duplicateErrors: allIssues.filter(i => i.type === 'duplicate').length
  };

  return {
    totalRecords: finances.length,
    issuesFound: allIssues.length,
    issues: allIssues,
    summary
  };
}
