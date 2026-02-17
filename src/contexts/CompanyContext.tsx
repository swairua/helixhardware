import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useCompanies } from '@/hooks/useDatabase';

interface CompanyContextType {
  currentCompany: any | null;
  isLoading: boolean;
  error: Error | null;
  isReady: boolean;
}

export const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { data: companies, isLoading, error } = useCompanies();
  const [isReady, setIsReady] = useState(false);
  const [loadTimeout, setLoadTimeout] = useState(false);

  const currentCompany = companies?.[0] || null;

  // Set isReady when loading is complete and we have company data or error
  useEffect(() => {
    if (!isLoading) {
      setIsReady(true);

      // Log warnings if company is not found
      if (!currentCompany && !error) {
        console.warn('No companies found for the current user');
      }

      if (error) {
        console.error('Error loading company:', error);
      }
    }
  }, [isLoading, currentCompany, error]);

  // After 5 seconds, assume loading has timed out and mark as ready
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        setLoadTimeout(true);
        setIsReady(true);
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  return (
    <CompanyContext.Provider value={{ currentCompany, isLoading: isLoading && !loadTimeout, error, isReady }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCurrentCompany() {
  const context = useContext(CompanyContext);
  // Return safe default when used outside of provider (e.g., on login page)
  if (context === undefined) {
    return {
      currentCompany: null,
      isLoading: false,
      error: null,
      isReady: true
    };
  }
  return context;
}

export function useCurrentCompanyId() {
  const { currentCompany } = useCurrentCompany();
  return currentCompany?.id || null;
}
