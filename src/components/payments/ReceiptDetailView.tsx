import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, Download, Send, Printer, Copy, Check, FileText } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface Receipt {
  id: string;
  receipt_number: string;
  receipt_date: string;
  receipt_type: string;
  total_amount: number;
  excess_amount: number;
  excess_handling: string;
  created_at: string;
  notes?: string;
  payment?: {
    id: string;
    payment_method: string;
    reference_number?: string;
    notes?: string;
  };
  invoice?: {
    id: string;
    invoice_number: string;
    total_amount: number;
    customer_id: string;
  };
}

export interface ReceiptDetailViewProps {
  receipt: Receipt;
  lineItems?: any[];
  companyName?: string;
  onDownloadPDF?: () => void;
  onSendEmail?: () => void;
  onPrint?: () => void;
  isLoading?: boolean;
}

export function ReceiptDetailView({
  receipt,
  lineItems = [],
  companyName = 'Company',
  onDownloadPDF,
  onSendEmail,
  onPrint,
  isLoading = false
}: ReceiptDetailViewProps) {
  const [copied, setCopied] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleCopyReceiptNumber = () => {
    navigator.clipboard.writeText(receipt.receipt_number);
    setCopied(true);
    toast.success('Receipt number copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const getExcessHandlingLabel = (handling: string) => {
    switch (handling) {
      case 'credit_balance':
        return 'Added to Credit Balance';
      case 'change_note':
        return 'Change Note Issued';
      case 'pending':
        return 'Pending Resolution';
      default:
        return handling;
    }
  };

  const getReceiptTypeLabel = (type: string) => {
    switch (type) {
      case 'direct_receipt':
        return 'Direct Receipt';
      case 'payment_against_invoice':
        return 'Payment Against Invoice';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="font-mono text-lg">
                  {receipt.receipt_number}
                </CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyReceiptNumber}
                  className="h-7 w-7 p-0"
                  title="Copy receipt number"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDate(receipt.receipt_date)}
              </p>
            </div>
            <div className="text-right">
              <Badge variant="default" className="bg-success-light text-success">
                {getReceiptTypeLabel(receipt.receipt_type)}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Amount Section */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Amount Received</p>
              <p className="text-2xl font-bold">{formatCurrency(receipt.total_amount)}</p>
            </div>
            {receipt.invoice && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Invoice Amount</p>
                <p className="text-2xl font-bold">{formatCurrency(receipt.invoice.total_amount)}</p>
              </div>
            )}
          </div>

          {/* Excess Payment Alert */}
          {receipt.excess_amount > 0 && (
            <Alert className="bg-warning-light text-warning border-warning/20">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div className="font-semibold">
                    Excess Payment: {formatCurrency(receipt.excess_amount)}
                  </div>
                  <div className="text-sm">
                    Status: {getExcessHandlingLabel(receipt.excess_handling)}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Payment Details */}
          {receipt.payment && (
            <div className="space-y-2">
              <p className="font-semibold text-sm">Payment Details</p>
              <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded text-sm">
                <div>
                  <p className="text-muted-foreground">Method</p>
                  <p className="font-medium capitalize">
                    {receipt.payment.payment_method?.replace('_', ' ')}
                  </p>
                </div>
                {receipt.payment.reference_number && (
                  <div>
                    <p className="text-muted-foreground">Reference</p>
                    <p className="font-mono text-xs">{receipt.payment.reference_number}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Invoice Details */}
          {receipt.invoice && (
            <div className="space-y-2">
              <p className="font-semibold text-sm">Related Invoice</p>
              <div className="p-3 bg-muted rounded text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice Number</span>
                  <span className="font-mono font-semibold">
                    {receipt.invoice.invoice_number}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Line Items Section */}
          {lineItems && lineItems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <p className="font-semibold text-sm">Line Items</p>
              </div>
              <div className="overflow-x-auto">
                <Table className="text-sm">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-center w-16">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.description || item.product_name || 'N/A'}</TableCell>
                        <TableCell className="text-center">{item.quantity || 0}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.unit_price || 0)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(item.line_total || (item.quantity || 0) * (item.unit_price || 0))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <Separator />

          {/* Notes */}
          {receipt.notes && (
            <div className="space-y-2">
              <p className="font-semibold text-sm">Notes</p>
              <p className="text-sm text-muted-foreground p-3 bg-muted rounded">
                {receipt.notes}
              </p>
            </div>
          )}

          {/* Created Info */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Created: {formatDate(receipt.created_at)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {onDownloadPDF && (
          <Button
            variant="outline"
            size="sm"
            onClick={onDownloadPDF}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        )}
        {onPrint && (
          <Button
            variant="outline"
            size="sm"
            onClick={onPrint}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
        )}
        {onSendEmail && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSendEmail}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            Send Email
          </Button>
        )}
      </div>
    </div>
  );
}
