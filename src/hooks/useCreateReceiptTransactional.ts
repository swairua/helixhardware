/**
 * Transaction-safe receipt creation hook
 * Uses the PHP backend endpoint to ensure atomic operations
 * All operations (invoice, payment, items, receipt) are created in a single transaction
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { parseErrorMessageWithCodes } from '@/utils/errorHelpers';

export interface TransactionalReceiptInput {
  company_id: string;
  customer_id: string;
  payment: {
    amount: number;
    payment_date?: string;
    payment_method?: string;
    payment_number?: string;
    reference_number?: string;
    notes?: string;
  };
  invoice?: {
    invoice_number?: string;
    total_amount?: number;
  };
  items?: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    tax_percentage?: number;
    tax_amount?: number;
    product_id?: string;
  }>;
}

export interface ReceiptTransactionResult {
  receipt: any;
  payment: any;
  invoice: any;
  allocation: any;
  excess_amount: number;
}

/**
 * Hook to create receipt with items using transaction-safe PHP endpoint
 * Ensures all operations are atomic - either all succeed or all rollback
 */
export const useCreateReceiptTransactional = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TransactionalReceiptInput) => {
      // Get the backend API URL from environment
      const backendUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001/backend';

      // Prepare request payload
      const payload = {
        action: 'create_receipt_with_items_transaction',
        company_id: input.company_id,
        customer_id: input.customer_id,
        payment: input.payment,
        invoice: input.invoice || {},
        items: input.items || []
      };

      try {
        // Make the request to the PHP backend
        const response = await fetch(backendUrl + '/api.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            // Include authorization header if available from localStorage
            ...(localStorage.getItem('med_api_token') && {
              'Authorization': `Bearer ${localStorage.getItem('med_api_token')}`
            })
          },
          body: JSON.stringify(payload)
        });

        const responseData = await response.json();

        // Handle API errors
        if (!response.ok || responseData.status === 'error') {
          throw new Error(responseData.message || 'Failed to create receipt');
        }

        // Validate response structure
        if (!responseData.data || !responseData.data.receipt) {
          throw new Error('Invalid response structure from server');
        }

        return responseData.data as ReceiptTransactionResult;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Receipt creation transaction error:', errorMessage);
        throw new Error(errorMessage);
      }
    },
    onSuccess: (data) => {
      // Invalidate all related query caches
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice_items'] });
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['payment_allocations'] });
      queryClient.invalidateQueries({ queryKey: ['directReceipts'] });

      // Show success message
      const receiptNumber = data.receipt?.receipt_number || 'Receipt';
      const invoiceNumber = data.invoice?.invoice_number || '';
      const message = invoiceNumber
        ? `${receiptNumber} created successfully with invoice ${invoiceNumber}`
        : `${receiptNumber} created successfully`;

      toast.success(message);
    },
    onError: (error) => {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to create receipt';

      console.error('Receipt creation error:', errorMessage);
      toast.error(`Receipt creation failed: ${errorMessage}`);
    }
  });
};

/**
 * Hook to handle receipt creation errors with detailed diagnostics
 */
export const useHandleReceiptError = () => {
  return (error: Error, context?: { receiptNumber?: string; invoiceNumber?: string }) => {
    const message = error.message;

    // Provide helpful error messages based on error type
    let userMessage = 'Failed to create receipt';
    let technicalDetails = message;

    if (message.includes('invoice')) {
      userMessage = 'Failed to create invoice for receipt';
    } else if (message.includes('payment')) {
      userMessage = 'Failed to record payment';
    } else if (message.includes('transaction')) {
      userMessage = 'Database transaction failed - all changes were rolled back';
    } else if (message.includes('authorization') || message.includes('permission')) {
      userMessage = 'You do not have permission to create receipts';
    } else if (message.includes('connection') || message.includes('network')) {
      userMessage = 'Connection error - please check your internet connection';
    }

    return {
      userMessage,
      technicalDetails,
      fullMessage: `${userMessage}: ${technicalDetails}`
    };
  };
};
