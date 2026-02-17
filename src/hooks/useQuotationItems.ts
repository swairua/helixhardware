import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getDatabase, getDatabaseProvider } from '@/integrations/database';
import { parseErrorMessageWithCodes } from '@/utils/errorHelpers';
import { toast } from 'sonner';

export interface QuotationItem {
  quotation_id: string;
  product_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_setting_id?: string;
  tax_percentage?: number;
  tax_amount?: number;
  tax_inclusive?: boolean;
  line_total: number;
  sort_order?: number;
}

export interface InvoiceItem {
  invoice_id: string;
  product_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_percentage?: number;
  discount_before_vat?: number;
  tax_setting_id?: string;
  tax_percentage?: number;
  tax_amount?: number;
  tax_inclusive?: boolean;
  line_total: number;
  sort_order?: number;
}

// Calculate line item totals with tax
export const calculateLineItemTotal = (item: {
  quantity: number;
  unit_price: number;
  discount_percentage?: number;
  tax_percentage?: number;
  tax_inclusive?: boolean;
}) => {
  const { quantity, unit_price, discount_percentage = 0, tax_percentage = 0, tax_inclusive = false } = item;
  
  const baseAmount = quantity * unit_price;
  const discountAmount = baseAmount * (discount_percentage / 100);
  const afterDiscount = baseAmount - discountAmount;
  
  let taxAmount = 0;
  let lineTotal = 0;
  
  if (tax_inclusive) {
    // Tax is already included in the unit price
    lineTotal = afterDiscount;
    taxAmount = afterDiscount - (afterDiscount / (1 + tax_percentage / 100));
  } else {
    // Tax is added on top
    taxAmount = afterDiscount * (tax_percentage / 100);
    lineTotal = afterDiscount + taxAmount;
  }
  
  return {
    line_total: lineTotal,
    tax_amount: taxAmount,
    subtotal: afterDiscount,
    discount_amount: discountAmount
  };
};

// Hook for restocking inventory
export const useRestockProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      quantity,
      costPerUnit,
      companyId,
      supplier,
      notes
    }: {
      productId: string;
      quantity: number;
      costPerUnit?: number;
      companyId: string;
      supplier?: string;
      notes?: string;
    }) => {
      const db = getDatabase();

      // Create stock movement record using database adapter
      const movementData = {
        company_id: companyId,
        product_id: productId,
        movement_type: 'IN',
        reference_type: 'RESTOCK',
        quantity: quantity,
        cost_per_unit: costPerUnit,
        notes: notes || `Restock from ${supplier || 'supplier'}`
      };

      const movementResult = await db.insert('stock_movements', movementData);
      if (movementResult.error) throw movementResult.error;
      if (!movementResult.id) throw new Error('Failed to create stock movement: no ID returned');

      // Fetch the created movement
      const movementSelectResult = await db.selectOne('stock_movements', movementResult.id);
      if (movementSelectResult.error) throw movementSelectResult.error;
      if (!movementSelectResult.data) throw new Error('Failed to fetch created stock movement');

      return movementSelectResult.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock_movements'] });
    },
  });
};

export const useCreateQuotationWithItems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ quotation, items }: { quotation: any; items: QuotationItem[] }) => {
      const db = getDatabase();

      // Ensure created_by references the authenticated user to satisfy FK constraints
      let cleanQuotation = { ...quotation } as any;
      try {
        const { data: userData } = await supabase.auth.getUser();
        const authUserId = userData?.user?.id || null;
        if (authUserId) {
          cleanQuotation.created_by = authUserId;
        } else if (typeof cleanQuotation.created_by === 'undefined') {
          cleanQuotation.created_by = null;
        }
      } catch {
        if (typeof cleanQuotation.created_by === 'undefined') {
          cleanQuotation.created_by = null;
        }
      }

      // Create the quotation using the database adapter
      const insertResult = await db.insert('quotations', cleanQuotation);
      if (insertResult.error) throw insertResult.error;
      if (!insertResult.id) throw new Error('Failed to create quotation: no ID returned');

      // Fetch the created quotation to get full data
      const selectResult = await db.selectOne('quotations', insertResult.id);
      if (selectResult.error) throw selectResult.error;
      if (!selectResult.data) throw new Error('Failed to fetch created quotation');

      const quotationData = selectResult.data;

      // Create the quotation items if any
      if (items.length > 0) {
        const quotationItems = items.map((item, index) => ({
          ...item,
          quotation_id: quotationData.id,
          sort_order: index + 1
        }));

        const itemsResult = await db.insertMany('quotation_items', quotationItems);
        if (itemsResult.error) throw itemsResult.error;
      }

      return quotationData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
  });
};

// Update quotation with items
export const useUpdateQuotationWithItems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ quotationId, quotation, items }: { quotationId: string; quotation: any; items: QuotationItem[] }) => {
      const db = getDatabase();

      const updateData = {
        customer_id: quotation.customer_id,
        quotation_date: quotation.quotation_date,
        valid_until: quotation.valid_until,
        status: quotation.status || 'draft',
        notes: quotation.notes,
        terms_and_conditions: quotation.terms_and_conditions,
        subtotal: quotation.subtotal,
        tax_amount: quotation.tax_amount,
        total_amount: quotation.total_amount,
      };

      // Update the quotation using the database adapter
      const updateResult = await db.update('quotations', quotationId, updateData);
      if (updateResult.error) throw updateResult.error;

      // Fetch the updated quotation to get full data
      const selectResult = await db.selectOne('quotations', quotationId);
      if (selectResult.error) throw selectResult.error;
      if (!selectResult.data) throw new Error('Failed to fetch updated quotation');

      const updatedQuotation = selectResult.data;

      // Delete existing quotation items
      const deleteResult = await db.deleteMany('quotation_items', { quotation_id: quotationId });
      if (deleteResult.error) throw deleteResult.error;

      // Insert new quotation items
      if (items.length > 0) {
        const quotationItems = items.map((item, index) => ({
          quotation_id: quotationId,
          product_id: item.product_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_percentage: item.discount_percentage || 0,
          tax_percentage: item.tax_percentage || 0,
          tax_amount: item.tax_amount || 0,
          tax_inclusive: item.tax_inclusive || false,
          line_total: item.line_total,
          sort_order: index + 1
        }));

        const itemsResult = await db.insertMany('quotation_items', quotationItems);
        if (itemsResult.error) throw itemsResult.error;
      }

      return updatedQuotation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
  });
};

// Convert quotation to invoice
export const useConvertQuotationToInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quotationId: string) => {
      const db = getDatabase();

      // Get quotation data using database adapter
      const quotationResult = await db.selectOne('quotations', quotationId);
      if (quotationResult.error) throw quotationResult.error;
      if (!quotationResult.data) throw new Error('Quotation not found');

      const quotation = quotationResult.data as any;

      // Get quotation items
      const itemsResult = await db.selectBy('quotation_items', { quotation_id: quotationId });
      if (itemsResult.error) throw itemsResult.error;
      const quotationItems = itemsResult.data || [];

      // Generate invoice number using centralized API
      const { generateDocumentNumberAPI } = await import('@/utils/documentNumbering');
      const invoiceNumber = await generateDocumentNumberAPI('invoice');

      // Create invoice from quotation
      // Determine creator
      let createdBy: string | null = null;
      try {
        const { data: userData } = await supabase.auth.getUser();
        createdBy = userData?.user?.id || null;
      } catch {
        createdBy = null;
      }

      const invoiceData = {
        company_id: quotation.company_id,
        customer_id: quotation.customer_id,
        invoice_number: invoiceNumber,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'sent',
        subtotal: quotation.subtotal,
        tax_amount: quotation.tax_amount,
        total_amount: quotation.total_amount,
        created_by: createdBy
      };

      // Create invoice using database adapter
      const invoiceInsertResult = await db.insert('invoices', invoiceData);
      if (invoiceInsertResult.error) {
        // Fallback: if FK violation on created_by, retry with created_by = null
        if (String(invoiceInsertResult.error.message || '').includes('created_by')) {
          const retryPayload = { ...invoiceData, created_by: null };
          const retryResult = await db.insert('invoices', retryPayload);
          if (retryResult.error) throw retryResult.error;
          invoiceData.created_by = null;
        } else {
          throw invoiceInsertResult.error;
        }
      }

      if (!invoiceInsertResult.id) throw new Error('Failed to create invoice: no ID returned');

      // Fetch the created invoice to get full data
      const invoiceSelectResult = await db.selectOne('invoices', invoiceInsertResult.id);
      if (invoiceSelectResult.error) throw invoiceSelectResult.error;
      if (!invoiceSelectResult.data) throw new Error('Failed to fetch created invoice');

      const invoice = invoiceSelectResult.data as any;

      // Create invoice items from quotation items
      if (quotationItems && quotationItems.length > 0) {
        const invoiceItems = quotationItems.map((item: any, index: number) => ({
          invoice_id: invoice.id,
          product_id: item.product_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_percentage: item.discount_percentage,
          tax_percentage: item.tax_percentage,
          tax_amount: item.tax_amount,
          tax_inclusive: item.tax_inclusive,
          line_total: item.line_total,
          sort_order: item.sort_order || index + 1
        }));

        const itemsInsertResult = await db.insertMany('invoice_items', invoiceItems);
        if (itemsInsertResult.error) throw itemsInsertResult.error;

        // Create stock movements for products
        const stockMovements = invoiceItems
          .filter(item => item.product_id && item.quantity > 0)
          .map(item => ({
            company_id: invoice.company_id,
            product_id: item.product_id,
            movement_type: 'OUT',
            reference_type: 'INVOICE',
            reference_id: invoice.id,
            quantity: item.quantity,
            cost_per_unit: item.unit_price,
            notes: `Stock reduction for invoice ${invoice.invoice_number} (converted from quotation ${quotation.quotation_number})`
          }));

        if (stockMovements.length > 0) {
          const movementsResult = await db.insertMany('stock_movements', stockMovements);
          if (movementsResult.error) {
            console.warn('Failed to create stock movements:', movementsResult.error);
            // Don't throw - invoice was created successfully, stock can be adjusted later
          }
        }
      }

      // Update quotation status using database adapter
      const updateResult = await db.update('quotations', quotationId, { status: 'converted' });
      if (updateResult.error) {
        console.warn('Failed to update quotation status:', updateResult.error);
        // Don't throw - invoice was created successfully
      }

      return invoice;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock_movements'] });
      toast.success(`Quotation converted to invoice ${data.invoice_number} successfully!`);
    },
    onError: (error) => {
      const errorMessage = parseErrorMessageWithCodes(error, 'convert quotation to invoice');
      console.error('Error converting quotation to invoice:', errorMessage);
      toast.error(`Error converting quotation to invoice: ${errorMessage}`);
    },
  });
};

export const useCreateInvoiceWithItems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invoice, items }: { invoice: any; items: InvoiceItem[] }) => {
      const db = getDatabase();

      // Ensure created_by references the authenticated user to satisfy FK constraints
      let cleanInvoice = { ...invoice } as any;
      try {
        const { data: userData } = await supabase.auth.getUser();
        const authUserId = userData?.user?.id || null;
        if (authUserId) {
          cleanInvoice.created_by = authUserId;
        } else if (typeof cleanInvoice.created_by === 'undefined') {
          cleanInvoice.created_by = null;
        }
      } catch {
        if (typeof cleanInvoice.created_by === 'undefined') {
          cleanInvoice.created_by = null;
        }
      }

      // Create the invoice using database adapter
      const invoiceInsertResult = await db.insert('invoices', cleanInvoice);
      if (invoiceInsertResult.error) {
        // Fallback: if FK violation on created_by, retry with created_by = null
        if (String(invoiceInsertResult.error.message || '').includes('created_by')) {
          const retryPayload = { ...cleanInvoice, created_by: null };
          const retryResult = await db.insert('invoices', retryPayload);
          if (retryResult.error) throw retryResult.error;
          if (!retryResult.id) throw new Error('Failed to create invoice: no ID returned');
        } else {
          throw invoiceInsertResult.error;
        }
      }

      if (!invoiceInsertResult.id) throw new Error('Failed to create invoice: no ID returned');

      // Fetch the created invoice to get full data
      const invoiceSelectResult = await db.selectOne('invoices', invoiceInsertResult.id);
      if (invoiceSelectResult.error) throw invoiceSelectResult.error;
      if (!invoiceSelectResult.data) throw new Error('Failed to fetch created invoice');

      const invoiceData = invoiceSelectResult.data;

      // Create the invoice items if any
      if (items.length > 0) {
        const invoiceItems = items.map((item, index) => ({
          ...item,
          invoice_id: invoiceData.id,
          sort_order: index + 1
        }));

        console.log('📌 About to insert invoice items:', {
          invoiceId: invoiceData.id,
          itemsCount: items.length,
          itemsData: invoiceItems,
          firstItem: invoiceItems[0]
        });

        const itemsInsertResult = await db.insertMany('invoice_items', invoiceItems);

        console.log('📌 Invoice items insert result:', {
          success: !itemsInsertResult.error,
          error: itemsInsertResult.error,
          insertedId: itemsInsertResult.id
        });

        if (itemsInsertResult.error) {
          console.error('❌ Failed to insert invoice items:', {
            error: itemsInsertResult.error,
            message: itemsInsertResult.error?.message,
            details: itemsInsertResult.error?.details,
            hint: (itemsInsertResult.error as any)?.hint
          });
          throw itemsInsertResult.error;
        }

        // Create stock movements for products that affect inventory
        if (invoice.affects_inventory !== false) {
          const stockMovements = items
            .filter(item => item.product_id && item.quantity > 0)
            .map(item => ({
              company_id: invoice.company_id,
              product_id: item.product_id!,
              movement_type: 'OUT',
              reference_type: 'INVOICE',
              reference_id: invoiceData.id,
              quantity: item.quantity,
              cost_per_unit: item.unit_price,
              notes: `Stock reduction for invoice ${invoice.invoice_number}`
            }));

          if (stockMovements.length > 0) {
            const movementsInsertResult = await db.insertMany('stock_movements', stockMovements);
            if (movementsInsertResult.error) {
              console.warn('Failed to create stock movements:', movementsInsertResult.error);
              // Don't throw - invoice was created successfully, stock can be adjusted later
            } else {
              console.log(`Created stock movements for invoice ${invoice.invoice_number}`);
            }
          }
        }
      }

      return invoiceData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock_movements'] });
    },
  });
};

export const useUpdateInvoiceWithItems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invoiceId, invoice, items }: { invoiceId: string; invoice: any; items: InvoiceItem[] }) => {
      const db = getDatabase();

      // First, reverse any existing stock movements for this invoice
      const existingMovementsResult = await db.selectBy('stock_movements', {
        reference_id: invoiceId,
        reference_type: 'INVOICE'
      });

      if (!existingMovementsResult.error && existingMovementsResult.data && existingMovementsResult.data.length > 0) {
        const existingMovements = existingMovementsResult.data;

        // Create reverse movements
        const reverseMovements = existingMovements.map((movement: any) => ({
          company_id: movement.company_id,
          product_id: movement.product_id,
          movement_type: movement.movement_type === 'OUT' ? 'IN' : 'OUT',
          reference_type: 'ADJUSTMENT',
          reference_id: invoiceId,
          quantity: -movement.quantity,
          notes: `Reversal for updated invoice ${invoice.invoice_number}`
        }));

        const reverseInsertResult = await db.insertMany('stock_movements', reverseMovements);
        if (reverseInsertResult.error) {
          console.warn('Failed to create reverse stock movements:', reverseInsertResult.error);
        }
      }

      // Update the invoice using database adapter
      const updateResult = await db.update('invoices', invoiceId, invoice);
      if (updateResult.error) throw updateResult.error;

      // Fetch updated invoice
      const invoiceSelectResult = await db.selectOne('invoices', invoiceId);
      if (invoiceSelectResult.error) throw invoiceSelectResult.error;
      if (!invoiceSelectResult.data) throw new Error('Failed to fetch updated invoice');

      const invoiceData = invoiceSelectResult.data;

      // Delete existing invoice items
      const deleteResult = await db.deleteMany('invoice_items', { invoice_id: invoiceId });
      if (deleteResult.error) throw deleteResult.error;

      // Create new invoice items
      if (items.length > 0) {
        const invoiceItems = items.map((item, index) => ({
          ...item,
          invoice_id: invoiceId,
          sort_order: index + 1
        }));

        const itemsInsertResult = await db.insertMany('invoice_items', invoiceItems);
        if (itemsInsertResult.error) throw itemsInsertResult.error;

        // Create new stock movements if affects inventory
        if (invoice.affects_inventory !== false) {
          const stockMovements = items
            .filter(item => item.product_id && item.quantity > 0)
            .map(item => ({
              company_id: invoice.company_id,
              product_id: item.product_id!,
              movement_type: 'OUT',
              reference_type: 'INVOICE',
              reference_id: invoiceId,
              quantity: item.quantity,
              cost_per_unit: item.unit_price,
              notes: `Stock reduction for updated invoice ${invoice.invoice_number}`
            }));

          if (stockMovements.length > 0) {
            const movementsInsertResult = await db.insertMany('stock_movements', stockMovements);
            if (movementsInsertResult.error) {
              console.warn('Failed to create stock movements:', movementsInsertResult.error);
            }
          }
        }
      }

      return invoiceData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock_movements'] });
    },
  });
};

// Create proforma invoice
export const useCreateProformaWithItems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ proforma, items }: { proforma: any; items: any[] }) => {
      const db = getDatabase();

      // Create the proforma invoice using database adapter
      // Note: proforma_invoices table does not have a created_by column
      const { created_by, ...cleanProforma } = proforma as any;

      let proformaInsertResult = await db.insert('proforma_invoices', cleanProforma);
      if (proformaInsertResult.error) {
        const errorMessage = String(proformaInsertResult.error.message || '').toLowerCase();

        // Fallback: if valid_until column missing, retry without it
        if (errorMessage.includes('valid_until')) {
          const { valid_until, ...dataWithoutValidUntil } = cleanProforma;
          const retryResult = await db.insert('proforma_invoices', dataWithoutValidUntil);
          if (retryResult.error) throw retryResult.error;
          if (!retryResult.id) throw new Error('Failed to create proforma: no ID returned');
          proformaInsertResult = retryResult;
        } else {
          throw proformaInsertResult.error;
        }
      }

      if (!proformaInsertResult.id) throw new Error('Failed to create proforma: no ID returned');

      // Fetch the created proforma to get full data
      const proformaSelectResult = await db.selectOne('proforma_invoices', proformaInsertResult.id);
      if (proformaSelectResult.error) throw proformaSelectResult.error;
      if (!proformaSelectResult.data) throw new Error('Failed to fetch created proforma');

      const proformaData = proformaSelectResult.data;

      // Create the proforma items if any
      if (items.length > 0) {
        const proformaItems = items.map((item, index) => ({
          proforma_id: proformaData.id,
          product_id: item.product_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_percentage: item.discount_percentage || 0,
          discount_amount: item.discount_amount || 0,
          tax_percentage: item.tax_percentage || 0,
          tax_amount: item.tax_amount || 0,
          tax_inclusive: !!item.tax_inclusive,
          line_total: item.line_total,
          sort_order: index + 1
        }));

        const itemsInsertResult = await db.insertMany('proforma_items', proformaItems);
        if (itemsInsertResult.error) throw itemsInsertResult.error;
      }

      return proformaData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proforma_invoices'] });
    },
  });
};

// Create delivery note (affects inventory without creating invoice)
export const useCreateDeliveryNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ deliveryNote, items }: { deliveryNote: any; items: any[] }) => {
      const db = getDatabase();

      // Validate that delivery note is backed by a sale (invoice)
      if (!deliveryNote.invoice_id) {
        throw new Error('Delivery note must be linked to an existing invoice or sale.');
      }

      // Verify the invoice exists and belongs to the same company
      const invoiceResult = await db.selectOne('invoices', deliveryNote.invoice_id);
      if (invoiceResult.error) {
        throw new Error('Related invoice not found or does not belong to this company.');
      }

      const invoice = invoiceResult.data as any;
      if (!invoice || invoice.company_id !== deliveryNote.company_id) {
        throw new Error('Related invoice not found or does not belong to this company.');
      }

      // Verify customer matches
      if (invoice.customer_id !== deliveryNote.customer_id) {
        throw new Error('Delivery note customer must match the invoice customer.');
      }

      // Verify delivery items correspond to invoice items
      if (items.length > 0) {
        const invoiceItemsResult = await db.selectBy('invoice_items', { invoice_id: deliveryNote.invoice_id });

        const invoiceProductMap = new Map();
        if (!invoiceItemsResult.error && invoiceItemsResult.data) {
          (invoiceItemsResult.data || []).forEach((item: any) => {
            invoiceProductMap.set(item.product_id, item.quantity);
          });
        }

        // Check that all delivery items exist in the invoice
        for (const item of items) {
          if (!invoiceProductMap.has(item.product_id)) {
            throw new Error(`Product in delivery note is not included in the related invoice.`);
          }

          const invoiceQuantity = invoiceProductMap.get(item.product_id);
          const deliveredQuantity = item.quantity_delivered ?? item.quantity ?? 0;
          const orderedQuantity = item.quantity_ordered ?? invoiceQuantity ?? item.quantity ?? 0;

          if (deliveredQuantity > invoiceQuantity) {
            throw new Error(`Delivery quantity (${deliveredQuantity}) cannot exceed invoice quantity (${invoiceQuantity}) for product.`);
          }

          if (deliveredQuantity > orderedQuantity) {
            console.warn(`Delivery quantity (${deliveredQuantity}) exceeds ordered quantity (${orderedQuantity}) for product ${item.product_id}`);
          }
        }
      }

      // Create delivery note using database adapter
      const deliveryInsertResult = await db.insert('delivery_notes', deliveryNote);
      if (deliveryInsertResult.error) throw deliveryInsertResult.error;
      if (!deliveryInsertResult.id) throw new Error('Failed to create delivery note: no ID returned');

      // Fetch the created delivery note to get full data
      const deliverySelectResult = await db.selectOne('delivery_notes', deliveryInsertResult.id);
      if (deliverySelectResult.error) throw deliverySelectResult.error;
      if (!deliverySelectResult.data) throw new Error('Failed to fetch created delivery note');

      const deliveryData = deliverySelectResult.data;

      // Create delivery note items
      if (items.length > 0) {
        const deliveryItems = items.map((item, index) => {
          const quantityOrdered = item.quantity_ordered ?? item.quantity ?? item.quantity_delivered ?? 0;
          const quantityDelivered = item.quantity_delivered ?? item.quantity ?? 0;
          return {
            delivery_note_id: deliveryData.id,
            product_id: item.product_id,
            description: item.description,
            quantity_ordered: quantityOrdered,
            quantity_delivered: quantityDelivered,
            unit_of_measure: item.unit_of_measure ?? 'pcs',
            unit_price: item.unit_price ?? 0,
            sort_order: index + 1,
          };
        });

        const itemsInsertResult = await db.insertMany('delivery_note_items', deliveryItems);
        if (itemsInsertResult.error) throw itemsInsertResult.error;

        // Create stock movements for delivered items
        const stockMovements = deliveryItems
          .filter(item => item.product_id && (item.quantity_delivered ?? 0) > 0)
          .map(item => ({
            company_id: deliveryNote.company_id,
            product_id: item.product_id,
            movement_type: 'OUT',
            reference_type: 'DELIVERY_NOTE',
            reference_id: deliveryData.id,
            quantity: item.quantity_delivered,
            notes: `Stock delivery for delivery note ${deliveryNote.delivery_number || deliveryNote.delivery_note_number}`
          }));

        if (stockMovements.length > 0) {
          const movementsInsertResult = await db.insertMany('stock_movements', stockMovements);
          if (movementsInsertResult.error) {
            console.warn('Failed to create stock movements:', movementsInsertResult.error);
          }
        }
      }

      return deliveryData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery_notes'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock_movements'] });
    },
  });
};

// Convert quotation to proforma invoice
export const useConvertQuotationToProforma = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quotationId: string) => {
      const db = getDatabase();

      // Get quotation data using database adapter
      const quotationResult = await db.selectOne('quotations', quotationId);
      if (quotationResult.error) throw quotationResult.error;
      if (!quotationResult.data) throw new Error('Quotation not found');

      const quotation = quotationResult.data as any;

      // Get quotation items
      const itemsResult = await db.selectBy('quotation_items', { quotation_id: quotationId });
      if (itemsResult.error) throw itemsResult.error;
      const quotationItems = itemsResult.data || [];

      // Generate proforma number using centralized API
      const { generateDocumentNumberAPI } = await import('@/utils/documentNumbering');
      const proformaNumber = await generateDocumentNumberAPI('proforma');

      // Create proforma from quotation
      let createdBy: string | null = null;
      try {
        const { data: userData } = await supabase.auth.getUser();
        createdBy = userData?.user?.id || null;
      } catch {
        createdBy = null;
      }

      const validUntilDate = new Date(quotation.valid_until || Date.now() + 30 * 24 * 60 * 60 * 1000);

      const proformaData = {
        company_id: quotation.company_id,
        customer_id: quotation.customer_id,
        proforma_number: proformaNumber,
        proforma_date: new Date().toISOString().split('T')[0],
        valid_until: validUntilDate.toISOString().split('T')[0],
        status: 'draft',
        subtotal: quotation.subtotal,
        tax_amount: quotation.tax_amount,
        total_amount: quotation.total_amount,
        notes: `Converted from quotation ${quotation.quotation_number}`,
        terms_and_conditions: quotation.terms_and_conditions
        // Note: created_by column does not exist in proforma_invoices table
      };

      // Create proforma using database adapter
      let proformaInsertResult = await db.insert('proforma_invoices', proformaData);
      if (proformaInsertResult.error) {
        const errorMessage = String(proformaInsertResult.error.message || '').toLowerCase();

        // Fallback: if valid_until column missing, retry without it
        if (errorMessage.includes('valid_until')) {
          const { valid_until, ...dataWithoutValidUntil } = proformaData;
          const retryResult = await db.insert('proforma_invoices', dataWithoutValidUntil);
          if (retryResult.error) throw retryResult.error;
          proformaInsertResult = retryResult;
        } else {
          throw proformaInsertResult.error;
        }
      }

      if (!proformaInsertResult.id) throw new Error('Failed to create proforma: no ID returned');

      // Fetch the created proforma to get full data
      const proformaSelectResult = await db.selectOne('proforma_invoices', proformaInsertResult.id);
      if (proformaSelectResult.error) throw proformaSelectResult.error;
      if (!proformaSelectResult.data) throw new Error('Failed to fetch created proforma');

      const proforma = proformaSelectResult.data as any;

      // Create proforma items from quotation items
      if (quotationItems && quotationItems.length > 0) {
        const proformaItems = quotationItems.map((item: any, index: number) => ({
          proforma_id: proforma.id,
          product_id: item.product_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_percentage: item.discount_percentage || 0,
          tax_percentage: item.tax_percentage,
          tax_amount: item.tax_amount,
          tax_inclusive: item.tax_inclusive,
          line_total: item.line_total,
          sort_order: item.sort_order || index + 1
        }));

        const itemsInsertResult = await db.insertMany('proforma_items', proformaItems);
        if (itemsInsertResult.error) throw itemsInsertResult.error;
      }

      // Update quotation status using database adapter
      const updateResult = await db.update('quotations', quotationId, { status: 'converted' });
      if (updateResult.error) {
        console.warn('Failed to update quotation status:', updateResult.error);
        // Don't throw - proforma was created successfully
      }

      return proforma;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['proforma_invoices'] });
      toast.success(`Quotation converted to proforma invoice ${data.proforma_number} successfully!`);
    },
    onError: (error) => {
      const errorMessage = parseErrorMessageWithCodes(error, 'convert quotation to proforma');
      console.error('Error converting quotation to proforma:', errorMessage);
      toast.error(`Error converting quotation to proforma: ${errorMessage}`);
    },
  });
};

// Delete a quotation (audited, cleans up items)
export const useDeleteQuotation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quotationId: string) => {
      const db = getDatabase();

      // Check permission before deletion
      const { profile } = await (async () => {
        // Get user ID from localStorage (external API auth) or from Supabase
        let userId: string | null = localStorage.getItem('med_api_user_id');

        if (!userId) {
          // Fall back to Supabase auth
          const { data: { user } } = await supabase.auth.getUser();
          userId = user?.id || null;
        }

        if (!userId) throw new Error('Not authenticated');

        // Use database adapter to fetch profile (respects VITE_DATABASE_PROVIDER)
        const { data: profileData, error } = await db.selectOne('profiles', userId);

        if (error) {
          console.warn('⚠️ Profile fetch error:', error.message);
          // If we can't fetch profile, allow deletion (don't block the user)
          return { profile: null };
        }

        return { profile: profileData };
      })();

      // Check if user has delete_quotation permission (only if profile data was fetched)
      if (profile && profile.permissions && !profile.permissions.includes('delete_quotation')) {
        throw new Error('You do not have permission to delete quotations');
      }

      // Fetch snapshot for audit
      let snapshot: any = null;
      let companyId: string | null = null;
      try {
        const selectResult = await db.selectOne('quotations', quotationId);
        if (!selectResult.error && selectResult.data) {
          snapshot = selectResult.data;
          companyId = (selectResult.data as any)?.company_id ?? null;
        }
      } catch {}

      // Attempt to log deletion (best-effort)
      try {
        const { logDeletion } = await import('@/utils/auditLogger');
        await logDeletion('quotation', quotationId, snapshot, companyId);
      } catch (e) {
        console.warn('Quotation delete audit failed:', (e as any)?.message || e);
      }

      // Attempt to delete child items first (best-effort)
      try {
        await db.deleteMany('quotation_items', { quotation_id: quotationId });
      } catch (e) {
        console.warn('Quotation items delete skipped/failed:', (e as any)?.message || e);
      }

      // Delete parent record using the database adapter
      const deleteResult = await db.delete('quotations', quotationId);

      if (deleteResult.error) {
        const errorMessage = parseErrorMessageWithCodes(deleteResult.error, 'delete quotation');
        console.error('Error deleting quotation:', errorMessage);
        throw new Error(`Failed to delete quotation: ${errorMessage}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Quotation deleted successfully!');
    },
    onError: (error) => {
      const errorMessage = parseErrorMessageWithCodes(error, 'delete quotation');
      console.error('Error deleting quotation:', errorMessage);
      toast.error(`Failed to delete quotation: ${errorMessage}`);
    },
  });
};

// Update quotation status
export const useUpdateQuotationStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ quotationId, status, notes }: { quotationId: string; status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'; notes?: string }) => {
      const db = getDatabase();
      const updateData: any = { status };

      if (notes) {
        // Append note to existing notes
        const currentQuotationResult = await db.selectOne('quotations', quotationId);

        if (!currentQuotationResult.error && currentQuotationResult.data) {
          const currentQuotation = currentQuotationResult.data as any;
          if (currentQuotation?.notes) {
            updateData.notes = `${currentQuotation.notes}\n[${new Date().toLocaleString()}] Status changed to ${status}: ${notes}`;
          } else {
            updateData.notes = `[${new Date().toLocaleString()}] Status changed to ${status}: ${notes}`;
          }
        } else {
          updateData.notes = `[${new Date().toLocaleString()}] Status changed to ${status}: ${notes}`;
        }
      }

      // Update quotation status using database adapter
      const updateResult = await db.update('quotations', quotationId, updateData);
      if (updateResult.error) throw updateResult.error;

      // Fetch updated quotation
      const quotationSelectResult = await db.selectOne('quotations', quotationId);
      if (quotationSelectResult.error) throw quotationSelectResult.error;
      if (!quotationSelectResult.data) throw new Error('Failed to fetch updated quotation');

      return quotationSelectResult.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });

      const statusLabels: Record<string, string> = {
        'draft': 'Draft',
        'sent': 'Sent',
        'accepted': 'Accepted',
        'rejected': 'Rejected',
        'expired': 'Expired',
        'converted': 'Converted',
      };

      toast.success(`Quotation status changed to ${statusLabels[variables.status] || variables.status}`);
    },
    onError: (error) => {
      const errorMessage = parseErrorMessageWithCodes(error, 'update quotation status');
      console.error('Error updating quotation status:', errorMessage);
      toast.error(`Failed to update status: ${errorMessage}`);
    },
  });
};

// Create direct receipt with auto-generated invoice
export const useCreateDirectReceipt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      payment,
      invoiceAmount,
      companyId,
      customerId,
      invoiceNumber
    }: {
      payment: any;
      invoiceAmount: number;
      companyId: string;
      customerId: string;
      invoiceNumber?: string;
    }) => {
      const db = getDatabase();

      // Get created_by from auth
      let createdBy: any = null;
      try {
        const { data: userData } = await supabase.auth.getUser();
        createdBy = userData?.user?.id || null;
      } catch {
        createdBy = null;
      }

      const paymentDate = payment.payment_date || new Date().toISOString().split('T')[0];

      // Determine invoice status based on payment amount vs invoice total
      let invoiceStatus = 'draft';
      let paidAmount = 0;
      let balanceDue = invoiceAmount;

      const paymentAmount = payment.amount || 0;
      if (paymentAmount >= invoiceAmount) {
        invoiceStatus = 'paid';
        paidAmount = invoiceAmount;
        balanceDue = 0;
      } else if (paymentAmount > 0) {
        invoiceStatus = 'partial';
        paidAmount = paymentAmount;
        balanceDue = invoiceAmount - paymentAmount;
      }

      // Generate invoice number if not provided
      let finalInvoiceNumber = invoiceNumber;
      if (!finalInvoiceNumber) {
        const { generateDocumentNumberAPI: generateInvoiceNum } = await import('@/utils/documentNumbering');
        finalInvoiceNumber = await generateInvoiceNum('invoice');
      }

      // CREATE INVOICE FIRST (before payment, since payments.invoice_id references invoices.id)
      let cleanInvoice = {
        company_id: companyId,
        customer_id: customerId,
        invoice_number: finalInvoiceNumber,
        invoice_date: paymentDate,
        due_date: paymentDate,
        status: invoiceStatus,
        subtotal: invoiceAmount,
        tax_amount: 0,
        total_amount: invoiceAmount,
        paid_amount: paidAmount,
        balance_due: balanceDue,
        notes: 'Direct receipt',
        created_by: createdBy
      } as any;

      let invoiceId: string | null = null;
      let invoiceInsertResult = await db.insert('invoices', cleanInvoice);

      if (invoiceInsertResult.error) {
        if (String(invoiceInsertResult.error.message || '').includes('created_by')) {
          const retryPayload = { ...cleanInvoice, created_by: null };
          const retryResult = await db.insert('invoices', retryPayload);
          if (retryResult.error) throw retryResult.error;
          if (!retryResult.id) throw new Error('Failed to create invoice: no ID returned');
          invoiceId = retryResult.id;
        } else {
          throw invoiceInsertResult.error;
        }
      } else {
        if (!invoiceInsertResult.id) throw new Error('Failed to create invoice: no ID returned');
        invoiceId = invoiceInsertResult.id;
      }

      // Fetch the created invoice
      const invoiceSelectResult = await db.selectOne('invoices', invoiceId!);
      if (invoiceSelectResult.error) throw invoiceSelectResult.error;
      if (!invoiceSelectResult.data) throw new Error('Failed to fetch created invoice');

      const invoiceData = invoiceSelectResult.data;

      // NOW CREATE PAYMENT with invoice_id
      let cleanPayment = {
        company_id: companyId,
        invoice_id: invoiceData.id,
        payment_date: paymentDate,
        payment_method: payment.payment_method || 'cash',
        amount: paymentAmount,
        reference_number: payment.reference_number || null,
        created_by: createdBy
      } as any;

      // Include optional fields if they exist in the payment object
      if (payment.payment_number) {
        cleanPayment.payment_number = payment.payment_number;
      }
      if (payment.notes) {
        cleanPayment.notes = payment.notes;
      }

      let paymentId: string | null = null;
      let paymentInsertResult = await db.insert('payments', cleanPayment);

      if (paymentInsertResult.error) {
        if (String(paymentInsertResult.error.message || '').includes('created_by')) {
          const retryPayload = { ...cleanPayment, created_by: null };
          const retryResult = await db.insert('payments', retryPayload);
          if (retryResult.error) throw retryResult.error;
          if (!retryResult.id) throw new Error('Failed to create payment: no ID returned');
          paymentId = retryResult.id;
        } else {
          throw paymentInsertResult.error;
        }
      } else {
        if (!paymentInsertResult.id) throw new Error('Failed to create payment: no ID returned');
        paymentId = paymentInsertResult.id;
      }

      // Fetch the created payment
      const paymentSelectResult = await db.selectOne('payments', paymentId!);
      if (paymentSelectResult.error) throw paymentSelectResult.error;
      if (!paymentSelectResult.data) throw new Error('Failed to fetch created payment');

      const paymentData = paymentSelectResult.data as any;

      // Create payment allocation linking payment to invoice
      const allocationInsertResult = await db.insert('payment_allocations', {
        payment_id: paymentData.id,
        invoice_id: invoiceData.id,
        amount: paymentAmount
      });

      if (allocationInsertResult.error) {
        const allocationError = allocationInsertResult.error;
        console.error(
          'Failed to create payment allocation',
          {
            paymentId: paymentData.id,
            invoiceId: invoiceData.id,
            amount: paymentAmount,
            error: allocationError,
            errorMessage: typeof allocationError === 'string' ? allocationError : (allocationError as any).message || JSON.stringify(allocationError)
          }
        );
        // Don't throw - payment and invoice were created successfully
        // But alert user about allocation link failure
        console.warn(`Warning: Payment allocation could not be created for invoice ${invoiceData.invoice_number}`);
      }

      return {
        payment: paymentData,
        invoice: invoiceData,
        allocation: allocationInsertResult.error ? null : { id: allocationInsertResult.id }
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['payment_allocations'] });
      toast.success(`Receipt ${data.payment.payment_number} created with invoice ${data.invoice.invoice_number}`);
    },
    onError: (error) => {
      const errorMessage = parseErrorMessageWithCodes(error, 'create direct receipt');
      console.error('Error creating direct receipt:', errorMessage);
      toast.error(`Failed to create receipt: ${errorMessage}`);
    },
  });
};

// Create direct receipt with line items
export const useCreateDirectReceiptWithItems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      payment,
      invoiceAmount,
      subtotal,
      taxAmount,
      companyId,
      customerId,
      invoiceNumber,
      items
    }: {
      payment: any;
      invoiceAmount: number;
      subtotal: number;
      taxAmount: number;
      companyId: string;
      customerId: string;
      invoiceNumber?: string;
      items: any[];
    }) => {
      const db = getDatabase();

      // Get created_by from auth
      let createdBy: any = null;
      try {
        const { data: userData } = await supabase.auth.getUser();
        createdBy = userData?.user?.id || null;
      } catch {
        createdBy = null;
      }

      const paymentDate = payment.payment_date || new Date().toISOString().split('T')[0];
      const paymentAmount = payment.amount || 0;

      // Determine invoice status based on payment amount vs invoice total
      let invoiceStatus = 'draft';
      let paidAmount = 0;
      let balanceDue = invoiceAmount;

      if (paymentAmount >= invoiceAmount) {
        invoiceStatus = 'paid';
        paidAmount = invoiceAmount;
        balanceDue = 0;
      } else if (paymentAmount > 0) {
        invoiceStatus = 'partial';
        paidAmount = paymentAmount;
        balanceDue = invoiceAmount - paymentAmount;
      }

      // Generate invoice number if not provided
      let finalInvoiceNumber = invoiceNumber;
      if (!finalInvoiceNumber) {
        const { generateDocumentNumberAPI: generateInvoiceNum } = await import('@/utils/documentNumbering');
        finalInvoiceNumber = await generateInvoiceNum('invoice');
      }

      // CREATE INVOICE FIRST (before payment, since payments.invoice_id references invoices.id)
      let cleanInvoice = {
        company_id: companyId,
        customer_id: customerId,
        invoice_number: finalInvoiceNumber,
        invoice_date: paymentDate,
        due_date: paymentDate,
        status: invoiceStatus,
        subtotal: subtotal,
        tax_amount: taxAmount,
        total_amount: invoiceAmount,
        paid_amount: paidAmount,
        balance_due: balanceDue,
        notes: 'Direct receipt',
        created_by: createdBy
      } as any;

      let invoiceId: string | null = null;
      let invoiceInsertResult = await db.insert('invoices', cleanInvoice);

      if (invoiceInsertResult.error) {
        if (String(invoiceInsertResult.error.message || '').includes('created_by')) {
          const retryPayload = { ...cleanInvoice, created_by: null };
          const retryResult = await db.insert('invoices', retryPayload);
          if (retryResult.error) throw retryResult.error;
          if (!retryResult.id) throw new Error('Failed to create invoice: no ID returned');
          invoiceId = retryResult.id;
        } else {
          throw invoiceInsertResult.error;
        }
      } else {
        if (!invoiceInsertResult.id) throw new Error('Failed to create invoice: no ID returned');
        invoiceId = invoiceInsertResult.id;
      }

      // Fetch the created invoice
      const invoiceSelectResult = await db.selectOne('invoices', invoiceId!);
      if (invoiceSelectResult.error) throw invoiceSelectResult.error;
      if (!invoiceSelectResult.data) throw new Error('Failed to fetch created invoice');

      const invoiceData = invoiceSelectResult.data;

      // Create invoice items
      const invoiceItemsResult = await Promise.all(
        items.map((item, index) =>
          db.insert('invoice_items', {
            invoice_id: invoiceData.id,
            product_id: item.product_id || null,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            tax_percentage: item.tax_percentage || 0,
            tax_amount: item.tax_amount || 0,
            tax_inclusive: item.tax_inclusive || false,
            line_total: item.line_total,
            sort_order: index + 1
          })
        )
      );

      // Check for errors in item creation
      for (const result of invoiceItemsResult) {
        if (result.error) {
          console.warn('Error creating invoice item:', result.error);
        }
      }

      // NOW CREATE PAYMENT with invoice_id
      let cleanPayment = {
        company_id: companyId,
        invoice_id: invoiceData.id,
        payment_date: paymentDate,
        payment_method: payment.payment_method || 'cash',
        amount: paymentAmount,
        reference_number: payment.reference_number || null,
        created_by: createdBy
      } as any;

      // Include optional fields if they exist in the payment object
      if (payment.payment_number) {
        cleanPayment.payment_number = payment.payment_number;
      }
      if (payment.notes) {
        cleanPayment.notes = payment.notes;
      }

      let paymentId: string | null = null;
      let paymentInsertResult = await db.insert('payments', cleanPayment);

      if (paymentInsertResult.error) {
        if (String(paymentInsertResult.error.message || '').includes('created_by')) {
          const retryPayload = { ...cleanPayment, created_by: null };
          const retryResult = await db.insert('payments', retryPayload);
          if (retryResult.error) throw retryResult.error;
          if (!retryResult.id) throw new Error('Failed to create payment: no ID returned');
          paymentId = retryResult.id;
        } else {
          throw paymentInsertResult.error;
        }
      } else {
        if (!paymentInsertResult.id) throw new Error('Failed to create payment: no ID returned');
        paymentId = paymentInsertResult.id;
      }

      // Fetch the created payment
      const paymentSelectResult = await db.selectOne('payments', paymentId!);
      if (paymentSelectResult.error) throw paymentSelectResult.error;
      if (!paymentSelectResult.data) throw new Error('Failed to fetch created payment');

      const paymentData = paymentSelectResult.data as any;

      // Create payment allocation linking payment to invoice
      const allocationInsertResult = await db.insert('payment_allocations', {
        payment_id: paymentData.id,
        invoice_id: invoiceData.id,
        amount: paymentAmount
      });

      if (allocationInsertResult.error) {
        const allocationError = allocationInsertResult.error;
        console.error(
          'Failed to create payment allocation for direct receipt',
          {
            paymentId: paymentData.id,
            invoiceId: invoiceData.id,
            amount: paymentAmount,
            error: allocationError,
            errorMessage: typeof allocationError === 'string' ? allocationError : (allocationError as any).message || JSON.stringify(allocationError)
          }
        );
        // Don't throw - payment and invoice were created successfully
        // But log for debugging
        console.warn(`Warning: Payment allocation could not be created for direct receipt (Invoice: ${invoiceData?.invoice_number || 'unknown'})`);
      }

      // CREATE RECEIPT RECORD
      // Generate receipt number using centralized utility (now async)
      const { generateReceiptNumber } = await import('@/utils/documentNumbering');
      const receiptNumber = await generateReceiptNumber(companyId);

      const excessAmount = paymentAmount > invoiceAmount ? paymentAmount - invoiceAmount : 0;

      let receiptData = {
        company_id: companyId,
        payment_id: paymentData.id,
        invoice_id: invoiceData.id,
        receipt_number: receiptNumber,
        receipt_date: paymentDate,
        receipt_type: 'direct_receipt',
        total_amount: paymentAmount,
        excess_amount: excessAmount,
        excess_handling: excessAmount > 0 ? 'pending' : 'pending',
        notes: 'Direct receipt',
        created_by: createdBy
      } as any;

      const receiptInsertResult = await db.insert('receipts', receiptData);
      let receiptRecord = null;

      if (receiptInsertResult.error) {
        console.warn('Failed to create receipt:', receiptInsertResult.error);
      } else if (receiptInsertResult.id) {
        // Fetch the created receipt
        const receiptSelectResult = await db.selectOne('receipts', receiptInsertResult.id);
        if (!receiptSelectResult.error && receiptSelectResult.data) {
          receiptRecord = receiptSelectResult.data;
        }
      }

      // CREATE RECEIPT ITEMS
      // Copy items to receipt_items table to maintain a snapshot of items at receipt creation
      let receiptItemsResult = [];
      if (receiptRecord && Array.isArray(items) && items.length > 0) {
        receiptItemsResult = await Promise.all(
          items.map((item, index) =>
            db.insert('receipt_items', {
              receipt_id: receiptRecord.id,
              product_id: item.product_id || null,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              tax_percentage: item.tax_percentage || 0,
              tax_amount: item.tax_amount || 0,
              tax_inclusive: item.tax_inclusive || false,
              discount_before_vat: item.discount_before_vat || 0,
              line_total: item.line_total,
              sort_order: index + 1
            })
          )
        );

        // Check for errors in receipt item creation
        for (const result of receiptItemsResult) {
          if (result.error) {
            console.warn('Warning: Error creating receipt item:', result.error);
            // Don't throw - receipt was created successfully, but log for debugging
          }
        }
      }

      // HANDLE EXCESS PAYMENT
      // If there's excess payment, note it for future credit balance/change note handling
      let excessPaymentData = null;
      if (excessAmount > 0 && receiptRecord) {
        excessPaymentData = {
          receiptId: receiptRecord.id,
          customerId: customerId,
          excessAmount: excessAmount,
          paymentAmount: paymentAmount,
          invoiceAmount: invoiceAmount
        };
      }

      return {
        payment: paymentData,
        invoice: invoiceData,
        items: invoiceItemsResult,
        allocation: allocationInsertResult.error ? null : { id: allocationInsertResult.id },
        receipt: receiptRecord,
        excessPayment: excessPaymentData
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['payment_allocations'] });
      queryClient.invalidateQueries({ queryKey: ['directReceipts'] });
      toast.success(`Receipt created successfully with invoice ${data.invoice.invoice_number}`);
    },
    onError: (error) => {
      const errorMessage = parseErrorMessageWithCodes(error, 'create direct receipt with items');
      console.error('Error creating direct receipt with items:', errorMessage);
      toast.error(`Failed to create receipt: ${errorMessage}`);
    },
  });
};
