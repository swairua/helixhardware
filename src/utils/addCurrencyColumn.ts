/**
 * ADD CURRENCY COLUMN - DISABLED
 *
 * This module attempted to alter table schema using Supabase RPC,
 * which is not available with external MySQL API.
 *
 * To add currency support:
 * 1. Modify PHP backend code
 * 2. Use MySQL ALTER TABLE commands directly
 * 3. Implement custom API endpoint for schema modifications
 */

export const ADD_CURRENCY_COLUMN_SQL = `
ALTER TABLE companies ADD COLUMN currency VARCHAR(3) DEFAULT 'USD' AFTER country;
ALTER TABLE invoices ADD COLUMN currency VARCHAR(3) DEFAULT 'USD' AFTER invoice_date;
ALTER TABLE quotations ADD COLUMN currency VARCHAR(3) DEFAULT 'USD' AFTER quotation_date;
`;

export async function addCurrencyColumn() {
  console.warn('⚠️ addCurrencyColumn is disabled');
  return {
    success: false,
    message: 'Please execute SQL directly or ask backend administrator'
  };
}
