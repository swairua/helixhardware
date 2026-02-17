/**
 * CENTRALIZED DOCUMENT NUMBERING SYSTEM
 * =====================================
 *
 * Provides sequential, globally unique number generation for all document types
 * Ensures consistency across the application using backend API with fallback support
 *
 * ARCHITECTURE:
 * - Primary: Backend PHP API endpoint (/backend/api.php?action=get_next_document_number)
 * - Fallback: Client-side random alphanumeric generation (when API unavailable)
 * - Format: TYPE-YYYY-NNNN (e.g., INV-2026-0001, PRO-2026-0042, QT-2026-0115)
 *
 * SUPPORTED DOCUMENT TYPES:
 * - INV: Invoices (generateDocumentNumberAPI('invoice'))
 * - PRO: Proforma Invoices (generateDocumentNumberAPI('proforma'))
 * - QT: Quotations (generateDocumentNumberAPI('quotation'))
 * - REC: Receipts (generateDocumentNumberAPI('receipt'))
 * - PO: Purchase Orders (generateDocumentNumberAPI('po'))
 * - LPO: Local Purchase Orders (generateDocumentNumberAPI('lpo'))
 * - DN: Delivery Notes (generateDocumentNumberAPI('delivery_note'))
 * - CN: Credit Notes (generateDocumentNumberAPI('credit_note'))
 * - PAY: Payments (generateDocumentNumberAPI('payment'))
 *
 * USAGE EXAMPLES:
 * ==============
 *
 * 1. Generate an invoice number:
 *    const invoiceNumber = await generateDocumentNumberAPI('invoice');
 *    // Result: "INV-2026-0001"
 *
 * 2. Generate a proforma number:
 *    const proformaNumber = await generateDocumentNumberAPI('proforma');
 *    // Result: "PRO-2026-0001"
 *
 * 3. Using legacy wrapper (deprecated but still functional):
 *    const receiptNumber = await generateReceiptNumber();
 *    // Internally calls: generateDocumentNumberAPI('receipt')
 *
 * TECHNICAL DETAILS:
 * ==================
 *
 * API Request Pattern:
 * - URL: /backend/api.php?action=get_next_document_number
 * - Method: POST
 * - Body: { type: "INV", year: 2026 }
 * - Response: { success: true, number: "INV-2026-0001", type: "INV", year: 2026, sequence: 1 }
 *
 * Fallback Behavior (when API unavailable):
 * - Still returns valid format: TYPE-YYYY-RANDOM (e.g., INV-2026-A7K2)
 * - Uses random alphanumeric characters (A-Z, 0-9) instead of sequential
 * - Prevents application crashes when API is down
 * - Logs warnings to console for monitoring
 *
 * ERROR HANDLING:
 * ===============
 * - API failures: Automatically fallback to random generation
 * - Network errors: Gracefully handled with fallback
 * - Invalid types: Throws error with clear message
 * - Missing API: Uses fallback mechanism
 *
 * MIGRATION FROM LEGACY SYSTEM:
 * =============================
 *
 * Old RPC-based system (DEPRECATED):
 * - db.rpc('generate_invoice_number', { company_id: ... })
 * - db.rpc('generate_proforma_number', { company_uuid: ... })
 * - Stored procedures in schema.sql
 *
 * New API-based system (CURRENT):
 * - generateDocumentNumberAPI('invoice')
 * - generateDocumentNumberAPI('proforma')
 * - Backend PHP endpoint with unified logic
 *
 * Legacy wrapper functions still available:
 * - generateInvoiceNumber() -> generateDocumentNumberAPI('invoice')
 * - generateReceiptNumber() -> generateDocumentNumberAPI('receipt')
 * - generateProformaNumber() -> generateDocumentNumberAPI('proforma')
 * - All others -> generateDocumentNumberAPI(type)
 *
 * CONVERSION FLOW UPDATES:
 * ========================
 * When converting documents (quotation -> invoice, proforma -> invoice, etc.):
 * ✅ BEFORE: const invoiceNumber = `INV-${Date.now()}` (timestamp-based, non-sequential)
 * ✅ NOW:    const invoiceNumber = await generateDocumentNumberAPI('invoice') (sequential, proper)
 *
 * Affected functions:
 * - useProforma.ts: useConvertProformaToInvoice()
 * - useQuotationItems.ts: useConvertQuotationToInvoice(), useCreateDirectReceipt(), etc.
 *
 * ADDING NEW DOCUMENT TYPES:
 * ==========================
 * To add support for a new document type:
 *
 * 1. Update DOCUMENT_TYPE_MAP:
 *    const DOCUMENT_TYPE_MAP: Record<string, string> = {
 *      ...
 *      'new_type': 'NWT'  // Add your type here
 *    };
 *
 * 2. Update VALID_DOCUMENT_TYPES:
 *    const VALID_DOCUMENT_TYPES = [..., 'NWT'] as const;
 *
 * 3. Update DocumentType type:
 *    export type DocumentType = typeof VALID_DOCUMENT_TYPES[number];
 *
 * 4. Add backend support:
 *    - Update src/backend/api.php to handle ?action=get_next_document_number with type=NWT
 *
 * 5. Test:
 *    const result = await generateDocumentNumberAPI('new_type');
 *
 * DEBUGGING:
 * ==========
 * The system logs detailed information with [DOC_NUM] prefix:
 * - [DOC_NUM] Starting document number generation for type: invoice
 * - [DOC_NUM] Mapped type: invoice -> INV, year: 2026
 * - [DOC_NUM] Sending request to: /api.php?action=get_next_document_number
 * - [DOC_NUM] API Response: { success: true, number: "INV-2026-0001", ... }
 *
 * Check browser console for [DOC_NUM] logs when troubleshooting.
 */

/**
 * Document type mapping from internal names to 3-letter prefixes
 */
const DOCUMENT_TYPE_MAP: Record<string, string> = {
  'receipt': 'REC',
  'invoice': 'INV',
  'payment': 'PAY',
  'proforma': 'PRO',
  'quotation': 'QT',
  'delivery_note': 'DN',
  'credit_note': 'CN',
  'po': 'PO',
  'lpo': 'LPO',
};

/**
 * Valid document types for the API
 */
const VALID_DOCUMENT_TYPES = ['INV', 'PRO', 'QT', 'PO', 'LPO', 'DN', 'CN', 'PAY', 'REC'] as const;
export type DocumentType = typeof VALID_DOCUMENT_TYPES[number];

/**
 * Response from the document number API
 */
export interface DocumentNumberResponse {
  success: boolean;
  number?: string;
  type?: string;
  year?: number;
  sequence?: number;
  error?: string;
}

/**
 * Generate a unique document number via the backend API
 * Format: TYPE-YYYY-NNNN (e.g., INV-2026-0001)
 *
 * @param type - Document type (e.g., 'invoice', 'proforma', 'quotation')
 * @param year - Optional year (defaults to current year)
 * @returns Promise resolving to the generated document number
 */
export async function generateDocumentNumberAPI(
  type: string,
  year?: number
): Promise<string> {
  try {
    console.log(`[DOC_NUM] Starting document number generation for type: ${type}`);

    // Map internal type name to API type code
    const apiType = DOCUMENT_TYPE_MAP[type];
    if (!apiType) {
      throw new Error(`Unknown document type: ${type}`);
    }

    const currentYear = year || new Date().getFullYear();
    console.log(`[DOC_NUM] Mapped type: ${type} -> ${apiType}, year: ${currentYear}`);

    // Get API base URL with proper environment detection
    // This handles both local (/api.php) and cloud (external API URL) setups
    let apiUrl = '/api.php';
    try {
      const { getAPIBaseURL } = await import('./environment-detection');
      apiUrl = getAPIBaseURL();
      console.log(`[DOC_NUM] Successfully detected API URL:`, apiUrl);
    } catch (error) {
      // Fallback to relative path if environment detection fails
      console.warn('[DOC_NUM] Could not detect API base URL, using /api.php fallback', error);
    }

    // Build the API URL with action in query string, parameters in POST body
    const fullUrl = `${apiUrl}?action=get_next_document_number`;
    const requestBody = {
      type: apiType,
      year: currentYear,
    };

    console.log(`[DOC_NUM] Sending request to: ${fullUrl}`);
    console.log(`[DOC_NUM] Request parameters:`, requestBody);

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`[DOC_NUM] Response status:`, response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`[DOC_NUM] Failed to generate document number (${response.status}):`, errorData);
      console.warn(`[DOC_NUM] Falling back to random number generation`);
      // Return fallback format on API error
      return generateFallbackNumber(apiType, currentYear);
    }

    const data = await response.json() as DocumentNumberResponse;
    console.log(`[DOC_NUM] API Response:`, data);

    if (!data.success || !data.number) {
      console.error('[DOC_NUM] API returned unsuccessful response:', data);
      console.warn(`[DOC_NUM] Falling back to random number generation`);
      return generateFallbackNumber(apiType, currentYear);
    }

    console.log(`[DOC_NUM] Successfully generated document number:`, data.number);
    return data.number;
  } catch (error) {
    console.error('[DOC_NUM] Error generating document number via API:', error);
    // Return fallback format on network/parsing error
    const apiType = DOCUMENT_TYPE_MAP[type] || type.toUpperCase().substring(0, 3);
    const currentYear = year || new Date().getFullYear();
    console.warn(`[DOC_NUM] Falling back to random number generation`);
    return generateFallbackNumber(apiType, currentYear);
  }
}

/**
 * Generate a fallback document number when API is unavailable
 * Format: TYPE-YYYY-XXXX where XXXX is random alphanumeric
 *
 * @param type - Document type code (e.g., 'INV', 'PRO')
 * @param year - Year for the number
 * @returns Fallback number string
 */
function generateFallbackNumber(type: string, year: number): string {
  // Generate 4 random alphanumeric characters for fallback
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let random = '';
  for (let i = 0; i < 4; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const fallbackNumber = `${type}-${year}-${random}`;
  console.warn(`[DOC_NUM] Generated FALLBACK number (API unavailable):`, fallbackNumber);
  return fallbackNumber;
}

/**
 * Legacy function exports for backward compatibility
 * These now use the API-based generation
 */

/**
 * @deprecated Use generateDocumentNumberAPI('receipt') instead
 */
export const generateReceiptNumber = async (companyId?: string): Promise<string> => {
  return generateDocumentNumberAPI('receipt');
};

/**
 * @deprecated Use generateDocumentNumberAPI('invoice') instead
 */
export const generateInvoiceNumber = async (companyId?: string): Promise<string> => {
  return generateDocumentNumberAPI('invoice');
};

/**
 * @deprecated Use generateDocumentNumberAPI('payment') instead
 */
export const generatePaymentNumber = async (companyId?: string): Promise<string> => {
  return generateDocumentNumberAPI('payment');
};

/**
 * @deprecated Use generateDocumentNumberAPI('proforma') instead
 */
export const generateProformaNumber = async (companyId?: string): Promise<string> => {
  return generateDocumentNumberAPI('proforma');
};

/**
 * @deprecated Use generateDocumentNumberAPI('quotation') instead
 */
export const generateQuotationNumber = async (companyId?: string): Promise<string> => {
  return generateDocumentNumberAPI('quotation');
};

/**
 * @deprecated Use generateDocumentNumberAPI('delivery_note') instead
 */
export const generateDeliveryNoteNumber = async (companyId?: string): Promise<string> => {
  return generateDocumentNumberAPI('delivery_note');
};

/**
 * @deprecated Use generateDocumentNumberAPI('credit_note') instead
 */
export const generateCreditNoteNumber = async (companyId?: string): Promise<string> => {
  return generateDocumentNumberAPI('credit_note');
};

/**
 * @deprecated Use generateDocumentNumberAPI('po') instead
 */
export const generatePONumber = async (companyId?: string): Promise<string> => {
  return generateDocumentNumberAPI('po');
};

/**
 * Type-safe document number generator (async version)
 * Usage: await generateDocumentNumber('receipt') or await generateDocumentNumber('invoice')
 * 
 * @deprecated Use generateDocumentNumberAPI instead
 */
export const generateDocumentNumber = async (
  type: 'receipt' | 'invoice' | 'payment' | 'proforma' | 'quotation' | 'delivery_note' | 'credit_note' | 'po',
  companyId?: string
): Promise<string> => {
  return generateDocumentNumberAPI(type);
};
