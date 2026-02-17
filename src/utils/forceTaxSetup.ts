import { apiClient } from '@/integrations/api';

export interface SimpleTaxSetting {
  id: string;
  company_id: string;
  name: string;
  rate: number;
  is_active: boolean;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

// In-memory tax settings storage as fallback
let memoryTaxSettings: SimpleTaxSetting[] = [];

export async function forceCreateTaxSettings(): Promise<void> {
  console.log('🚀 Force creating tax settings...');

  try {
    // Try to get company ID from external API
    let companyId = 'default-company';

    try {
      const result = await apiClient.select('companies', {});

      if (!result.error && result.data) {
        const companies = Array.isArray(result.data) ? result.data : [result.data];
        companyId = companies?.[0]?.id || 'default-company';
        console.log('✅ Found company:', companyId);
      } else {
        console.warn('⚠️ Cannot access companies from API:', result.error?.message);
        console.log('📦 Using default company ID for tax settings');
      }
    } catch (apiError) {
      console.warn('⚠️ API error accessing companies:', apiError);
      console.log('📦 Using default company ID for tax settings');
    }

    // Create default tax settings in memory
    const defaultTaxSettings: SimpleTaxSetting[] = [
      {
        id: crypto.randomUUID(),
        company_id: companyId,
        name: 'Zero Rate',
        rate: 0.0,
        is_active: true,
        is_default: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        company_id: companyId,
        name: 'VAT',
        rate: 16.0,
        is_active: true,
        is_default: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        company_id: companyId,
        name: 'Exempt',
        rate: 0.0,
        is_active: true,
        is_default: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // Store in memory
    memoryTaxSettings = defaultTaxSettings;

    // Also store in localStorage for persistence
    localStorage.setItem('tax_settings', JSON.stringify(defaultTaxSettings));

    console.log('✅ Tax settings created in memory storage');

  } catch (error) {
    console.error('❌ Force tax setup failed:', error);
    // Don't rethrow - create minimal tax settings with default company ID
    const defaultCompanyId = 'default-company';
    const fallbackTaxSettings: SimpleTaxSetting[] = [
      {
        id: crypto.randomUUID(),
        company_id: defaultCompanyId,
        name: 'Zero Rate',
        rate: 0.0,
        is_active: true,
        is_default: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        company_id: defaultCompanyId,
        name: 'VAT',
        rate: 16.0,
        is_active: true,
        is_default: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
    ];
    memoryTaxSettings = fallbackTaxSettings;
    localStorage.setItem('tax_settings', JSON.stringify(fallbackTaxSettings));
    console.log('✅ Fallback tax settings created');
  }
}

export async function getTaxSettings(companyId?: string): Promise<SimpleTaxSetting[]> {
  try {
    // First try to get from localStorage (fastest)
    const storedSettings = localStorage.getItem('tax_settings');
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings) as SimpleTaxSetting[];
        if (parsed.length > 0) {
          console.log('💾 Using localStorage tax settings');
          memoryTaxSettings = parsed;
          return parsed.filter(tax => !companyId || tax.company_id === companyId);
        }
      } catch (parseError) {
        console.warn('⚠️ Failed to parse localStorage tax settings:', parseError);
      }
    }

    // Fallback to memory
    if (memoryTaxSettings.length > 0) {
      console.log('📦 Using memory tax settings');
      return memoryTaxSettings.filter(tax => !companyId || tax.company_id === companyId);
    }

    // Try to get from database via external API (may fail if tables don't exist)
    try {
      const result = await apiClient.select('tax_settings', {});

      if (!result.error && result.data && Array.isArray(result.data) && result.data.length > 0) {
        console.log('📊 Using database tax settings');
        const taxSettings = result.data as SimpleTaxSetting[];
        memoryTaxSettings = taxSettings;
        localStorage.setItem('tax_settings', JSON.stringify(taxSettings));
        return companyId
          ? taxSettings.filter(tax => tax.company_id === companyId)
          : taxSettings;
      }
    } catch (apiError) {
      console.warn('⚠️ Failed to get tax settings from API:', apiError);
    }

    // If nothing exists, force create defaults
    console.log('🔧 No tax settings found, force creating...');
    await forceCreateTaxSettings();
    return memoryTaxSettings.filter(tax => !companyId || tax.company_id === companyId);

  } catch (error) {
    console.error('❌ Error getting tax settings:', error);

    // Return memory settings as absolute fallback
    if (memoryTaxSettings.length > 0) {
      return memoryTaxSettings.filter(tax => !companyId || tax.company_id === companyId);
    }

    // Last resort - return empty array instead of throwing
    console.warn('⚠️ No tax settings available, returning empty array');
    return [];
  }
}

export async function createTaxSetting(taxSetting: Omit<SimpleTaxSetting, 'id' | 'created_at' | 'updated_at'>): Promise<SimpleTaxSetting> {
  try {
    // Try database first via external API
    const result = await apiClient.insert('tax_settings', {
      ...taxSetting,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    if (!result.error) {
      console.log('✅ Tax setting created in database');
      return {
        ...taxSetting,
        id: result.data || crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as SimpleTaxSetting;
    }
    
    // Fallback to memory storage
    console.log('📦 Creating tax setting in memory');
    const newTaxSetting: SimpleTaxSetting = {
      ...taxSetting,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // If this is set as default, unset others
    if (newTaxSetting.is_default) {
      memoryTaxSettings = memoryTaxSettings.map(tax => 
        tax.company_id === newTaxSetting.company_id 
          ? { ...tax, is_default: false }
          : tax
      );
    }
    
    memoryTaxSettings.push(newTaxSetting);
    localStorage.setItem('tax_settings', JSON.stringify(memoryTaxSettings));
    
    return newTaxSetting;
    
  } catch (error) {
    console.error('Error creating tax setting:', error);
    throw error;
  }
}

export async function updateTaxSetting(id: string, updates: Partial<SimpleTaxSetting>): Promise<SimpleTaxSetting> {
  try {
    // Try database first via external API
    const result = await apiClient.update('tax_settings', id, {
      ...updates,
      updated_at: new Date().toISOString()
    });

    if (!result.error) {
      console.log('✅ Tax setting updated in database');
      // Find and return the updated setting from memory
      const index = memoryTaxSettings.findIndex(tax => tax.id === id);
      if (index !== -1) {
        return memoryTaxSettings[index];
      }
    }
    
    // Fallback to memory storage
    console.log('📦 Updating tax setting in memory');
    const index = memoryTaxSettings.findIndex(tax => tax.id === id);
    if (index === -1) {
      throw new Error('Tax setting not found');
    }
    
    const updatedTaxSetting = {
      ...memoryTaxSettings[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    // If this is set as default, unset others
    if (updatedTaxSetting.is_default) {
      memoryTaxSettings = memoryTaxSettings.map(tax => 
        tax.company_id === updatedTaxSetting.company_id && tax.id !== id
          ? { ...tax, is_default: false }
          : tax
      );
    }
    
    memoryTaxSettings[index] = updatedTaxSetting;
    localStorage.setItem('tax_settings', JSON.stringify(memoryTaxSettings));
    
    return updatedTaxSetting;
    
  } catch (error) {
    console.error('Error updating tax setting:', error);
    throw error;
  }
}

export async function deleteTaxSetting(id: string): Promise<void> {
  try {
    // Try database first via external API
    const result = await apiClient.delete('tax_settings', id);

    if (!result.error) {
      console.log('✅ Tax setting deleted from database');
      return;
    }
    
    // Fallback to memory storage
    console.log('📦 Deleting tax setting from memory');
    memoryTaxSettings = memoryTaxSettings.filter(tax => tax.id !== id);
    localStorage.setItem('tax_settings', JSON.stringify(memoryTaxSettings));
    
  } catch (error) {
    console.error('Error deleting tax setting:', error);
    throw error;
  }
}

export function getDefaultTaxRate(companyId: string): number {
  const taxSettings = memoryTaxSettings.filter(tax => tax.company_id === companyId);
  const defaultTax = taxSettings.find(tax => tax.is_default && tax.is_active);
  return defaultTax?.rate || 0; // Default to 0% as requested
}
