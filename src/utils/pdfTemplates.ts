import { lightenColor } from './colorUtils';

export type TemplateName = 'default' | 'helix' | 'compact' | 'helix_general_hardware';

export interface CompanyDataForTemplate {
  name: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  primary_color?: string;
  tax_number?: string;
}

export interface TemplateData {
  documentTitle: string;
  documentNumber: string;
  documentDate: string;
  customer?: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
  };
  relatedDocument?: {
    label: string;
    value: string;
  };
  additionalDetails?: Array<{
    label: string;
    value: string;
  }>;
}

export interface PDFTemplate {
  name: TemplateName;
  label: string;
  description: string;
  renderHeader: (company: CompanyDataForTemplate, data: TemplateData, primaryColor: string) => string;
  getCSS: (primaryColor: string) => string;
}

/**
 * Default template - maintains current design for backward compatibility
 * Two-row grid layout with logo (left) + company details (right) in top row
 * Customer details (left) + document info (right) in bottom row
 */
const defaultTemplate: PDFTemplate = {
  name: 'default',
  label: 'Default',
  description: 'Classic design with logo and company details',
  renderHeader: (company: CompanyDataForTemplate, data: TemplateData, primaryColor: string) => {
    return `
      <!-- Header Section -->
      <div class="header">
        <!-- Row 1: Logo (20%) + Company Details (80%) -->
        <div class="header-row-1">
          <div class="logo">
            ${company.logo_url ?
              `<img src="${company.logo_url}" alt="${company.name} Logo" onerror="this.style.display='none';" />` :
              `<div style="width:100%; height:100%; background:#f8f9fa; border:2px dashed #e9ecef; display:flex; align-items:center; justify-content:center; font-size:12px; color:#6c757d; text-align:center;">No logo</div>`
            }
          </div>
          <div class="company-details-block">
            <div class="company-name">${company.name}</div>
            <div class="company-details">
              ${company.tax_number ? `PIN: ${company.tax_number}<br>` : ''}
              ${company.address ? `${company.address}<br>` : ''}
              ${company.city ? `${company.city}` : ''}${company.country ? `, ${company.country}` : ''}<br>
              ${company.phone ? `Tel: ${company.phone}<br>` : ''}
              ${company.email ? `Email: ${company.email}` : ''}
            </div>
          </div>
        </div>

        <!-- Row 2: Customer Details (50%) + Document Details (50%) -->
        <div class="header-row-2">
          <div class="customer-info-block">
            <div class="section-title">Client</div>
            ${data.customer ? `
              <div class="customer-name">${data.customer.name}</div>
              <div class="customer-details">
                ${data.customer.email ? `${data.customer.email}<br>` : ''}
                ${data.customer.phone ? `${data.customer.phone}<br>` : ''}
                ${data.customer.address ? `${data.customer.address}<br>` : ''}
                ${data.customer.city ? `${data.customer.city}` : ''}${data.customer.country ? `, ${data.customer.country}` : ''}
              </div>
            ` : ''}
          </div>

          <div class="document-info">
            <div class="document-title">${data.documentTitle}</div>
            <div class="document-details">
              <table>
                <tr>
                  <td class="label">Number:</td>
                  <td class="value">${data.documentNumber}</td>
                </tr>
                <tr>
                  <td class="label">Date:</td>
                  <td class="value">${data.documentDate}</td>
                </tr>
                ${data.relatedDocument ? `
                <tr>
                  <td class="label">${data.relatedDocument.label}:</td>
                  <td class="value">${data.relatedDocument.value}</td>
                </tr>
                ` : ''}
                ${data.additionalDetails ? data.additionalDetails.map(detail => `
                <tr>
                  <td class="label">${detail.label}:</td>
                  <td class="value">${detail.value}</td>
                </tr>
                `).join('') : ''}
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  },
  getCSS: (primaryColor: string) => {
    return `
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
      
      .logo {
        width: 100%;
        height: 120px;
        border-radius: 8px;
        overflow: hidden;
        justify-self: start;
        align-self: start;
      }
      
      .logo img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
      
      .company-details-block {
        width: 100%;
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
        font-size: 18px;
        font-weight: bold;
        margin: 0 0 12px 0;
        color: ${primaryColor};
        text-transform: uppercase;
        letter-spacing: 0.5px;
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
      
      .customer-details {
        font-size: 10px;
        color: #666;
        line-height: 1.4;
        word-wrap: break-word;
        overflow-wrap: break-word;
      }
    `;
  }
};

/**
 * Helix template - professional design with document type badge
 * Features: Red accent badge for document type, refined layout, dark text
 */
const helixTemplate: PDFTemplate = {
  name: 'helix',
  label: 'Helix',
  description: 'Professional design with document type badge and red accents',
  renderHeader: (company: CompanyDataForTemplate, data: TemplateData, primaryColor: string) => {
    return `
      <!-- Header Section with Badge -->
      <div class="header">
        <!-- Document Type Badge -->
        <div class="document-badge">
          <span class="badge-text">${data.documentTitle}</span>
        </div>

        <!-- Row 1: Logo (15%) + Company Details (85%) -->
        <div class="header-row-1">
          <div class="logo">
            ${company.logo_url ?
              `<img src="${company.logo_url}" alt="${company.name} Logo" onerror="this.style.display='none';" />` :
              `<div style="width:100%; height:100%; background:#f8f9fa; border:2px dashed #e9ecef; display:flex; align-items:center; justify-content:center; font-size:12px; color:#6c757d; text-align:center;">No logo</div>`
            }
          </div>
          <div class="company-details-block">
            <div class="company-name">${company.name}</div>
            <div class="company-tagline">${company.address || ''}</div>
            <div class="company-details">
              ${company.phone ? `Tel: ${company.phone}` : ''}
              ${company.email ? `&nbsp;• ${company.email}` : ''}
            </div>
          </div>
        </div>

        <!-- Header separator line -->
        <div class="header-separator"></div>

        <!-- Row 2: Customer Details (50%) + Document Details (50%) -->
        <div class="header-row-2">
          <div class="customer-info-block">
            <div class="section-title">Bill To</div>
            ${data.customer ? `
              <div class="customer-name">${data.customer.name}</div>
              <div class="customer-details">
                ${data.customer.address ? `${data.customer.address}<br>` : ''}
                ${data.customer.city ? `${data.customer.city}` : ''}${data.customer.country ? `, ${data.customer.country}` : ''}<br>
                ${data.customer.phone ? `${data.customer.phone}<br>` : ''}
                ${data.customer.email ? `${data.customer.email}` : ''}
              </div>
            ` : ''}
          </div>

          <div class="document-info">
            <div class="document-meta-block">
              <div class="meta-row">
                <span class="meta-label">Document #</span>
                <span class="meta-value">${data.documentNumber}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">Date</span>
                <span class="meta-value">${data.documentDate}</span>
              </div>
              ${data.relatedDocument ? `
              <div class="meta-row">
                <span class="meta-label">${data.relatedDocument.label}</span>
                <span class="meta-value">${data.relatedDocument.value}</span>
              </div>
              ` : ''}
              ${data.additionalDetails ? data.additionalDetails.map(detail => `
              <div class="meta-row">
                <span class="meta-label">${detail.label}</span>
                <span class="meta-value">${detail.value}</span>
              </div>
              `).join('') : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  },
  getCSS: (primaryColor: string) => {
    return `
      .header {
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: auto auto auto auto;
        margin-bottom: 30px;
        gap: 15px;
      }

      .document-badge {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
      }

      .badge-text {
        display: inline-block;
        background: ${primaryColor};
        color: white;
        padding: 6px 16px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      
      .header-row-1 {
        display: grid;
        grid-template-columns: 100px 1fr;
        gap: 20px;
        align-items: flex-start;
        padding-bottom: 15px;
      }
      
      .header-row-2 {
        display: grid;
        grid-template-columns: 50% 50%;
        gap: 20px;
        padding-top: 10px;
      }
      
      .header-separator {
        height: 1px;
        background: ${primaryColor};
        grid-column: 1 / -1;
      }
      
      .logo {
        width: 100px;
        height: 100px;
        border-radius: 4px;
        overflow: hidden;
        justify-self: start;
        align-self: start;
      }
      
      .logo img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
      
      .company-details-block {
        width: 100%;
      }
      
      .company-name {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 4px;
        color: #1a1a1a;
        letter-spacing: 0.5px;
      }

      .company-tagline {
        font-size: 11px;
        color: ${primaryColor};
        margin-bottom: 6px;
        font-weight: 500;
      }
      
      .company-details {
        font-size: 10px;
        color: #666;
        line-height: 1.4;
      }
      
      .document-info {
        text-align: left;
        width: 100%;
        display: flex;
        justify-content: flex-end;
      }

      .document-meta-block {
        text-align: right;
      }

      .meta-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
        margin-bottom: 6px;
        font-size: 10px;
      }

      .meta-label {
        font-weight: 500;
        color: #666;
        text-align: right;
        min-width: 80px;
      }

      .meta-value {
        font-weight: 600;
        color: #1a1a1a;
        text-align: right;
        min-width: 100px;
      }
      
      .customer-info-block {
        text-align: left;
        width: 100%;
      }
      
      .section-title {
        font-size: 10px;
        font-weight: bold;
        color: ${primaryColor};
        margin: 0 0 8px 0;
        text-transform: uppercase;
        letter-spacing: 0.8px;
      }
      
      .customer-name {
        font-size: 12px;
        font-weight: bold;
        margin-bottom: 4px;
        color: #1a1a1a;
      }
      
      .customer-details {
        font-size: 10px;
        color: #666;
        line-height: 1.5;
        word-wrap: break-word;
        overflow-wrap: break-word;
      }
    `;
  }
};

// Compact template for future use
const compactTemplate: PDFTemplate = {
  name: 'compact',
  label: 'Compact',
  description: 'Minimal design for space-efficient documents',
  renderHeader: (company: CompanyDataForTemplate, data: TemplateData, primaryColor: string) => {
    return `
      <!-- Header Section - Compact -->
      <div class="header">
        <div class="header-row-1">
          <div class="company-name">${company.name}</div>
          <div class="document-title">${data.documentTitle} #${data.documentNumber}</div>
        </div>
      </div>
    `;
  },
  getCSS: (primaryColor: string) => {
    return `
      .header {
        display: grid;
        grid-template-columns: 1fr;
        margin-bottom: 20px;
        gap: 10px;
      }

      .header-row-1 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        align-items: center;
        padding-bottom: 10px;
        border-bottom: 1px solid ${primaryColor};
      }

      .company-name {
        font-size: 14px;
        font-weight: bold;
        color: ${primaryColor};
      }

      .document-title {
        font-size: 12px;
        font-weight: bold;
        color: ${primaryColor};
        text-align: right;
        text-transform: uppercase;
      }
    `;
  }
};

/**
 * Helix General Hardware template - Professional design for hardware distributor
 * Features: Red document badge, company branding with tagline, clean layout
 */
const helixGeneralHardwareTemplate: PDFTemplate = {
  name: 'helix_general_hardware',
  label: 'Helix General Hardware',
  description: 'Professional template for Helix General Hardware & Timber Products',
  renderHeader: (company: CompanyDataForTemplate, data: TemplateData, primaryColor: string) => {
    return `
      <!-- Header Section with Badge -->
      <div class="header">
        <!-- Document Type Badge -->
        <div class="document-badge">
          <span class="badge-text">${data.documentTitle}</span>
        </div>

        <!-- Row 1: Company Branding -->
        <div class="header-row-1">
          <div class="company-logo-icon">H</div>
          <div class="company-details-block">
            <div class="company-name">HELIX GENERAL HARDWARE</div>
            <div class="company-subtitle">Dealers in General Hardware & Timber Products</div>
            <div class="company-contact">P.O Box 2424 -01000 Thika. Tel: 0720 717 463</div>
            <div class="company-tagline"><em>seamlessly within your reach</em></div>
          </div>
        </div>

        <!-- Header separator line -->
        <div class="header-separator"></div>

        <!-- Row 2: Customer Details (50%) + Document Details (50%) -->
        <div class="header-row-2">
          <div class="customer-info-block">
            <div class="section-title">Bill To</div>
            ${data.customer ? `
              <div class="customer-name">${data.customer.name}</div>
              <div class="customer-details">
                ${data.customer.address ? `${data.customer.address}<br>` : ''}
                ${data.customer.city ? `${data.customer.city}` : ''}${data.customer.country ? `, ${data.customer.country}` : ''}<br>
                ${data.customer.phone ? `${data.customer.phone}<br>` : ''}
                ${data.customer.email ? `${data.customer.email}` : ''}
              </div>
            ` : ''}
          </div>

          <div class="document-info">
            <div class="document-meta-block">
              <div class="meta-row">
                <span class="meta-label">Document #</span>
                <span class="meta-value">${data.documentNumber}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">Date</span>
                <span class="meta-value">${data.documentDate}</span>
              </div>
              ${data.relatedDocument ? `
              <div class="meta-row">
                <span class="meta-label">${data.relatedDocument.label}</span>
                <span class="meta-value">${data.relatedDocument.value}</span>
              </div>
              ` : ''}
              ${data.additionalDetails ? data.additionalDetails.map(detail => `
              <div class="meta-row">
                <span class="meta-label">${detail.label}</span>
                <span class="meta-value">${detail.value}</span>
              </div>
              `).join('') : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  },
  getCSS: (primaryColor: string) => {
    return `
      .header {
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: auto auto auto auto;
        margin-bottom: 30px;
        gap: 15px;
      }

      .document-badge {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
      }

      .badge-text {
        display: inline-block;
        background: ${primaryColor};
        color: white;
        padding: 6px 16px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .header-row-1 {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 20px;
        align-items: flex-start;
        padding-bottom: 15px;
      }

      .header-row-2 {
        display: grid;
        grid-template-columns: 50% 50%;
        gap: 20px;
        padding-top: 10px;
      }

      .header-separator {
        height: 2px;
        background: ${primaryColor};
        grid-column: 1 / -1;
      }

      .company-logo-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 60px;
        height: 60px;
        border: 3px solid ${primaryColor};
        border-radius: 50%;
        font-size: 32px;
        font-weight: bold;
        color: white;
        background: ${primaryColor};
        flex-shrink: 0;
      }

      .company-details-block {
        width: 100%;
      }

      .company-name {
        font-size: 20px;
        font-weight: bold;
        margin-bottom: 2px;
        color: ${primaryColor};
        letter-spacing: 1px;
      }

      .company-subtitle {
        font-size: 12px;
        color: ${primaryColor};
        margin-bottom: 4px;
        font-weight: 500;
      }

      .company-contact {
        font-size: 10px;
        color: #333;
        margin-bottom: 4px;
        line-height: 1.3;
      }

      .company-tagline {
        font-size: 11px;
        color: #666;
        font-style: italic;
        margin-top: 2px;
      }

      .document-info {
        text-align: left;
        width: 100%;
        display: flex;
        justify-content: flex-end;
      }

      .document-meta-block {
        text-align: right;
      }

      .meta-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
        margin-bottom: 6px;
        font-size: 10px;
      }

      .meta-label {
        font-weight: 500;
        color: #666;
        text-align: right;
        min-width: 80px;
      }

      .meta-value {
        font-weight: 600;
        color: #1a1a1a;
        text-align: right;
        min-width: 100px;
      }

      .customer-info-block {
        text-align: left;
        width: 100%;
      }

      .section-title {
        font-size: 10px;
        font-weight: bold;
        color: ${primaryColor};
        margin: 0 0 8px 0;
        text-transform: uppercase;
        letter-spacing: 0.8px;
      }

      .customer-name {
        font-size: 12px;
        font-weight: bold;
        margin-bottom: 4px;
        color: #1a1a1a;
      }

      .customer-details {
        font-size: 10px;
        color: #666;
        line-height: 1.5;
        word-wrap: break-word;
        overflow-wrap: break-word;
      }
    `;
  }
};

// Template registry
const templateRegistry: Record<TemplateName, PDFTemplate> = {
  default: defaultTemplate,
  helix: helixTemplate,
  compact: compactTemplate,
  helix_general_hardware: helixGeneralHardwareTemplate
};

/**
 * Get all available templates
 */
export function getAvailableTemplates(): Array<{ name: TemplateName; label: string; description: string }> {
  return Object.values(templateRegistry).map(template => ({
    name: template.name,
    label: template.label,
    description: template.description
  }));
}

/**
 * Get a specific template by name
 */
export function getTemplate(templateName: TemplateName | string): PDFTemplate {
  const template = templateRegistry[templateName as TemplateName];
  if (!template) {
    console.warn(`Template "${templateName}" not found, falling back to default`);
    return templateRegistry.default;
  }
  return template;
}

/**
 * Validate if a template name is valid
 */
export function isValidTemplate(templateName: string): templateName is TemplateName {
  return templateName in templateRegistry;
}

/**
 * Render header HTML using a specific template
 */
export function renderHeaderHTML(
  company: CompanyDataForTemplate,
  data: TemplateData,
  templateName: TemplateName | string = 'default',
  primaryColor: string = '#FF8C42'
): string {
  const template = getTemplate(templateName);
  return template.renderHeader(company, data, primaryColor);
}

/**
 * Get CSS for a specific template
 */
export function getTemplateCSS(templateName: TemplateName | string = 'default', primaryColor: string = '#FF8C42'): string {
  const template = getTemplate(templateName);
  return template.getCSS(primaryColor);
}
