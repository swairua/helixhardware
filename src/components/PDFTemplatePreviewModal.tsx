import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { renderHeaderHTML, getTemplateCSS, CompanyDataForTemplate, TemplateData } from '@/utils/pdfTemplates';

interface PDFTemplatePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateName: string;
  companyData: CompanyDataForTemplate;
  primaryColor: string;
}

/**
 * Creates sample document data for preview purposes
 */
function getSampleDocumentData(): TemplateData {
  return {
    documentTitle: 'INVOICE',
    documentNumber: 'INV-2024-001',
    documentDate: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    customer: {
      name: 'Sample Customer Inc.',
      email: 'customer@example.com',
      phone: '+1 (555) 987-6543',
      address: '123 Business Street',
      city: 'New York',
      country: 'USA'
    },
    relatedDocument: {
      label: 'PO Number',
      value: 'PO-2024-0456'
    },
    additionalDetails: [
      {
        label: 'Due Date',
        value: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      },
      {
        label: 'Payment Terms',
        value: 'Net 30'
      }
    ]
  };
}

export function PDFTemplatePreviewModal({
  open,
  onOpenChange,
  templateName,
  companyData,
  primaryColor
}: PDFTemplatePreviewModalProps) {
  const sampleData = getSampleDocumentData();
  
  // Generate the HTML header using the template
  const headerHTML = renderHeaderHTML(
    companyData,
    sampleData,
    templateName,
    primaryColor
  );

  // Get the CSS for the template
  const templateCSS = getTemplateCSS(templateName, primaryColor);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between w-full">
            <DialogTitle>
              {companyData.name} - Template Preview
            </DialogTitle>
            <DialogClose asChild>
              <button className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="px-6 py-6 bg-gradient-to-b from-background to-muted/20">
          {/* Document preview container */}
          <div className="bg-white rounded-lg shadow-lg p-8 border border-border max-w-full">
            {/* Inject CSS for this template */}
            <style>{templateCSS}</style>

            {/* Render the template header */}
            <div
              dangerouslySetInnerHTML={{ __html: headerHTML }}
              className="template-preview-content"
            />

            {/* Sample content to show how the template looks with body content */}
            <div className="mt-8 space-y-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-foreground">Order Details</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2" style={{ borderColor: primaryColor }}>
                      <th className="text-left py-2 font-semibold" style={{ color: primaryColor }}>Description</th>
                      <th className="text-right py-2 font-semibold" style={{ color: primaryColor }}>Qty</th>
                      <th className="text-right py-2 font-semibold" style={{ color: primaryColor }}>Unit Price</th>
                      <th className="text-right py-2 font-semibold" style={{ color: primaryColor }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3">Sample Product Line Item 1</td>
                      <td className="text-right">2</td>
                      <td className="text-right">1,000.00</td>
                      <td className="text-right">2,000.00</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3">Sample Product Line Item 2</td>
                      <td className="text-right">1</td>
                      <td className="text-right">500.00</td>
                      <td className="text-right">500.00</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3">Professional Service</td>
                      <td className="text-right">5</td>
                      <td className="text-right">200.00</td>
                      <td className="text-right">1,000.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Totals section */}
              <div className="flex justify-end mt-6">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>3,500.00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax (16%):</span>
                    <span>560.00</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold py-2 px-3 rounded" style={{ backgroundColor: `${primaryColor}20`, borderLeft: `4px solid ${primaryColor}` }}>
                    <span>Total:</span>
                    <span>4,060.00</span>
                  </div>
                </div>
              </div>

              {/* Notes section */}
              <div className="mt-8 pt-6 border-t">
                <h4 className="font-semibold text-sm mb-2 text-foreground">Notes</h4>
                <p className="text-sm text-muted-foreground">
                  This is a preview of how your documents will look with the selected template. The layout, branding, and styling will be applied to all your invoices, quotes, and other documents.
                </p>
              </div>
            </div>
          </div>

          {/* Preview info banner */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
            <p className="font-semibold mb-1">Preview Information</p>
            <p>This preview uses sample data to demonstrate how your template will appear. Your actual documents will use real customer and transaction data.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
