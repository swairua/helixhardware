import React, { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/utils/taxCalculation';

export interface ConversionSourceData {
  id: string;
  number: string;
  date: string;
  customer?: {
    name: string;
    email?: string;
  };
  items?: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    line_total: number;
  }>;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
}

export interface ConversionDestinationData {
  documentType: 'proforma' | 'invoice'; // The new document type
  number?: string; // Will be auto-generated
  date: string; // Today's date
  dueDate?: string; // For invoices
  status: 'draft' | 'sent';
  conversionImpact: string[];
}

interface ConversionPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceDocument: ConversionSourceData;
  sourceDocumentType: 'quotation' | 'proforma';
  destinationData: ConversionDestinationData;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

const getDocumentTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    quotation: 'Quotation',
    proforma: 'Proforma Invoice',
    invoice: 'Invoice',
  };
  return labels[type] || type;
};

const getDocumentTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    quotation: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
    proforma: 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800',
    invoice: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
  };
  return colors[type] || '';
};

export function ConversionPreviewModal({
  open,
  onOpenChange,
  sourceDocument,
  sourceDocumentType,
  destinationData,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConversionPreviewModalProps) {
  const destinationLabel = getDocumentTypeLabel(destinationData.documentType);
  const sourceLabel = getDocumentTypeLabel(sourceDocumentType);

  // Format dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleConfirm = async () => {
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error('Conversion error:', error);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
  };

  // Memoize computed values
  const itemCount = useMemo(() => sourceDocument.items?.length || 0, [sourceDocument.items]);
  const statusLabel = useMemo(() => {
    return destinationData.status.charAt(0).toUpperCase() + destinationData.status.slice(1);
  }, [destinationData.status]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-lg">
            <span>Convert {sourceLabel}</span>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
            <span>{destinationLabel}</span>
          </DialogTitle>
          <DialogDescription>
            Review the conversion details below before confirming. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Source and Destination Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Source Document */}
            <Card className={`border-2 ${getDocumentTypeColor(sourceDocumentType)}`}>
              <CardHeader>
                <CardTitle className="text-base">{sourceLabel}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Document Number and Date */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Number</span>
                    <span className="font-semibold">{sourceDocument.number}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Date</span>
                    <span className="text-sm">{formatDate(sourceDocument.date)}</span>
                  </div>
                </div>

                <Separator />

                {/* Customer */}
                {sourceDocument.customer && (
                  <div className="space-y-2">
                    <span className="text-muted-foreground text-sm block">Customer</span>
                    <div className="font-medium">{sourceDocument.customer.name}</div>
                    {sourceDocument.customer.email && (
                      <div className="text-sm text-muted-foreground">{sourceDocument.customer.email}</div>
                    )}
                  </div>
                )}

                <Separator />

                {/* Items Summary */}
                <div className="space-y-2">
                  <span className="text-muted-foreground text-sm block">
                    Items ({itemCount})
                  </span>
                  {sourceDocument.items && sourceDocument.items.length > 0 ? (
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {sourceDocument.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-start text-sm gap-2">
                          <span className="text-muted-foreground truncate">
                            {item.description}
                          </span>
                          <span className="text-right">
                            {item.quantity} × {formatCurrency(item.unit_price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No items</p>
                  )}
                </div>

                <Separator />

                {/* Amounts */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(sourceDocument.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatCurrency(sourceDocument.tax_amount)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base pt-2 border-t">
                    <span>Total</span>
                    <span>{formatCurrency(sourceDocument.total_amount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Destination Document */}
            <Card className={`border-2 ${getDocumentTypeColor(destinationData.documentType)}`}>
              <CardHeader>
                <CardTitle className="text-base">{destinationLabel}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Auto-generated info */}
                <div className="bg-muted/50 p-3 rounded text-sm space-y-1">
                  <p className="font-medium text-foreground">Will be auto-generated:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                    <li>Document number (e.g., {destinationData.documentType === 'invoice' ? 'INV-' : 'PROFORMA-'}...)</li>
                    <li>Created date: Today</li>
                    {destinationData.dueDate && <li>Due date: {formatDate(destinationData.dueDate)}</li>}
                  </ul>
                </div>

                {/* Document Details */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Number</span>
                    <Badge variant="outline">Auto-generated</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Date</span>
                    <span className="text-sm">{formatDate(destinationData.date)}</span>
                  </div>
                  {destinationData.dueDate && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">Due Date</span>
                      <span className="text-sm">{formatDate(destinationData.dueDate)}</span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Customer (same as source) */}
                {sourceDocument.customer && (
                  <div className="space-y-2">
                    <span className="text-muted-foreground text-sm block">Customer</span>
                    <div className="font-medium">{sourceDocument.customer.name}</div>
                  </div>
                )}

                <Separator />

                {/* Items (same as source) */}
                <div className="space-y-2">
                  <span className="text-muted-foreground text-sm block">
                    Items ({itemCount})
                  </span>
                  <p className="text-sm text-muted-foreground">All items will be copied from {sourceLabel.toLowerCase()}</p>
                </div>

                <Separator />

                {/* Status and Amounts */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant="outline">{statusLabel}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(sourceDocument.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatCurrency(sourceDocument.tax_amount)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base pt-2 border-t">
                    <span>Total</span>
                    <span>{formatCurrency(sourceDocument.total_amount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Conversion Impact */}
          {destinationData.conversionImpact.length > 0 && (
            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2 text-amber-900 dark:text-amber-100">
                  Conversion Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {destinationData.conversionImpact.map((impact, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-amber-900 dark:text-amber-100">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400 mt-1.5 flex-shrink-0" />
                      {impact}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLoading ? 'Converting...' : `Convert to ${destinationLabel}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
