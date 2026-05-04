# BOQ Percentage Display Feature - Implementation Tasks

## Status: IN PROGRESS

## Task Breakdown

### 1. Add `display_as_percentage` Column to Database
- [ ] Create migration file `002_add_display_as_percentage.sql`
  - [ ] Add `display_as_percentage` BOOLEAN DEFAULT FALSE to `quotations` table
  - [ ] Add `display_as_percentage` BOOLEAN DEFAULT FALSE to `proforma_invoices` table
  - [ ] Add `display_as_percentage` BOOLEAN DEFAULT FALSE to `invoices` table
- [ ] Update `src/integrations/supabase/types.ts` to include new field in Row, Insert, and Update types
- [ ] Update `database/mysql/schema.sql` to include the new column definition

### 2. Update PDF Generator Logic
- [ ] Read `src/utils/pdfGenerator.ts` and understand current column analysis
- [ ] Modify `analyzeColumns()` function to respect `display_as_percentage` flag
- [ ] When flag is true: exclude percentage columns, show calculated amounts
- [ ] Add `display_as_percentage` field to `DocumentData` interface
- [ ] Test PDF generation with both modes

### 3. Update Document Creation UIs
- [ ] **Quotations**: `src/components/quotations/CreateQuotationModal.tsx`
  - [ ] Add toggle/checkbox: "Display as progressive percentages"
  - [ ] Pass flag to API when saving
- [ ] **Proformas**: `src/components/proforma/CreateProformaModal.tsx`
  - [ ] Add toggle/checkbox: "Display as progressive percentages"
  - [ ] Pass flag to API when saving
- [ ] **Invoices**: `src/components/invoices/CreateInvoiceModal.tsx`
  - [ ] Add toggle/checkbox: "Display as progressive percentages"
  - [ ] Pass flag to API when saving

### 4. Update Conversion Hooks
- [ ] `src/hooks/useQuotationItems.ts`
  - [ ] Update `useConvertQuotationToInvoice()` to copy `display_as_percentage` flag
- [ ] `src/hooks/useProforma.ts`
  - [ ] Update `useConvertProformaToInvoice()` to copy `display_as_percentage` flag

### 5. Update Invoice View Modal
- [ ] `src/components/invoices/ViewInvoiceModal.tsx`
  - [ ] Display calculated values instead of percentages when flag is true
  - [ ] Ensure consistency with PDF display

### 6. Testing
- [ ] Create quotation with percentage display enabled
- [ ] Convert quotation to invoice - verify flag is copied
- [ ] Generate PDF - verify percentages are hidden, amounts shown
- [ ] View invoice modal - verify display matches PDF
- [ ] Test with percentage display disabled - verify original behavior

### 7. Documentation
- [ ] Document the feature in code comments
- [ ] Update any relevant user-facing documentation

## Files Modified
- `database/migrations/002_add_display_as_percentage.sql` (CREATE)
- `database/mysql/schema.sql`
- `src/integrations/supabase/types.ts`
- `src/utils/pdfGenerator.ts`
- `src/components/quotations/CreateQuotationModal.tsx`
- `src/components/proforma/CreateProformaModal.tsx`
- `src/components/invoices/CreateInvoiceModal.tsx`
- `src/hooks/useQuotationItems.ts`
- `src/hooks/useProforma.ts`
- `src/components/invoices/ViewInvoiceModal.tsx`

## Key Implementation Notes
- The `display_as_percentage` flag is a presentation-layer feature
- No changes to data calculation logic are needed
- Existing tax_percentage and tax_amount fields remain unchanged
- Feature works by controlling which columns are rendered in PDFs and views
