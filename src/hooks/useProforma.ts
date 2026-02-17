import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getDatabase } from '@/integrations/database';
import { toast } from 'sonner';
import { calculateDocumentTotals, type TaxableItem } from '@/utils/taxCalculation';
import { parseErrorMessage } from '@/utils/errorHelpers';
import { externalApiAdapter } from '@/integrations/database/external-api-adapter';

export interface ProformaItem {
  id?: string;
  proforma_id?: string;
  product_id: string;
  product_name?: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_percentage?: number;
  discount_amount?: number;
  tax_percentage: number;
  tax_amount: number;
  tax_inclusive: boolean;
  line_total: number;
}

export interface ProformaInvoice {
  id?: string;
  company_id: string;
  customer_id: string;
  proforma_number: string;
  proforma_date: string;
  valid_until: string;
  subtotal: number;
  tax_percentage?: number;
  tax_amount: number;
  total_amount: number;
  status: 'draft' | 'sent' | 'accepted' | 'expired' | 'converted';
  notes?: string;
  terms_and_conditions?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProformaWithItems extends ProformaInvoice {
  customers?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  proforma_items?: ProformaItem[];
}

/**
 * Hook to fetch proforma invoices for a company
 */
export const useProformas = (companyId?: string) => {
  return useQuery({
    queryKey: ['proforma_invoices', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      console.log('📋 Fetching proformas for company:', companyId);
      const result = await externalApiAdapter.selectBy('proforma_invoices', { company_id: companyId });

      if (result.error) {
        console.error('Error fetching proformas:', result.error);
        throw result.error;
      }

      console.log('✅ Fetched', result.data?.length || 0, 'proforma invoices');
      return (result.data || []) as ProformaWithItems[];
    },
    enabled: !!companyId,
  });
};

/**
 * Hook to fetch a single proforma invoice
 */
export const useProforma = (proformaId?: string) => {
  return useQuery({
    queryKey: ['proforma_invoice', proformaId],
    queryFn: async () => {
      if (!proformaId) return null;

      console.log('📋 Fetching proforma:', proformaId);
      const result = await externalApiAdapter.selectOne('proforma_invoices', proformaId);

      if (result.error) {
        console.error('Error fetching proforma:', result.error);
        throw result.error;
      }

      if (!result.data) {
        throw new Error('Proforma not found');
      }

      console.log('✅ Fetched proforma:', proformaId);
      return result.data as ProformaWithItems;
    },
    enabled: !!proformaId,
  });
};

// Utility function to serialize errors properly
const serializeError = (error: any): string => {
  if (!error) return 'Unknown error';
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  if (error.details) return error.details;
  if (error.hint) return error.hint;
  if (error.code) return `Database error (code: ${error.code})`;
  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return parseErrorMessage(error);
  }
};

/**
 * Hook to create a proforma invoice with items
 */
export const useCreateProforma = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ proforma, items }: { proforma: ProformaInvoice; items: ProformaItem[] }) => {
      // Validate and calculate totals
      const taxableItems: TaxableItem[] = items.map(item => ({
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_percentage: item.tax_percentage,
        tax_inclusive: item.tax_inclusive,
        discount_percentage: item.discount_percentage,
        discount_amount: item.discount_amount,
      }));

      const totals = calculateDocumentTotals(taxableItems);

      // Update proforma with calculated totals
      const proformaWithTotals = {
        ...proforma,
        subtotal: totals.subtotal,
        tax_amount: totals.tax_total,
        total_amount: totals.total_amount,
      };

      // Ensure created_by defaults to authenticated user
      let cleanProforma = { ...proformaWithTotals } as any;
      try {
        // Try to get user from Supabase auth
        const { data: userData } = await supabase.auth.getUser();
        const authUserId = userData?.user?.id || null;
        if (authUserId) {
          cleanProforma.created_by = authUserId;
        } else {
          cleanProforma.created_by = null;
        }
      } catch {
        cleanProforma.created_by = null;
      }

      // Create the proforma invoice via external API
      console.log('📋 Creating proforma via external API');
      let insertResult = await externalApiAdapter.insert('proforma_invoices', cleanProforma);
      let proformaData: any;

      // Fallback: if error includes created_by, retry without it
      if (insertResult.error) {
        const errorMsg = String(insertResult.error.message || '').toLowerCase();
        console.warn('Proforma insert failed:', errorMsg);

        if (errorMsg.includes('created_by')) {
          console.log('🔄 Retrying without created_by field');
          const { created_by, ...retryPayload } = cleanProforma;
          insertResult = await externalApiAdapter.insert('proforma_invoices', retryPayload);
        }
      }

      if (insertResult.error) {
        const errorMessage = serializeError(insertResult.error);
        console.error('❌ Failed to create proforma:', errorMessage);
        throw new Error(`Failed to create proforma: ${errorMessage}`);
      }

      proformaData = { id: insertResult.id, ...cleanProforma };
      console.log('✅ Proforma created:', proformaData.id);

      // Create the proforma items
      if (items.length > 0) {
        const proformaItemsData = items.map(item => ({
          proforma_id: proformaData.id,
          product_id: item.product_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_percentage: item.discount_percentage || 0,
          discount_amount: item.discount_amount || 0,
          tax_percentage: item.tax_percentage,
          tax_amount: item.tax_amount,
          tax_inclusive: item.tax_inclusive,
          line_total: item.line_total,
        }));

        console.log('📦 Creating proforma items');
        let itemsInsertResult = await externalApiAdapter.insertMany('proforma_items', proformaItemsData);

        // Fallback: if error, retry with reduced fields
        if (itemsInsertResult.error) {
          const errorMsg = String(itemsInsertResult.error.message || '').toLowerCase();
          console.warn('Proforma items insert failed:', errorMsg);

          let proformaItemsReduced = items.map((item, index) => ({
            proforma_id: proformaData.id,
            product_id: item.product_id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_percentage: item.discount_percentage || 0,
            line_total: item.line_total,
            sort_order: index + 1,
          }));

          // If discount_percentage column is missing, remove it too
          if (errorMsg.includes('discount_percentage')) {
            proformaItemsReduced = proformaItemsReduced.map(({ discount_percentage, ...rest }) => rest as any);
          }

          console.log('🔄 Retrying with reduced fields');
          itemsInsertResult = await externalApiAdapter.insertMany('proforma_items', proformaItemsReduced);
        }

        if (itemsInsertResult.error) {
          const retryMessage = serializeError(itemsInsertResult.error);
          console.error('❌ Failed to create proforma items:', retryMessage);
          // Try to delete the proforma if items creation failed
          await externalApiAdapter.delete('proforma_invoices', proformaData.id);
          throw new Error(`Failed to create proforma items: ${retryMessage}`);
        }

        console.log('✅ Proforma items created');
      }

      return proformaData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['proforma_invoices'] });
      toast.success(`Proforma invoice ${data.proforma_number} created successfully!`);
    },
    onError: (error) => {
      const errorMessage = serializeError(error);
      console.error('Error creating proforma:', errorMessage);
      toast.error(`Error creating proforma: ${errorMessage}`);
    },
  });
};

/**
 * Hook to update a proforma invoice
 */
export const useUpdateProforma = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      proformaId, 
      proforma, 
      items 
    }: { 
      proformaId: string; 
      proforma: Partial<ProformaInvoice>; 
      items?: ProformaItem[] 
    }) => {
      // If items are provided, recalculate totals
      if (items) {
        const taxableItems: TaxableItem[] = items.map(item => ({
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_percentage: item.tax_percentage,
          tax_inclusive: item.tax_inclusive,
          discount_percentage: item.discount_percentage,
          discount_amount: item.discount_amount,
        }));

        const totals = calculateDocumentTotals(taxableItems);

        // Update proforma with calculated totals
        proforma = {
          ...proforma,
          subtotal: totals.subtotal,
          tax_amount: totals.tax_total,
          total_amount: totals.total_amount,
        };
      }

      // Update the proforma invoice via external API
      console.log('📝 Updating proforma via external API:', proformaId);
      const updateResult = await externalApiAdapter.update('proforma_invoices', proformaId, proforma);

      if (updateResult.error) {
        const errorMessage = serializeError(updateResult.error);
        console.error('❌ Error updating proforma:', errorMessage);
        throw new Error(`Failed to update proforma: ${errorMessage}`);
      }

      console.log('✅ Proforma updated');

      // Fetch the updated proforma data
      const selectResult = await externalApiAdapter.selectOne('proforma_invoices', proformaId);
      if (selectResult.error) {
        console.warn('⚠️ Could not fetch updated proforma:', selectResult.error);
      }
      const proformaData = selectResult.data;

      // Update items if provided
      if (items) {
        // Delete existing items
        console.log('🗑️ Deleting existing proforma items');
        const deleteResult = await externalApiAdapter.deleteMany('proforma_items', { proforma_id: proformaId });

        if (deleteResult.error) {
          const errorMessage = serializeError(deleteResult.error);
          console.error('❌ Error deleting existing proforma items:', errorMessage);
          throw new Error(`Failed to delete existing proforma items: ${errorMessage}`);
        }

        console.log('✅ Existing items deleted');

        // Insert new items
        if (items.length > 0) {
          const proformaItems = items.map(item => ({
            proforma_id: proformaId,
            product_id: item.product_id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            tax_percentage: item.tax_percentage,
            tax_amount: item.tax_amount,
            tax_inclusive: item.tax_inclusive,
            line_total: item.line_total,
          }));

          console.log('📦 Creating new proforma items');
          const itemsInsertResult = await externalApiAdapter.insertMany('proforma_items', proformaItems);

          if (itemsInsertResult.error) {
            const errorMessage = serializeError(itemsInsertResult.error);
            console.error('❌ Error creating updated proforma items:', errorMessage);
            throw new Error(`Failed to create updated proforma items: ${errorMessage}`);
          }

          console.log('✅ New items created');
        }
      }

      return proformaData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['proforma_invoices'] });
      queryClient.invalidateQueries({ queryKey: ['proforma_invoice', data.id] });
      toast.success(`Proforma invoice ${data.proforma_number} updated successfully!`);
    },
    onError: (error) => {
      const errorMessage = serializeError(error);
      console.error('Error updating proforma:', errorMessage);
      toast.error(`Error updating proforma: ${errorMessage}`);
    },
  });
};

/**
 * Hook to delete a proforma invoice
 */
export const useDeleteProforma = (companyId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (proformaId: string) => {
      console.log('🗑️ Starting proforma deletion via external API:', proformaId);

      // Fetch the proforma to get company ID before deletion
      let recordCompanyId: string | null = null;
      try {
        const selectResult = await externalApiAdapter.selectOne('proforma_invoices', proformaId);
        if (selectResult.error) {
          console.warn('⚠️ Could not fetch proforma before delete:', selectResult.error);
        } else if (selectResult.data) {
          recordCompanyId = (selectResult.data as any)?.company_id ?? null;
          console.log('📋 Fetched proforma company_id:', recordCompanyId);
        }
      } catch (e) {
        console.warn('⚠️ Error fetching proforma:', e);
      }

      // Delete child items first (best-effort)
      try {
        const itemsDeleteResult = await externalApiAdapter.deleteMany('proforma_items', { proforma_id: proformaId });
        if (itemsDeleteResult.error) {
          console.warn('⚠️ Error deleting proforma items:', itemsDeleteResult.error);
        } else {
          console.log('✅ Proforma items deleted');
        }
      } catch (e) {
        console.warn('Proforma items delete skipped/failed:', (e as any)?.message || e);
      }

      // Delete parent record via external API
      console.log('🔄 Deleting proforma invoice record:', proformaId);
      const deleteResult = await externalApiAdapter.delete('proforma_invoices', proformaId);

      console.log('📤 Delete response:', { error: deleteResult.error });

      if (deleteResult.error) {
        const errorMessage = serializeError(deleteResult.error);
        console.error('❌ Error deleting proforma:', errorMessage);
        throw deleteResult.error;
      }

      console.log('✅ Proforma record deleted successfully');

      // Return the company ID for use in onSuccess
      return recordCompanyId || companyId;
    },
    onSuccess: (returnedCompanyId) => {
      console.log('✅ Deletion successful, invalidating cache for company:', returnedCompanyId);

      // Invalidate both the company-specific query and the general query
      if (returnedCompanyId) {
        console.log('🔄 Invalidating query for company:', returnedCompanyId);
        queryClient.invalidateQueries({ queryKey: ['proforma_invoices', returnedCompanyId] });
      }
      console.log('🔄 Invalidating all proforma queries');
      queryClient.invalidateQueries({ queryKey: ['proforma_invoices'], exact: false });

      toast.success('Proforma invoice deleted successfully!');
    },
    onError: (error) => {
      const errorMessage = serializeError(error);
      console.error('Error deleting proforma:', errorMessage);
      toast.error(`Error deleting proforma: ${errorMessage}`);
    },
  });
};

/**
 * Hook to generate proforma number using the centralized API
 */
export const useGenerateProformaNumber = () => {
  return useMutation({
    mutationFn: async (companyId: string) => {
      // Use the centralized document number generation API
      const { generateDocumentNumberAPI } = await import('@/utils/documentNumbering');
      return generateDocumentNumberAPI('proforma');
    },
  });
};

/**
 * Hook to convert proforma to invoice
 */
export const useConvertProformaToInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (proformaId: string) => {
      // Get proforma data using external API adapter
      console.log('📋 Fetching proforma for conversion:', proformaId);
      const proformaResult = await externalApiAdapter.selectOne('proforma_invoices', proformaId);
      if (proformaResult.error) throw proformaResult.error;
      if (!proformaResult.data) throw new Error('Proforma not found');

      const proforma = proformaResult.data as any;
      console.log('✅ Proforma fetched:', proforma);

      // Get proforma items
      console.log('📦 Fetching proforma items');
      const itemsResult = await externalApiAdapter.selectBy('proforma_items', { proforma_id: proformaId });
      if (itemsResult.error) throw itemsResult.error;
      const proformaItems = itemsResult.data || [];
      console.log('✅ Proforma items fetched:', proformaItems.length);

      // Generate invoice number using centralized API
      const { generateDocumentNumberAPI } = await import('@/utils/documentNumbering');
      const invoiceNumber = await generateDocumentNumberAPI('invoice');

      // Get current user
      let createdBy: string | null = null;
      try {
        const { data: userData } = await supabase.auth.getUser();
        createdBy = userData?.user?.id || null;
      } catch {
        createdBy = null;
      }

      // Create invoice from proforma
      const invoiceData = {
        company_id: proforma.company_id,
        customer_id: proforma.customer_id,
        invoice_number: invoiceNumber,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'sent',
        subtotal: proforma.subtotal,
        tax_amount: proforma.tax_amount,
        total_amount: proforma.total_amount,
        created_by: createdBy
      };

      // Create invoice using external API adapter
      console.log('📝 Creating invoice from proforma');
      const invoiceInsertResult = await externalApiAdapter.insert('invoices', invoiceData);
      if (invoiceInsertResult.error) {
        // Fallback: if FK violation on created_by, retry with created_by = null
        if (String(invoiceInsertResult.error.message || '').includes('created_by')) {
          console.log('🔄 Retrying without created_by');
          const retryPayload = { ...invoiceData, created_by: null };
          const retryResult = await externalApiAdapter.insert('invoices', retryPayload);
          if (retryResult.error) throw retryResult.error;
          if (!retryResult.id) throw new Error('Failed to create invoice: no ID returned');
        } else {
          throw invoiceInsertResult.error;
        }
      }

      if (!invoiceInsertResult.id) throw new Error('Failed to create invoice: no ID returned');

      console.log('✅ Invoice created:', invoiceInsertResult.id);

      // Fetch the created invoice
      const invoiceSelectResult = await externalApiAdapter.selectOne('invoices', invoiceInsertResult.id);
      if (invoiceSelectResult.error) throw invoiceSelectResult.error;
      if (!invoiceSelectResult.data) throw new Error('Failed to fetch created invoice');

      const invoice = invoiceSelectResult.data as any;

      // Create invoice items from proforma items
      if (proformaItems && proformaItems.length > 0) {
        const invoiceItems = proformaItems.map((item: any, index: number) => ({
          invoice_id: invoice.id,
          product_id: item.product_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_percentage: item.tax_percentage,
          tax_amount: item.tax_amount,
          tax_inclusive: item.tax_inclusive,
          line_total: item.line_total,
          sort_order: item.sort_order || index + 1
        }));

        console.log('📦 Creating invoice items');
        const itemsInsertResult = await externalApiAdapter.insertMany('invoice_items', invoiceItems);
        if (itemsInsertResult.error) throw itemsInsertResult.error;

        console.log('✅ Invoice items created');

        // Create stock movements
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
            notes: `Stock reduction for invoice ${invoice.invoice_number} (converted from proforma ${proforma.proforma_number})`
          }));

        if (stockMovements.length > 0) {
          console.log('📦 Creating stock movements');
          const movementsInsertResult = await externalApiAdapter.insertMany('stock_movements', stockMovements);
          if (movementsInsertResult.error) {
            console.warn('⚠️ Failed to create stock movements:', movementsInsertResult.error);
          } else {
            console.log('✅ Stock movements created');
          }
        }
      }

      // Update proforma status to converted
      console.log('📝 Updating proforma status to converted');
      const updateResult = await externalApiAdapter.update('proforma_invoices', proformaId, { status: 'converted' });
      if (updateResult.error) {
        console.warn('⚠️ Failed to update proforma status:', updateResult.error);
      } else {
        console.log('✅ Proforma status updated');
      }

      return invoice;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['proforma_invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock_movements'] });
      toast.success(`Proforma invoice converted to invoice ${data.invoice_number}!`);
    },
    onError: (error) => {
      const errorMessage = serializeError(error);
      console.error('Error converting proforma to invoice:', errorMessage);
      toast.error(`Error converting proforma: ${errorMessage}`);
    },
  });
};

/**
 * Hook to update proforma status
 */
export const useUpdateProformaStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ proformaId, status, notes }: { proformaId: string; status: ProformaInvoice['status']; notes?: string }) => {
      const updateData: any = { status };

      if (notes) {
        // Append note to existing notes
        console.log('📋 Fetching current proforma notes');
        const currentResult = await externalApiAdapter.selectOne('proforma_invoices', proformaId);

        if (currentResult.error) {
          console.warn('⚠️ Could not fetch current proforma:', currentResult.error);
        } else if (currentResult.data) {
          const currentProforma = currentResult.data as any;
          if (currentProforma?.notes) {
            updateData.notes = `${currentProforma.notes}\n[${new Date().toLocaleString()}] Status changed to ${status}: ${notes}`;
          } else {
            updateData.notes = `[${new Date().toLocaleString()}] Status changed to ${status}: ${notes}`;
          }
        }
      }

      console.log('📝 Updating proforma status:', { proformaId, status });
      const updateResult = await externalApiAdapter.update('proforma_invoices', proformaId, updateData);

      if (updateResult.error) {
        console.error('❌ Error updating proforma status:', updateResult.error);
        throw updateResult.error;
      }

      console.log('✅ Proforma status updated');

      // Fetch the updated record
      const selectResult = await externalApiAdapter.selectOne('proforma_invoices', proformaId);
      if (selectResult.error) {
        console.warn('⚠️ Could not fetch updated proforma:', selectResult.error);
        return null;
      }

      return selectResult.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['proforma_invoices'] });
      queryClient.invalidateQueries({ queryKey: ['proforma_invoice', variables.proformaId] });

      const statusLabels: Record<string, string> = {
        'draft': 'Draft',
        'sent': 'Sent',
        'accepted': 'Accepted',
        'expired': 'Expired',
        'converted': 'Converted to Invoice',
      };

      toast.success(`Proforma status changed to ${statusLabels[variables.status] || variables.status}`);
    },
    onError: (error) => {
      const errorMessage = serializeError(error);
      console.error('Error updating proforma status:', errorMessage);
      toast.error(`Failed to update status: ${errorMessage}`);
    },
  });
};
