import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/integrations/api';

export interface DirectReceipt {
  id: string;
  invoice_id: string;
  payment_number: string;
  invoice_number: string;
  customers: {
    name: string;
    email?: string;
  };
  invoice_date: string;
  payment_date: string;
  total_amount: number;
  paid_amount: number;
  payment_method: string;
  reference_number?: string;
  status: 'paid' | 'partial' | 'draft';
  invoice_items?: any[];
  created_by?: string;
  created_by_profile?: { full_name?: string } | null;
}

export const useDirectReceipts = (companyId?: string) => {
  return useQuery({
    queryKey: ['directReceipts', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      try {
        // Fetch invoices using the API client
        const { data: invoices, error: invoicesError } = await apiClient.select('invoices', {
          company_id: companyId
        });

        if (invoicesError) {
          throw new Error(invoicesError.message || 'Failed to fetch invoices');
        }

        if (!Array.isArray(invoices)) {
          return [];
        }

        // Filter for receipts (invoices with 'Direct receipt' in notes)
        const receiptInvoices = invoices.filter((inv: any) =>
          inv.notes && inv.notes.includes('Direct receipt')
        );

        if (receiptInvoices.length === 0) {
          return [];
        }

        // Fetch customer, item, and payment data
        const invoiceIds = receiptInvoices.map((inv: any) => inv.id);
        const customerIds = [...new Set(receiptInvoices.map((inv: any) => inv.customer_id).filter(id => id))];

        let customerMap = new Map();
        let itemsMap = new Map();
        let paymentMap = new Map();

        // Fetch customers
        try {
          for (const customerId of customerIds) {
            const { data: customer } = await apiClient.selectOne('customers', customerId);
            if (customer) {
              customerMap.set(customerId, customer);
            }
          }
        } catch (e) {
          console.warn('Could not fetch customer details:', e);
        }

        // Fetch invoice items
        try {
          const { data: allItems } = await apiClient.select('invoice_items', {});
          if (Array.isArray(allItems)) {
            const relevantItems = allItems.filter((item: any) => invoiceIds.includes(item.invoice_id));
            relevantItems.forEach((item: any) => {
              if (!itemsMap.has(item.invoice_id)) {
                itemsMap.set(item.invoice_id, []);
              }
              itemsMap.get(item.invoice_id).push(item);
            });
          }
        } catch (e) {
          console.warn('Could not fetch invoice items:', e);
        }

        // Fetch payment data
        try {
          const { data: allPayments } = await apiClient.select('payment_allocations', {});
          const { data: payments } = await apiClient.select('payments', {});

          if (Array.isArray(allPayments) && Array.isArray(payments)) {
            const paymentsById = new Map();

            payments.forEach((p: any) => {
              paymentsById.set(p.id, p);
            });

            allPayments.forEach((allocation: any) => {
              if (invoiceIds.includes(allocation.invoice_id) && paymentsById.has(allocation.payment_id)) {
                const payment = paymentsById.get(allocation.payment_id);
                paymentMap.set(allocation.invoice_id, payment);
              }
            });
          }
        } catch (e) {
          console.warn('Could not fetch payment data:', e);
        }

        // Transform to receipts format
        const transformedReceipts: DirectReceipt[] = receiptInvoices.map((invoice: any) => {
          const payment = paymentMap.get(invoice.id);
          const customer = customerMap.get(invoice.customer_id);

          return {
            id: invoice.id,
            invoice_id: invoice.id,
            payment_number: payment?.payment_number || `REC-${invoice.id.slice(0, 8)}`,
            invoice_number: invoice.invoice_number,
            customers: customer || { name: 'Unknown Customer', email: null },
            invoice_date: invoice.invoice_date,
            payment_date: payment?.payment_date || invoice.invoice_date,
            total_amount: invoice.total_amount,
            paid_amount: invoice.paid_amount || 0,
            payment_method: payment?.payment_method || 'unknown',
            reference_number: payment?.reference_number,
            status: invoice.status,
            invoice_items: itemsMap.get(invoice.id) || [],
            created_by: invoice.created_by,
            created_by_profile: invoice.created_by_profile
          };
        });

        return transformedReceipts;
      } catch (error) {
        console.error('Error fetching direct receipts:', error);
        throw error;
      }
    },
    enabled: !!companyId,
  });
};
