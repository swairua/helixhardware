import { useState, useEffect } from 'react';
import { fetchPublicCompanyData, type CompanyData } from '@/services/companyService';

interface UsePublicCompanyReturn {
  company: CompanyData | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch company data for public pages (like login)
 * This bypasses the need for authentication and uses the public edge function
 */
export function usePublicCompany(): UsePublicCompanyReturn {
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadCompany = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchPublicCompanyData();
        if (data) {
          console.log('✅ Company data loaded:', {
            id: data.id,
            name: data.name,
            hasLogo: !!data.logo_url,
            logoPreview: data.logo_url ? data.logo_url.substring(0, 50) + '...' : 'none'
          });
        }
        setCompany(data);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load company';
        console.error('❌ Failed to load company:', errorMsg);
        setError(err instanceof Error ? err : new Error(errorMsg));
      } finally {
        setIsLoading(false);
      }
    };

    loadCompany();
  }, []);

  return {
    company,
    isLoading,
    error,
  };
}
