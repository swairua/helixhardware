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
import { toast } from 'sonner';
import { useUpdateTransportPayment } from '@/hooks/useDatabase';

interface EditPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  payment: any | null;
}

export function EditPaymentModal({
  open,
  onOpenChange,
  onSuccess,
  payment,
}: EditPaymentModalProps) {
  const [formData, setFormData] = useState({
    payment_amount: '',
    payment_date: '',
    payment_method: 'cash' as 'cash' | 'check' | 'bank_transfer' | 'mobile_money' | 'card' | 'other',
    reference_number: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updatePayment = useUpdateTransportPayment();

  useEffect(() => {
    if (payment && open) {
      setFormData({
        payment_amount: payment.payment_amount?.toString() || '',
        payment_date: payment.payment_date || new Date().toISOString().split('T')[0],
        payment_method: payment.payment_method || 'cash',
        reference_number: payment.reference_number || '',
        notes: payment.notes || '',
      });
    }
  }, [payment, open]);

  const handleSubmit = async () => {
    if (!formData.payment_amount) {
      toast.error('Payment amount is required');
      return;
    }

    const paymentAmount = parseFloat(formData.payment_amount);
    if (paymentAmount <= 0) {
      toast.error('Payment amount must be greater than 0');
      return;
    }

    if (!payment) {
      toast.error('Payment information is missing');
      return;
    }

    try {
      setIsSubmitting(true);
      await updatePayment.mutateAsync({
        id: payment.id,
        data: {
          payment_amount: paymentAmount,
          payment_date: formData.payment_date,
          payment_method: formData.payment_method,
          reference_number: formData.reference_number || undefined,
          notes: formData.notes || undefined,
        },
      });

      toast.success('Payment updated successfully');
      onSuccess();
    } catch (error) {
      console.error('Error updating payment:', error);
      toast.error('Failed to update payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!payment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Payment</DialogTitle>
          <DialogDescription>
            Update payment details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {/* Payment Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="payment_amount">Payment Amount *</Label>
              <Input
                id="payment_amount"
                type="number"
                placeholder="0.00"
                value={formData.payment_amount}
                onChange={(e) => setFormData({ ...formData, payment_amount: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="payment_date">Payment Date</Label>
              <Input
                id="payment_date"
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="payment_method">Payment Method</Label>
              <Select value={formData.payment_method} onValueChange={(value) => setFormData({ ...formData, payment_method: value as any })}>
                <SelectTrigger id="payment_method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reference_number">Reference Number</Label>
              <Input
                id="reference_number"
                placeholder="e.g., Check #, Transaction ID"
                value={formData.reference_number}
                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              placeholder="Additional payment details (optional)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !formData.payment_amount}>
            {isSubmitting ? 'Updating...' : 'Update Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
