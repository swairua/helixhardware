import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  CreditCard,
  Calendar,
  Receipt,
  User,
  AlertTriangle,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { parseErrorMessageWithCodes } from '@/utils/errorHelpers';
import { generateDocumentNumberAPI } from '@/utils/documentNumbering';
import { useCreatePayment, usePaymentMethods, useCreatePaymentMethod, useCreateOverpaymentCreditNote } from '@/hooks/useDatabase';
import { useInvoicesFixed as useInvoices } from '@/hooks/useInvoicesFixed';
import { useCurrentCompany } from '@/contexts/CompanyContext';
import { PaymentAllocationQuickFix } from './PaymentAllocationQuickFix';

interface RecordPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  invoice?: any;
}

export function RecordPaymentModal({ open, onOpenChange, onSuccess, invoice }: RecordPaymentModalProps) {
  const [paymentData, setPaymentData] = useState({
    invoice_id: invoice?.id || '',
    amount: invoice?.balance_due || 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: '',
    reference_number: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allocationFailed, setAllocationFailed] = useState(false);
  const [showCreateMethodDialog, setShowCreateMethodDialog] = useState(false);
  const [newMethodData, setNewMethodData] = useState({
    name: '',
    code: ''
  });
  const [isCreatingMethod, setIsCreatingMethod] = useState(false);
  const [createdCreditNoteNumber, setCreatedCreditNoteNumber] = useState<string | null>(null);
  const [showOverpaymentConfirm, setShowOverpaymentConfirm] = useState(false);
  const [pendingOverpaymentData, setPendingOverpaymentData] = useState<{
    amount: number;
    currentBalance: number;
    overpaymentAmount: number;
  } | null>(null);

  // Reset allocation failed state when modal closes
  useEffect(() => {
    if (!open) {
      setAllocationFailed(false);
      setCreatedCreditNoteNumber(null);
    }
  }, [open]);

  // Fetch all available invoices for selection
  const { currentCompany } = useCurrentCompany();
  const { data: invoices = [] } = useInvoices(currentCompany?.id);
  const createPaymentMutation = useCreatePayment();
  const createOverpaymentCreditNoteMutation = useCreateOverpaymentCreditNote();

  // Fetch available payment methods
  const { data: paymentMethods = [], isLoading: methodsLoading } = usePaymentMethods(currentCompany?.id);
  const createPaymentMethodMutation = useCreatePaymentMethod();

  // Set default payment method to first available
  useEffect(() => {
    if (paymentMethods.length > 0 && !paymentData.payment_method) {
      setPaymentData(prev => ({
        ...prev,
        payment_method: paymentMethods[0].code
      }));
    }
  }, [paymentMethods]);
  
  // Include all invoices for manual payment adjustments (including fully paid ones)
  const availableInvoices = invoices.filter(inv =>
    inv.total_amount !== null && inv.total_amount !== undefined
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const handleInputChange = (field: string, value: any) => {
    setPaymentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    // Validate that an invoice is selected
    if (!paymentData.invoice_id) {
      toast.error('Please select an invoice. Payments can only be made against invoices.');
      return;
    }

    if (!paymentData.amount || paymentData.amount === 0) {
      toast.error('Please enter a valid payment amount (can be negative for refunds/adjustments)');
      return;
    }

    const selectedInvoice = availableInvoices.find(inv => inv.id === paymentData.invoice_id);
    const currentBalance = selectedInvoice?.balance_due || (selectedInvoice?.total_amount || 0) - (selectedInvoice?.paid_amount || 0);

    // Check for overpayments and show modal confirmation
    if (paymentData.amount > currentBalance && currentBalance > 0) {
      const overpaymentAmount = paymentData.amount - currentBalance;
      setPendingOverpaymentData({
        amount: paymentData.amount,
        currentBalance,
        overpaymentAmount
      });
      setShowOverpaymentConfirm(true);
      return;
    }

    if (!paymentData.payment_method) {
      toast.error('Please select a payment method');
      return;
    }

    if (!currentCompany?.id) {
      toast.error('Company not found. Please refresh and try again.');
      return;
    }

    await processPayment();
  };

  const processPayment = async () => {
    const selectedInvoice = availableInvoices.find(inv => inv.id === paymentData.invoice_id);

    setIsSubmitting(true);
    try {
      // Generate payment number using sequential API
      const paymentNumber = await generateDocumentNumberAPI('payment');

      const paymentRecord = {
        company_id: selectedInvoice?.company_id || currentCompany.id,
        invoice_id: paymentData.invoice_id,
        payment_number: paymentNumber,
        payment_date: paymentData.payment_date,
        amount: paymentData.amount,
        payment_method: paymentData.payment_method,
        reference_number: paymentData.reference_number || paymentNumber
      };

      const result = await createPaymentMutation.mutateAsync(paymentRecord);

      /**
       * Fallback Handling Strategy:
       * - Payment creation itself uses direct DB inserts (no RPC)
       * - Document numbering uses generateDocumentNumberAPI() with automatic fallback to sequence-based generation
       * - Allocation is attempted immediately after payment insert
       * - If allocation fails, result.allocation_failed = true (user is notified via PaymentAllocationQuickFix)
       * - Payment record persists even if allocation fails - this is intentional design
       */

      // Check if this is an overpayment and create a credit note automatically
      let creditNoteNumber: string | null = null;
      const invoiceData = invoices.find(inv => inv.id === paymentData.invoice_id);
      if (invoiceData) {
        const invoiceBalance = invoiceData.balance_due || (invoiceData.total_amount || 0) - (invoiceData.paid_amount || 0);
        const overpaymentAmount = paymentData.amount > invoiceBalance ? paymentData.amount - invoiceBalance : 0;

        if (overpaymentAmount > 0.01) {
          try {
            const creditNoteResult = await createOverpaymentCreditNoteMutation.mutateAsync({
              invoice_id: paymentData.invoice_id,
              company_id: selectedInvoice?.company_id || currentCompany.id,
              customer_id: selectedInvoice?.customer_id || null,
              overpayment_amount: overpaymentAmount,
              payment_date: paymentData.payment_date,
              payment_reference: paymentRecord.reference_number
            });

            if (creditNoteResult.success) {
              creditNoteNumber = creditNoteResult.credit_note_number;
              setCreatedCreditNoteNumber(creditNoteNumber);
            }
          } catch (creditNoteError: any) {
            // Log warning to user but don't fail the payment
            toast.warning('Credit note creation failed', {
              description: creditNoteError?.message || 'Overpayment was recorded but credit note could not be created'
            });
          }
        }
      }

      // Check if payment was recorded but allocation might have failed
      if (result.fallback_used) {
        if (result.allocation_failed) {
          setAllocationFailed(true);
          if (creditNoteNumber) {
            toast.success(`Payment of ${formatCurrency(paymentData.amount)} recorded successfully!`, {
              description: `Credit note ${creditNoteNumber} created for overpayment. However, payment allocation failed. See the fix options below.`
            });
          } else {
            toast.success(`Payment of ${formatCurrency(paymentData.amount)} recorded successfully!`, {
              description: "However, payment allocation failed. See the fix options below."
            });
          }
        } else {
          if (creditNoteNumber) {
            toast.success(`Payment of ${formatCurrency(paymentData.amount)} recorded successfully!`, {
              description: `Credit note ${creditNoteNumber} created for overpayment.`
            });
          } else {
            toast.success(`Payment of ${formatCurrency(paymentData.amount)} recorded successfully!`);
          }
        }
      } else {
        if (creditNoteNumber) {
          toast.success(`Payment of ${formatCurrency(paymentData.amount)} recorded successfully!`, {
            description: `Credit note ${creditNoteNumber} created for overpayment.`
          });
        } else {
          toast.success(`Payment of ${formatCurrency(paymentData.amount)} recorded successfully!`);
        }
        setAllocationFailed(false);
      }
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error recording payment:', error);

      const errorMessage = parseErrorMessageWithCodes(error, 'payment');

      toast.error(errorMessage, {
        duration: 6000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverpaymentConfirm = async () => {
    setShowOverpaymentConfirm(false);
    if (!paymentData.payment_method) {
      toast.error('Please select a payment method');
      return;
    }
    await processPayment();
  };

  const handleOverpaymentCancel = () => {
    setShowOverpaymentConfirm(false);
    setPendingOverpaymentData(null);
  };

  const resetForm = () => {
    setPaymentData({
      invoice_id: invoice?.id || '',
      amount: invoice?.balance_due || 0,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: paymentMethods.length > 0 ? paymentMethods[0].code : '',
      reference_number: ''
    });
    setAllocationFailed(false);
  };

  const handleCreatePaymentMethod = async () => {
    if (!newMethodData.name.trim()) {
      toast.error('Payment method name is required');
      return;
    }

    if (!newMethodData.code.trim()) {
      toast.error('Payment method code is required');
      return;
    }

    if (!currentCompany?.id) {
      toast.error('Company not found');
      return;
    }

    // Check if method with this name already exists
    const existingMethod = paymentMethods?.find(
      method => method.name && method.name.toLowerCase() === newMethodData.name.trim().toLowerCase()
    );

    if (existingMethod) {
      handleInputChange('payment_method', existingMethod.code);
      setNewMethodData({ name: '', code: '', description: '' });
      setShowCreateMethodDialog(false);
      toast.success(`Payment method "${existingMethod.name}" already exists and has been selected!`);
      return;
    }

    setIsCreatingMethod(true);
    try {
      const newMethod = await createPaymentMethodMutation.mutateAsync({
        company_id: currentCompany.id,
        name: newMethodData.name,
        code: newMethodData.code,
        is_active: true
      });

      handleInputChange('payment_method', newMethod.code);
      setNewMethodData({ name: '', code: '' });
      setShowCreateMethodDialog(false);
      toast.success(`Payment method "${newMethod.name}" created successfully!`);
    } catch (error) {
      console.error('Error creating payment method:', error);
      let errorMessage = 'Failed to create payment method';

      if (error instanceof Error) {
        if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
          errorMessage = `A payment method with the name "${newMethodData.name}" already exists for your company`;
        } else {
          errorMessage = error.message;
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsCreatingMethod(false);
    }
  };

  const getMethodIcon = (iconName?: string) => {
    switch (iconName) {
      case 'CreditCard':
        return <CreditCard className="h-4 w-4" />;
      case 'Receipt':
        return <Receipt className="h-4 w-4" />;
      case 'DollarSign':
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-success" />
            <span>Record Payment</span>
          </DialogTitle>
          <DialogDescription>
            Record a payment against an invoice. All payments must be linked to an invoice.
          </DialogDescription>
          {!invoice && (
            <div className="bg-warning-light border border-warning/20 rounded-lg p-3 mt-2">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span className="text-sm font-medium text-warning">Invoice Required</span>
              </div>
              <p className="text-xs text-warning mt-1">
                Payments can only be recorded against existing invoices. Please select an invoice below.
              </p>
            </div>
          )}
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Invoice Selection and Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Receipt className="h-4 w-4" />
                <span>Invoice Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!invoice && (
                <div className="space-y-2">
                  <Label htmlFor="invoice_select">Select Invoice *</Label>
                  <Select
                    value={paymentData.invoice_id || ''}
                    onValueChange={(value) => {
                      const selectedInv = availableInvoices.find(inv => inv.id === value);
                      handleInputChange('invoice_id', value);
                      handleInputChange('amount', selectedInv?.balance_due || selectedInv?.total_amount || 0);
                      handleInputChange('customer_name', selectedInv?.customers?.name || '');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an invoice to pay" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableInvoices.filter(inv => inv?.id).map((inv) => (
                        <SelectItem key={inv.id} value={inv.id}>
                          <div className="flex justify-between items-center w-full">
                            <span>{inv.invoice_number} - {inv.customers?.name}</span>
                            <span className="ml-2 text-sm text-muted-foreground">
                              {formatCurrency(inv.balance_due || inv.total_amount || 0)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {availableInvoices.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No invoices found.
                    </p>
                  )}
                </div>
              )}
              
              {(invoice || paymentData.invoice_id) && (() => {
                const displayInvoice = invoice || availableInvoices.find(inv => inv.id === paymentData.invoice_id);
                return (
                  <>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Invoice Number:</span>
                        <div className="font-medium">{displayInvoice?.invoice_number}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Customer:</span>
                        <div className="font-medium">{displayInvoice?.customers?.name}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Invoice Date:</span>
                        <div className="font-medium">
                          {displayInvoice?.invoice_date ? new Date(displayInvoice.invoice_date).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Due Date:</span>
                        <div className="font-medium">
                          {displayInvoice?.due_date ? new Date(displayInvoice.due_date).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-muted-foreground text-sm">Total Amount:</span>
                          <div className="font-bold text-lg">{formatCurrency(displayInvoice?.total_amount || 0)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-sm">Paid Amount:</span>
                          <div className="font-bold text-lg text-success">{formatCurrency(displayInvoice?.paid_amount || 0)}</div>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground text-sm">Balance Due:</span>
                          <div className="font-bold text-xl text-destructive">{formatCurrency(displayInvoice?.balance_due || (displayInvoice?.total_amount || 0) - (displayInvoice?.paid_amount || 0))}</div>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <CreditCard className="h-4 w-4" />
                <span>Payment Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Payment Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Payment Amount (KES) *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                  min="0"
                  max={undefined}
                  step="0.01"
                  placeholder="0.00"
                  disabled={!paymentData.invoice_id}
                />
                <div className="text-xs text-muted-foreground">
                  {paymentData.invoice_id ? (
                    <>Outstanding: {formatCurrency((() => {
                      const selectedInv = invoice || availableInvoices.find(inv => inv.id === paymentData.invoice_id);
                      return selectedInv?.balance_due || (selectedInv?.total_amount || 0) - (selectedInv?.paid_amount || 0);
                    })())} • Use negative amounts for refunds/adjustments</>
                  ) : (
                    'Select an invoice first'
                  )}
                </div>
              </div>

              {/* Payment Date */}
              <div className="space-y-2">
                <Label htmlFor="payment_date">Payment Date *</Label>
                <Input
                  id="payment_date"
                  type="date"
                  value={paymentData.payment_date}
                  onChange={(e) => handleInputChange('payment_date', e.target.value)}
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="payment_method">Payment Method *</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCreateMethodDialog(true)}
                    className="h-auto p-1 text-xs text-primary hover:text-primary/80"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add New
                  </Button>
                </div>
                <Select value={paymentData.payment_method || ''} onValueChange={(value) => handleInputChange('payment_method', value)}>
                  <SelectTrigger disabled={paymentMethods.length === 0 && !methodsLoading}>
                    <SelectValue
                      placeholder={methodsLoading ? "Loading payment methods..." : (paymentMethods.length === 0 ? "No methods available" : "Select payment method")}
                    >
                      {paymentData.payment_method ? (
                        paymentMethods.find(m => m.code === paymentData.payment_method)?.name || paymentData.payment_method
                      ) : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.length > 0 ? (
                      paymentMethods.filter(m => m?.code).map((method) => (
                        <SelectItem key={method.id} value={method.code}>
                          <div className="flex items-center space-x-2">
                            {getMethodIcon(method.icon_name)}
                            <span>{method.name}</span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        {methodsLoading ? "Loading payment methods..." : "No payment methods available"}
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {paymentMethods.length === 0 && !methodsLoading && (
                  <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                    <p className="text-sm text-warning font-medium">No payment methods found</p>
                    <p className="text-xs text-warning/80 mt-1">
                      The payment methods table may not be set up yet. Please run the database migration to create default payment methods. See PAYMENT_METHODS_SETUP.md for instructions.
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCreateMethodDialog(true)}
                      className="mt-2 text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Create First Payment Method
                    </Button>
                  </div>
                )}
              </div>

              {/* Reference Number */}
              <div className="space-y-2">
                <Label htmlFor="reference_number">Reference Number</Label>
                <Input
                  id="reference_number"
                  value={paymentData.reference_number}
                  onChange={(e) => handleInputChange('reference_number', e.target.value)}
                  placeholder="Transaction ID, Cheque number, etc."
                />
              </div>

              {/* Payment Summary */}
              {paymentData.invoice_id && (() => {
                const selectedInv = invoice || availableInvoices.find(inv => inv.id === paymentData.invoice_id);
                const balance = selectedInv?.balance_due || selectedInv?.total_amount || 0;
                const remainingBalance = Math.max(0, balance - paymentData.amount);
                const creditNoteAmount = Math.max(0, paymentData.amount - balance);

                return (
                  <div className="border-t pt-4 bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Payment Summary</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Payment Amount:</span>
                        <span className="font-semibold">{formatCurrency(paymentData.amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Remaining Balance:</span>
                        <span className={`font-semibold ${remainingBalance > 0 ? 'text-destructive' : 'text-success'}`}>
                          {formatCurrency(remainingBalance)}
                        </span>
                      </div>
                      {creditNoteAmount > 0.01 && (
                        <div className="flex justify-between pt-2 border-t">
                          <span className="text-warning font-medium">Credit Note:</span>
                          <span className="font-semibold text-warning">{formatCurrency(creditNoteAmount)}</span>
                        </div>
                      )}
                      {paymentData.payment_method && (
                        <div className="flex justify-between">
                          <span>Payment Method:</span>
                          <div className="flex items-center space-x-1">
                            {getMethodIcon(paymentData.payment_method)}
                            <span className="font-semibold capitalize">
                              {paymentData.payment_method.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>

        {/* Show quick fix if allocation failed */}
        {allocationFailed && (
          <PaymentAllocationQuickFix className="mt-4" />
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !paymentData.amount || paymentData.amount === 0 || !paymentData.invoice_id}
            className="bg-success hover:bg-success/90"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Recording...' : !paymentData.invoice_id ? 'Select Invoice First' : paymentData.amount < 0 ? 'Record Adjustment/Refund' : 'Record Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Create Payment Method Dialog */}
      <Dialog open={showCreateMethodDialog} onOpenChange={setShowCreateMethodDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5 text-primary" />
              <span>Create New Payment Method</span>
            </DialogTitle>
            <DialogDescription>
              Add a new payment method to your payment options
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="method_name">Method Name *</Label>
              <Input
                id="method_name"
                placeholder="e.g., PayPal, Crypto, Wire Transfer"
                value={newMethodData.name}
                onChange={(e) => setNewMethodData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="method_code">Code *</Label>
              <Input
                id="method_code"
                placeholder="e.g., paypal, crypto, wire"
                value={newMethodData.code}
                onChange={(e) => setNewMethodData(prev => ({ ...prev, code: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Unique identifier for this payment method (lowercase, no spaces)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateMethodDialog(false)}
              disabled={isCreatingMethod}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePaymentMethod}
              disabled={isCreatingMethod || !newMethodData.name.trim() || !newMethodData.code.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              {isCreatingMethod ? 'Creating...' : 'Create Method'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Overpayment Confirmation Modal */}
      <Dialog open={showOverpaymentConfirm} onOpenChange={setShowOverpaymentConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <span>Overpayment Confirmation</span>
            </DialogTitle>
            <DialogDescription>
              This payment will result in an overpayment
            </DialogDescription>
          </DialogHeader>

          {pendingOverpaymentData && (
            <div className="space-y-4">
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Payment amount ({formatCurrency(pendingOverpaymentData.amount)}) exceeds outstanding balance ({formatCurrency(pendingOverpaymentData.currentBalance)}).
                </p>
                <p className="text-sm font-semibold text-warning">
                  This will create an overpayment of {formatCurrency(pendingOverpaymentData.overpaymentAmount)}
                </p>
              </div>

              <div className="bg-info/10 border border-info/20 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  ℹ️ A credit note will be automatically created for the overpayment amount. The credit note can be applied to this or other invoices.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleOverpaymentCancel}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleOverpaymentConfirm}
              className="bg-warning hover:bg-warning/90"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Confirm Overpayment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
