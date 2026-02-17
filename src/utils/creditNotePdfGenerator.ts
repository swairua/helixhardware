import type { CreditNote } from '@/hooks/useCreditNotes';
import { lightenColor, getColorAsHslVar } from './colorUtils';

export interface CreditNotePDFData extends CreditNote {
  customers: {
    name: string;
    email?: string;
    phone?: string;
    customer_code: string;
    address?: string;
    city?: string;
    country?: string;
  };
  credit_note_items?: Array<{
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    tax_percentage: number;
    tax_amount: number;
    line_total: number;
    products?: {
      name: string;
      product_code: string;
    };
  }>;
  invoices?: {
    invoice_number: string;
  };
}

export interface CompanyData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  logo_url?: string;
}

// Default company details (fallback) - logo will be determined dynamically
const DEFAULT_COMPANY: CompanyData = {
  name: 'Medical Supplies',
  address: '',
  city: 'Nairobi',
  country: 'Kenya',
  phone: '',
  email: 'info@medplusafrica.com',
  logo_url: 'https://cdn.builder.io/api/v1/image/assets%2Ffd1c9d5781fc4f20b6ad16683f5b85b3%2F274fc62c033e464584b0f50713695127?format=webp&width=800'
};

export const generateCreditNotePDF = (creditNote: CreditNotePDFData, company?: CompanyData) => {
  const companyData = company || DEFAULT_COMPANY;

  // Get primary color from company settings, with fallback to orange
  const primaryColor = (company as any)?.primary_color || '#FF8C42';
  const primaryColorLight = lightenColor(primaryColor, 25);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Could not open print window. Please allow popups.');
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Credit Note ${creditNote.credit_note_number}</title>
      <meta charset="UTF-8">
      <style>
        @page {
          size: A4;
          margin: 15mm;
        }
        
        * {
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Arial', sans-serif;
          margin: 0;
          padding: 0;
          color: #333;
          line-height: 1.4;
          font-size: 12px;
          background: white;
        }
        
        .page {
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          background: white;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          padding: 20mm;
          position: relative;
        }
        
        .header {
          display: grid;
          grid-template-columns: 1fr;
          grid-template-rows: auto auto;
          margin-bottom: 30px;
          gap: 20px;
        }
        
        .header-row-1 {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 20px;
          align-items: flex-start;
          padding-bottom: 20px;
          border-bottom: 2px solid ${primaryColor};
        }
        
        .header-row-2 {
          display: grid;
          grid-template-columns: 50% 50%;
          gap: 20px;
        }
        
        .company-info {
          display: contents;
        }
        
        .logo {
          width: 100%;
          height: 120px;
          border-radius: 8px;
          overflow: hidden;
          grid-column: 1;
          grid-row: 1;
          justify-self: start;
          align-self: start;
        }
        
        .logo img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        
        .company-details-block {
          grid-column: 2;
          grid-row: 1;
        }
        
        .company-name {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 8px;
          color: ${primaryColor};
        }
        
        .company-details {
          font-size: 10px;
          line-height: 1.6;
          color: #666;
          margin-bottom: 0;
        }
        
        .document-info {
          text-align: right;
          width: 100%;
        }
        
        .customer-info-block {
          text-align: left;
          width: 100%;
        }
        
        .document-title {
          font-size: 22px;
          font-weight: bold;
          margin: 0 0 12px 0;
          color: ${primaryColor};
          text-transform: uppercase;
          letter-spacing: 1px;
          text-align: right;
        }
        
        .document-details {
          background: transparent;
          padding: 0;
          border-radius: 0;
          border: none;
          text-align: right;
        }
        
        .document-details table {
          width: 100%;
          border-collapse: collapse;
          line-height: 1.4;
        }
        
        .document-details td {
          padding: 2px 0;
          border: none;
          font-size: 10px;
        }
        
        .document-details .label {
          font-weight: bold;
          color: #666;
          text-align: right;
          padding-right: 10px;
          width: auto;
        }
        
        .document-details .value {
          text-align: right;
          color: #212529;
          font-weight: normal;
        }
        
        .section-title {
          font-size: 11px;
          font-weight: bold;
          color: ${primaryColor};
          margin: 0 0 8px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .customer-name {
          font-size: 13px;
          font-weight: bold;
          margin-bottom: 4px;
          color: #212529;
        }
        
        .customer-details, .related-details {
          font-size: 10px;
          color: #666;
          line-height: 1.4;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        
        .items-section {
          margin: 30px 0;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          font-size: 11px;
          border: 2px solid ${primaryColor};
          border-radius: 8px;
          overflow: hidden;
          table-layout: auto;
        }

        .items-table thead {
          background: ${primaryColor};
          color: white;
        }
        
        .items-table th {
          padding: 8px 8px;
          text-align: center;
          font-weight: bold;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-right: 1px solid rgba(255,255,255,0.2);
          word-break: break-word;
        }
        
        .items-table th:last-child {
          border-right: none;
        }
        
        .items-table td {
          padding: 6px 8px;
          border-bottom: 1px solid #e9ecef;
          border-right: 1px solid #e9ecef;
          text-align: center;
          vertical-align: middle;
          word-wrap: break-word;
          overflow-wrap: break-word;
          hyphens: auto;
        }
        
        .items-table td:last-child {
          border-right: none;
        }
        
        .items-table tbody tr:last-child td {
          border-bottom: none;
        }
        
        .items-table tbody tr:nth-child(even) {
          background: #f8f9fa;
        }
        
        .items-table tbody tr:hover {
          background: #e3f2fd;
        }
        
        .description-cell {
          text-align: left !important;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        
        .amount-cell {
          text-align: right !important;
          font-weight: 500;
          white-space: nowrap;
        }

        .center {
          text-align: center !important;
        }
        
        .totals-section {
          margin-top: 20px;
          display: flex;
          justify-content: flex-end;
        }
        
        .totals-table {
          width: 300px;
          border-collapse: collapse;
          font-size: 12px;
        }
        
        .totals-table td {
          padding: 8px 15px;
          border: none;
        }
        
        .totals-table .label {
          text-align: left;
          color: #495057;
          font-weight: 500;
        }
        
        .totals-table .amount {
          text-align: right;
          font-weight: 600;
          color: #212529;
        }
        
        .totals-table .subtotal-row {
          border-top: 1px solid #dee2e6;
        }
        
        .totals-table .total-row {
          border-top: 2px solid ${primaryColor};
          background: #f8f9fa;
        }

        .totals-table .total-row .label {
          font-size: 14px;
          font-weight: bold;
          color: ${primaryColor};
        }

        .totals-table .total-row .amount {
          font-size: 16px;
          font-weight: bold;
          color: ${primaryColor};
        }
        
        .footer {
          position: absolute;
          bottom: 20mm;
          left: 20mm;
          right: 20mm;
          text-align: center;
          font-size: 10px;
          color: #666;
          border-top: 1px solid #e9ecef;
          padding-top: 10px;
        }
        
        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 72px;
          color: color-mix(in srgb, ${primaryColor} 10%, transparent);
          font-weight: bold;
          z-index: -1;
          pointer-events: none;
          text-transform: uppercase;
          letter-spacing: 5px;
        }
        
        @media print {
          body {
            background: white;
          }
          
          .page {
            box-shadow: none;
            margin: 0;
            padding: 0;
          }
        }
        
        @media screen {
          body {
            background: #f5f5f5;
            padding: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="watermark">Credit Note</div>
        
        <!-- Header Section -->
        <div class="header">
          <!-- Row 1: Logo (20%) + Company Details (80%) -->
          <div class="header-row-1">
            <div class="logo">
              ${companyData.logo_url ?
                `<img src="${companyData.logo_url}" alt="${companyData.name} Logo" onerror="this.style.display='none';" />` :
                `<div style="width:100%; height:100%; background:#f8f9fa; border:2px dashed #e9ecef; display:flex; align-items:center; justify-content:center; font-size:12px; color:#6c757d; text-align:center;">No logo</div>`
              }
            </div>
            <div class="company-details-block">
              <div class="company-name">${companyData.name}</div>
              <div class="company-details">
                ${companyData.tax_number ? `PIN: ${companyData.tax_number}<br>` : ''}
                ${companyData.address ? `${companyData.address}<br>` : ''}
                ${companyData.city ? `${companyData.city}` : ''}${companyData.country ? `, ${companyData.country}` : ''}<br>
                ${companyData.phone ? `Tel: ${companyData.phone}<br>` : ''}
                ${companyData.email ? `Email: ${companyData.email}` : ''}
              </div>
            </div>
          </div>

          <!-- Row 2: Customer Details (50%) + Document Details (50%) -->
          <div class="header-row-2">
            <div class="customer-info-block">
              <div class="section-title">Customer</div>
              <div class="customer-name">${creditNote.customers.name}</div>
              <div class="customer-details">
                ${creditNote.customers.email ? `${creditNote.customers.email}<br>` : ''}
                ${creditNote.customers.phone ? `${creditNote.customers.phone}<br>` : ''}
                ${creditNote.customers.address ? `${creditNote.customers.address}<br>` : ''}
                ${creditNote.customers.city ? `${creditNote.customers.city}` : ''}
                ${creditNote.customers.country ? `, ${creditNote.customers.country}` : ''}<br>
                ${creditNote.customers.customer_code ? `Customer Code: ${creditNote.customers.customer_code}` : ''}
              </div>
            </div>

            <div class="document-info">
              <div class="document-title">Credit Note</div>
              <div class="document-details">
                <table>
                  <tr>
                    <td class="label">Credit Note #:</td>
                    <td class="value">${creditNote.credit_note_number}</td>
                  </tr>
                  <tr>
                    <td class="label">Date:</td>
                    <td class="value">${formatDate(creditNote.credit_note_date)}</td>
                  </tr>
                  <tr>
                    <td class="label">Status:</td>
                    <td class="value">${creditNote.status.toUpperCase()}</td>
                  </tr>
                  <tr>
                    <td class="label">Amount:</td>
                    <td class="value" style="font-weight: bold; color: #2BB673;">${formatCurrency(creditNote.total_amount)}</td>
                  </tr>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Items Section -->
        ${creditNote.credit_note_items && creditNote.credit_note_items.length > 0 ? `
        <div class="items-section">
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 5%;">#</th>
                <th style="width: 40%;">Description</th>
                <th style="width: 10%;">Qty</th>
                <th style="width: 15%;">Unit Price</th>
                <th style="width: 10%;">Tax %</th>
                <th style="width: 10%;">Tax Amount</th>
                <th style="width: 10%;">Line Total</th>
              </tr>
            </thead>
            <tbody>
              ${creditNote.credit_note_items.map((item, index) => `
                <tr>
                  <td class="center">${index + 1}</td>
                  <td class="description-cell">${item.description || item.products?.name || 'Unknown Item'}</td>
                  <td class="center">${item.quantity}</td>
                  <td class="amount-cell">${formatCurrency(item.unit_price)}</td>
                  <td class="center">${item.tax_percentage}%</td>
                  <td class="amount-cell">${formatCurrency(item.tax_amount)}</td>
                  <td class="amount-cell">${formatCurrency(item.line_total)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}
        
        <!-- Totals Section -->
        <div class="totals-section">
          <table class="totals-table">
            <tr class="subtotal-row">
              <td class="label">Subtotal:</td>
              <td class="amount">${formatCurrency(creditNote.subtotal)}</td>
            </tr>
            <tr>
              <td class="label">Tax Amount:</td>
              <td class="amount">${formatCurrency(creditNote.tax_amount)}</td>
            </tr>
            <tr class="total-row">
              <td class="label">TOTAL CREDIT:</td>
              <td class="amount">${formatCurrency(creditNote.total_amount)}</td>
            </tr>
            <tr>
              <td class="label">Applied Amount:</td>
              <td class="amount">${formatCurrency(creditNote.applied_amount)}</td>
            </tr>
            <tr class="total-row">
              <td class="label">REMAINING BALANCE:</td>
              <td class="amount">${formatCurrency(creditNote.balance)}</td>
            </tr>
          </table>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <em>This credit note can be applied against future invoices or refunded as per our terms</em>
        </div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();

  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  setTimeout(() => {
    if (printWindow && !printWindow.closed) {
      printWindow.print();
    }
  }, 1000);

  return printWindow;
};
