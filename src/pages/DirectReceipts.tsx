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
  Download,
  Calendar,
  Banknote,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { useCompanies } from '@/hooks/useDatabase';
import { toast } from 'sonner';
import { parseErrorMessage } from '@/utils/errorHelpers';
import { downloadInvoicePDF } from '@/utils/pdfGenerator';
import { CreateDirectReceiptModalEnhanced } from '@/components/payments/CreateDirectReceiptModalEnhanced';
import { ViewReceiptModal } from '@/components/payments/ViewReceiptModal';
import { apiClient } from '@/integrations/api';
import { callCustomApiAction } from '@/utils/customApiCall';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Receipt {
  id: string;
  receipt_number: string;
  receipt_date: string;
  receipt_type: string;
  invoice_id: string;
  payment_id: string;
  payment_number: string;
  invoice_number: string;
  customers: {
    name: string;
    email?: string;
  };
  payment_date: string;
  total_amount: number;
  excess_amount: number;
  excess_handling: string;
  payment_method: string;
  reference_number?: string;
  status: 'paid' | 'partial' | 'draft';
  invoice_items?: any[];
  created_by?: string;
  created_by_profile?: { full_name?: string } | null;
}

function getStatusColor(status: string) {
  switch (status) {
    case 'draft':
      return 'bg-muted text-muted-foreground border-muted-foreground/20';
    case 'paid':
      return 'bg-success-light text-success border-success/20';
    case 'partial':
      return 'bg-primary-light text-primary border-primary/20';
    default:
      return 'bg-muted text-muted-foreground border-muted-foreground/20';
  }
}

export default function DirectReceipts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState<Receipt | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [amountFromFilter, setAmountFromFilter] = useState('');
  const [amountToFilter, setAmountToFilter] = useState('');

  const { data: companies } = useCompanies();
  const currentCompany = companies?.[0];

  // Fetch direct receipts from receipts table
  const fetchDirectReceipts = async () => {
    if (!currentCompany?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch all receipts for the company
      const { data: allReceipts, error: receiptsError } = await apiClient.select('receipts', {
        company_id: currentCompany.id
      });

      if (receiptsError) throw new Error(receiptsError.message || 'Failed to fetch receipts');

      if (!Array.isArray(allReceipts) || allReceipts.length === 0) {
        setReceipts([]);
        return;
      }

      // Collect IDs for batch fetching
      const invoiceIds = [...new Set(allReceipts.map((r: any) => r.invoice_id))];
      const paymentIds = [...new Set(allReceipts.map((r: any) => r.payment_id))];
      let customerIds: string[] = [];
      let createdByIds: string[] = [];

      let invoiceMap = new Map();
      let paymentMap = new Map();
      let customerMap = new Map();
      let createdByMap = new Map();
      let itemsMap = new Map();

      // Fetch invoices
      try {
        const { data: invoices } = await apiClient.select('invoices', {});
        if (Array.isArray(invoices)) {
          invoices.forEach((inv: any) => {
            invoiceMap.set(inv.id, inv);
            if (inv.customer_id && !customerIds.includes(inv.customer_id)) {
              customerIds.push(inv.customer_id);
            }
          });
        }
      } catch (e) {
        console.warn('Could not fetch invoices:', e);
      }

      // Fetch payments
      try {
        const { data: payments } = await apiClient.select('payments', {});
        if (Array.isArray(payments)) {
          payments.forEach((payment: any) => {
            paymentMap.set(payment.id, payment);
            if (payment.created_by && !createdByIds.includes(payment.created_by)) {
              createdByIds.push(payment.created_by);
            }
          });
        }
      } catch (e) {
        console.warn('Could not fetch payments:', e);
      }

      // Fetch customers
      try {
        for (const customerId of customerIds) {
          const { data: customer } = await apiClient.selectOne('customers', customerId);
          if (customer) {
            customerMap.set(customerId, customer);
          }
        }
      } catch (e) {
        console.warn('Could not fetch customer details:', e);
      }

      // Fetch receipt items snapshot first (items from the moment of payment)
      try {
        for (const receipt of allReceipts) {
          try {
            // Try to fetch receipt_items (snapshot from payment time)
            const { data: receiptItems } = await apiClient.select('receipt_items', {
              receipt_id: receipt.id
            });

            if (Array.isArray(receiptItems) && receiptItems.length > 0) {
              // Use snapshot items if available
              itemsMap.set(receipt.id, receiptItems);
            } else {
              // Fall back to current invoice_items if snapshot doesn't exist
              try {
                const { data: invoiceItems } = await apiClient.select('invoice_items', {
                  invoice_id: receipt.invoice_id
                });
                if (Array.isArray(invoiceItems) && invoiceItems.length > 0) {
                  itemsMap.set(receipt.id, invoiceItems);
                }
              } catch (e) {
                console.warn(`Could not fetch invoice items for receipt ${receipt.id}:`, e);
              }
            }
          } catch (e) {
            console.warn(`Could not fetch items for receipt ${receipt.id}:`, e);
          }
        }
      } catch (e) {
        console.warn('Could not fetch receipt items:', e);
      }

      // Transform receipts
      const transformedReceipts: Receipt[] = allReceipts.map((receipt: any) => {
        const invoice = invoiceMap.get(receipt.invoice_id);
        const payment = paymentMap.get(receipt.payment_id);
        const customer = invoice ? customerMap.get(invoice.customer_id) : null;

        return {
          id: receipt.id,
          receipt_number: receipt.receipt_number,
          receipt_date: receipt.receipt_date,
          receipt_type: receipt.receipt_type,
          invoice_id: receipt.invoice_id,
          payment_id: receipt.payment_id,
          payment_number: receipt.receipt_number,
          invoice_number: invoice?.invoice_number || 'Unknown',
          customers: customer || { name: 'Unknown Customer', email: null },
          payment_date: receipt.receipt_date,
          total_amount: receipt.total_amount,
          excess_amount: receipt.excess_amount || 0,
          excess_handling: receipt.excess_handling,
          payment_method: payment?.payment_method || 'unknown',
          reference_number: payment?.reference_number,
          status: invoice?.status || 'draft',
          invoice_items: itemsMap.get(receipt.id) || [],
          created_by: receipt.created_by,
          created_by_profile: receipt.created_by_profile
        };
      });

      setReceipts(transformedReceipts.sort((a, b) =>
        new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
      ));
    } catch (err) {
      console.error('Error fetching direct receipts:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch receipts on component mount and when company changes
  useEffect(() => {
    fetchDirectReceipts();
  }, [currentCompany?.id]);

  // Filter and search logic
  const filteredReceipts = receipts.filter(receipt => {
    // Search filter
    const matchesSearch =
      receipt.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.customers?.name.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus = statusFilter === 'all' || receipt.status === statusFilter;

    // Date filter
    const receiptDate = new Date(receipt.payment_date);
    const matchesDateFrom = !dateFromFilter || receiptDate >= new Date(dateFromFilter);
    const matchesDateTo = !dateToFilter || receiptDate <= new Date(dateToFilter);

    // Payment method filter
    const matchesPaymentMethod = 
      paymentMethodFilter === 'all' || 
      receipt.payment_method === paymentMethodFilter;

    // Amount filter
    const matchesAmountFrom = !amountFromFilter || receipt.total_amount >= parseFloat(amountFromFilter);
    const matchesAmountTo = !amountToFilter || receipt.total_amount <= parseFloat(amountToFilter);

    return (
      matchesSearch && 
      matchesStatus && 
      matchesDateFrom && 
      matchesDateTo && 
      matchesPaymentMethod &&
      matchesAmountFrom && 
      matchesAmountTo
    );
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleCreateSuccess = () => {
    fetchDirectReceipts();
    toast.success('Direct receipt created successfully!');
  };

  const handleViewReceipt = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setShowViewModal(true);
  };

  const handleDownloadReceipt = async (receipt: Receipt) => {
    try {
      let enrichedReceipt: any = receipt;
      if (!receipt.invoice_items || receipt.invoice_items.length === 0) {
        try {
          // Try to fetch receipt_items (snapshot from payment time) first
          const { data: receiptItems } = await apiClient.select('receipt_items', {
            receipt_id: receipt.id
          });

          if (receiptItems && Array.isArray(receiptItems) && receiptItems.length > 0) {
            enrichedReceipt = { ...receipt, invoice_items: receiptItems };
          } else {
            // Fall back to current invoice_items if snapshot doesn't exist
            try {
              const { data: invoiceItems } = await apiClient.select('invoice_items', {
                invoice_id: receipt.invoice_id
              });
              if (invoiceItems && Array.isArray(invoiceItems)) {
                enrichedReceipt = { ...receipt, invoice_items: invoiceItems };
              }
            } catch (e) {
              console.warn('Could not fetch invoice items for PDF:', e);
            }
          }
        } catch (e) {
          console.warn('Could not fetch receipt items for PDF:', e);
        }
      }

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

      await downloadInvoicePDF(
        {
          ...enrichedReceipt,
          type: 'receipt',
          number: receipt.receipt_number,
          date: receipt.receipt_date
        },
        'RECEIPT',
        companyDetails
      );
      toast.success(`Receipt PDF download started for ${receipt.receipt_number}`);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download receipt PDF. Please try again.');
    }
  };

  const handleDeleteReceipt = (receipt: Receipt) => {
    console.log('🗑️ [DELETE_TRIGGER] Delete receipt button clicked');
    console.log('🗑️ [DELETE_TRIGGER] Receipt selected for deletion:', {
      id: receipt.id,
      receiptNumber: receipt.receipt_number,
      invoiceId: receipt.invoice_id,
      invoiceNumber: receipt.invoice_number,
      paymentId: receipt.payment_id,
      totalAmount: receipt.total_amount,
      paymentMethod: receipt.payment_method,
      receiptDate: receipt.receipt_date,
      status: receipt.status
    });
    console.log('🗑️ [DELETE_TRIGGER] Opening delete confirmation dialog');
    setReceiptToDelete(receipt);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!receiptToDelete) return;

    setIsDeleting(true);
    console.log('🗑️ [FRONTEND] ===== START DELETE RECEIPT CONFIRMATION =====');
    try {
      // Use transaction-safe deletion endpoint for atomic operation
      const token = localStorage.getItem('med_api_token');
      const requestBody = {
        receipt_id: receiptToDelete.id
      };

      console.log('🗑️ [FRONTEND] Receipt deletion request:', {
        receiptId: receiptToDelete.id,
        receiptIdType: typeof receiptToDelete.id,
        receiptNumber: receiptToDelete.receipt_number,
        invoiceId: receiptToDelete.invoice_id,
        paymentId: receiptToDelete.payment_id,
        token: token ? '***present***' : '***missing***',
        requestBody: requestBody
      });

      console.log('🗑️ [FRONTEND] Sending DELETE request to /api?action=delete_receipt_with_cascade');
      const response = await fetch('/api?action=delete_receipt_with_cascade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('🗑️ [FRONTEND] Response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: {
          contentType: response.headers.get('content-type'),
          contentLength: response.headers.get('content-length')
        }
      });

      // Check if response has content
      const responseText = await response.text();
      console.log('🗑️ [FRONTEND] Response body length:', responseText.length);
      console.log('🗑️ [FRONTEND] Response body (first 500 chars):', responseText.substring(0, 500));

      if (!response.ok) {
        console.error('🗑️ [FRONTEND] Response not OK, attempting to parse error:', {
          statusCode: response.status,
          statusText: response.statusText,
          bodyLength: responseText.length,
          bodyPreview: responseText.substring(0, 200)
        });

        // Handle empty response
        if (!responseText || responseText.trim() === '') {
          console.error('🗑️ [FRONTEND] Empty response body from server');
          throw new Error(`HTTP ${response.status}: The server returned an empty response. This may indicate a server error.`);
        }

        // Try to parse JSON error response
        try {
          const errorData = JSON.parse(responseText);
          console.error('🗑️ [FRONTEND] Parsed error data:', errorData);
          throw new Error(errorData.message || 'Failed to delete receipt');
        } catch (parseErr) {
          console.error('🗑️ [FRONTEND] Failed to parse error response as JSON:', parseErr);
          // If it's not JSON, use the raw text as the error message
          if (responseText.includes('<') || responseText.includes('<!')) {
            console.error('🗑️ [FRONTEND] Response appears to be HTML, not JSON');
            throw new Error(`HTTP ${response.status}: Server returned an HTML error page. Please check server logs.`);
          }
          throw new Error(`HTTP ${response.status}: ${responseText || 'Empty response'}`);
        }
      }

      if (!responseText) {
        console.error('🗑️ [FRONTEND] Empty response from server');
        throw new Error('Empty response from server');
      }

      console.log('🗑️ [FRONTEND] Parsing success response...');
      const result = JSON.parse(responseText);
      console.log('🗑️ [FRONTEND] Parsed response:', result);

      if (result.status !== 'success') {
        console.error('🗑️ [FRONTEND] Response status is not success:', {
          status: result.status,
          message: result.message
        });
        throw new Error(result.message || 'Failed to delete receipt');
      }

      console.log('✅ [FRONTEND] Deletion successful, updating local state');

      // Remove from local state
      setReceipts(receipts.filter(r => r.id !== receiptToDelete.id));

      console.log('✅ [FRONTEND] Local state updated, showing success toast');
      toast.success(`Receipt ${receiptToDelete.receipt_number} and all related records deleted successfully`);
      setShowDeleteConfirm(false);
      setReceiptToDelete(null);

      console.log('✅ [FRONTEND] Refreshing receipts list...');
      // Refresh the receipts list to ensure consistency
      setTimeout(() => {
        console.log('✅ [FRONTEND] Executing fetchDirectReceipts refresh');
        fetchDirectReceipts();
      }, 500);

      console.log('✅ [FRONTEND] ===== DELETE RECEIPT COMPLETED SUCCESSFULLY =====');
    } catch (err) {
      console.error('🔴 [FRONTEND] Error deleting receipt:', err);
      console.error('🔴 [FRONTEND] Error stack:', err instanceof Error ? err.stack : 'N/A');
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete receipt';
      console.error('🔴 [FRONTEND] Displaying error toast:', errorMessage);
      toast.error(errorMessage);
      console.log('🔴 [FRONTEND] ===== DELETE RECEIPT FAILED =====');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearFilters = () => {
    setStatusFilter('all');
    setDateFromFilter('');
    setDateToFilter('');
    setPaymentMethodFilter('all');
    setAmountFromFilter('');
    setAmountToFilter('');
    setSearchTerm('');
    toast.success('Filters cleared');
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Direct Receipts</h1>
            <p className="text-muted-foreground">View and manage payment receipts</p>
          </div>
        </div>
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-destructive">Error loading receipts: {parseErrorMessage(error)}</p>
              <Button 
                variant="outline" 
                onClick={() => fetchDirectReceipts()}
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
          <h1 className="text-3xl font-bold text-foreground">Direct Receipts</h1>
          <p className="text-muted-foreground">
            Create and manage customer payment receipts
          </p>
        </div>
        <Button
          className="gradient-primary text-primary-foreground hover:opacity-90 shadow-card"
          size="lg"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Receipt
        </Button>
      </div>

      {/* Filters and Search */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search receipts by invoice or receipt number..."
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
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment-method-filter">Payment Method</Label>
                    <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All methods" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Methods</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="mpesa">M-Pesa</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
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
          </div>
        </CardContent>
      </Card>

      {/* Receipts Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Banknote className="h-5 w-5 text-primary" />
            <span>Direct Receipts List</span>
            {!isLoading && (
              <Badge variant="outline" className="ml-auto">
                {filteredReceipts.length} receipts
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
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          ) : filteredReceipts.length === 0 ? (
            <div className="text-center py-12">
              <Banknote className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No receipts found</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm 
                  ? 'Try adjusting your search criteria'
                  : 'Get started by creating your first direct receipt'
                }
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="gradient-primary text-primary-foreground hover:opacity-90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Receipt
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt Number</TableHead>
                  <TableHead>Invoice Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceipts.map((receipt: Receipt) => (
                  <TableRow key={receipt.id} className="hover:bg-muted/50 transition-smooth">
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <Banknote className="h-4 w-4 text-primary" />
                        <span>{receipt.receipt_number}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {receipt.invoice_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{receipt.customers?.name || 'Unknown Customer'}</div>
                        {receipt.customers?.email && (
                          <div className="text-sm text-muted-foreground">{receipt.customers.email}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(receipt.payment_date).toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">
                      {receipt.payment_method.replace('_', ' ')}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(receipt.total_amount || 0)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {receipt.created_by_profile?.full_name || receipt.created_by || 'System'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(receipt.status)}>
                        {receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewReceipt(receipt)}
                          title="View receipt"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownloadReceipt(receipt)}
                          title="Download receipt PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteReceipt(receipt)}
                          title="Delete receipt"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Direct Receipt Modal */}
      <CreateDirectReceiptModalEnhanced
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={handleCreateSuccess}
      />

      {/* View Receipt Modal */}
      {selectedReceipt && (
        <ViewReceiptModal
          open={showViewModal}
          onOpenChange={setShowViewModal}
          receipt={selectedReceipt}
          onDownload={() => handleDownloadReceipt(selectedReceipt)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={showDeleteConfirm}
        onOpenChange={(open) => {
          if (open) {
            console.log('🗑️ [DELETE_MODAL] Delete confirmation dialog opened');
            console.log('🗑️ [DELETE_MODAL] Receipt details:', {
              id: receiptToDelete?.id,
              receiptNumber: receiptToDelete?.receipt_number,
              invoiceId: receiptToDelete?.invoice_id,
              invoiceNumber: receiptToDelete?.invoice_number,
              paymentId: receiptToDelete?.payment_id,
              totalAmount: receiptToDelete?.total_amount,
              paymentMethod: receiptToDelete?.payment_method,
              receiptDate: receiptToDelete?.receipt_date,
              notes: receiptToDelete?.notes
            });
          } else {
            console.log('🗑️ [DELETE_MODAL] Delete confirmation dialog closed');
          }
          setShowDeleteConfirm(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <AlertDialogTitle>Delete Receipt</AlertDialogTitle>
            </div>
          </AlertDialogHeader>
          <div className="space-y-4">
            <AlertDialogDescription>
              Are you sure you want to delete receipt <strong className="text-foreground">{receiptToDelete?.receipt_number}</strong>?
            </AlertDialogDescription>

            {/* Receipt Details Preview */}
            <div className="text-sm bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3 rounded space-y-2">
              <div className="font-semibold text-blue-900 dark:text-blue-100">📋 Receipt Information:</div>
              <div className="space-y-1 text-xs text-blue-800 dark:text-blue-200">
                {receiptToDelete?.receipt_number && (
                  <div><span className="font-semibold">Receipt #:</span> {receiptToDelete.receipt_number}</div>
                )}
                {receiptToDelete?.invoice_number && (
                  <div><span className="font-semibold">Invoice #:</span> {receiptToDelete.invoice_number}</div>
                )}
                {receiptToDelete?.total_amount && (
                  <div><span className="font-semibold">Amount:</span> ${parseFloat(receiptToDelete.total_amount).toFixed(2)}</div>
                )}
                {receiptToDelete?.payment_method && (
                  <div><span className="font-semibold">Method:</span> {receiptToDelete.payment_method}</div>
                )}
                {receiptToDelete?.receipt_date && (
                  <div><span className="font-semibold">Date:</span> {new Date(receiptToDelete.receipt_date).toLocaleDateString()}</div>
                )}
              </div>
            </div>

            {/* Cascade Delete Warning */}
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded space-y-2">
              <div className="font-semibold text-destructive">⚠️ This will also delete:</div>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Receipt line items snapshot</li>
                <li>Payment allocation</li>
                <li>Payment record (ID: {receiptToDelete?.payment_id || 'N/A'})</li>
                <li>Invoice status will revert to draft (Invoice ID: {receiptToDelete?.invoice_id || 'N/A'})</li>
              </ul>
            </div>

            {/* Critical Warning */}
            <div className="text-sm font-semibold text-destructive bg-destructive/10 p-2 rounded border border-destructive/20">
              🔴 This action cannot be undone. All related financial records will be permanently deleted.
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              onClick={() => {
                console.log('🗑️ [DELETE_MODAL] Delete cancelled by user');
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                console.log('🗑️ [DELETE_MODAL] Delete button clicked, starting deletion process');
                console.log('🗑️ [DELETE_MODAL] Receipt to delete:', {
                  id: receiptToDelete?.id,
                  number: receiptToDelete?.receipt_number,
                  amount: receiptToDelete?.total_amount
                });
                confirmDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block animate-spin">⏳</span>
                  Deleting...
                </span>
              ) : (
                'Delete Receipt'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
