import { apiClient } from '@/integrations/api';

export interface CompanyData {
  id: string;
  name: string;
  logo_url?: string;
  primary_color?: string;
  [key: string]: any;
}

/**
 * Validate if a logo URL is a valid data URI or regular URL
 */
function isValidLogoUrl(url?: string): boolean {
  if (!url) return false;

  // Check if it's a data URI
  if (url.startsWith('data:')) {
    // Validate base64 data URI - should have proper format
    // data:image/jpeg;base64,xxxxx should have content after comma
    const parts = url.split(',');
    if (parts.length !== 2 || parts[1].length < 50) {
      console.warn('Invalid or truncated base64 logo URL');
      return false;
    }
    return true;
  }

  // Check if it's a regular URL
  try {
    new URL(url);
    return true;
  } catch {
    console.warn('Invalid logo URL format:', url);
    return false;
  }
}

/**
 * Fetch company information for public pages (login)
 * This uses the external PHP API instead of Supabase
 */
export async function fetchPublicCompanyData(): Promise<CompanyData | null> {
  try {
    const result = await apiClient.select('companies', {});

    if (!result.data || result.error) {
      console.warn('Failed to fetch company data:', result.error?.message);
      return null;
    }

    // Get first company from the list
    const companies = Array.isArray(result.data) ? result.data : [result.data];
    const company = companies[0];

    if (!company) {
      console.warn('No companies found');
      return null;
    }

    // Validate logo URL and exclude if invalid
    const logoUrl = isValidLogoUrl(company.logo_url) ? company.logo_url : undefined;

    return {
      id: company.id,
      name: company.name,
      logo_url: logoUrl,
      primary_color: company.primary_color,
      ...company
    } as CompanyData;
  } catch (error) {
    console.error('Error fetching company data:', error);
    return null;
  }
}
