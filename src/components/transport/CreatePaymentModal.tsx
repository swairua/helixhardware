import { useState, useMemo } from 'react';
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
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateTransportPayment, useTransportPayments, useTransportFinance } from '@/hooks/useDatabase';

interface CreatePaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  companyId: string;
}

export function CreatePaymentModal({
  open,
  onOpenChange,
  onSuccess,
  companyId,
}: CreatePaymentModalProps) {
  const [formData, setFormData] = useState({
    trip_id: '',
    payment_amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash' as 'cash' | 'check' | 'bank_transfer' | 'mobile_money' | 'card' | 'other',
    reference_number: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createPayment = useCreateTransportPayment();
  const { data: finances = [] } = useTransportFinance(companyId);
  const { data: existingPayments = [] } = useTransportPayments(formData.trip_id || undefined);

  // Calculate totals for selected trip
  const selectedTrip = finances.find(f => f.id === formData.trip_id);
  const totalPaid = useMemo(() => {
    return (existingPayments || []).reduce((sum: number, p: any) => sum + (p.payment_amount || 0), 0);
  }, [existingPayments]);

  const balance = useMemo(() => {
    return (selectedTrip?.selling_price || 0) - totalPaid;
  }, [selectedTrip?.selling_price, totalPaid]);

  const paymentAmount = parseFloat(formData.payment_amount) || 0;
  const newBalance = balance - paymentAmount;

  const handleSubmit = async () => {
    if (!formData.trip_id) {
      toast.error('Please select a trip');
      return;
    }

    if (!formData.payment_amount) {
      toast.error('Payment amount is required');
      return;
    }

    if (paymentAmount <= 0) {
      toast.error('Payment amount must be greater than 0');
      return;
    }

    if (paymentAmount > balance) {
      toast.error(`Payment amount cannot exceed balance due (${balance.toLocaleString()})`);
      return;
    }

    try {
      setIsSubmitting(true);
      await createPayment.mutateAsync({
        company_id: companyId,
        trip_id: formData.trip_id,
        payment_amount: paymentAmount,
        payment_date: formData.payment_date,
        payment_method: formData.payment_method,
        reference_number: formData.reference_number || undefined,
        notes: formData.notes || undefined,
      });

      toast.success('Payment recorded successfully');
      setFormData({
        trip_id: '',
        payment_amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        reference_number: '',
        notes: '',
      });
      onSuccess();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Record Transport Payment</DialogTitle>
          <DialogDescription>
            Record a new payment for a transport trip
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {/* Trip Selection */}
          <div>
            <Label htmlFor="trip_id">Trip / Finance Record *</Label>
            <Select value={formData.trip_id} onValueChange={(value) => setFormData({ ...formData, trip_id: value })}>
              <SelectTrigger id="trip_id">
                <SelectValue placeholder="Select a trip" />
              </SelectTrigger>
              <SelectContent>
                {finances
                  .filter(f => f.payment_status !== 'paid')
                  .map((finance) => (
                    <SelectItem key={finance.id} value={finance.id}>
                      {finance.vehicle_number || '-'} - {finance.materials || '-'} ({finance.selling_price.toLocaleString()}) - {finance.customer_name || 'No customer'}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Trip Summary */}
          {selectedTrip && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">Trip Amount:</span>
                    <span className="font-semibold">{(selectedTrip.selling_price || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">Previously Paid:</span>
                    <span className="font-semibold">{totalPaid.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-blue-200 my-2"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-blue-700">Balance Due:</span>
                    <span className={`font-bold text-lg ${balance <= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                      {Math.max(0, balance).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedTrip && balance <= 0 && (
            <Alert className="border-green-200 bg-green-50">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                This trip has been fully paid.
              </AlertDescription>
            </Alert>
          )}

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
                disabled={!selectedTrip || balance <= 0}
                max={balance}
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

          {/* Balance Preview */}
          {selectedTrip && paymentAmount > 0 && (
            <Card className="bg-gray-50">
              <CardContent className="pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">New Balance After Payment:</span>
                  <span className={`font-semibold text-lg ${newBalance <= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                    {Math.max(0, newBalance).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !formData.trip_id || !formData.payment_amount}>
            {isSubmitting ? 'Recording...' : 'Record Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
