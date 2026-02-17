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
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { useUpdatePayment, usePaymentMethods } from '@/hooks/useDatabase';
import { useCurrentCompany } from '@/contexts/CompanyContext';

interface EditPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  payment?: {
    id: string;
    payment_number?: string;
    payment_date: string;
    amount: number;
    payment_method: string;
    reference_number?: string;
    customers?: {
      name: string;
      email?: string;
    };
    payment_allocations?: Array<{
      invoice_number: string;
      allocated_amount: number;
    }>;
  };
}

export function EditPaymentModal({
  open,
  onOpenChange,
  onSuccess,
  payment,
}: EditPaymentModalProps) {
  const [formData, setFormData] = useState({
    amount: 0,
    payment_date: '',
    payment_method: '',
    reference_number: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amountChanged, setAmountChanged] = useState(false);

  const { currentCompany } = useCurrentCompany();
  const updatePaymentMutation = useUpdatePayment();
  const { data: paymentMethods = [], isLoading: methodsLoading } = usePaymentMethods(currentCompany?.id);

  // Initialize form when payment changes
  useEffect(() => {
    if (payment && open) {
      setFormData({
        amount: payment.amount,
        payment_date: payment.payment_date,
        payment_method: payment.payment_method,
        reference_number: payment.reference_number || ''
      });
      setAmountChanged(false);
    }
  }, [payment, open]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const handleInputChange = (field: string, value: any) => {
    if (field === 'amount') {
      setAmountChanged(true);
    }
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!payment?.id) {
      toast.error('Payment not found');
      return;
    }

    if (!formData.amount || formData.amount === 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    if (!formData.payment_method) {
      toast.error('Please select a payment method');
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePaymentMutation.mutateAsync({
        paymentId: payment.id,
        paymentData: {
          amount: formData.amount,
          payment_date: formData.payment_date,
          payment_method: formData.payment_method,
          reference_number: formData.reference_number
        },
        oldAmount: payment.amount
      });

      toast.success('Payment updated successfully!', {
        description: amountChanged 
          ? `Invoice balances have been recalculated.` 
          : 'Payment details updated.'
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating payment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update payment';
      toast.error(errorMessage, {
        duration: 6000,
        description: 'Please try again or contact support'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!payment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Edit Payment
          </DialogTitle>
          <DialogDescription>
            Update payment details. Changes will affect customer statements.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Payment Number</p>
                <p className="font-medium text-sm">{payment.payment_number}</p>
              </div>

              {payment.customers && (
                <div>
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="font-medium text-sm">{payment.customers.name}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount (KES) *</Label>
                  <div className="relative mt-2">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                      className="pl-10"
                    />
                  </div>
                  {amountChanged && (
                    <p className="text-xs text-warning mt-1">
                      Original: {formatCurrency(payment.amount)}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="payment_date">Payment Date *</Label>
                  <div className="relative mt-2">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="payment_date"
                      type="date"
                      value={formData.payment_date}
                      onChange={(e) => handleInputChange('payment_date', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="payment_method">Payment Method *</Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(value) => handleInputChange('payment_method', value)}
                  disabled={methodsLoading}
                >
                  <SelectTrigger id="payment_method" className="mt-2">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.filter(m => m?.code).map((method) => (
                      <SelectItem key={method.code} value={method.code}>
                        {method.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="reference_number">Reference Number</Label>
                <Input
                  id="reference_number"
                  value={formData.reference_number}
                  onChange={(e) => handleInputChange('reference_number', e.target.value)}
                  placeholder="e.g., Cheque number, transaction ID"
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Invoice Allocations */}
          {payment.payment_allocations && payment.payment_allocations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Invoice Allocations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {payment.payment_allocations.map((allocation, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <span className="font-medium text-sm">{allocation.invoice_number}</span>
                      <span className="text-sm font-semibold text-success">
                        {formatCurrency(allocation.allocated_amount)}
                      </span>
                    </div>
                  ))}
                </div>
                {amountChanged && (
                  <div className="mt-4 p-3 bg-info/10 border border-info/20 rounded-lg">
                    <p className="text-sm text-muted-foreground flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-info" />
                      <span>
                        Changing the amount will automatically recalculate invoice balances for all allocations.
                      </span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Original Amount:</span>
                  <span className="font-medium">{formatCurrency(payment.amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">New Amount:</span>
                  <span className="font-medium text-success">{formatCurrency(formData.amount)}</span>
                </div>
                {amountChanged && formData.amount !== payment.amount && (
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span className="text-muted-foreground">Difference:</span>
                    <span className={`font-semibold ${formData.amount > payment.amount ? 'text-success' : 'text-destructive'}`}>
                      {formData.amount > payment.amount ? '+' : ''}{formatCurrency(formData.amount - payment.amount)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="gradient-primary"
          >
            {isSubmitting ? 'Updating...' : 'Update Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
