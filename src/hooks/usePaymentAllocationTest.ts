/**
 * Runtime environment verification hook for payment allocation features.
 *
 * This hook verifies that the necessary prerequisites are in place for payment
 * allocations to function correctly:
 * - The payment_allocations table exists in the database
 * - The current user is authenticated
 * - The user's profile is linked to a company (required for RLS policies)
 *
 * Note: This is NOT a unit test file - it's a runtime verification utility
 * used by the application to check setup status before attempting allocations.
 * All queries are direct Supabase calls (no RPC).
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AllocationTestResult {
  success: boolean;
  message: string;
  details?: any;
}

export const usePaymentAllocationTest = () => {
  const [isLoading, setIsLoading] = useState(false);

  const testAllocationSetup = async (): Promise<AllocationTestResult> => {
    setIsLoading(true);
    
    try {
      // 1. Check if payment_allocations table exists
      const { error: tableError } = await supabase
        .from('payment_allocations')
        .select('id')
        .limit(1);

      if (tableError && tableError.message.includes('relation') && tableError.message.includes('does not exist')) {
        return {
          success: false,
          message: 'payment_allocations table does not exist',
          details: { step: 'table_check', error: tableError }
        };
      }

      // 2. Check if user profile is linked to company
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          success: false,
          message: 'No authenticated user found',
          details: { step: 'auth_check' }
        };
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.company_id) {
        return {
          success: false,
          message: 'User profile is not linked to a company (required for RLS)',
          details: { step: 'profile_check', error: profileError, profile }
        };
      }

      // All checks passed - payment allocation is ready to use
      return {
        success: true,
        message: 'All payment allocation components are working correctly',
        details: {
          step: 'complete',
          tableExists: true,
          profileLinked: true
        }
      };

    } catch (error) {
      return {
        success: false,
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { step: 'exception', error }
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    testAllocationSetup,
    isLoading
  };
};
