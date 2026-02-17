import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Download,
  Calendar,
  User,
  DollarSign,
  FileText,
  Banknote
} from 'lucide-react';

interface Receipt {
  id: string;
  invoice_id: string;
  payment_number: string;
  invoice_number: string;
  customers?: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
  };
  invoice_date: string;
  payment_date: string;
  total_amount: number;
  paid_amount: number;
  payment_method: string;
  reference_number?: string;
  status: string;
  invoice_items?: any[];
  notes?: string;
}

interface ViewReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: Receipt | null;
  onDownload?: () => void;
}

export function ViewReceiptModal({ 
  open, 
  onOpenChange, 
  receipt,
  onDownload
}: ViewReceiptModalProps) {
  if (!receipt) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-success-light text-success border-success/20';
      case 'partial':
        return 'bg-primary-light text-primary border-primary/20';
      case 'draft':
        return 'bg-muted text-muted-foreground border-muted-foreground/20';
      default:
        return 'bg-muted text-muted-foreground border-muted-foreground/20';
    }
  };

  const calculateTotals = () => {
    if (!receipt.invoice_items || receipt.invoice_items.length === 0) {
      return {
        subtotal: receipt.total_amount || 0,
        totalTax: 0,
        total: receipt.total_amount || 0
      };
    }

    let subtotal = 0;
    let totalTax = 0;
    let lineItemsTotal = 0;

    receipt.invoice_items.forEach(item => {
      const itemSubtotal = item.quantity * item.unit_price;
      subtotal += itemSubtotal;
      totalTax += item.tax_amount || 0;
      lineItemsTotal += item.line_total || 0;
    });

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      total: receipt.total_amount || Math.round(lineItemsTotal * 100) / 100
    };
  };

  const totals = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Receipt Details
          </DialogTitle>
          <DialogDescription>
            Receipt #{receipt.payment_number} - Invoice #{receipt.invoice_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Receipt Header Info */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Banknote className="h-4 w-4" />
                  Receipt Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Receipt #:</span>
                  <span className="font-semibold ml-2">{receipt.payment_number}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Invoice #:</span>
                  <span className="font-semibold ml-2">{receipt.invoice_number}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <span className="ml-2">
                    <Badge variant="outline" className={getStatusColor(receipt.status)}>
                      {receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1)}
                    </Badge>
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Receipt Date:</span>
                  <span className="font-semibold ml-2">{formatDate(receipt.payment_date)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Invoice Date:</span>
                  <span className="font-semibold ml-2">{formatDate(receipt.invoice_date)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Customer Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Customer:</span>
                <span className="font-semibold ml-2">{receipt.customers?.name || 'Unknown'}</span>
              </div>
              {receipt.customers?.email && (
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <span className="ml-2">{receipt.customers.email}</span>
                </div>
              )}
              {receipt.customers?.phone && (
                <div>
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="ml-2">{receipt.customers.phone}</span>
                </div>
              )}
              {receipt.customers?.address && (
                <div>
                  <span className="text-muted-foreground">Address:</span>
                  <span className="ml-2">{receipt.customers.address}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Method:</span>
                <span className="font-semibold capitalize">{receipt.payment_method.replace('_', ' ')}</span>
              </div>
              {receipt.reference_number && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference:</span>
                  <span className="font-semibold">{receipt.reference_number}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount Paid:</span>
                <span className="font-semibold">{formatCurrency(receipt.paid_amount || receipt.total_amount)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Receipt Items */}
          {receipt.invoice_items && receipt.invoice_items.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Line Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table className="text-xs">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Tax %</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receipt.invoice_items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                        <TableCell className="text-right">{item.tax_percentage}%</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(item.line_total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Totals */}
                <div className="space-y-2 border-t mt-4 pt-4 text-sm">
                  <div className="flex justify-end gap-8">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-semibold">{formatCurrency(totals.subtotal)}</span>
                  </div>
                  {totals.totalTax > 0 && (
                    <div className="flex justify-end gap-8">
                      <span className="text-muted-foreground">Tax:</span>
                      <span className="font-semibold">{formatCurrency(totals.totalTax)}</span>
                    </div>
                  )}
                  <div className="flex justify-end gap-8 text-base">
                    <span className="font-bold">Total:</span>
                    <span className="font-bold">{formatCurrency(totals.total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {receipt.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{receipt.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {onDownload && (
            <Button onClick={onDownload} className="gradient-primary text-primary-foreground">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
