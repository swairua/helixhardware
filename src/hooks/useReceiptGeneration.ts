import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getDatabase } from '@/integrations/database';
import { toast } from 'sonner';
import { parseErrorMessageWithCodes } from '@/utils/errorHelpers';
import { generateReceiptNumber } from '@/utils/documentNumbering';

export interface ReceiptGenerationInput {
  companyId: string;
  paymentId: string;
  invoiceId: string;
  totalAmount: number;
  excessAmount?: number;
  excessHandling?: 'credit_balance' | 'change_note' | 'pending';
  changeNoteId?: string;
  receiptType?: 'direct_receipt' | 'payment_against_invoice';
  notes?: string;
  createdBy?: string;
}

/**
 * Hook to generate receipt number in format REC-YYYY-NNNN
 * Uses centralized number generation utility (API-based)
 */
export const useGenerateReceiptNumber = () => {
  return useMutation({
    mutationFn: (companyId: string) => generateReceiptNumber(companyId)
  });
};

/**
 * Hook to create a receipt record
 * Called after payment is created, links payment to invoice with receipt details
 */
export const useCreateReceipt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ReceiptGenerationInput) => {
      const db = getDatabase();

      // Generate receipt number using centralized utility (now async)
      const receiptNumber = await generateReceiptNumber(input.companyId);
      const receiptDate = new Date().toISOString().split('T')[0];

      // Create receipt record
      const receiptData = {
        company_id: input.companyId,
        payment_id: input.paymentId,
        invoice_id: input.invoiceId,
        receipt_number: receiptNumber,
        receipt_date: receiptDate,
        receipt_type: input.receiptType || 'payment_against_invoice',
        total_amount: input.totalAmount,
        excess_amount: input.excessAmount || 0,
        excess_handling: input.excessHandling || 'pending',
        change_note_id: input.changeNoteId || null,
        notes: input.notes || null,
        created_by: input.createdBy || null
      };

      const result = await db.insert('receipts', receiptData);
      if (result.error) throw result.error;
      if (!result.id) throw new Error('Failed to create receipt: no ID returned');

      // Fetch the created receipt
      const selectResult = await db.selectOne('receipts', result.id);
      if (selectResult.error) throw selectResult.error;
      if (!selectResult.data) throw new Error('Failed to fetch created receipt');

      return selectResult.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      toast.success(`Receipt ${(data as any).receipt_number} created successfully`);
    },
    onError: (error) => {
      const errorMessage = parseErrorMessageWithCodes(error, 'create receipt');
      console.error('Error creating receipt:', errorMessage);
      toast.error(`Failed to create receipt: ${errorMessage}`);
    }
  });
};

/**
 * Hook to fetch a single receipt
 */
export const useGetReceipt = (receiptId: string | null) => {
  const db = getDatabase();
  const [receipt, setReceipt] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!receiptId) return;

    const fetchReceipt = async () => {
      setIsLoading(true);
      try {
        const result = await db.selectOne('receipts', receiptId);
        if (result.error) throw result.error;
        setReceipt(result.data);
        setError(null);
      } catch (err) {
        setError(err as Error);
        setReceipt(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReceipt();
  }, [receiptId, db]);

  return { receipt, isLoading, error };
};

/**
 * Hook to fetch all receipts for a company
 */
export const useReceipts = (companyId: string | null) => {
  const db = getDatabase();
  const [receipts, setReceipts] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!companyId) return;

    const fetchReceipts = async () => {
      setIsLoading(true);
      try {
        const result = await db.select('receipts', { company_id: companyId });
        if (result.error) throw result.error;
        setReceipts(Array.isArray(result.data) ? result.data : []);
        setError(null);
      } catch (err) {
        setError(err as Error);
        setReceipts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReceipts();
  }, [companyId, db]);

  return { receipts, isLoading, error };
};

/**
 * Hook to update a receipt
 */
export const useUpdateReceipt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { receiptId: string; data: Partial<ReceiptGenerationInput> }) => {
      const db = getDatabase();

      const updateData = {
        ...(input.data.excessHandling && { excess_handling: input.data.excessHandling }),
        ...(input.data.changeNoteId && { change_note_id: input.data.changeNoteId }),
        ...(input.data.notes && { notes: input.data.notes })
      };

      const result = await db.update('receipts', input.receiptId, updateData);
      if (result.error) throw result.error;

      // Fetch updated receipt
      const selectResult = await db.selectOne('receipts', input.receiptId);
      if (selectResult.error) throw selectResult.error;
      if (!selectResult.data) throw new Error('Failed to fetch updated receipt');

      return selectResult.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      toast.success('Receipt updated successfully');
    },
    onError: (error) => {
      const errorMessage = parseErrorMessageWithCodes(error, 'update receipt');
      toast.error(`Failed to update receipt: ${errorMessage}`);
    }
  });
};
