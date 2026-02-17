import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/integrations/api';
import { toast } from 'sonner';

/**
 * Fixed hook for fetching invoices with customer data
 * Uses the external API adapter for database operations
 */
export const useInvoicesFixed = (companyId?: string) => {
  return useQuery({
    queryKey: ['invoices_fixed', companyId],
    queryFn: async () => {
      if (!companyId) {
        console.log('[useInvoicesFixed] No companyId provided, returning empty array');
        return [];
      }

      try {
        console.log('[useInvoicesFixed] Starting fetch for companyId:', companyId);

        // Fetch invoices using the external API adapter
        console.log('[useInvoicesFixed] Calling apiClient.select("invoices", {company_id:', companyId, '})');
        const { data: invoices, error: invoicesError } = await apiClient.select('invoices', {
          company_id: companyId
        });

        console.log('[useInvoicesFixed] API response - Error:', invoicesError);
        console.log('[useInvoicesFixed] API response - Data type:', typeof invoices, 'Is Array:', Array.isArray(invoices));
        console.log('[useInvoicesFixed] API response - Data length:', Array.isArray(invoices) ? invoices.length : 'N/A');
        console.log('[useInvoicesFixed] Raw API response:', invoices);

        if (invoicesError) {
          console.error('[useInvoicesFixed] Error fetching invoices:', invoicesError);
          throw new Error(`Failed to fetch invoices: ${invoicesError.message}`);
        }

        if (!Array.isArray(invoices)) {
          console.log('[useInvoicesFixed] Invoices is not an array, returning empty');
          return [];
        }

        if (!invoices || invoices.length === 0) {
          console.log('[useInvoicesFixed] No invoices returned from API');
          return [];
        }

        console.log('[useInvoicesFixed] Invoices fetched successfully, count:', invoices.length);
        console.log('[useInvoicesFixed] First invoice sample:', invoices[0]);

        // Try to fetch customer data
        const customerIds = [...new Set(invoices.map((invoice: any) => invoice.customer_id).filter(id => id && typeof id === 'string'))];
        console.log('[useInvoicesFixed] Unique customer IDs found:', customerIds.length, customerIds);

        let customerMap = new Map();

        if (customerIds.length > 0) {
          try {
            // Fetch customers
            for (const customerId of customerIds) {
              const { data: customer, error: customerError } = await apiClient.selectOne('customers', customerId);
              console.log(`[useInvoicesFixed] Fetched customer ${customerId} - Error:`, customerError, 'Data:', customer);
              if (!customerError && customer) {
                customerMap.set(customerId, customer);
              }
            }
            console.log('[useInvoicesFixed] Customer map size after fetching:', customerMap.size);
          } catch (e) {
            console.warn('[useInvoicesFixed] Could not fetch customer details (non-fatal):', e);
          }
        }

        // Try to fetch invoice items
        let itemsMap = new Map();
        let invoiceIds = invoices.map((inv: any) => inv.id);
        console.log('[useInvoicesFixed] Invoice IDs to fetch items for:', invoiceIds.length, invoiceIds.slice(0, 5));

        if (invoiceIds.length > 0) {
          try {
            // Fetch invoice items for all invoices
            console.log('[useInvoicesFixed] Fetching invoice_items with filter: {}');
            const { data: allItems, error: itemsError } = await apiClient.select('invoice_items', {});

            console.log('[useInvoicesFixed] All items API response - Error:', itemsError);
            console.log('[useInvoicesFixed] All items API response - Count:', Array.isArray(allItems) ? allItems.length : 'Not an array');
            console.log('[useInvoicesFixed] All items sample:', Array.isArray(allItems) ? allItems.slice(0, 3) : allItems);

            if (!itemsError && Array.isArray(allItems)) {
              // Filter items for our invoices
              const relevantItems = allItems.filter((item: any) => invoiceIds.includes(item.invoice_id));
              console.log('[useInvoicesFixed] Filtered relevant items count:', relevantItems.length);

              // Group by invoice_id
              relevantItems.forEach((item: any) => {
                if (!itemsMap.has(item.invoice_id)) {
                  itemsMap.set(item.invoice_id, []);
                }
                itemsMap.get(item.invoice_id).push(item);
              });
              console.log('[useInvoicesFixed] Items map size (invoices with items):', itemsMap.size);
            }
          } catch (e) {
            console.warn('[useInvoicesFixed] Could not fetch invoice items (non-fatal):', e);
          }
        }

        // Combine data
        const enrichedInvoices = invoices.map((invoice: any) => ({
          ...invoice,
          customers: customerMap.get(invoice.customer_id) || {
            name: 'Unknown Customer',
            email: null,
            phone: null
          },
          invoice_items: itemsMap.get(invoice.id) || []
        }));

        console.log('[useInvoicesFixed] Enrichment complete - Invoices with items:', enrichedInvoices.filter((inv: any) => inv.invoice_items.length > 0).length);
        console.log('[useInvoicesFixed] Final enriched invoices sample:', enrichedInvoices.slice(0, 2));
        return enrichedInvoices;

      } catch (error) {
        console.error('[useInvoicesFixed] Fatal error in useInvoicesFixed:', error);
        console.error('[useInvoicesFixed] Error details:', {
          message: (error as any)?.message,
          stack: (error as any)?.stack,
          error
        });
        throw error;
      }
    },
    enabled: !!companyId,
    staleTime: 30000, // Cache for 30 seconds
    retry: 1,
    retryDelay: 1000,
  });
};

/**
 * Hook for fetching customer invoices (for a specific customer)
 */
export const useCustomerInvoicesFixed = (customerId?: string, companyId?: string) => {
  return useQuery({
    queryKey: ['customer_invoices_fixed', customerId, companyId],
    queryFn: async () => {
      if (!customerId) return [];

      try {
        console.log('Fetching invoices for customer:', customerId);

        // Fetch invoices for the customer using the external API adapter
        const { data: invoices, error: invoicesError } = await apiClient.select('invoices', {
          customer_id: customerId,
          ...(companyId && { company_id: companyId })
        });

        if (invoicesError) {
          console.error('Error fetching customer invoices:', invoicesError);
          throw new Error(`Failed to fetch customer invoices: ${invoicesError.message}`);
        }

        if (!Array.isArray(invoices) || !invoices || invoices.length === 0) {
          return [];
        }

        // Fetch customer data
        let customer = null;
        try {
          const { data: customerData, error: customerError } = await apiClient.selectOne('customers', customerId);
          if (!customerError && customerData) {
            customer = customerData;
          }
        } catch (e) {
          console.warn('Could not fetch customer data (non-fatal):', e);
        }

        // Fetch invoice items
        let itemsMap = new Map();
        try {
          const invoiceIds = invoices.map((inv: any) => inv.id);
          const { data: allItems, error: itemsError } = await apiClient.select('invoice_items', {});
          
          if (!itemsError && Array.isArray(allItems)) {
            const relevantItems = allItems.filter((item: any) => invoiceIds.includes(item.invoice_id));
            relevantItems.forEach((item: any) => {
              if (!itemsMap.has(item.invoice_id)) {
                itemsMap.set(item.invoice_id, []);
              }
              itemsMap.get(item.invoice_id).push(item);
            });
          }
        } catch (e) {
          console.warn('Could not fetch invoice items (non-fatal):', e);
        }

        // Combine data
        const enrichedInvoices = invoices.map((invoice: any) => ({
          ...invoice,
          customers: customer || {
            name: 'Unknown Customer',
            email: null,
            phone: null
          },
          invoice_items: itemsMap.get(invoice.id) || []
        }));

        return enrichedInvoices;

      } catch (error) {
        console.error('Error in useCustomerInvoicesFixed:', error);
        throw error;
      }
    },
    enabled: !!customerId,
    staleTime: 30000,
    retry: 1,
  });
};

// Delete an invoice with cascade (transaction-safe, deletes invoice_items, payments, payment_allocations)
export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      try {
        // Use the transaction-safe delete_invoice_with_cascade endpoint
        // This handles cascading deletion of:
        // - invoice_items
        // - payment_allocations
        // - payments
        // - invoice itself
        // All in a single database transaction
        const response = await fetch(`${process.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api.php?action=delete_invoice_with_cascade`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            invoice_id: invoiceId,
          }),
        });

        const result = await response.json();

        if (!response.ok || result.status !== 'success') {
          throw new Error(result.message || 'Failed to delete invoice');
        }

        return result;
      } catch (error) {
        console.error('Error deleting invoice:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices_fixed'] });
      toast.success('Invoice deleted successfully!');
    },
    onError: (error) => {
      console.error('Error deleting invoice:', error);
      toast.error(`Failed to delete invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });
};
