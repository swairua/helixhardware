import { useState, useEffect, useRef } from 'react';
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
  Receipt
} from 'lucide-react';
import { useCustomers, useProducts, useTaxSettings } from '@/hooks/useDatabase';
import { useUpdateInvoiceWithItems } from '@/hooks/useQuotationItems';
import { useCurrentCompany } from '@/contexts/CompanyContext';
import { getDatabase } from '@/integrations/database';
import { toast } from 'sonner';

interface InvoiceItem {
  id: string;
  product_id: string;
  product_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  discount_before_vat?: number;
  tax_percentage: number;
  tax_amount: number;
  tax_inclusive: boolean;
  line_total: number;
}

interface EditInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  invoice: any;
}

export function EditInvoiceModal({ open, onOpenChange, onSuccess, invoice }: EditInvoiceModalProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [lpoNumber, setLpoNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState('');
  
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { currentCompany } = useCurrentCompany();
  const { data: customers, isLoading: loadingCustomers } = useCustomers(currentCompany?.id);
  const { data: products, isLoading: loadingProducts } = useProducts(currentCompany?.id);
  const { data: taxSettings } = useTaxSettings(currentCompany?.id);
  const updateInvoiceWithItems = useUpdateInvoiceWithItems();

  // Get default tax rate
  const defaultTax = taxSettings?.find(tax => tax.is_default && tax.is_active);
  const defaultTaxRate = defaultTax?.rate || 16; // Fallback to 16% if no default is set

  // Load invoice data when modal opens
  useEffect(() => {
    if (invoice && open) {
      // DEBUG: Log incoming invoice data
      console.log('📋 EditInvoiceModal - Received invoice:', {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
        hasInvoiceItems: !!invoice.invoice_items,
        invoiceItemsCount: invoice.invoice_items?.length || 0,
        invoiceItemsData: invoice.invoice_items,
        invoiceMetadata: {
          customer_id: invoice.customer_id,
          subtotal: invoice.subtotal,
          tax_amount: invoice.tax_amount,
          total_amount: invoice.total_amount,
          balance_due: invoice.balance_due
        }
      });

      setSelectedCustomerId(invoice.customer_id || '');
      setInvoiceDate(invoice.invoice_date || '');
      setDueDate(invoice.due_date || '');
      setLpoNumber(invoice.lpo_number || '');
      setNotes(invoice.notes || '');
      setTermsAndConditions(invoice.terms_and_conditions || '');

      // Convert invoice items to local format
      const invoiceItems = (invoice.invoice_items || []).map((item: any, index: number) => ({
        id: item.id || `existing-${index}`,
        product_id: item.product_id || '',
        product_name: item.products?.name || 'Unknown Product',
        description: item.description || '',
        quantity: item.quantity || 0,
        unit_price: item.unit_price || 0,
        discount_percentage: item.discount_percentage || 0,
        discount_before_vat: item.discount_before_vat || 0,
        tax_percentage: 0,
        tax_amount: 0,
        tax_inclusive: false,
        line_total: item.line_total || 0,
      }));

      // DEBUG: Log after mapping
      console.log('📋 EditInvoiceModal - Mapped items:', {
        mappedItemsCount: invoiceItems.length,
        mappedItems: invoiceItems
      });

      setItems(invoiceItems);
    }
  }, [invoice, open]);

  // Fallback: If invoice has amounts but no items loaded, fetch them directly from invoice_items table
  const hasFallbackFetched = useRef(false);
  useEffect(() => {
    const fetchMissingItems = async () => {
      // Check if we need fallback: invoice exists, has amounts, but items weren't loaded
      if (
        invoice?.id &&
        open &&
        (invoice.total_amount > 0 || invoice.subtotal > 0) &&
        (!invoice.invoice_items || invoice.invoice_items.length === 0) &&
        !hasFallbackFetched.current
      ) {
        console.log('🔄 Fallback fetch triggered - Fetching invoice_items directly from DB', {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoice_number
        });

        try {
          const db = getDatabase();
          const itemsResult = await db.selectBy('invoice_items', { invoice_id: invoice.id });

          if (itemsResult.error) {
            console.error('❌ Fallback fetch error:', itemsResult.error);
            return;
          }

          const items = itemsResult.data || [];

          if (items && items.length > 0) {
            console.log('✅ Fallback fetch successful - Found items:', {
              count: items.length,
              items: items
            });

            // Map the fetched items to local format
            const mappedItems: InvoiceItem[] = items.map((item: any, index: number) => ({
              id: item.id,
              product_id: item.product_id || '',
              product_name: item.product_name || 'Unknown Product',
              description: item.description || '',
              quantity: item.quantity || 0,
              unit_price: item.unit_price || 0,
              discount_percentage: item.discount_percentage || 0,
              discount_before_vat: item.discount_before_vat || 0,
              tax_percentage: 0,
              tax_amount: 0,
              tax_inclusive: false,
              line_total: item.line_total || 0,
            }));

            setItems(mappedItems);
          } else {
            console.warn('⚠️ Fallback fetch: No items found in database', {
              invoiceId: invoice.id
            });
          }

          hasFallbackFetched.current = true;
        } catch (error) {
          console.error('❌ Fallback fetch exception:', error);
        }
      }
    };

    fetchMissingItems();
  }, [invoice?.id, open, invoice?.total_amount, invoice?.subtotal, invoice?.invoice_items]);

  const filteredProducts = products?.filter(product =>
    product.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
    product.product_code.toLowerCase().includes(searchProduct.toLowerCase())
  ) || [];

  const calculateLineTotal = (item: InvoiceItem, quantity?: number, unitPrice?: number, discountPercentage?: number, taxPercentage?: number, taxInclusive?: boolean) => {
    const qty = quantity ?? item.quantity;
    const price = unitPrice ?? item.unit_price;
    const discount = discountPercentage ?? item.discount_percentage;
    const tax = taxPercentage ?? item.tax_percentage;
    const inclusive = taxInclusive ?? item.tax_inclusive;

    // Calculate base amount after discount
    const baseAmount = qty * price;
    const discountAmount = baseAmount * (discount / 100);
    const afterDiscountAmount = baseAmount - discountAmount;

    let taxAmount = 0;
    let lineTotal = 0;

    if (tax === 0 || !inclusive) {
      // No tax or tax checkbox unchecked
      lineTotal = afterDiscountAmount;
      taxAmount = 0;
    } else {
      // Tax checkbox checked: add tax to the discounted amount
      taxAmount = afterDiscountAmount * (tax / 100);
      lineTotal = afterDiscountAmount + taxAmount;
    }

    return { lineTotal, taxAmount };
  };

  const addItem = (product: any) => {
    const existingItem = items.find(item => item.product_id === product.id);
    
    if (existingItem) {
      updateItemQuantity(existingItem.id, existingItem.quantity + 1);
      return;
    }

    const newItem: InvoiceItem = {
      id: `temp-${Date.now()}`,
      product_id: product.id,
      product_name: product.name,
      description: product.description || product.name,
      quantity: 1,
      unit_price: product.selling_price,
      discount_percentage: 0,
      discount_before_vat: 0,
      tax_percentage: 0,
      tax_amount: 0,
      tax_inclusive: false,
      line_total: product.selling_price
    };

    const { lineTotal, taxAmount } = calculateLineTotal(newItem);
    newItem.line_total = lineTotal;
    newItem.tax_amount = taxAmount;

    setItems([...items, newItem]);
    setSearchProduct('');
  };

  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    setItems(items.map(item => {
      if (item.id === itemId) {
        const { lineTotal, taxAmount } = calculateLineTotal(item, quantity);
        return { ...item, quantity, line_total: lineTotal, tax_amount: taxAmount };
      }
      return item;
    }));
  };

  const updateItemPrice = (itemId: string, unitPrice: number) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const { lineTotal, taxAmount } = calculateLineTotal(item, undefined, unitPrice);
        return { ...item, unit_price: unitPrice, line_total: lineTotal, tax_amount: taxAmount };
      }
      return item;
    }));
  };

  const updateItemDiscount = (itemId: string, discountPercentage: number) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const { lineTotal, taxAmount } = calculateLineTotal(item, undefined, undefined, discountPercentage);
        return { ...item, discount_percentage: discountPercentage, line_total: lineTotal, tax_amount: taxAmount };
      }
      return item;
    }));
  };

  const updateItemDiscountBeforeVat = (itemId: string, discountBeforeVat: number) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        return { ...item, discount_before_vat: discountBeforeVat };
      }
      return item;
    }));
  };

  const updateItemTax = (itemId: string, taxPercentage: number) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const { lineTotal, taxAmount } = calculateLineTotal(item, undefined, undefined, undefined, taxPercentage);
        return { ...item, tax_percentage: taxPercentage, line_total: lineTotal, tax_amount: taxAmount };
      }
      return item;
    }));
  };

  const updateItemTaxInclusive = (itemId: string, taxInclusive: boolean) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        // When checking VAT Inclusive, auto-apply default tax rate if no VAT is set
        let newTaxPercentage = item.tax_percentage;
        if (taxInclusive && item.tax_percentage === 0) {
          newTaxPercentage = defaultTaxRate;
        }
        // When unchecking VAT Inclusive, reset VAT to 0
        if (!taxInclusive) {
          newTaxPercentage = 0;
        }

        const { lineTotal, taxAmount } = calculateLineTotal(item, undefined, undefined, undefined, newTaxPercentage, taxInclusive);
        console.log(`VAT Inclusive changed for item ${itemId}:`, {
          taxInclusive,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          oldTaxPercentage: item.tax_percentage,
          newTaxPercentage,
          oldLineTotal: item.line_total,
          newLineTotal: lineTotal
        });
        return { ...item, tax_inclusive: taxInclusive, tax_percentage: newTaxPercentage, line_total: lineTotal, tax_amount: taxAmount };
      }
      return item;
    }));
  };

  const removeItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const subtotal = items.reduce((sum, item) => {
    // Always use base amount for subtotal (unit price × quantity × discount)
    // VAT is calculated separately and added for exclusive, or extracted for inclusive
    const itemSubtotal = (item.quantity * item.unit_price) * (1 - item.discount_percentage / 100);
    return sum + itemSubtotal;
  }, 0);
  const taxAmount = items.reduce((sum, item) => sum + (item.tax_amount || 0), 0);
  const totalAmount = items.reduce((sum, item) => sum + item.line_total, 0);
  const balanceDue = totalAmount - (invoice?.paid_amount || 0);

  const handleSubmit = async () => {
    if (!selectedCustomerId) {
      toast.error('Please select a customer');
      return;
    }

    if (items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    setIsSubmitting(true);
    try {
      // Log the selected customer for debugging
      const selectedCustomer = customers?.find(c => String(c.id) === selectedCustomerId);
      console.log('🔍 Updating invoice with customer:', {
        customerId: selectedCustomerId,
        customerName: selectedCustomer?.name,
        customerFound: !!selectedCustomer,
        allCustomers: customers?.map(c => ({ id: c.id, name: c.name }))
      });

      const invoiceData = {
        customer_id: selectedCustomerId,
        invoice_date: invoiceDate,
        due_date: dueDate,
        lpo_number: lpoNumber || null,
        subtotal: subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        balance_due: balanceDue,
        terms_and_conditions: termsAndConditions,
        notes: notes,
      };

      const invoiceItems = items.map(item => ({
        product_id: item.product_id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percentage: item.discount_percentage,
        discount_before_vat: item.discount_before_vat || 0,
        tax_percentage: 0,
        tax_amount: 0,
        tax_inclusive: false,
        line_total: item.line_total
      }));

      await updateInvoiceWithItems.mutateAsync({
        invoiceId: invoice.id,
        invoice: invoiceData,
        items: invoiceItems
      });

      toast.success(`Invoice ${invoice.invoice_number} updated successfully!`);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error('Failed to update invoice. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Receipt className="h-5 w-5 text-primary" />
            <span>Edit Invoice {invoice?.invoice_number}</span>
          </DialogTitle>
          <DialogDescription>
            Update invoice details and items
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Invoice Details */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Invoice Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Customer Selection */}
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer *</Label>
                  <Select
                    value={selectedCustomerId}
                    onValueChange={(value) => {
                      console.log('Customer selection changed to:', value);
                      setSelectedCustomerId(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingCustomers ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">Loading customers...</div>
                      ) : customers && customers.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">No customers available</div>
                      ) : (
                        customers?.map((customer) => {
                          // Ensure customer ID is a string for consistent matching
                          const customerId = String(customer.id);
                          const displayName = customer.customer_code ? `${customer.name} (${customer.customer_code})` : customer.name;
                          return (
                            <SelectItem key={customerId} value={customerId}>
                              {displayName}
                            </SelectItem>
                          );
                        })
                      )}
                    </SelectContent>
                  </Select>
                  {selectedCustomerId && (
                    <p className="text-xs text-muted-foreground">
                      Selected: {customers?.find(c => String(c.id) === selectedCustomerId)?.name || 'Unknown'}
                    </p>
                  )}
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoice_date">Invoice Date *</Label>
                    <Input
                      id="invoice_date"
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Due Date *</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* LPO Number */}
                <div className="space-y-2">
                  <Label htmlFor="lpo_number">LPO Number (Optional)</Label>
                  <Input
                    id="lpo_number"
                    type="text"
                    value={lpoNumber}
                    onChange={(e) => setLpoNumber(e.target.value)}
                    placeholder="Enter LPO reference number"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Additional notes for this invoice..."
                  />
                </div>

                {/* Terms and Conditions */}
                <div className="space-y-2">
                  <Label htmlFor="terms">Terms and Conditions</Label>
                  <Textarea
                    id="terms"
                    value={termsAndConditions}
                    onChange={(e) => setTermsAndConditions(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Product Selection */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Product Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search products by name or code..."
                      value={searchProduct}
                      onChange={(e) => setSearchProduct(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Product List */}
                  {searchProduct && (
                    <div className="max-h-64 overflow-y-auto border rounded-lg">
                      {loadingProducts ? (
                        <div className="p-4 text-center text-muted-foreground">Loading products...</div>
                      ) : filteredProducts.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">No products found</div>
                      ) : (
                        filteredProducts.map((product) => (
                          <div
                            key={product.id}
                            className="p-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0 transition-smooth"
                            onClick={() => addItem(product)}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium">{product.name}</div>
                                <div className="text-sm text-muted-foreground">{product.product_code}</div>
                                {product.description && (
                                  <div className="text-xs text-muted-foreground mt-1">{product.description}</div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="font-semibold">{formatCurrency(Number.isFinite(Number(product.selling_price)) ? Number(product.selling_price) : 0)}</div>
                                <div className="text-xs text-muted-foreground">Stock: {product.stock_quantity}</div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Items Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Invoice Items</span>
              <Badge variant="outline">{items.length} items</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No items added yet. Search and select products to add them.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Discount %</TableHead>
                    <TableHead>Disc. Before VAT</TableHead>
                    <TableHead>Line Total</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.product_name}</div>
                          <div className="text-sm text-muted-foreground">{item.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 0)}
                          className="w-20"
                          min="1"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => updateItemPrice(item.id, parseFloat(e.target.value) || 0)}
                          className="w-24"
                          step="0.01"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.discount_percentage}
                          onChange={(e) => updateItemDiscount(item.id, parseFloat(e.target.value) || 0)}
                          className="w-20"
                          min="0"
                          max="100"
                          step="0.1"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.discount_before_vat || 0}
                          onChange={(e) => updateItemDiscountBeforeVat(item.id, parseFloat(e.target.value) || 0)}
                          className="w-24"
                          step="0.01"
                          placeholder="0.00"
                        />
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(item.line_total)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Totals */}
            {items.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <div className="flex justify-end">
                  <div className="w-80 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-semibold">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-lg border-t pt-2">
                      <span className="font-bold">Total:</span>
                      <span className="font-bold text-primary">{formatCurrency(totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Paid:</span>
                      <span>{formatCurrency(invoice?.paid_amount || 0)}</span>
                    </div>
                    <div className="flex justify-between text-lg border-t pt-2">
                      <span className="font-bold">Balance Due:</span>
                      <span className="font-bold text-destructive">{formatCurrency(balanceDue)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !selectedCustomerId || items.length === 0}>
            <Calculator className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Updating...' : 'Update Invoice'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
