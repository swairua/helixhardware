import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getDatabase } from '@/integrations/database';
import { toast } from 'sonner';
import { parseErrorMessageWithCodes } from '@/utils/errorHelpers';

export interface CreditBalanceInput {
  companyId: string;
  customerId: string;
  creditAmount: number;
  sourceReceiptId: string;
  sourcePaymentId?: string;
  appliedInvoiceId?: string;
  notes?: string;
}

export interface CreditBalanceUpdateInput {
  status?: 'available' | 'applied' | 'expired';
  appliedInvoiceId?: string;
  expiresAt?: string;
  notes?: string;
}

/**
 * Hook to create a customer credit balance from excess payment
 */
export const useCreateCreditBalance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreditBalanceInput) => {
      const db = getDatabase();

      const creditData = {
        company_id: input.companyId,
        customer_id: input.customerId,
        credit_amount: input.creditAmount,
        source_receipt_id: input.sourceReceiptId,
        source_payment_id: input.sourcePaymentId || null,
        applied_invoice_id: input.appliedInvoiceId || null,
        status: 'available',
        notes: input.notes || null
      };

      const result = await db.insert('customer_credit_balances', creditData);
      if (result.error) throw result.error;
      if (!result.id) throw new Error('Failed to create credit balance: no ID returned');

      // Fetch the created credit balance
      const selectResult = await db.selectOne('customer_credit_balances', result.id);
      if (selectResult.error) throw selectResult.error;
      if (!selectResult.data) throw new Error('Failed to fetch created credit balance');

      return selectResult.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer_credit_balances'] });
      toast.success('Customer credit balance created successfully');
    },
    onError: (error) => {
      const errorMessage = parseErrorMessageWithCodes(error, 'create credit balance');
      console.error('Error creating credit balance:', errorMessage);
      toast.error(`Failed to create credit balance: ${errorMessage}`);
    }
  });
};

/**
 * Hook to fetch customer credit balances
 */
export const useCustomerCreditBalances = (customerId: string | null, companyId: string | null) => {
  const db = getDatabase();
  const [balances, setBalances] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!customerId || !companyId) return;

    const fetchBalances = async () => {
      setIsLoading(true);
      try {
        const result = await db.select('customer_credit_balances', {
          customer_id: customerId,
          company_id: companyId,
          status: 'available'
        });
        if (result.error) throw result.error;
        setBalances(Array.isArray(result.data) ? result.data : []);
        setError(null);
      } catch (err) {
        setError(err as Error);
        setBalances([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalances();
  }, [customerId, companyId, db]);

  // Calculate total available credit
  const totalAvailableCredit = balances.reduce((sum, balance) => sum + (balance.credit_amount || 0), 0);

  return { balances, totalAvailableCredit, isLoading, error };
};

/**
 * Hook to fetch all credit balances for a company
 */
export const useCompanyCreditBalances = (companyId: string | null) => {
  const db = getDatabase();
  const [balances, setBalances] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!companyId) return;

    const fetchBalances = async () => {
      setIsLoading(true);
      try {
        const result = await db.select('customer_credit_balances', {
          company_id: companyId
        });
        if (result.error) throw result.error;
        setBalances(Array.isArray(result.data) ? result.data : []);
        setError(null);
      } catch (err) {
        setError(err as Error);
        setBalances([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalances();
  }, [companyId, db]);

  return { balances, isLoading, error };
};

/**
 * Hook to update a credit balance
 * Used when credit is applied to an invoice
 */
export const useUpdateCreditBalance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { creditBalanceId: string; data: CreditBalanceUpdateInput }) => {
      const db = getDatabase();

      const updateData: any = {};
      if (input.data.status) updateData.status = input.data.status;
      if (input.data.appliedInvoiceId) updateData.applied_invoice_id = input.data.appliedInvoiceId;
      if (input.data.expiresAt) updateData.expires_at = input.data.expiresAt;
      if (input.data.notes) updateData.notes = input.data.notes;

      const result = await db.update('customer_credit_balances', input.creditBalanceId, updateData);
      if (result.error) throw result.error;

      // Fetch updated balance
      const selectResult = await db.selectOne('customer_credit_balances', input.creditBalanceId);
      if (selectResult.error) throw selectResult.error;
      if (!selectResult.data) throw new Error('Failed to fetch updated credit balance');

      return selectResult.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer_credit_balances'] });
      toast.success('Credit balance updated successfully');
    },
    onError: (error) => {
      const errorMessage = parseErrorMessageWithCodes(error, 'update credit balance');
      toast.error(`Failed to update credit balance: ${errorMessage}`);
    }
  });
};

/**
 * Hook to delete a credit balance
 */
export const useDeleteCreditBalance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (creditBalanceId: string) => {
      const db = getDatabase();
      const result = await db.delete('customer_credit_balances', creditBalanceId);
      if (result.error) throw result.error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer_credit_balances'] });
      toast.success('Credit balance deleted successfully');
    },
    onError: (error) => {
      const errorMessage = parseErrorMessageWithCodes(error, 'delete credit balance');
      toast.error(`Failed to delete credit balance: ${errorMessage}`);
    }
  });
};
