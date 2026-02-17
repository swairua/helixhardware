/**
 * Hook for handling excess payment (overpayment) from receipt creation
 * Supports three handling methods:
 * - credit_balance: Credit to customer account for future purchases
 * - change_note: Create a formal credit note (refund document)
 * - pending: Mark for manual resolution (default)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getDatabase } from '@/integrations/database';
import { toast } from 'sonner';
import { parseErrorMessageWithCodes } from '@/utils/errorHelpers';
import { useCreateCreditBalance as useCreateCreditBalanceHook } from '@/hooks/useCustomerCreditBalances';
import { generateDocumentNumberAPI } from '@/utils/documentNumbering';

export interface ExcessPaymentInput {
  receiptId: string;
  companyId: string;
  customerId: string;
  invoiceId: string;
  paymentId: string;
  excessAmount: number;
  handling: 'credit_balance' | 'change_note' | 'pending';
}

export interface ExcessPaymentResult {
  handling: string;
  creditBalance?: any;
  creditNote?: any;
}

/**
 * Hook to create customer credit balance from excess payment
 * NOTE: Consolidated into a single implementation. Use the imported hook from useCustomerCreditBalances.
 * @deprecated - Import useCreateCreditBalance from useCustomerCreditBalances instead
 */
export const useCreateCreditBalance = () => {
  return useCreateCreditBalanceHook();
};

/**
 * Hook to create a formal credit note from excess payment
 * Credit notes can be printed and formally document the refund/credit
 */
export const useCreateChangeNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ExcessPaymentInput) => {
      if (input.excessAmount <= 0) {
        throw new Error('Excess amount must be greater than zero');
      }

      const db = getDatabase();

      // Generate credit note number using sequential API
      const creditNoteNumber = await generateDocumentNumberAPI('credit_note');

      const creditNoteData = {
        company_id: input.companyId,
        customer_id: input.customerId,
        invoice_id: input.invoiceId,
        credit_note_number: creditNoteNumber,
        credit_note_date: new Date().toISOString().split('T')[0],
        reason: 'Overpayment - Excess from receipt',
        amount: input.excessAmount,
        status: 'issued',
        notes: `Generated from excess payment on receipt ${input.receiptId}`
      };

      const insertResult = await db.insert('credit_notes', creditNoteData);
      if (insertResult.error) throw insertResult.error;

      // Fetch created credit note
      const selectResult = await db.selectOne('credit_notes', insertResult.id);
      if (selectResult.error) throw selectResult.error;

      const creditNote = selectResult.data;

      // Link credit note back to receipt
      const updateReceiptResult = await db.update('receipts', input.receiptId, {
        change_note_id: creditNote.id
      });
      if (updateReceiptResult.error) {
        console.warn('Failed to link credit note to receipt:', updateReceiptResult.error);
      }

      return creditNote;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['credit_notes'] });
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      toast.success(`Change note ${(data as any).credit_note_number} created for excess payment`);
    },
    onError: (error) => {
      const errorMessage = parseErrorMessageWithCodes(error, 'create change note');
      toast.error(`Failed to create change note: ${errorMessage}`);
    }
  });
};

/**
 * Hook to handle excess payment with specified handling method
 * Coordinates the creation of credit balance, change note, or pending resolution
 */
export const useHandleExcessPayment = () => {
  const createCreditBalance = useCreateCreditBalance();
  const createChangeNote = useCreateChangeNote();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ExcessPaymentInput): Promise<ExcessPaymentResult> => {
      const db = getDatabase();

      // If no excess, nothing to handle
      if (input.excessAmount <= 0) {
        return { handling: 'none' };
      }

      let result: ExcessPaymentResult = { handling: input.handling };

      try {
        switch (input.handling) {
          case 'credit_balance':
            // Create customer credit balance with correct parameter structure
            result.creditBalance = await createCreditBalance.mutateAsync({
              companyId: input.companyId,
              customerId: input.customerId,
              creditAmount: input.excessAmount,
              sourceReceiptId: input.receiptId,
              sourcePaymentId: input.paymentId,
              notes: `Created from excess payment on receipt ${input.receiptId}`
            });
            break;

          case 'change_note':
            // Create a formal credit note
            result.creditNote = await createChangeNote.mutateAsync(input);
            break;

          case 'pending':
          default:
            // Mark for manual resolution - no automatic action needed
            // The receipt's excess_handling field is already set to 'pending'
            result.handling = 'pending';
            break;
        }

        // Update receipt with the handling result
        const updateResult = await db.update('receipts', input.receiptId, {
          excess_handling: input.handling
        });

        if (updateResult.error) {
          console.warn('Failed to update receipt excess_handling:', updateResult.error);
        }
      } catch (error) {
        console.error(`Error handling excess payment (${input.handling}):`, error);
        throw error;
      }

      return result;
    },
    onSuccess: (data, input) => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['customer_credit_balances'] });
      queryClient.invalidateQueries({ queryKey: ['credit_notes'] });

      const messages: Record<string, string> = {
        credit_balance: 'Excess payment applied as customer credit',
        change_note: 'Change note created for excess payment',
        pending: 'Excess payment marked for manual resolution'
      };

      toast.success(messages[input.handling] || 'Excess payment handled');
    },
    onError: (error) => {
      const errorMessage = parseErrorMessageWithCodes(error, 'handle excess payment');
      toast.error(`Failed to handle excess payment: ${errorMessage}`);
    }
  });
};

/**
 * Hook to update receipt to mark excess as resolved
 */
export const useMarkExcessAsResolved = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { receiptId: string; handling: 'credit_balance' | 'change_note' }) => {
      const db = getDatabase();

      const updateResult = await db.update('receipts', input.receiptId, {
        excess_handling: input.handling
      });

      if (updateResult.error) throw updateResult.error;

      // Fetch updated receipt
      const selectResult = await db.selectOne('receipts', input.receiptId);
      if (selectResult.error) throw selectResult.error;

      return selectResult.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      toast.success('Excess payment handling updated');
    },
    onError: (error) => {
      const errorMessage = parseErrorMessageWithCodes(error, 'update excess handling');
      toast.error(`Failed to update excess handling: ${errorMessage}`);
    }
  });
};
