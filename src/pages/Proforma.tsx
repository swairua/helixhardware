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
  DollarSign,
  Download,
  Send,
  Calendar,
  Receipt,
  FileText,
  CheckCircle,
  Trash2,
  ArrowRightCircle
} from 'lucide-react';
import { useProformas, useDeleteProforma, useConvertProformaToInvoice, type ProformaWithItems } from '@/hooks/useProforma';
import { useCompanies } from '@/hooks/useDatabase';
import { toast } from 'sonner';
import { ConversionPreviewModal } from '@/components/shared/ConversionPreviewModal';
import { supabase } from '@/integrations/supabase/client';
import { CreateProformaModalOptimized } from '@/components/proforma/CreateProformaModalOptimized';
import { EditProformaModal } from '@/components/proforma/EditProformaModal';
import { ViewProformaModal } from '@/components/proforma/ViewProformaModal';
import { ProformaSetupBanner } from '@/components/proforma/ProformaSetupBanner';
import { ChangeProformaStatusModal } from '@/components/proforma/ChangeProformaStatusModal';
import { ConvertProformaToInvoiceModal } from '@/components/proforma/ConvertProformaToInvoiceModal';
import { downloadInvoicePDF, downloadQuotationPDF } from '@/utils/pdfGenerator';
import { formatCurrency } from '@/utils/taxCalculation';
import { ensureProformaSchema } from '@/utils/proformaDatabaseSetup';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function Proforma() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showConversionPreviewModal, setShowConversionPreviewModal] = useState(false);
  const [selectedProforma, setSelectedProforma] = useState<ProformaWithItems | null>(null);
  const [isLoadingConversionData, setIsLoadingConversionData] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [proformaToDelete, setProformaToDelete] = useState<ProformaWithItems | null>(null);
  const [showDeletePopover, setShowDeletePopover] = useState<string | null>(null);


  // Get company data
  const { data: companies } = useCompanies();
  const currentCompany = companies?.[0];

  // Use proper proforma hooks
  const { data: proformas = [], isLoading, refetch } = useProformas(currentCompany?.id);
  const deleteProforma = useDeleteProforma(currentCompany?.id);
  const convertToInvoice = useConvertProformaToInvoice();

  const filteredProformas = proformas.filter(proforma =>
    proforma.proforma_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proforma.customers?.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => new Date(b.created_at || b.proforma_date).getTime() - new Date(a.created_at || a.proforma_date).getTime());

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'sent':
        return <Badge variant="default">Sent</Badge>;
      case 'accepted':
        return <Badge variant="destructive">Accepted</Badge>;
      case 'expired':
        return <Badge variant="outline">Expired</Badge>;
      case 'converted':
        return <Badge variant="destructive">Converted</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleView = (proforma: ProformaWithItems) => {
    setSelectedProforma(proforma);
    setShowViewModal(true);
  };

  const handleEdit = async (proforma: ProformaWithItems) => {
    try {
      // Fetch full proforma with items and product details
      const { data, error } = await supabase
        .from('proformas')
        .select(`
          *,
          customers (
            id,
            name,
            email,
            phone,
            address
          ),
          proforma_items (
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
        .eq('id', proforma.id)
        .single();

      if (error) throw error;
      setSelectedProforma(data as ProformaWithItems);
      setShowEditModal(true);
    } catch (error) {
      console.error('Error fetching proforma data:', error);
      toast.error('Failed to load proforma details');
    }
  };

  const handleDownloadPDF = async (proforma: ProformaWithItems) => {
    try {
      // Convert proforma to invoice format for PDF generation
      const invoiceData = {
        id: proforma.id,
        invoice_number: proforma.proforma_number,
        customers: proforma.customers,
        invoice_date: proforma.proforma_date,
        valid_until: proforma.valid_until,
        total_amount: proforma.total_amount,
        invoice_items: proforma.proforma_items || [],
        subtotal: proforma.subtotal,
        tax_amount: proforma.tax_amount,
        status: proforma.status,
        notes: proforma.notes || 'This is a proforma invoice for advance payment.',
        terms_and_conditions: proforma.terms_and_conditions || 'Payment required before goods are delivered.',
      };

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

      await downloadInvoicePDF(invoiceData, 'PROFORMA', companyDetails);
      toast.success('Proforma PDF downloaded successfully!');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

  const handleSendEmail = (proforma: ProformaWithItems) => {
    const subject = `Proforma Invoice ${proforma.proforma_number}`;
    const body = `Please find attached proforma invoice ${proforma.proforma_number} for your review.`;
    const emailUrl = `mailto:${proforma.customers?.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    window.open(emailUrl);
    toast.success(`Email client opened with proforma ${proforma.proforma_number}`);
  };

  const handleCreateInvoice = async (proforma: ProformaWithItems) => {
    try {
      setIsLoadingConversionData(true);
      // Fetch full proforma with items
      const { data, error } = await supabase
        .from('proforma_invoices')
        .select(`
          *,
          customers (
            id,
            name,
            email,
            phone,
            address
          ),
          proforma_items (
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
        .eq('id', proforma.id)
        .single();

      if (error) throw error;
      setSelectedProforma(data as ProformaWithItems);
      setShowConversionPreviewModal(true);
    } catch (error) {
      console.error('Error fetching proforma data:', error);
      toast.error('Failed to load proforma details');
    } finally {
      setIsLoadingConversionData(false);
    }
  };

  const handleConvertSuccess = (invoiceNumber: string) => {
    refetch();
    setSelectedProforma(null);
    setShowViewModal(false);
    toast.success(`Successfully converted to invoice ${invoiceNumber}`);
  };

  const handleConversionPreviewConfirm = async () => {
    if (!selectedProforma) return;

    try {
      const result = await convertToInvoice.mutateAsync(selectedProforma.id!);
      refetch();
      setShowConversionPreviewModal(false);
      setSelectedProforma(null);
      toast.success(`Successfully converted to invoice ${result.invoice_number}`);
    } catch (error) {
      console.error('Conversion failed:', error);
    }
  };

  const handleAcceptProforma = async (proforma: ProformaWithItems) => {
    setSelectedProforma(proforma);
    setShowStatusModal(true);
  };

  const handleDeleteProforma = async (proforma: ProformaWithItems) => {
    try {
      await deleteProforma.mutateAsync(proforma.id!);
      setShowDeletePopover(null);
      setSelectedProforma(null);
    } catch (error) {
      console.error('Error deleting proforma:', error);
    }
  };

  const handleFilter = () => {
    toast.info('Advanced filter functionality coming soon!');
  };

  const handleOpenStatusModal = (proforma: ProformaWithItems) => {
    setSelectedProforma(proforma);
    setShowStatusModal(true);
  };

  const handleCreateSuccess = () => {
    refetch();
    setShowCreateModal(false);
  };

  const handleEditSuccess = () => {
    refetch();
    setShowEditModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Database Setup Banner */}
      <ProformaSetupBanner />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Proforma Invoices</h1>
          <p className="text-muted-foreground">
            Create and manage proforma invoices for prepayment scenarios
          </p>
        </div>
        <Button 
          variant="default" 
          size="lg"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Proforma
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="text-lg font-bold">{proformas.length}</p>
                <p className="text-xs text-muted-foreground">Total Proformas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-2">
              <Send className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-lg font-bold">
                  {proformas.filter(p => p.status === 'sent').length}
                </p>
                <p className="text-xs text-muted-foreground">Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-success" />
              <div>
                <p className="text-lg font-bold">
                  {proformas.filter(p => p.status === 'accepted').length}
                </p>
                <p className="text-xs text-muted-foreground">Accepted</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-success" />
              <div>
                <p className="text-lg font-bold">
                  {formatCurrency(proformas.reduce((sum, p) => sum + (p.total_amount || 0), 0))}
                </p>
                <p className="text-xs text-muted-foreground">Total Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Proforma Invoices</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search proformas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" size="sm" onClick={handleFilter}>
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const res = await ensureProformaSchema();
                  if ((res as any)?.success) {
                    toast.success('Proforma schema harmonized');
                  } else {
                    toast.error(`Schema fix failed: ${(res as any)?.error || 'Unknown error'}`);
                  }
                }}
              >
                Fix Proforma Schema
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[160px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProformas.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No proforma invoices found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'No proformas match your search.' : 'Create your first proforma invoice to get started.'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Proforma
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proforma #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProformas.map((proforma) => (
                  <TableRow key={proforma.id}>
                    <TableCell className="font-medium">
                      {proforma.proforma_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{proforma.customers?.name}</div>
                        {proforma.customers?.email && (
                          <div className="text-sm text-muted-foreground">
                            {proforma.customers.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        {formatDate(proforma.proforma_date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        {formatDate(proforma.valid_until)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center font-medium">
                        <DollarSign className="h-4 w-4 mr-1" />
                        {formatCurrency(proforma.total_amount)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(proforma.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(proforma)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(proforma)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadPDF(proforma)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSendEmail(proforma)}
                          disabled={!proforma.customers?.email}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                        {proforma.status === 'sent' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAcceptProforma(proforma)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {proforma.status !== 'converted' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCreateInvoice(proforma)}
                            title="Convert to Invoice"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Receipt className="h-4 w-4" />
                          </Button>
                        )}
                        {proforma.status !== 'converted' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenStatusModal(proforma)}
                            title="Change Status"
                          >
                            <ArrowRightCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Popover open={showDeletePopover === proforma.id} onOpenChange={(open) => setShowDeletePopover(open ? proforma.id! : null)}>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" title="Delete proforma" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48">
                            <div className="text-sm mb-2">Delete proforma {proforma.proforma_number}?</div>
                            <div className="flex justify-end space-x-2">
                              <Button variant="ghost" size="sm" onClick={() => setShowDeletePopover(null)}>
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteProforma(proforma)}
                                disabled={deleteProforma.isPending}
                              >
                                {deleteProforma.isPending ? 'Deleting...' : 'Delete'}
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
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
      <CreateProformaModalOptimized
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={handleCreateSuccess}
        companyId={currentCompany?.id}
      />

      <EditProformaModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        proforma={selectedProforma}
        onSuccess={handleEditSuccess}
        companyId={currentCompany?.id}
      />

      <ViewProformaModal
        open={showViewModal}
        onOpenChange={setShowViewModal}
        proforma={selectedProforma}
        onDownloadPDF={handleDownloadPDF}
        onSendEmail={handleSendEmail}
        onCreateInvoice={handleCreateInvoice}
        companyId={currentCompany?.id}
      />

      <ChangeProformaStatusModal
        open={showStatusModal}
        onOpenChange={setShowStatusModal}
        proformaId={selectedProforma?.id || ''}
        currentStatus={selectedProforma?.status || ''}
        proformaNumber={selectedProforma?.proforma_number || ''}
      />

      <ConvertProformaToInvoiceModal
        open={showConvertModal}
        onOpenChange={setShowConvertModal}
        proformaId={selectedProforma?.id || ''}
        proformaNumber={selectedProforma?.proforma_number || ''}
        onSuccess={handleConvertSuccess}
      />

      {selectedProforma && showConversionPreviewModal && (
        <ConversionPreviewModal
          open={showConversionPreviewModal}
          onOpenChange={setShowConversionPreviewModal}
          sourceDocument={{
            id: selectedProforma.id!,
            number: selectedProforma.proforma_number,
            date: selectedProforma.proforma_date,
            customer: selectedProforma.customers,
            items: (selectedProforma.proforma_items || []).map((item: any) => ({
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              line_total: item.line_total,
            })),
            subtotal: selectedProforma.subtotal || 0,
            tax_amount: selectedProforma.tax_amount || 0,
            total_amount: selectedProforma.total_amount || 0,
          }}
          sourceDocumentType="proforma"
          destinationData={{
            documentType: 'invoice',
            date: new Date().toISOString().split('T')[0],
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'sent',
            conversionImpact: [
              'Create a new invoice with status "Sent"',
              'Generate a unique invoice number',
              'Copy all items and amounts from the proforma',
              'Create stock movements for inventory tracking',
              'Mark the proforma as "Converted"'
            ]
          }}
          isLoading={convertToInvoice.isPending}
          onConfirm={handleConversionPreviewConfirm}
        />
      )}
    </div>
  );
}
