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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Plus,
  Trash2,
  Search,
  Calculator,
  Receipt,
  Loader2
} from 'lucide-react';
import { useCustomers, useGenerateDocumentNumber, useTaxSettings, useCompanies } from '@/hooks/useDatabase';
import { useOptimizedProductSearch, usePopularProducts } from '@/hooks/useOptimizedProducts';
import { useCreateDirectReceiptWithItems } from '@/hooks/useQuotationItems';
import { useCreateCreditBalance, useCustomerCreditBalances } from '@/hooks/useCustomerCreditBalances';
import { useHandleExcessPayment } from '@/hooks/useHandleExcessPayment';
import { generateDocumentNumberAPI } from '@/utils/documentNumbering';
import { useAuth } from '@/contexts/AuthContext';
import { ExcessPaymentHandler, type ExcessPaymentData } from '@/components/payments/ExcessPaymentHandler';
import { CustomerCreditBalanceViewer } from '@/components/payments/CustomerCreditBalanceViewer';
import { toast } from 'sonner';

interface ReceiptItem {
  id: string;
  product_id: string;
  product_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_before_vat?: number;
  tax_percentage: number;
  tax_amount: number;
  tax_inclusive: boolean;
  line_total: number;
}

interface CreateDirectReceiptModalEnhancedProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  preSelectedCustomer?: any;
}

export function CreateDirectReceiptModalEnhanced({ 
  open, 
  onOpenChange, 
  onSuccess, 
  preSelectedCustomer 
}: CreateDirectReceiptModalEnhancedProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState(preSelectedCustomer?.id || '');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amount, setAmount] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [defaultVatPercentage, setDefaultVatPercentage] = useState<number | null>(null);

  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExcessPaymentHandler, setShowExcessPaymentHandler] = useState(false);
  const [excessPaymentData, setExcessPaymentData] = useState<ExcessPaymentData | null>(null);

  // Get current user and company from context
  const { profile, loading: authLoading } = useAuth();
  const { data: companies } = useCompanies();
  const currentCompany = companies?.[0];
  const { data: customers, isLoading: loadingCustomers } = useCustomers(currentCompany?.id);
  const {
    data: searchedProducts,
    isLoading: loadingProducts,
    searchTerm: searchProduct,
    setSearchTerm: setSearchProduct,
    isSearching
  } = useOptimizedProductSearch(currentCompany?.id, open);
  const { data: popularProducts } = usePopularProducts(currentCompany?.id, 10);
  const { data: taxSettings } = useTaxSettings(currentCompany?.id);
  const createDirectReceiptWithItems = useCreateDirectReceiptWithItems();
  const createCreditBalance = useCreateCreditBalance();
  const handleExcessPayment = useHandleExcessPayment();
  const { totalAvailableCredit } = useCustomerCreditBalances(selectedCustomerId || null, currentCompany?.id || null);
  const generateDocNumber = useGenerateDocumentNumber();

  // Get default tax rate
  const defaultTax = taxSettings?.find(tax => tax.is_default && tax.is_active);
  const defaultTaxRate = defaultTax?.rate || 16;

  // Handle pre-selected customer
  useEffect(() => {
    if (preSelectedCustomer && open) {
      setSelectedCustomerId(preSelectedCustomer.id);
    }
  }, [preSelectedCustomer, open]);

  // Use optimized search results or popular products when no search term
  const displayProducts = searchProduct.trim() ? searchedProducts : popularProducts;

  const addItem = (product: any) => {
    const existingItem = items.find(item => item.product_id === product.id);

    if (existingItem) {
      updateItemQuantity(existingItem.id, existingItem.quantity + 1);
      return;
    }

    const price = Number(product.selling_price || product.unit_price || 0);
    if (isNaN(price) || price === 0) {
      console.warn('Product price missing or invalid for product:', product);
      toast.warning(`Product "${product.name}" has no price set`);
    }

    const newItem: ReceiptItem = {
      id: `temp-${Date.now()}`,
      product_id: product.id,
      product_name: product.name,
      description: product.description || product.name,
      quantity: 1,
      unit_price: price,
      discount_before_vat: 0,
      tax_percentage: defaultVatPercentage !== null ? defaultVatPercentage : defaultTaxRate,
      tax_amount: 0,
      tax_inclusive: true,
      line_total: price
    };

    const { lineTotal, taxAmount } = calculateLineTotal(newItem);
    newItem.line_total = lineTotal;
    newItem.tax_amount = taxAmount;

    setItems([...items, newItem]);
    setSearchProduct('');
    toast.success(`Added "${product.name}" - ${formatCurrency(lineTotal)}`);
  };

  const calculateLineTotal = (item: ReceiptItem) => {
    const baseAmount = item.quantity * item.unit_price;
    const discountAmount = item.discount_before_vat || 0;
    const afterDiscount = baseAmount - discountAmount;

    let taxAmount = 0;
    let lineTotal = afterDiscount;

    if (item.tax_percentage > 0) {
      taxAmount = item.tax_inclusive 
        ? (afterDiscount - (afterDiscount / (1 + item.tax_percentage / 100)))
        : (afterDiscount * item.tax_percentage / 100);
      lineTotal = item.tax_inclusive ? afterDiscount : (afterDiscount + taxAmount);
    }

    return {
      lineTotal: Math.round(lineTotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100
    };
  };

  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
      return;
    }

    setItems(items.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, quantity: newQuantity };
        const { lineTotal, taxAmount } = calculateLineTotal(updatedItem);
        return { ...updatedItem, line_total: lineTotal, tax_amount: taxAmount };
      }
      return item;
    }));
  };

  const updateItemPrice = (itemId: string, newPrice: number) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, unit_price: newPrice };
        const { lineTotal, taxAmount } = calculateLineTotal(updatedItem);
        return { ...updatedItem, line_total: lineTotal, tax_amount: taxAmount };
      }
      return item;
    }));
  };

  const updateItemTaxPercentage = (itemId: string, newTaxPercentage: number) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, tax_percentage: newTaxPercentage };
        const { lineTotal, taxAmount } = calculateLineTotal(updatedItem);
        return { ...updatedItem, line_total: lineTotal, tax_amount: taxAmount };
      }
      return item;
    }));
  };

  const removeItem = (itemId: string) => {
    const removedItem = items.find(item => item.id === itemId);
    setItems(items.filter(item => item.id !== itemId));
    if (removedItem) {
      toast.info(`Removed "${removedItem.product_name}"`);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const totalTax = items.reduce((sum, item) => sum + item.tax_amount, 0);
    const total = items.reduce((sum, item) => sum + item.line_total, 0);

    return { subtotal, totalTax, total };
  };

  const { subtotal, totalTax, total } = calculateTotals();

  const handleSubmit = async () => {
    if (!selectedCustomerId) {
      toast.error('Please select a customer');
      return;
    }

    if (items.length === 0) {
      toast.error('Please add at least one item to the receipt');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    setIsSubmitting(true);

    try {
      const paymentNumber = await generateDocumentNumberAPI('receipt');

      const paymentData = {
        payment_number: paymentNumber,
        payment_date: paymentDate,
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        reference_number: referenceNumber || null,
        notes: notes || null,
      };

      const result = await createDirectReceiptWithItems.mutateAsync({
        payment: paymentData,
        invoiceAmount: total,
        subtotal: subtotal,
        taxAmount: totalTax,
        companyId: currentCompany!.id,
        customerId: selectedCustomerId,
        items: items
      });

      // Check if there's excess payment to handle
      if (result.excessPayment && result.receipt) {
        const selectedCustomer = customers?.find(c => c.id === selectedCustomerId);
        setExcessPaymentData({
          receiptId: result.receipt.id,
          customerId: selectedCustomerId,
          invoiceId: result.invoice.id,
          excessAmount: result.excessPayment.excessAmount,
          paymentAmount: result.excessPayment.paymentAmount,
          invoiceAmount: result.excessPayment.invoiceAmount,
          customerName: selectedCustomer?.name
        });
        setShowExcessPaymentHandler(true);
      } else {
        // No excess payment, success
        onSuccess();
        onOpenChange(false);
        resetForm();
      }
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
    setDefaultVatPercentage(null);
    setItems([]);
    setShowExcessPaymentHandler(false);
    setExcessPaymentData(null);
  };

  const handleExcessPaymentCreditBalance = async (notes?: string) => {
    if (!excessPaymentData) return;

    try {
      await createCreditBalance.mutateAsync({
        companyId: currentCompany!.id,
        customerId: excessPaymentData.customerId,
        creditAmount: excessPaymentData.excessAmount,
        sourceReceiptId: excessPaymentData.receiptId,
        notes: notes || 'Credit from excess payment'
      });

      onSuccess();
      setShowExcessPaymentHandler(false);
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error creating credit balance:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to create credit balance: ${errorMessage}`);
    }
  };

  const handleExcessPaymentChangeNote = async (notes?: string) => {
    if (!excessPaymentData) return;

    try {
      setIsSubmitting(true);
      await handleExcessPayment.mutateAsync({
        receiptId: excessPaymentData.receiptId,
        companyId: currentCompany!.id,
        customerId: excessPaymentData.customerId,
        invoiceId: excessPaymentData.invoiceId,
        paymentId: '', // Payment ID not available in excess payment context, will be handled by receipt
        excessAmount: excessPaymentData.excessAmount,
        handling: 'change_note'
      });

      onSuccess();
      setShowExcessPaymentHandler(false);
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error creating change note:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to create change note: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const amountNum = parseFloat(amount) || 0;
  const isFullPayment = amountNum >= total && total > 0;
  const isPartialPayment = amountNum > 0 && amountNum < total && total > 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Create Direct Receipt
          </DialogTitle>
          <DialogDescription>
            Create a receipt with line items and automatically generate an invoice
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

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Receipt Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* VAT Selection */}
              <div className="space-y-2">
                <Label>Default VAT for New Items</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={defaultVatPercentage === null ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDefaultVatPercentage(null)}
                    className={defaultVatPercentage === null ? 'gradient-primary' : ''}
                  >
                    Not Selected (0%)
                  </Button>
                  <Button
                    variant={defaultVatPercentage === 0 ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDefaultVatPercentage(0)}
                    className={defaultVatPercentage === 0 ? 'gradient-primary' : ''}
                  >
                    No VAT (0%)
                  </Button>
                  <Button
                    variant={defaultVatPercentage === 8 ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDefaultVatPercentage(8)}
                    className={defaultVatPercentage === 8 ? 'gradient-primary' : ''}
                  >
                    8% VAT
                  </Button>
                  <Button
                    variant={defaultVatPercentage === 16 ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDefaultVatPercentage(16)}
                    className={defaultVatPercentage === 16 ? 'gradient-primary' : ''}
                  >
                    16% VAT
                  </Button>
                </div>
                {defaultVatPercentage !== null && (
                  <p className="text-xs text-muted-foreground">
                    New items will be added with {defaultVatPercentage}% VAT
                  </p>
                )}
                {defaultVatPercentage === null && (
                  <p className="text-xs text-muted-foreground">
                    New items will be added with 0% VAT (Not Selected)
                  </p>
                )}
              </div>

              {/* Product Search */}
              <div className="space-y-2">
                <Label htmlFor="productSearch">Add Products</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="productSearch"
                    placeholder="Search products by name..."
                    value={searchProduct}
                    onChange={(e) => setSearchProduct(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Product List */}
                {displayProducts && displayProducts.length > 0 && (
                  <div className="border rounded-lg p-2 max-h-48 overflow-y-auto space-y-1">
                    {displayProducts.map((product: any) => (
                      <Button
                        key={product.id}
                        variant="ghost"
                        className="w-full justify-start text-sm"
                        onClick={() => addItem(product)}
                      >
                        <Plus className="h-3 w-3 mr-2" />
                        <span className="flex-1 text-left">{product.name}</span>
                        <span className="text-xs text-muted-foreground">
                          KES {formatCurrency(Number(product.selling_price || product.unit_price || 0))}
                        </span>
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              {/* Items Table */}
              {items.length > 0 && (
                <Table className="text-sm">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-center">Tax %</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="max-w-xs">{item.description}</TableCell>
                        <TableCell className="w-24">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                            className="w-full text-center h-10 text-lg font-semibold"
                          />
                        </TableCell>
                        <TableCell className="w-28">
                          <Input
                            type="number"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) => updateItemPrice(item.id, parseFloat(e.target.value) || 0)}
                            className="w-full text-right h-10"
                          />
                        </TableCell>
                        <TableCell className="w-32">
                          <Select
                            value={item.tax_percentage.toString()}
                            onValueChange={(value) => updateItemTaxPercentage(item.id, parseFloat(value))}
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">0% (None)</SelectItem>
                              <SelectItem value="8">8% VAT</SelectItem>
                              <SelectItem value="16">16% VAT</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="w-28 font-semibold text-right">
                          {formatCurrency(item.line_total)}
                        </TableCell>
                        <TableCell className="w-10">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                            className="h-8 w-8"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* Totals */}
              {items.length > 0 && (
                <div className="space-y-2 border-t pt-4">
                  <div className="flex justify-end gap-4">
                    <span className="font-medium">Subtotal:</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-end gap-4">
                    <span className="font-medium">Tax:</span>
                    <span>{formatCurrency(totalTax)}</span>
                  </div>
                  <div className="flex justify-end gap-4 text-lg font-bold">
                    <span>Total:</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Amount Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Payment Amount</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  className="h-10 text-lg"
                />
                {amount && <p className="text-xs text-muted-foreground">{formatCurrency(parseFloat(amount))}</p>}
              </div>

              {/* Payment Status Indicator with Change/Balance */}
              {amount && total > 0 && (
                <div className="pt-2 space-y-2">
                  {isFullPayment && (
                    <div className="flex items-center gap-2 p-3 bg-success-light text-success rounded text-sm border border-success/20">
                      <span className="font-medium">✓ Full Payment</span>
                      <span>Invoice will be marked as PAID</span>
                    </div>
                  )}
                  {isPartialPayment && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-3 bg-warning-light text-warning rounded text-sm border border-warning/20">
                        <span className="font-medium">⚠ Partial Payment</span>
                        <span>Invoice will be marked as PARTIAL</span>
                      </div>
                      <div className="p-3 bg-muted rounded border border-muted-foreground/20">
                        <div className="flex justify-between mb-2">
                          <span className="text-muted-foreground">Invoice Total:</span>
                          <span className="font-semibold">{formatCurrency(total)}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span className="text-muted-foreground">Amount Received:</span>
                          <span className="font-semibold">{formatCurrency(amountNum)}</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between">
                          <span className="font-medium text-destructive">Balance Due:</span>
                          <span className="font-bold text-destructive">{formatCurrency(total - amountNum)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {amountNum > total && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-3 bg-success-light text-success rounded text-sm border border-success/20">
                        <span className="font-medium">✓ Overpayment - Change Due</span>
                        <span>Invoice will be marked as PAID</span>
                      </div>
                      <div className="p-3 bg-muted rounded border border-muted-foreground/20">
                        <div className="flex justify-between mb-2">
                          <span className="text-muted-foreground">Invoice Total:</span>
                          <span className="font-semibold">{formatCurrency(total)}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span className="text-muted-foreground">Amount Received:</span>
                          <span className="font-semibold">{formatCurrency(amountNum)}</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between">
                          <span className="font-medium text-success">Change:</span>
                          <span className="font-bold text-success">{formatCurrency(amountNum - total)}</span>
                        </div>
                      </div>
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
              placeholder="Add any additional notes about this receipt..."
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
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !selectedCustomerId || !amount || items.length === 0}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isSubmitting ? 'Creating...' : 'Create Receipt & Invoice'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Excess Payment Handler Modal */}
    <ExcessPaymentHandler
      open={showExcessPaymentHandler}
      onOpenChange={setShowExcessPaymentHandler}
      excessPaymentData={excessPaymentData}
      onCreditBalance={handleExcessPaymentCreditBalance}
      onChangeNote={handleExcessPaymentChangeNote}
      isLoading={createCreditBalance.isPending}
    />
    </>
  );
}
