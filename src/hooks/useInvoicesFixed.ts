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
        // Normalize customer IDs to strings for consistent lookup
        const rawCustomerIds = invoices.map((invoice: any) => invoice.customer_id).filter(id => id);
        console.log('[useInvoicesFixed] Raw customer IDs found:', rawCustomerIds);
        console.log('[useInvoicesFixed] Raw customer ID types:', rawCustomerIds.map(id => ({ id, type: typeof id })));

        const customerIds = [...new Set(rawCustomerIds.map(id => String(id)))];
        console.log('[useInvoicesFixed] Normalized unique customer IDs:', customerIds.length, customerIds);

        let customerMap = new Map();

        if (customerIds.length > 0) {
          try {
            // Fetch all customers at once to improve performance
            console.log('[useInvoicesFixed] Fetching all customers...');
            const { data: allCustomers, error: customersError } = await apiClient.select('customers', {});

            if (customersError) {
              console.warn('[useInvoicesFixed] Error fetching customers:', customersError);
            } else if (Array.isArray(allCustomers)) {
              console.log('[useInvoicesFixed] Fetched', allCustomers.length, 'customers from API');

              // Create a map of all customers by ID
              allCustomers.forEach((customer: any) => {
                const customerId = String(customer.id);
                customerMap.set(customerId, customer);
                console.log(`[useInvoicesFixed] Mapped customer: ${customerId} -> ${customer.name}`);
              });

              console.log('[useInvoicesFixed] Customer map created with', customerMap.size, 'entries');

              // Log missing customers
              const missingCustomers = customerIds.filter(id => !customerMap.has(id));
              if (missingCustomers.length > 0) {
                console.warn('[useInvoicesFixed] Warning: These customer IDs were not found:', missingCustomers);
              }
            }
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

        // Combine data - Normalize customer ID lookup to string
        const enrichedInvoices = invoices.map((invoice: any) => {
          // Normalize customer ID to string for consistent lookup
          const normalizedCustomerId = String(invoice.customer_id);
          const customer = customerMap.get(normalizedCustomerId);

          console.log(`[useInvoicesFixed] Enriching invoice ${invoice.invoice_number}:`, {
            customerId: invoice.customer_id,
            normalizedId: normalizedCustomerId,
            customerFound: !!customer,
            customerName: customer?.name || 'Unknown Customer'
          });

          return {
            ...invoice,
            customers: customer || {
              name: 'Unknown Customer',
              email: null,
              phone: null
            },
            invoice_items: itemsMap.get(invoice.id) || []
          };
        });

        console.log('[useInvoicesFixed] Enrichment complete - Invoices with items:', enrichedInvoices.filter((inv: any) => inv.invoice_items.length > 0).length);
        console.log('[useInvoicesFixed] Final enriched invoices:', enrichedInvoices.map((inv: any) => ({ number: inv.invoice_number, customer: inv.customers?.name })));
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
        console.log('🗑️ Starting invoice deletion for ID:', invoiceId);

        // Step 1: Delete invoice items first (due to foreign key constraints)
        console.log('📋 Deleting invoice items...');
        const { data: invoiceItems, error: fetchItemsError } = await apiClient.select('invoice_items', {
          invoice_id: invoiceId
        });

        if (fetchItemsError) {
          console.warn('⚠️ Warning: Could not fetch invoice items for deletion, continuing anyway:', fetchItemsError);
        } else if (Array.isArray(invoiceItems) && invoiceItems.length > 0) {
          // Delete each invoice item
          for (const item of invoiceItems) {
            const deleteResult = await apiClient.delete('invoice_items', item.id);
            if (deleteResult.error) {
              console.warn('⚠️ Warning: Failed to delete invoice item:', item.id, deleteResult.error);
            }
          }
          console.log('✅ Invoice items deleted');
        }

        // Step 2: Delete payment allocations
        console.log('💰 Deleting payment allocations...');
        const { data: allocations, error: fetchAllocationsError } = await apiClient.select('payment_allocations', {
          invoice_id: invoiceId
        });

        if (fetchAllocationsError) {
          console.warn('⚠️ Warning: Could not fetch payment allocations, continuing anyway:', fetchAllocationsError);
        } else if (Array.isArray(allocations) && allocations.length > 0) {
          for (const allocation of allocations) {
            const deleteResult = await apiClient.delete('payment_allocations', allocation.id);
            if (deleteResult.error) {
              console.warn('⚠️ Warning: Failed to delete payment allocation:', allocation.id, deleteResult.error);
            }
          }
          console.log('✅ Payment allocations deleted');
        }

        // Step 3: Finally, delete the invoice itself
        console.log('🗑️ Deleting invoice...');
        const deleteResult = await apiClient.delete('invoices', invoiceId);

        if (deleteResult.error) {
          console.error('❌ Error deleting invoice:', deleteResult.error);
          throw deleteResult.error;
        }

        console.log('✅ Invoice deleted successfully');
        return { success: true, invoiceId };
      } catch (error) {
        console.error('❌ Error deleting invoice:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('🎉 Invalidating invoices cache');
      queryClient.invalidateQueries({ queryKey: ['invoices_fixed'] });
      toast.success('Invoice deleted successfully!');
    },
    onError: (error) => {
      console.error('❌ Invoice deletion error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to delete invoice: ${errorMessage}`);
    },
  });
};
