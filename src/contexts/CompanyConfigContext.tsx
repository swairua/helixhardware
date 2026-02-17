import React, { createContext, useContext, ReactNode, useEffect, useState, useCallback } from 'react';
import { getDatabase } from '@/integrations/database';
import { logError } from '@/utils/errorLogger';
import { updateFavicon } from '@/utils/seoHelpers';

/**
 * Company configuration interface for public-facing branding and SEO
 */
export interface CompanyConfig {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  description?: string;
  logo_url?: string;
  primary_color?: string;
  currency?: string;
}

interface CompanyConfigContextType {
  config: CompanyConfig | null;
  isLoading: boolean;
  error: Error | null;
  isReady: boolean;
}

const defaultConfig: CompanyConfig = {
  id: 'default',
  name: '>> Medical Supplies',
  email: 'info@medplusafrica.com',
  phone: '+254 741 207 690',
  address: 'P.O. Box 85988-00200, Nairobi, Eastern Bypass, Membley',
  city: 'Nairobi',
  country: 'Kenya',
  currency: 'KES',
  logo_url: 'https://medplusafrica.com/assets/medplus-logo.webp',
  primary_color: '#FF8C42',
  description: 'Trusted distributor of critical care supplies, hospital consumables, and furniture across Africa.',
};

const CompanyConfigContext = createContext<CompanyConfigContextType | undefined>(undefined);

export function CompanyConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<CompanyConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Load first company from database on mount
  const loadCompanyConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const database = getDatabase();
      if (!database) {
        throw new Error('Database not initialized');
      }

      // Fetch first active company from database
      const result = await database.select('companies', {}, { limit: 1, filter: 'is_active=eq.true' });

      if (result.error) {
        console.warn('⚠️  Error fetching company config from database:', result.error);
        // Use fallback defaults
        setConfig(defaultConfig);
        updateFavicon(defaultConfig.logo_url, defaultConfig);
      } else if (result.data && result.data.length > 0) {
        const companyData = result.data[0];
        const loadedConfig: CompanyConfig = {
          id: companyData.id,
          name: companyData.name || defaultConfig.name,
          email: companyData.email || defaultConfig.email,
          phone: companyData.phone || defaultConfig.phone,
          address: companyData.address || defaultConfig.address,
          city: companyData.city || defaultConfig.city,
          country: companyData.country || defaultConfig.country,
          description: companyData.description || defaultConfig.description,
          logo_url: companyData.logo_url || defaultConfig.logo_url,
          primary_color: companyData.primary_color || defaultConfig.primary_color,
          currency: companyData.currency || defaultConfig.currency,
        };
        console.log('✅ Company config loaded from database:', loadedConfig.name);
        setConfig(loadedConfig);
        // Update favicon to match company logo
        updateFavicon(loadedConfig.logo_url, loadedConfig);
      } else {
        // No companies found, use defaults
        console.warn('ℹ️  No companies found in database, using defaults');
        setConfig(defaultConfig);
        updateFavicon(defaultConfig.logo_url, defaultConfig);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('❌ Error loading company config:', error);
      logError('CompanyConfigContext: Error loading company config', error, {
        context: 'loadCompanyConfig'
      });
      // Use fallback defaults on error
      setConfig(defaultConfig);
      updateFavicon(defaultConfig.logo_url, defaultConfig);
      setError(error);
    } finally {
      setIsLoading(false);
      setIsReady(true);
    }
  }, []);

  // Load config once on mount
  useEffect(() => {
    loadCompanyConfig();
  }, [loadCompanyConfig]);

  return (
    <CompanyConfigContext.Provider value={{ config, isLoading, error, isReady }}>
      {children}
    </CompanyConfigContext.Provider>
  );
}

/**
 * Hook to use company configuration throughout the app
 * Returns company config with fallback to defaults
 */
export function useCompanyConfig(): CompanyConfig {
  const context = useContext(CompanyConfigContext);

  // Allow use outside of provider (e.g., on login page) with defaults
  if (context === undefined) {
    return defaultConfig;
  }

  // Return loaded config or defaults while loading
  return context.config || defaultConfig;
}

/**
 * Hook to check if company config is ready
 * Useful for components that need to wait for config before rendering
 */
export function useCompanyConfigReady(): boolean {
  const context = useContext(CompanyConfigContext);

  if (context === undefined) {
    return true; // Consider ready if provider not available
  }

  return context.isReady;
}

export default CompanyConfigProvider;
