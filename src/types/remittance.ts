// Remittance Advice TypeScript Interfaces
// Aligned with database schema: remittance_advice and remittance_advice_items tables

/**
 * RemittanceAdvice - Mapped directly to remittance_advice table
 * Represents payment advice sent to suppliers
 */
export interface RemittanceAdvice {
  id: number;
  company_id: number;
  supplier_id: number | null;
  remittance_number: string;
  total_amount: number;
  created_at?: string;

  // Related data (from joins)
  suppliers?: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    contact_person?: string;
  };

  remittance_advice_items?: RemittanceAdviceItem[];
}

/**
 * RemittanceAdviceItem - Mapped directly to remittance_advice_items table
 * Represents individual line items in a remittance advice
 */
export interface RemittanceAdviceItem {
  id: number;
  remittance_id: number;
  invoice_number: string | null;
  amount: number;
}

/**
 * Form data interfaces for UI components
 * Used for creating/editing remittance advice in the UI
 */
export interface RemittanceAdviceFormData {
  supplier_id: number;
  remittance_number: string;
  total_amount: number;
}

export interface RemittanceAdviceItemFormData {
  invoice_number: string;
  amount: number;
}

/**
 * API request/response types
 * Used for API communication
 */
export interface CreateRemittanceAdviceRequest {
  company_id: number;
  supplier_id: number;
  remittance_number: string;
  total_amount: number;
  items: Omit<RemittanceAdviceItem, 'id' | 'remittance_id'>[];
}

export interface UpdateRemittanceAdviceRequest extends Partial<Omit<RemittanceAdvice, 'id' | 'company_id' | 'created_at'>> {
  id: number;
}
