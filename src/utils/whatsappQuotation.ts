/**
 * WhatsApp Quotation Utility
 * Standardized function for generating WhatsApp quotation request URLs
 */

export interface QuotationRequestDetails {
  productName: string;
  productSku?: string;
  category?: string;
  quantity: string | number;
  companyName: string;
  contactPerson?: string;
  email: string;
  phone: string;
  additionalNotes?: string;
}

const WHATSAPP_PHONE = '254713416022';

/**
 * Generate a WhatsApp quotation request URL
 * Uses wa.me endpoint with formatted message including product and customer details
 */
export const generateWhatsAppQuotationUrl = (details: QuotationRequestDetails): string => {
  const message = formatQuotationMessage(details);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodedMessage}`;
};

/**
 * Format quotation request message with all details
 */
export const formatQuotationMessage = (details: QuotationRequestDetails): string => {
  const lines: string[] = ['*QUOTATION REQUEST*', '━━━━━━━━━━━━━━━━━━━━━━'];

  // Product Details
  lines.push('');
  lines.push('*Product Details:*');
  lines.push(`Product: ${details.productName}`);
  if (details.productSku) {
    lines.push(`SKU: ${details.productSku}`);
  }
  if (details.category) {
    lines.push(`Category: ${details.category}`);
  }

  // Order Details
  lines.push('');
  lines.push('*Order Details:*');
  lines.push(`Quantity: ${details.quantity} units`);

  // Customer Details
  lines.push('');
  lines.push('*Customer Information:*');
  lines.push(`Company/Institution: ${details.companyName}`);
  if (details.contactPerson) {
    lines.push(`Contact Person: ${details.contactPerson}`);
  }
  lines.push(`Email: ${details.email}`);
  lines.push(`Phone: ${details.phone}`);

  // Additional Notes
  if (details.additionalNotes) {
    lines.push('');
    lines.push('*Additional Notes:*');
    lines.push(details.additionalNotes);
  }

  lines.push('');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('Please provide a quotation for the above product with pricing and delivery terms.');

  return lines.join('\n');
};

/**
 * Open WhatsApp with quotation request
 */
export const openWhatsAppQuotation = (details: QuotationRequestDetails): void => {
  const url = generateWhatsAppQuotationUrl(details);
  window.open(url, '_blank');
};
