import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
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
  Truck,
  Trash2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanies } from '@/hooks/useDatabase';
import { useInvoicesFixed as useInvoices, useDeleteInvoice } from '@/hooks/useInvoicesFixed';
import { toast } from 'sonner';
import { parseErrorMessage } from '@/utils/errorHelpers';
import { CreateInvoiceModal } from '@/components/invoices/CreateInvoiceModal';
import { EditInvoiceModal } from '@/components/invoices/EditInvoiceModal';
import { ViewInvoiceModal } from '@/components/invoices/ViewInvoiceModal';
import { RecordPaymentModal } from '@/components/payments/RecordPaymentModal';
import { CreateDeliveryNoteModal } from '@/components/delivery/CreateDeliveryNoteModal';
import { downloadInvoicePDF } from '@/utils/pdfGenerator';
import { reconcileAllInvoiceBalances } from '@/utils/balanceReconciliation';
import { getDatabase } from '@/integrations/database';

interface Invoice {
  id: string;
  invoice_number: string;
  customers: {
    name: string;
    email?: string;
  };
  invoice_date: string;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue';
  invoice_items?: any[];
  created_by?: string;
  created_by_profile?: { full_name?: string } | null;
}

function calculateActualStatus(invoice: Invoice): 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' {
  // Use tolerance of 0.01 to handle floating-point precision issues
  const tolerance = 0.01;
  const balanceDue = Math.abs(invoice.balance_due || 0) < tolerance ? 0 : (invoice.balance_due || 0);
  const paidAmount = invoice.paid_amount || 0;

  // If balance is fully paid (0 or less) and there was some payment, mark as paid
  if (balanceDue <= 0 && paidAmount > 0) {
    return 'paid';
  }
  // If there's a payment but balance remains, mark as partial
  if (paidAmount > 0 && balanceDue > 0) {
    return 'partial';
  }
  // If status is overdue, preserve that
  if (invoice.status === 'overdue') {
    return 'overdue';
  }
  // If status is sent, preserve that
  if (invoice.status === 'sent') {
    return 'sent';
  }
  // Default to draft (no payments)
  return 'draft';
}

function getStatusColor(status: string) {
  switch (status) {
    case 'draft':
      return 'bg-muted text-muted-foreground border-muted-foreground/20';
    case 'sent':
      return 'bg-warning-light text-warning border-warning/20';
    case 'paid':
      return 'bg-success-light text-success border-success/20';
    case 'partial':
      return 'bg-primary-light text-primary border-primary/20';
    case 'overdue':
      return 'bg-destructive-light text-destructive border-destructive/20';
    default:
      return 'bg-muted text-muted-foreground border-muted-foreground/20';
  }
}

export default function Invoices() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDeliveryNoteModal, setShowDeliveryNoteModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isReconciling, setIsReconciling] = useState(false);

  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [amountFromFilter, setAmountFromFilter] = useState('');
  const [amountToFilter, setAmountToFilter] = useState('');

  const { isAdmin } = useAuth();
  const { data: companies } = useCompanies();
  const currentCompany = companies?.[0];

  // Use the fixed invoices hook
  const { data: invoices, isLoading, error, refetch } = useInvoices(currentCompany?.id);
  const deleteInvoice = useDeleteInvoice();

  // Auto-reconcile invoices on component mount to fix any status mismatches
  useEffect(() => {
    if (currentCompany?.id && !isLoading) {
      const autoReconcile = async () => {
        try {
          console.log('Auto-reconciling invoices for company:', currentCompany.id);
          const result = await reconcileAllInvoiceBalances(currentCompany.id, true);

          if (result.fixed > 0) {
            console.log(`Auto-reconciliation fixed ${result.fixed} invoices`);
            // Refetch invoices to show corrected status
            refetch();
          }
        } catch (error) {
          console.warn('Auto-reconciliation warning (non-critical):', error);
          // Don't show error toast for auto-reconciliation, it's a background operation
        }
      };

      // Run reconciliation with a small delay to allow initial data load
      const timer = setTimeout(autoReconcile, 500);
      return () => clearTimeout(timer);
    }
  }, [currentCompany?.id, isLoading, refetch]);

  // Filter and search logic
  const filteredInvoices = (invoices?.filter(invoice => {
    // Search filter
    const matchesSearch =
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customers?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customers?.email?.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter (use calculated status to show correct values)
    const actualInvoiceStatus = calculateActualStatus(invoice);
    const matchesStatus = statusFilter === 'all' || actualInvoiceStatus === statusFilter;

    // Date filter
    const invoiceDate = new Date(invoice.invoice_date);
    const matchesDateFrom = !dateFromFilter || invoiceDate >= new Date(dateFromFilter);
    const matchesDateTo = !dateToFilter || invoiceDate <= new Date(dateToFilter);

    // Amount filter
    const matchesAmountFrom = !amountFromFilter || (invoice.total_amount || 0) >= parseFloat(amountFromFilter);
    const matchesAmountTo = !amountToFilter || (invoice.total_amount || 0) <= parseFloat(amountToFilter);

    return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo && matchesAmountFrom && matchesAmountTo;
  }) || []).sort((a, b) => new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime());

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };


  const handleCreateSuccess = () => {
    refetch();
    toast.success('Invoice created successfully!');
  };

  const handleEditSuccess = () => {
    refetch();
    setSelectedInvoice(null);
    toast.success('Invoice updated successfully!');
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowViewModal(true);
  };

  const handleEditInvoice = async (invoice: Invoice) => {
    try {
      console.log('🔍 handleEditInvoice STARTED:', {
        selectedInvoiceId: invoice.id,
        selectedInvoiceNumber: invoice.invoice_number,
        invoiceIdType: typeof invoice.id,
        invoiceIdValue: invoice.id
      });

      const db = getDatabase();

      // Fetch invoice
      console.log('📋 Fetching invoice with selectOne, ID:', invoice.id);
      const invoiceResult = await db.selectOne('invoices', invoice.id);

      console.log('📋 selectOne result:', {
        hasError: !!invoiceResult.error,
        errorMessage: invoiceResult.error?.message,
        returnedId: invoiceResult.data?.id,
        returnedInvoiceNumber: invoiceResult.data?.invoice_number,
        returnedData: invoiceResult.data
      });

      if (invoiceResult.error) throw invoiceResult.error;
      if (!invoiceResult.data) throw new Error('Invoice not found');

      const invoiceData = invoiceResult.data as any;

      // Fetch invoice items
      console.log('📦 Fetching invoice items with filter:', { invoice_id: invoice.id });
      const itemsResult = await db.selectBy('invoice_items', { invoice_id: invoice.id });

      console.log('📦 selectBy items result:', {
        hasError: !!itemsResult.error,
        itemsCount: (itemsResult.data || []).length,
        items: itemsResult.data
      });

      if (itemsResult.error) console.warn('Warning: Could not fetch invoice items');

      // Fetch customer info
      const customerResult = await db.selectOne('customers', invoiceData.customer_id);
      if (customerResult.error) console.warn('Warning: Could not fetch customer');

      // Construct the full invoice object with related data
      const fullInvoice = {
        ...invoiceData,
        customers: customerResult.data,
        invoice_items: (itemsResult.data || []).map((item: any) => ({
          ...item,
          products: { name: item.product_name }
        }))
      };

      // DEBUG: Log the response
      console.log('🔍 handleEditInvoice - Full API Response:', {
        requestedInvoiceId: invoice.id,
        returnedInvoiceId: fullInvoice.id,
        invoiceNumber: fullInvoice.invoice_number,
        idsMatch: invoice.id === fullInvoice.id,
        invoiceItems: fullInvoice.invoice_items,
        itemsCount: fullInvoice.invoice_items?.length || 0,
        invoiceMetadata: {
          subtotal: fullInvoice.subtotal,
          tax_amount: fullInvoice.tax_amount,
          total_amount: fullInvoice.total_amount,
          balance_due: fullInvoice.balance_due
        }
      });

      // Additional debug: Check if items exist in DB by checking totals
      if (fullInvoice.total_amount > 0 && (!fullInvoice.invoice_items || fullInvoice.invoice_items.length === 0)) {
        console.warn('⚠️ MISMATCH DETECTED: Invoice has amounts but no items loaded', {
          invoiceId: fullInvoice.id,
          hasAmount: fullInvoice.total_amount > 0,
          itemsLoaded: fullInvoice.invoice_items?.length || 0,
          subtotal: fullInvoice.subtotal,
          tax_amount: fullInvoice.tax_amount
        });
      }

      setSelectedInvoice(fullInvoice as Invoice);
      setShowEditModal(true);
    } catch (error) {
      console.error('Error fetching invoice data:', error);
      toast.error('Failed to load invoice details');
    }
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    try {
      const db = getDatabase();

      // Log invoice data before PDF generation
      console.log('📥 Invoice Download - Data Debug:', {
        invoiceNumber: invoice.invoice_number,
        invoiceId: invoice.id,
        customerId: invoice.customer_id || (invoice as any).customer_id,
        hasCustomersProperty: !!(invoice as any).customers,
        customerName: (invoice as any).customers?.name,
      });

      // Ensure invoice has items; if not, fetch them on demand
      let enrichedInvoice: any = invoice;
      if (!invoice.invoice_items || invoice.invoice_items.length === 0) {
        const itemsResult = await db.selectBy('invoice_items', { invoice_id: invoice.id });
        if (!itemsResult.error && itemsResult.data && itemsResult.data.length > 0) {
          enrichedInvoice = { ...invoice, invoice_items: itemsResult.data };
        }
      }

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

      console.log('📤 Invoice to PDF Generator:', {
        invoiceNumber: enrichedInvoice.invoice_number,
        customerId: enrichedInvoice.customer_id,
        customerName: (enrichedInvoice as any).customers?.name,
        hasItems: enrichedInvoice.invoice_items?.length > 0
      });

      await downloadInvoicePDF(enrichedInvoice, 'INVOICE', companyDetails);
      toast.success(`PDF download started for ${invoice.invoice_number}`);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF. Please try again.');
    }
  };

  const handleSendInvoice = async (invoice: Invoice | string) => {
    const invoiceData = typeof invoice === 'string'
      ? invoices?.find(inv => inv.id === invoice)
      : invoice;

    if (!invoiceData) {
      toast.error('Invoice not found');
      return;
    }

    if (!invoiceData.customers?.email) {
      toast.error('Customer email not available');
      return;
    }

    try {
      // Create email content using dynamic company name
      const companyName = currentCompany?.name || 'Helix General Hardware';
      const subject = `Invoice ${invoiceData.invoice_number} from ${companyName}`;
      const body = `Dear ${invoiceData.customers.name},

Please find attached your invoice ${invoiceData.invoice_number} dated ${new Date(invoiceData.invoice_date).toLocaleDateString()}.

Invoice Summary:
- Invoice Amount: ${formatCurrency(invoiceData.total_amount || 0)}
- Due Date: ${new Date(invoiceData.due_date).toLocaleDateString()}
- Balance Due: ${formatCurrency(invoiceData.balance_due || 0)}

Payment can be made via:
- Bank Transfer
- Mobile Money (M-Pesa)
- Cheque

If you have any questions about this invoice, please don't hesitate to contact us.

Best regards,
${companyName}
Tel: ${currentCompany?.phone || '0741 207 690/0780 165 490'}
Email: ${currentCompany?.email || 'info@helixgeneralhardware.com'}`;

      // Open email client with pre-filled content
      const emailUrl = `mailto:${invoiceData.customers.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(emailUrl, '_blank');

      toast.success(`Email client opened with invoice ${invoiceData.invoice_number} for ${invoiceData.customers.email}`);

      // TODO: In a real app, update invoice status to 'sent'

    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error('Failed to send invoice email. Please try again.');
    }
  };

  const handleRecordPayment = (invoice: Invoice | string) => {
    const invoiceData = typeof invoice === 'string'
      ? invoices?.find(inv => inv.id === invoice)
      : invoice;

    if (!invoiceData) {
      toast.error('Invoice not found');
      return;
    }

    setSelectedInvoice(invoiceData);
    setShowPaymentModal(true);
  };

  const handleCreateDeliveryNote = (invoice: Invoice) => {
    if (!invoice) {
      toast.error('Invoice not found');
      return;
    }

    setSelectedInvoice(invoice);
    setShowDeliveryNoteModal(true);
    toast.info(`Creating delivery note for invoice ${invoice.invoice_number}`);
  };

  const handleClearFilters = () => {
    setStatusFilter('all');
    setDateFromFilter('');
    setDateToFilter('');
    setCustomerFilter('all');
    setAmountFromFilter('');
    setAmountToFilter('');
    setSearchTerm('');
    toast.success('Filters cleared');
  };

  const handleReconcileBalances = async () => {
    if (!currentCompany?.id) {
      toast.error('Company not found');
      return;
    }

    setIsReconciling(true);
    try {
      const result = await reconcileAllInvoiceBalances(currentCompany.id, true);

      if (result.mismatched > 0) {
        toast.success(
          `Reconciliation complete: ${result.fixed} invoices fixed, ${result.mismatched - result.fixed} issues found`
        );
      } else {
        toast.success('All invoices are balanced correctly!');
      }

      if (result.errors.length > 0) {
        console.warn('Reconciliation warnings:', result.errors);
      }

      refetch();
    } catch (error) {
      console.error('Error reconciling balances:', error);
      toast.error('Failed to reconcile invoice balances');
    } finally {
      setIsReconciling(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Invoices</h1>
            <p className="text-muted-foreground">Create and manage customer invoices</p>
          </div>
        </div>
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-destructive">Error loading invoices: {parseErrorMessage(error)}</p>
              <Button 
                variant="outline" 
                onClick={() => refetch()}
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
          <h1 className="text-3xl font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground">
            Create and manage customer invoices
          </p>
        </div>
        <Button
          className="gradient-primary text-primary-foreground hover:opacity-90 shadow-card"
          size="lg"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Invoice
        </Button>
      </div>

      {/* Filters and Search */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search invoices by customer or number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="status-filter">Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="date-from">Date From</Label>
                      <Input
                        id="date-from"
                        type="date"
                        value={dateFromFilter}
                        onChange={(e) => setDateFromFilter(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date-to">Date To</Label>
                      <Input
                        id="date-to"
                        type="date"
                        value={dateToFilter}
                        onChange={(e) => setDateToFilter(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="amount-from">Amount From</Label>
                      <Input
                        id="amount-from"
                        type="number"
                        placeholder="0.00"
                        value={amountFromFilter}
                        onChange={(e) => setAmountFromFilter(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount-to">Amount To</Label>
                      <Input
                        id="amount-to"
                        type="number"
                        placeholder="0.00"
                        value={amountToFilter}
                        onChange={(e) => setAmountToFilter(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={handleClearFilters}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              onClick={handleReconcileBalances}
              disabled={isReconciling || isLoading}
              title="Check and fix invoice balance discrepancies"
            >
              {isReconciling ? 'Reconciling...' : 'Reconcile Balances'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Receipt className="h-5 w-5 text-primary" />
            <span>Invoices List</span>
            {!isLoading && (
              <Badge variant="outline" className="ml-auto">
                {filteredInvoices.length} invoices
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
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No invoices found</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm 
                  ? 'Try adjusting your search criteria'
                  : 'Get started by creating your first invoice'
                }
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="gradient-primary text-primary-foreground hover:opacity-90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Invoice
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice: Invoice) => (
                  <TableRow key={invoice.id} className="hover:bg-muted/50 transition-smooth">
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <Receipt className="h-4 w-4 text-primary" />
                        <span>{invoice.invoice_number}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{invoice.customers?.name || 'Unknown Customer'}</div>
                        {invoice.customers?.email && (
                          <div className="text-sm text-muted-foreground">{invoice.customers.email}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(invoice.invoice_date).toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(invoice.due_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(invoice.total_amount || 0)}
                    </TableCell>
                    <TableCell className="text-success">
                      {formatCurrency(invoice.paid_amount || 0)}
                    </TableCell>
                    <TableCell className={`font-medium ${(invoice.balance_due || 0) > 0 ? 'text-destructive' : 'text-success'}`}>
                      {formatCurrency(invoice.balance_due || 0)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {invoice.created_by_profile?.full_name || invoice.created_by || 'System'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const actualStatus = calculateActualStatus(invoice);
                        return (
                          <Badge variant="outline" className={getStatusColor(actualStatus)}>
                            {actualStatus.charAt(0).toUpperCase() + actualStatus.slice(1)}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewInvoice(invoice)}
                          title="View invoice"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {(isAdmin || calculateActualStatus(invoice) === 'draft') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditInvoice(invoice)}
                            title="Edit invoice"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownloadInvoice(invoice)}
                          title="Download PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {/* Create Delivery Note - Available for sent/paid invoices */}
                        {(() => {
                          const status = calculateActualStatus(invoice);
                          return (status === 'sent' || status === 'paid' || status === 'partial') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCreateDeliveryNote(invoice)}
                              title="Create delivery note"
                            >
                              <Truck className="h-4 w-4" />
                            </Button>
                          );
                        })()}
                        {(() => {
                          const status = calculateActualStatus(invoice);
                          return status !== 'paid' && (
                            <>
                              {status === 'draft' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSendInvoice(invoice.id)}
                                  className="bg-primary-light text-primary border-primary/20 hover:bg-primary hover:text-primary-foreground"
                                >
                                  <Send className="h-4 w-4 mr-1" />
                                  Send
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRecordPayment(invoice)}
                                className="bg-success-light text-success border-success/20 hover:bg-success hover:text-success-foreground"
                              >
                                <DollarSign className="h-4 w-4 mr-1" />
                                {(invoice.balance_due || 0) > 0 ? 'Record Payment' : 'Payment Adjustment'}
                              </Button>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    title="Delete invoice"
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-48">
                                  <div className="text-sm mb-2">Delete invoice {invoice.invoice_number}?</div>
                                  <div className="flex justify-end space-x-2">
                                    <Button variant="ghost" size="sm" onClick={() => {}}>
                                      Cancel
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={async () => {
                                        try {
                                          await deleteInvoice.mutateAsync(invoice.id);
                                          refetch();
                                          setSelectedInvoice(null);
                                          toast.success('Invoice deleted');
                                        } catch (e) {
                                          console.error('Delete failed:', e);
                                          toast.error('Failed to delete invoice');
                                        }
                                      }}
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </>
                          );
                        })()}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Invoice Modal */}
      <CreateInvoiceModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={handleCreateSuccess}
      />

      {/* View Invoice Modal */}
      {selectedInvoice && (
        <ViewInvoiceModal
          open={showViewModal}
          onOpenChange={setShowViewModal}
          invoice={selectedInvoice}
          onEdit={() => {
            setShowViewModal(false);
            setShowEditModal(true);
          }}
          onDownload={() => handleDownloadInvoice(selectedInvoice)}
          onSend={() => handleSendInvoice(selectedInvoice.id)}
          onRecordPayment={() => handleRecordPayment(selectedInvoice.id)}
        />
      )}


      {/* Edit Invoice Modal */}
      {selectedInvoice && (
        <EditInvoiceModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          onSuccess={handleEditSuccess}
          invoice={selectedInvoice}
        />
      )}

      {/* Record Payment Modal */}
      {selectedInvoice && (
        <RecordPaymentModal
          open={showPaymentModal}
          onOpenChange={setShowPaymentModal}
          onSuccess={() => {
            refetch();
            setSelectedInvoice(null);
            toast.success('Payment recorded successfully!');
          }}
          invoice={selectedInvoice}
        />
      )}

      {/* Create Delivery Note Modal */}
      <CreateDeliveryNoteModal
        open={showDeliveryNoteModal}
        onOpenChange={setShowDeliveryNoteModal}
        invoiceId={selectedInvoice?.id}
        onSuccess={() => {
          setShowDeliveryNoteModal(false);
          toast.success('Delivery note created successfully!');
        }}
      />
    </div>
  );
}
