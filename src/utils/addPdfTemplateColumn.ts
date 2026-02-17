/**
 * ADD PDF_TEMPLATE COLUMN
 *
 * This module adds the pdf_template column to the companies table
 * to support custom PDF header templates for invoices and documents.
 */

export const ADD_PDF_TEMPLATE_COLUMN_SQL = `
ALTER TABLE companies ADD COLUMN pdf_template VARCHAR(50) DEFAULT 'default' AFTER primary_color;
`;

export async function addPdfTemplateColumn() {
  console.warn('⚠️ addPdfTemplateColumn: Please execute SQL directly or ask backend administrator');
  return {
    success: false,
    message: 'Please execute the following SQL on your database: ' + ADD_PDF_TEMPLATE_COLUMN_SQL
  };
}
