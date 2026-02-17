import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Receipt,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useCustomers, useCompanies } from '@/hooks/useDatabase';
import { useCreateDirectReceipt } from '@/hooks/useQuotationItems';
import { useAuth } from '@/contexts/AuthContext';
import { generateDocumentNumberAPI } from '@/utils/documentNumbering';
import { toast } from 'sonner';

interface CreateDirectReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  preSelectedCustomer?: any;
}

export function CreateDirectReceiptModal({
  open,
  onOpenChange,
  onSuccess,
  preSelectedCustomer
}: CreateDirectReceiptModalProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState(preSelectedCustomer?.id || '');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amount, setAmount] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get current user and company from context
  const { profile, loading: authLoading } = useAuth();
  const { data: companies } = useCompanies();
  const currentCompany = companies?.[0];
  const { data: customers, isLoading: loadingCustomers } = useCustomers(currentCompany?.id);
  const createDirectReceipt = useCreateDirectReceipt();

  // Handle pre-selected customer
  useEffect(() => {
    if (preSelectedCustomer && open) {
      setSelectedCustomerId(preSelectedCustomer.id);
    }
  }, [preSelectedCustomer, open]);

  const formatCurrency = (value: string) => {
    const num = parseFloat(value) || 0;
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const handleSubmit = async () => {
    if (!selectedCustomerId) {
      toast.error('Please select a customer');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    if (!invoiceAmount || parseFloat(invoiceAmount) <= 0) {
      toast.error('Please enter a valid invoice amount');
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate payment number using sequential API
      const paymentNumber = await generateDocumentNumberAPI('receipt');

      const paymentData = {
        payment_number: paymentNumber,
        payment_date: paymentDate,
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        reference_number: referenceNumber || null,
        notes: notes || null,
      };

      await createDirectReceipt.mutateAsync({
        payment: paymentData,
        invoiceAmount: parseFloat(invoiceAmount),
        companyId: currentCompany!.id,
        customerId: selectedCustomerId,
      });

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error creating direct receipt:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to create receipt: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedCustomerId(preSelectedCustomer?.id || '');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('cash');
    setAmount('');
    setReferenceNumber('');
    setNotes('');
    setInvoiceAmount('');
  };

  const amountNum = parseFloat(amount) || 0;
  const invoiceAmountNum = parseFloat(invoiceAmount) || 0;
  const isFullPayment = amountNum >= invoiceAmountNum && invoiceAmountNum > 0;
  const isPartialPayment = amountNum > 0 && amountNum < invoiceAmountNum && invoiceAmountNum > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Create Direct Receipt
          </DialogTitle>
          <DialogDescription>
            Record a payment and automatically create an invoice
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Selection */}
          <div className="space-y-2">
            <Label htmlFor="customer">Customer *</Label>
            <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a customer" />
              </SelectTrigger>
              <SelectContent>
                {customers?.map((customer: any) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentDate">Payment Date *</Label>
                  <Input
                    id="paymentDate"
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method *</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="mpesa">M-Pesa</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="referenceNumber">Reference Number</Label>
                <Input
                  id="referenceNumber"
                  placeholder="e.g., M-Pesa Transaction ID, Cheque Number"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Amount Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Amount Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoiceAmount">Invoice Amount (Total) *</Label>
                  <Input
                    id="invoiceAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={invoiceAmount}
                    onChange={(e) => setInvoiceAmount(e.target.value)}
                  />
                  {invoiceAmount && <p className="text-xs text-muted-foreground">{formatCurrency(invoiceAmount)}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Payment Amount (Received) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  {amount && <p className="text-xs text-muted-foreground">{formatCurrency(amount)}</p>}
                </div>
              </div>

              {/* Payment Status Indicator */}
              {amount && invoiceAmount && (
                <div className="pt-2">
                  {isFullPayment && (
                    <div className="flex items-center gap-2 p-2 bg-success-light text-success rounded text-sm">
                      <span className="font-medium">✓ Full Payment</span>
                      <span>Invoice will be marked as PAID</span>
                    </div>
                  )}
                  {isPartialPayment && (
                    <div className="flex items-center gap-2 p-2 bg-warning-light text-warning rounded text-sm">
                      <span className="font-medium">⚠ Partial Payment</span>
                      <span>Invoice will be marked as PARTIAL ({formatCurrency((invoiceAmountNum - amountNum).toString())} remaining)</span>
                    </div>
                  )}
                  {amountNum > invoiceAmountNum && (
                    <div className="flex items-center gap-2 p-2 bg-destructive-light text-destructive rounded text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <span>Payment exceeds invoice amount</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes about this payment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !selectedCustomerId || !amount || !invoiceAmount}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isSubmitting ? 'Creating...' : 'Create Receipt & Invoice'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
