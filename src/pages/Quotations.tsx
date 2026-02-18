import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  FileText,
  Download,
  Calendar,
  Send,
  Receipt,
  Trash2
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCompanies } from '@/hooks/useDatabase';
import { useQuotationsFixed } from '@/hooks/useQuotationsFixed';
import { useAuth } from '@/contexts/AuthContext';
import { useDeleteQuotation, useConvertQuotationToProforma, useConvertQuotationToInvoice } from '@/hooks/useQuotationItems';
import { toast } from 'sonner';
import { CreateQuotationModal } from '@/components/quotations/CreateQuotationModal';
import { ViewQuotationModal } from '@/components/quotations/ViewQuotationModal';
import { EditQuotationModal } from '@/components/quotations/EditQuotationModal';
import { ChangeQuotationStatusModal } from '@/components/quotations/ChangeQuotationStatusModal';
import { ConvertQuotationToProformaModal } from '@/components/quotations/ConvertQuotationToProformaModal';
import { ConvertQuotationToInvoiceModal } from '@/components/quotations/ConvertQuotationToInvoiceModal';
import { ConversionPreviewModal } from '@/components/shared/ConversionPreviewModal';
import { downloadQuotationPDF } from '@/utils/pdfGenerator';
import { supabase } from '@/integrations/supabase/client';

interface Quotation {
  id: string;
  quotation_number: string;
  customers: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
  };
  quotation_date: string;
  valid_until?: string;
  total_amount: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  quotation_items?: any[];
  subtotal?: number;
  tax_amount?: number;
  notes?: string;
  terms_and_conditions?: string;
}

function getStatusColor(status: string) {
  switch (status) {
    case 'draft':
      return 'bg-muted text-muted-foreground border-muted-foreground/20';
    case 'sent':
      return 'bg-warning-light text-warning border-warning/20';
    case 'accepted':
      return 'bg-success-light text-success border-success/20';
    case 'rejected':
      return 'bg-destructive-light text-destructive border-destructive/20';
    case 'expired':
      return 'bg-destructive-light text-destructive border-destructive/20';
    default:
      return 'bg-muted text-muted-foreground border-muted-foreground/20';
  }
}

export default function Quotations() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showConvertProformaModal, setShowConvertProformaModal] = useState(false);
  const [showConvertInvoiceModal, setShowConvertInvoiceModal] = useState(false);
  const [showConversionPreviewModal, setShowConversionPreviewModal] = useState(false);
  const [conversionType, setConversionType] = useState<'proforma' | 'invoice' | null>(null);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [isLoadingConversionData, setIsLoadingConversionData] = useState(false);
  const [quotationToDelete, setQuotationToDelete] = useState<Quotation | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Get current user and company from context
  const { profile, loading: authLoading } = useAuth();
  const { data: companies } = useCompanies();
  const currentCompany = companies?.[0];
  const { data: quotations, isLoading, error, refetch } = useQuotationsFixed(currentCompany?.id);
  const deleteQuotation = useDeleteQuotation();
  const convertToProforma = useConvertQuotationToProforma();
  const convertToInvoice = useConvertQuotationToInvoice();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const filteredQuotations = (quotations?.filter(quotation =>
    quotation.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quotation.quotation_number.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []).sort((a, b) => new Date(b.created_at || b.quotation_date).getTime() - new Date(a.created_at || a.quotation_date).getTime());

  const handleCreateSuccess = () => {
    refetch();
    toast.success('Quotation created successfully!');
  };

  const handleViewQuotation = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setShowViewModal(true);
  };

  const handleEditQuotation = async (quotation: Quotation) => {
    try {
      setIsLoadingConversionData(true);
      // Fetch full quotation with items and product details
      const { data, error } = await supabase
        .from('quotations')
        .select(`
          *,
          customers (
            id,
            name,
            email,
            phone,
            address
          ),
          quotation_items (
            id,
            product_id,
            products (
              name
            ),
            description,
            quantity,
            unit_price,
            discount_percentage,
            tax_percentage,
            tax_amount,
            tax_inclusive,
            line_total
          )
        `)
        .eq('id', quotation.id)
        .single();

      if (error) throw error;
      setSelectedQuotation(data as Quotation);
      setShowEditModal(true);
    } catch (error) {
      console.error('Error fetching quotation data:', error);
      toast.error('Failed to load quotation details');
    } finally {
      setIsLoadingConversionData(false);
    }
  };

  const handleEditSuccess = () => {
    refetch();
    setSelectedQuotation(null);
    toast.success('Quotation updated successfully!');
  };

  const handleDownloadQuotation = (quotation: Quotation) => {
    try {
      // Get current company details for PDF
      const companyDetails = currentCompany ? {
        name: currentCompany.name,
        address: currentCompany.address,
        city: currentCompany.city,
        country: currentCompany.country,
        phone: currentCompany.phone,
        email: currentCompany.email,
        tax_number: currentCompany.tax_number,
        logo_url: currentCompany.logo_url,
        primary_color: currentCompany.primary_color,
        pdf_template: currentCompany.pdf_template
      } : undefined;

      downloadQuotationPDF(quotation, companyDetails);
      toast.success(`PDF download started for ${quotation.quotation_number}`);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF. Please try again.');
    }
  };

  const handleSendQuotation = async (quotation: Quotation) => {
    if (!quotation.customers?.email) {
      toast.error('Customer email not available');
      return;
    }

    try {
      // Create email content using dynamic company details
      const companyName = currentCompany?.name || 'Helix General Hardware';
      const companyPhone = currentCompany?.phone || '0741 207 690/0780 165 490';
      const companyEmail = currentCompany?.email || 'info@helixgeneralhardware.com';

      const subject = `Quotation ${quotation.quotation_number} from ${companyName}`;
      const body = `Dear ${quotation.customers.name},

Please find attached your quotation ${quotation.quotation_number} dated ${new Date(quotation.quotation_date).toLocaleDateString()}.

Quotation Summary:
- Total Amount: KES ${quotation.total_amount?.toLocaleString() || '0'}
- Valid Until: ${quotation.valid_until ? new Date(quotation.valid_until).toLocaleDateString() : 'No expiry'}

If you have any questions about this quotation, please don't hesitate to contact us.

Best regards,
${companyName}
Tel: ${companyPhone}
Email: ${companyEmail}`;

      // Open email client with pre-filled content
      const emailUrl = `mailto:${quotation.customers.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(emailUrl, '_blank');

      toast.success(`Email client opened with quotation ${quotation.quotation_number} for ${quotation.customers.email}`);

    } catch (error) {
      console.error('Error sending quotation:', error);

      let errorMessage = 'Please try again.';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object') {
        const supabaseError = error as any;
        if (supabaseError.message) {
          errorMessage = supabaseError.message;
        } else if (supabaseError.details) {
          errorMessage = supabaseError.details;
        } else if (supabaseError.hint) {
          errorMessage = supabaseError.hint;
        } else {
          errorMessage = JSON.stringify(error);
        }
      }

      toast.error(`Failed to send quotation email: ${errorMessage}`);
    }
  };

  const handleConvertToProforma = async (quotation: Quotation) => {
    try {
      setIsLoadingConversionData(true);
      // Fetch full quotation with items
      const { data, error } = await supabase
        .from('quotations')
        .select(`
          *,
          customers (
            id,
            name,
            email,
            phone,
            address
          ),
          quotation_items (
            id,
            description,
            quantity,
            unit_price,
            line_total,
            tax_percentage,
            tax_amount,
            tax_inclusive
          )
        `)
        .eq('id', quotation.id)
        .single();

      if (error) throw error;
      setSelectedQuotation(data as Quotation);
      setConversionType('proforma');
      setShowConversionPreviewModal(true);
    } catch (error) {
      console.error('Error fetching quotation data:', error);
      toast.error('Failed to load quotation details');
    } finally {
      setIsLoadingConversionData(false);
    }
  };

  const handleConvertToInvoice = async (quotation: Quotation) => {
    try {
      setIsLoadingConversionData(true);
      // Fetch full quotation with items
      const { data, error } = await supabase
        .from('quotations')
        .select(`
          *,
          customers (
            id,
            name,
            email,
            phone,
            address
          ),
          quotation_items (
            id,
            description,
            quantity,
            unit_price,
            line_total,
            tax_percentage,
            tax_amount,
            tax_inclusive
          )
        `)
        .eq('id', quotation.id)
        .single();

      if (error) throw error;
      setSelectedQuotation(data as Quotation);
      setConversionType('invoice');
      setShowConversionPreviewModal(true);
    } catch (error) {
      console.error('Error fetching quotation data:', error);
      toast.error('Failed to load quotation details');
    } finally {
      setIsLoadingConversionData(false);
    }
  };

  const handleConvertSuccess = () => {
    refetch();
    setSelectedQuotation(null);
  };

  const handleConversionPreviewConfirm = async () => {
    if (!selectedQuotation) return;

    try {
      if (conversionType === 'proforma') {
        await convertToProforma.mutateAsync(selectedQuotation.id);
      } else if (conversionType === 'invoice') {
        await convertToInvoice.mutateAsync(selectedQuotation.id);
      }
      refetch();
      setShowConversionPreviewModal(false);
      setSelectedQuotation(null);
      setConversionType(null);
    } catch (error) {
      console.error('Conversion failed:', error);
    }
  };

  const handleOpenStatusModal = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setShowStatusModal(true);
  };

  const handleDeleteQuotation = (quotation: Quotation) => {
    setQuotationToDelete(quotation);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!quotationToDelete) return;

    try {
      await deleteQuotation.mutateAsync(quotationToDelete.id);
      refetch();
      setSelectedQuotation(null);
      setShowDeleteDialog(false);
      setQuotationToDelete(null);
    } catch (error) {
      console.error('Error deleting quotation:', error);
    }
  };

  const handleViewModalDelete = () => {
    refetch();
    setSelectedQuotation(null);
  };

  const handleFilter = () => {
    toast.info('Advanced filter functionality coming soon!');
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Quotations</h1>
            <p className="text-muted-foreground">Create and manage customer quotations</p>
          </div>
        </div>
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-destructive">Error loading quotations: {error.message}</p>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="mt-4"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quotations</h1>
          <p className="text-muted-foreground">
            Create and manage customer quotations
          </p>
        </div>
        <Button 
          className="gradient-primary text-primary-foreground hover:opacity-90 shadow-card"
          size="lg"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Quotation
        </Button>
      </div>

      {/* Filters and Search */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search quotations by customer or number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={handleFilter}>
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quotations Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-primary" />
            <span>Quotations List</span>
            {!isLoading && (
              <Badge variant="outline" className="ml-auto">
                {filteredQuotations.length} quotations
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          ) : filteredQuotations.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No quotations found</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm 
                  ? 'Try adjusting your search criteria'
                  : 'Get started by creating your first quotation'
                }
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => setShowCreateModal(true)}
                  className="gradient-primary text-primary-foreground hover:opacity-90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Quotation
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right min-w-[180px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotations.map((quotation: Quotation) => (
                  <TableRow key={quotation.id} className="hover:bg-muted/50 transition-smooth">
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span>{quotation.quotation_number}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{quotation.customers?.name || 'Unknown Customer'}</div>
                        {quotation.customers?.email && (
                          <div className="text-sm text-muted-foreground">{quotation.customers.email}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(quotation.quotation_date).toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(quotation.total_amount || 0)}
                    </TableCell>
                    <TableCell>
                      {quotation.valid_until 
                        ? new Date(quotation.valid_until).toLocaleDateString()
                        : 'No expiry'
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(quotation.status)}>
                        {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        {/* Icon Actions */}
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewQuotation(quotation)}
                            title="View quotation"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditQuotation(quotation)}
                            title="Edit quotation"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadQuotation(quotation)}
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteQuotation(quotation)}
                            title="Delete quotation"
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Conditional Action Buttons */}
                        <div className="flex flex-wrap gap-2">
                          {quotation.status === 'draft' && quotation.customers?.email && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSendQuotation(quotation)}
                              className="bg-primary-light text-primary border-primary/20 hover:bg-primary hover:text-primary-foreground"
                            >
                              <Send className="h-4 w-4 mr-1" />
                              <span className="hidden sm:inline">Send</span>
                            </Button>
                          )}
                          {quotation.status !== 'converted' && quotation.status !== 'expired' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenStatusModal(quotation)}
                              className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-600 hover:text-white"
                              title="Change quotation status"
                            >
                              <span className="hidden sm:inline">Change Status</span>
                              <span className="sm:hidden">Status</span>
                            </Button>
                          )}
                          {quotation.status !== 'converted' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleConvertToProforma(quotation)}
                                className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-600 hover:text-white"
                                title="Convert to Proforma Invoice"
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                <span className="hidden sm:inline">Proforma</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleConvertToInvoice(quotation)}
                                className="bg-success-light text-success border-success/20 hover:bg-success hover:text-success-foreground"
                                title="Convert directly to Invoice"
                              >
                                <Receipt className="h-4 w-4 mr-1" />
                                <span className="hidden sm:inline">Invoice</span>
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateQuotationModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={handleCreateSuccess}
      />

      <ViewQuotationModal
        open={showViewModal}
        onOpenChange={setShowViewModal}
        quotation={selectedQuotation}
        onEdit={() => selectedQuotation && handleEditQuotation(selectedQuotation)}
        onDownload={() => selectedQuotation && handleDownloadQuotation(selectedQuotation)}
        onSend={() => selectedQuotation && handleSendQuotation(selectedQuotation)}
        onChangeStatus={() => selectedQuotation && handleOpenStatusModal(selectedQuotation)}
        onConvertToProforma={() => selectedQuotation && handleConvertToProforma(selectedQuotation)}
        onConvertToInvoice={() => selectedQuotation && handleConvertToInvoice(selectedQuotation)}
        onDelete={handleViewModalDelete}
      />

      <EditQuotationModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        quotation={selectedQuotation}
        onSuccess={handleEditSuccess}
      />

      <ChangeQuotationStatusModal
        open={showStatusModal}
        onOpenChange={setShowStatusModal}
        quotationId={selectedQuotation?.id || ''}
        currentStatus={selectedQuotation?.status || ''}
        quotationNumber={selectedQuotation?.quotation_number || ''}
        onSuccess={handleConvertSuccess}
      />

      <ConvertQuotationToProformaModal
        open={showConvertProformaModal}
        onOpenChange={setShowConvertProformaModal}
        quotationId={selectedQuotation?.id || ''}
        quotationNumber={selectedQuotation?.quotation_number || ''}
        onSuccess={handleConvertSuccess}
      />

      <ConvertQuotationToInvoiceModal
        open={showConvertInvoiceModal}
        onOpenChange={setShowConvertInvoiceModal}
        quotationId={selectedQuotation?.id || ''}
        quotationNumber={selectedQuotation?.quotation_number || ''}
        onSuccess={handleConvertSuccess}
      />

      {selectedQuotation && showConversionPreviewModal && (
        <ConversionPreviewModal
          open={showConversionPreviewModal}
          onOpenChange={setShowConversionPreviewModal}
          sourceDocument={{
            id: selectedQuotation.id,
            number: selectedQuotation.quotation_number,
            date: selectedQuotation.quotation_date,
            customer: selectedQuotation.customers,
            items: (selectedQuotation.quotation_items || []).map((item: any) => ({
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              line_total: item.line_total,
            })),
            subtotal: selectedQuotation.subtotal || 0,
            tax_amount: selectedQuotation.tax_amount || 0,
            total_amount: selectedQuotation.total_amount || 0,
          }}
          sourceDocumentType="quotation"
          destinationData={{
            documentType: conversionType === 'proforma' ? 'proforma' : 'invoice',
            date: new Date().toISOString().split('T')[0],
            dueDate: conversionType === 'invoice' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
            status: conversionType === 'invoice' ? 'sent' : 'draft',
            conversionImpact: conversionType === 'invoice'
              ? [
                  'Create a new invoice with status "Sent"',
                  'Generate a unique invoice number',
                  'Copy all items and amounts from the quotation',
                  'Create stock movements for inventory tracking',
                  'Mark the quotation as "Converted"'
                ]
              : [
                  'Create a new proforma invoice with status "Draft"',
                  'Generate a proforma number',
                  'Copy all items and amounts from the quotation',
                  'Mark the quotation as "Converted"'
                ]
          }}
          isLoading={convertToProforma.isPending || convertToInvoice.isPending}
          onConfirm={handleConversionPreviewConfirm}
        />
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quotation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete quotation {quotationToDelete?.quotation_number}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteQuotation.isPending}
            >
              {deleteQuotation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
