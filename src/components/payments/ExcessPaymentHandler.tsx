import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertCircle, Loader2, DollarSign } from 'lucide-react';

export interface ExcessPaymentData {
  receiptId: string;
  customerId: string;
  invoiceId: string;
  excessAmount: number;
  paymentAmount: number;
  invoiceAmount: number;
  customerName?: string;
}

export interface ExcessPaymentHandlerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  excessPaymentData: ExcessPaymentData | null;
  onCreditBalance: (notes?: string) => Promise<void>;
  onChangeNote: (notes?: string) => Promise<void>;
  isLoading?: boolean;
}

export function ExcessPaymentHandler({
  open,
  onOpenChange,
  excessPaymentData,
  onCreditBalance,
  onChangeNote,
  isLoading = false,
}: ExcessPaymentHandlerProps) {
  const [handling, setHandling] = useState<'credit_balance' | 'change_note'>('credit_balance');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!excessPaymentData) {
    return null;
  }

  const handleSubmit = async () => {
    setIsProcessing(true);
    try {
      if (handling === 'credit_balance') {
        await onCreditBalance(notes);
      } else {
        await onChangeNote(notes);
      }
      onOpenChange(false);
      resetForm();
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setHandling('credit_balance');
    setNotes('');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning" />
            Excess Payment Detected
          </DialogTitle>
          <DialogDescription>
            Payment exceeds the invoice amount. Choose how to handle the difference.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payment Summary */}
          <Card className="bg-muted">
            <CardContent className="pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice Total:</span>
                <span className="font-semibold">{formatCurrency(excessPaymentData.invoiceAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount Received:</span>
                <span className="font-semibold">{formatCurrency(excessPaymentData.paymentAmount)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-semibold text-success">Excess Amount:</span>
                <span className="font-bold text-success text-lg">{formatCurrency(excessPaymentData.excessAmount)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Handling Options */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">How would you like to handle the excess?</Label>

            <RadioGroup value={handling} onValueChange={(value: any) => setHandling(value)}>
              {/* Credit Balance Option */}
              <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="credit_balance" id="credit_balance" />
                <div className="flex-1 min-w-0">
                  <Label htmlFor="credit_balance" className="text-sm font-medium cursor-pointer">
                    Add to Customer Credit Balance
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {excessPaymentData.customerName} can use this credit towards future invoices. No refund is issued.
                  </p>
                </div>
              </div>

              {/* Change Note Option */}
              <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="change_note" id="change_note" />
                <div className="flex-1 min-w-0">
                  <Label htmlFor="change_note" className="text-sm font-medium cursor-pointer">
                    Create Change Note
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Issue a formal change/refund note that can be tracked separately.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Notes Field */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm">
              Additional Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this excess payment handling..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              resetForm();
            }}
            disabled={isProcessing || isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isProcessing || isLoading}
            className="flex items-center gap-2"
          >
            {(isProcessing || isLoading) && <Loader2 className="h-4 w-4 animate-spin" />}
            {handling === 'credit_balance' ? 'Add to Credit' : 'Create Change Note'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
