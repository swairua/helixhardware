import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { DatabaseSchemaInitializer } from '@/components/setup/DatabaseSchemaInitializer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Building2, Save, Upload, Plus, Trash2, Edit, Check, X, Image, AlertTriangle, AlertCircle, Eye } from 'lucide-react';
import { getAvailableTemplates } from '@/utils/pdfTemplates';
import { PDFTemplatePreviewModal } from '@/components/PDFTemplatePreviewModal';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useUpdateCompany, useCreateCompany, useTaxSettings, useCreateTaxSetting, useUpdateTaxSetting, useDeleteTaxSetting } from '@/hooks/useDatabase';
import { useCurrentCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';
import { ForceTaxSettings } from '@/components/ForceTaxSettings';
import { CompanySettingsDiagnostics } from '@/components/CompanySettingsDiagnostics';
import { getUserFriendlyMessage, logError } from '@/utils/errorParser';
import { parseErrorMessage } from '@/utils/errorHelpers';
import { QuickSchemaFix } from '@/components/QuickSchemaFix';
import { addCurrencyColumn, ADD_CURRENCY_COLUMN_SQL } from '@/utils/addCurrencyColumn';
import { getDatabaseProvider } from '@/integrations/database';
import { validateLogoUrl, addCacheBustingParam, sanitizeLogoUrl } from '@/utils/logoUploadUtils';
import { uploadImage } from '@/utils/directFileUpload';
import { PermissionErrorHelper } from '@/components/PermissionErrorHelper';
import {
  validateCompanyName,
  validateCompanyEmail,
  validateCompanyPhone,
  validateWebsite,
  validateAddress,
  validateCity,
  validateState,
  validatePostalCode,
  validateCountry,
  validateCurrency,
  validateRegistrationNumber,
  validateTaxNumber,
  validateFiscalYearStart,
  validateCompanyData,
  getValidationErrors,
  isValidCompanyData,
  type CompanyDataValidation,
} from '@/utils/companySettingsValidators';

export default function CompanySettings() {
  const { profile: currentUser } = useAuth();
  const { role, loading } = usePermissions();

  const [editingTax, setEditingTax] = useState<string | null>(null);
  const [newTax, setNewTax] = useState({ name: '', rate: 0, is_default: false });
  const [showNewTaxForm, setShowNewTaxForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [fixingCurrency, setFixingCurrency] = useState(false);
  const [logoLoadError, setLogoLoadError] = useState(false);
  const [logoRefreshKey, setLogoRefreshKey] = useState(0); // Force re-render of logo image
  const [permissionError, setPermissionError] = useState<{ statusCode: number; message: string } | null>(null);
  const [validationErrors, setValidationErrors] = useState<CompanyDataValidation | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewTemplateIndex, setPreviewTemplateIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [companyData, setCompanyData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Kenya',
    currency: 'KES',
    website: '',
    logo_url: '',
    primary_color: '#FF8C42',
    pdf_template: 'default'
  });

  const { currentCompany, isLoading: companiesLoading, error: companiesError } = useCurrentCompany();
  const { data: taxSettings, isLoading: taxSettingsLoading, error: taxSettingsError } = useTaxSettings(currentCompany?.id);
  const updateCompany = useUpdateCompany();
  const createCompany = useCreateCompany();
  const createTaxSetting = useCreateTaxSetting();
  const updateTaxSetting = useUpdateTaxSetting();
  const deleteTaxSetting = useDeleteTaxSetting();


  // Debug logging and schema check
  useEffect(() => {
    console.log('=== Company Settings Debug Info ===');
    console.log('Current user:', {
      email: currentUser?.email,
      role: currentUser?.role,
      company_id: currentUser?.company_id,
      status: currentUser?.status,
    });
    console.log('Current company:', currentCompany);
    console.log('Companies loading:', companiesLoading);
    console.log('Companies error:', companiesError);
    console.log('Tax settings:', taxSettings);
    console.log('Tax settings loading:', taxSettingsLoading);
    console.log('Tax settings error:', taxSettingsError);

    // Check for company_id mismatch
    if (currentCompany && currentUser?.company_id && currentCompany.id !== currentUser.company_id) {
      console.warn('⚠️ COMPANY ID MISMATCH:', {
        userCompanyId: currentUser.company_id,
        editingCompanyId: currentCompany.id,
      });
    }

    // Check for schema errors in the companies query
    if (companiesError) {
      const errorString = String(companiesError);
      if (errorString.includes('currency') && (errorString.includes('column') || errorString.includes('schema cache'))) {
        setSchemaError('currency column missing');
      }
    }
  }, [companiesLoading, companiesError, currentCompany, taxSettings, taxSettingsLoading, taxSettingsError]);

  useEffect(() => {
    if (currentCompany) {
      setCompanyData({
        name: currentCompany.name || '',
        registration_number: currentCompany.registration_number || '',
        tax_number: currentCompany.tax_number || '',
        email: currentCompany.email || '',
        phone: currentCompany.phone || '',
        address: currentCompany.address || '',
        city: currentCompany.city || '',
        state: currentCompany.state || '',
        postal_code: currentCompany.postal_code || '',
        country: currentCompany.country || 'Kenya',
        currency: currentCompany.currency || 'KES',
        fiscal_year_start: currentCompany.fiscal_year_start || 1,
        logo_url: currentCompany.logo_url || '',
        primary_color: currentCompany.primary_color || '#FF8C42',
        pdf_template: currentCompany.pdf_template || 'default',
        website: currentCompany.website || ''
      });
    }
  }, [currentCompany]);

  const handleOpenPreview = (templateIndex: number) => {
    setPreviewTemplateIndex(templateIndex);
    setPreviewModalOpen(true);
  };

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentCompany) return;

    // Enhanced validation
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      toast.error('Please select a valid image file (PNG, JPG, GIF, or WebP)');
      return;
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      console.log('📤 Starting logo upload:', { fileName: file.name, fileSize: file.size, fileType: file.type });
      // Upload using the standard upload utility
      const result = await uploadImage(file);

      console.log('📥 Upload result received:', result);

      if (!result.success || !result.url) {
        const errorMsg = result.error || 'Upload failed';
        console.error('❌ Upload result indicates failure:', { success: result.success, url: result.url, error: result.error });
        throw new Error(errorMsg);
      }

      const logoUrl = result.url;
      console.log('✅ Logo upload successful:', logoUrl);

      // Add cache-busting parameter for safe URLs
      const cachebustedUrl = addCacheBustingParam(logoUrl);
      console.log('🔄 URL transformation:', { original: logoUrl, cacheBusted: cachebustedUrl });

      // Update local state & persist using existing hook
      setCompanyData(prev => ({ ...prev, logo_url: cachebustedUrl }));
      setLogoLoadError(false);
      setLogoRefreshKey(prev => prev + 1); // Force image re-render
      console.log('💾 Local state updated with cacheBusted URL');

      // Persist to database (use sanitized URL without cache-busting in DB)
      const dbUrl = sanitizeLogoUrl(logoUrl);
      console.log('📝 Preparing database update:', {
        companyId: currentCompany.id,
        originalUrl: logoUrl,
        dbUrl: dbUrl,
        updatePayload: { id: currentCompany.id, data: { logo_url: dbUrl } }
      });

      try {
        console.log('🔌 Calling updateCompany.mutateAsync...');
        const updateResult = await updateCompany.mutateAsync({ id: currentCompany.id, data: { logo_url: dbUrl } });
        console.log('✅ Database update successful:', updateResult);
        toast.success('Logo uploaded successfully! The preview updates below.');
      } catch (updateError: any) {
        console.error('❌ Database update failed:', updateError);
        const updateErrorMsg = updateError instanceof Error ? updateError.message : String(updateError);
        console.error('Update error details:', {
          message: updateErrorMsg,
          stack: updateError instanceof Error ? updateError.stack : 'N/A',
          errorType: typeof updateError,
          errorKeys: updateError && typeof updateError === 'object' ? Object.keys(updateError) : 'N/A'
        });
        throw updateError;
      }

    } catch (err: any) {
      // Use centralized error parsing and logging for file upload
      logError(err, 'Logo Upload');

      const errorMsg = err instanceof Error ? err.message : String(err);
      let userMessage = getUserFriendlyMessage(err, 'Failed to upload logo');

      // Provide helpful suggestions based on error type
      if (errorMsg.includes('Failed to fetch') || errorMsg.includes('network')) {
        userMessage = 'Cannot reach the upload server. Please check your internet connection and try again.';
      } else if (errorMsg.includes('CORS')) {
        userMessage = 'Server configuration issue (CORS). Please contact your administrator.';
      } else if (errorMsg.includes('timeout') || errorMsg.includes('Timeout')) {
        userMessage = 'Upload took too long. Please try again with a smaller file or faster connection.';
      } else if (errorMsg.includes('Invalid response')) {
        userMessage = 'The server returned an invalid response. The upload may have failed. Please try again.';
      } else if (errorMsg.includes('image format') || errorMsg.includes('Image')) {
        userMessage = 'Invalid image format. Please use PNG, JPG, GIF, or WebP.';
      }

      console.error('🔴 Logo upload error:', {
        message: errorMsg,
        userMessage,
        timestamp: new Date().toISOString()
      });

      toast.error(userMessage);
    } finally {
      setUploading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };



  // Real-time validation with debounce
  const performValidation = useCallback((data: any) => {
    const validation = validateCompanyData(data);
    setValidationErrors(validation);
  }, []);

  // Debounced validation on field change
  const debouncedValidate = useCallback((data: any) => {
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    validationTimeoutRef.current = setTimeout(() => {
      performValidation(data);
    }, 500); // Validate after 500ms of no changes
  }, [performValidation]);

  // Get field error message
  const getFieldError = (fieldName: keyof CompanyDataValidation): string | undefined => {
    return validationErrors?.[fieldName]?.error;
  };


  const fixCurrencyColumn = async () => {
    setFixingCurrency(true);
    try {
      const result = await addCurrencyColumn();
      if (result.success) {
        toast.success('Currency column added! You can now save company settings.');
        setSchemaError(null);
      } else {
        toast.error(result.message);
        // Copy SQL to clipboard for manual execution
        navigator.clipboard.writeText(ADD_CURRENCY_COLUMN_SQL);
        toast.info('SQL copied to clipboard for manual execution');
      }
    } catch (error) {
      toast.error('Failed to add currency column');
    } finally {
      setFixingCurrency(false);
    }
  };

  const handleSaveCompany = async () => {
    // Perform validation before saving
    const validation = validateCompanyData(companyData);
    setValidationErrors(validation);

    // Check if all validations passed
    if (!isValidCompanyData(validation)) {
      const errors = getValidationErrors(validation);
      toast.error(`Validation failed: ${errors[0]}`);
      return;
    }

    try {
      // Sanitize and prepare company data to match database schema
      // Only include fields that exist in the database
      const sanitizedData: any = {
        name: companyData.name?.trim() || '',
        email: companyData.email?.trim() || null,
        phone: companyData.phone?.trim() || null,
        address: companyData.address?.trim() || null,
        city: companyData.city?.trim() || null,
        state: companyData.state?.trim() || null,
        postal_code: companyData.postal_code?.trim() || null,
        country: companyData.country?.trim() || 'Kenya',
        logo_url: companyData.logo_url?.trim() || null,
        primary_color: companyData.primary_color?.trim() || '#FF8C42',
        pdf_template: companyData.pdf_template?.trim() || 'default'
      };

      // Include optional fields that exist in the schema
      if (companyData.website?.trim()) {
        sanitizedData.website = companyData.website.trim();
      }
      if (companyData.currency?.trim()) {
        sanitizedData.currency = companyData.currency.trim();
      }
      if (companyData.registration_number?.trim()) {
        sanitizedData.registration_number = companyData.registration_number.trim();
      }
      if (companyData.tax_number?.trim()) {
        sanitizedData.tax_number = companyData.tax_number.trim();
      }
      if (companyData.fiscal_year_start) {
        sanitizedData.fiscal_year_start = Math.max(1, Math.min(12, parseInt(companyData.fiscal_year_start) || 1));
      }

      // Remove empty strings and convert to null for optional fields
      Object.keys(sanitizedData).forEach(key => {
        if (key !== 'name' && key !== 'country') {
          if (sanitizedData[key] === '' || sanitizedData[key] === undefined) {
            sanitizedData[key] = null;
          }
        }
      });

      if (!currentCompany) {
        // Create a new company if none exists
        await createCompany.mutateAsync(sanitizedData);
        toast.success('Company created successfully');
      } else {
        // Update existing company
        await updateCompany.mutateAsync({
          id: currentCompany.id,
          data: sanitizedData
        });
        toast.success('Company settings saved successfully');
      }
    } catch (error) {
      // Use centralized error parsing and logging
      logError(error, 'Company Save');
      const userMessage = getUserFriendlyMessage(error, 'Failed to save company settings');
      const errorString = String(error);

      // Check for permission error (403)
      if (errorString.includes('403') || errorString.includes('Forbidden')) {
        // Log detailed info for debugging
        const token = localStorage.getItem('med_api_token');
        const tokenPreview = token ? `${token.substring(0, 20)}...${token.substring(token.length - 20)}` : 'MISSING';

        console.error('🔍 403 Permission Denied - Full Debug Info:', {
          userRole: currentUser?.role,
          userStatus: currentUser?.status,
          userCompanyId: currentUser?.company_id,
          editingCompanyId: currentCompany?.id,
          editingCompanyName: currentCompany?.name,
          authTokenPresent: !!token,
          tokenPreview: tokenPreview,
          errorMessage: errorString.substring(0, 200),
          fullError: error,
        });

        // Provide specific guidance based on authorization status
        let detailedMessage = userMessage;

        if (!currentUser?.role?.toLowerCase().includes('admin')) {
          detailedMessage = 'You do not have permission to update company settings. Your account must have an admin role. Current role: ' + (currentUser?.role || 'Not set');
        } else if (currentUser?.status !== 'active') {
          detailedMessage = 'Your account is not active. Current status: ' + (currentUser?.status || 'Not set') + '. Contact your administrator to activate it.';
        } else if (!currentUser?.company_id) {
          detailedMessage = 'Your account is not assigned to a company. Contact your administrator to assign you to a company.';
        } else if (currentCompany?.id && currentUser?.company_id !== currentCompany.id) {
          detailedMessage = `Company ID mismatch. You are assigned to company ${currentUser.company_id} but trying to edit company ${currentCompany.id}. Contact your administrator to verify your company assignment.`;
        } else {
          detailedMessage = `Authorization failed while updating company "${currentCompany?.name}". This may be a backend authorization issue. Please check the browser console for more details and contact your administrator if the issue persists.`;
        }

        setPermissionError({
          statusCode: 403,
          message: detailedMessage,
        });
        toast.error(detailedMessage);
      }
      // Check for unauthorized error (401)
      else if (errorString.includes('401') || errorString.includes('Unauthorized')) {
        // The adapter already attempts token refresh and retry on 401
        // If we still get 401 here, it means refresh failed
        console.error('🔴 401 Unauthorized - Token refresh attempt failed');

        const detailedMessage = 'Your authentication token is invalid or expired and could not be refreshed. Please log out and log in again to get a new token.';
        setPermissionError({
          statusCode: 401,
          message: detailedMessage,
        });
        toast.error(detailedMessage);
      }
      // Check if this is a schema error
      else if (errorString.includes('currency') && (errorString.includes('column') || errorString.includes('schema cache'))) {
        setSchemaError('currency column missing');
        toast.error(userMessage);
      }
      // Other errors
      else {
        toast.error(userMessage);
      }
    }
  };

  const handleCreateTax = async () => {
    if (!currentCompany) {
      toast.error('No company found. Please create a company first.');
      return;
    }

    if (!newTax.name.trim()) {
      toast.error('Please enter a tax name');
      return;
    }

    if (newTax.rate <= 0) {
      toast.error('Please enter a valid tax rate greater than 0');
      return;
    }


    try {
      await createTaxSetting.mutateAsync({
        company_id: currentCompany.id,
        name: newTax.name.trim(),
        rate: newTax.rate,
        is_active: true,
        is_default: newTax.is_default
      });

      setNewTax({ name: '', rate: 0, is_default: false });
      setShowNewTaxForm(false);
      toast.success(`Tax setting "${newTax.name}" created successfully!`);
    } catch (error) {
      console.error('Tax creation error:', error);

      let errorMessage = 'Unknown error occurred';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object') {
        // Handle Supabase error objects
        const supabaseError = error as any;
        if (supabaseError.message) {
          errorMessage = supabaseError.message;
        } else if (supabaseError.details) {
          errorMessage = supabaseError.details;
        } else if (supabaseError.hint) {
          errorMessage = supabaseError.hint;
        } else {
          errorMessage = JSON.stringify(error);
        }
      }

      // Check if it's a table missing error
      if (errorMessage.includes('tax_settings') && (errorMessage.includes('does not exist') || errorMessage.includes('relation') || errorMessage.includes('table'))) {
        toast.error('Tax settings table does not exist. Please create the table first using the migration runner above.');
      } else {
        toast.error(`Failed to create tax setting: ${errorMessage}`);
      }
    }
  };

  const handleUpdateTax = async (taxId: string, updates: any) => {
    try {
      await updateTaxSetting.mutateAsync({
        id: taxId,
        ...updates
      });
      setEditingTax(null);
      toast.success('Tax setting updated successfully');
    } catch (error) {
      console.error('Tax update error:', error);

      let errorMessage = 'Unknown error occurred';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object') {
        const supabaseError = error as any;
        if (supabaseError.message) {
          errorMessage = supabaseError.message;
        } else if (supabaseError.details) {
          errorMessage = supabaseError.details;
        } else if (supabaseError.hint) {
          errorMessage = supabaseError.hint;
        } else {
          errorMessage = JSON.stringify(error);
        }
      }

      toast.error(`Failed to update tax setting: ${errorMessage}`);
    }
  };

  const handleDeleteTax = async (taxId: string) => {
    if (!confirm('Are you sure you want to delete this tax setting?')) {
      return;
    }

    try {
      await deleteTaxSetting.mutateAsync(taxId);
      toast.success('Tax setting deleted successfully');
    } catch (error) {
      console.error('Tax deletion error:', error);

      let errorMessage = 'Unknown error occurred';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object') {
        const supabaseError = error as any;
        if (supabaseError.message) {
          errorMessage = supabaseError.message;
        } else if (supabaseError.details) {
          errorMessage = supabaseError.details;
        } else if (supabaseError.hint) {
          errorMessage = supabaseError.hint;
        } else {
          errorMessage = JSON.stringify(error);
        }
      }

      toast.error(`Failed to delete tax setting: ${errorMessage}`);
    }
  };

  // Show loading state while companies are loading
  if (companiesLoading && !currentCompany) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Company Settings</h1>
            <p className="text-muted-foreground">Loading company information...</p>
          </div>
        </div>
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="h-6 bg-muted rounded animate-pulse"></div>
              <div className="h-6 bg-muted rounded animate-pulse"></div>
              <div className="h-6 bg-muted rounded animate-pulse"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error if company loading failed
  if (companiesError && !currentCompany) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Company Settings</h1>
            <p className="text-muted-foreground">Unable to load company information</p>
          </div>
        </div>
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                <p className="text-destructive font-medium">Failed to load company information:</p>
                <p className="text-destructive/80 text-sm mt-2">{companiesError?.message || 'Unknown error'}</p>
              </div>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Company Settings</h1>
          <p className="text-muted-foreground">
            Manage company information and preferences
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="primary-gradient"
            size="lg"
            onClick={handleSaveCompany}
            disabled={loading}
            title={loading ? 'Loading permissions...' : ''}
          >
            <Save className="h-4 w-4" />
            Save Settings
          </Button>
        </div>
      </div>

      {/* Permission Error Helper - Show when user lacks permissions */}
      {permissionError && (
        <PermissionErrorHelper
          statusCode={permissionError.statusCode}
          errorMessage={permissionError.message}
          operation="update"
          resource="company settings"
        />
      )}

      {/* Simple Currency Column Fix - Show when schema errors are detected */}
      {schemaError && !companiesError && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <span className="font-medium text-orange-800">
                Currency column missing from companies table
              </span>
            </div>
            <Button
              onClick={fixCurrencyColumn}
              disabled={fixingCurrency}
              size="sm"
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {fixingCurrency ? 'Adding...' : 'Add Currency Column'}
            </Button>
          </div>
          <p className="text-sm text-orange-700 mt-2">
            Click the button to add the missing currency column to the database.
          </p>
        </div>
      )}

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="defaults">Defaults</TabsTrigger>
          <TabsTrigger value="taxes">Taxes</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* General Tab - Company Information */}
        <TabsContent value="general" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Company Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Basic Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Company Name *</Label>
                    <Input
                      id="company-name"
                      value={companyData.name || ''}
                      onChange={(e) => {
                        setCompanyData(prev => ({ ...prev, name: e.target.value }));
                        debouncedValidate({ ...companyData, name: e.target.value });
                      }}
                      placeholder="Enter company name"
                      className={getFieldError('name') ? 'border-destructive' : ''}
                    />
                    {getFieldError('name') ? (
                      <div className="flex items-center gap-2 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        {getFieldError('name')}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">The official name of your company (max 255 characters)</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={companyData.website || ''}
                      onChange={(e) => {
                        setCompanyData(prev => ({ ...prev, website: e.target.value }));
                        debouncedValidate({ ...companyData, website: e.target.value });
                      }}
                      placeholder="https://yourcompany.com"
                      className={getFieldError('website') ? 'border-destructive' : ''}
                    />
                    {getFieldError('website') ? (
                      <div className="flex items-center gap-2 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        {getFieldError('website')}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Your company's website URL (e.g., https://example.com)</p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Registration & Tax Information Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Registration & Tax Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="registration-number">Registration Number</Label>
                    <Input
                      id="registration-number"
                      value={companyData.registration_number || ''}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, registration_number: e.target.value }))}
                      placeholder="e.g., CR/2024/001"
                    />
                    <p className="text-xs text-muted-foreground">Company registration or incorporation number</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tax-number">Tax Number</Label>
                    <Input
                      id="tax-number"
                      value={companyData.tax_number || ''}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, tax_number: e.target.value }))}
                      placeholder="e.g., PIN-123456789"
                    />
                    <p className="text-xs text-muted-foreground">Tax identification or VAT number</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Location & Contact Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Location & Contact</h3>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={companyData.address || ''}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, address: e.target.value }))}
                    rows={3}
                    placeholder="Enter your company address"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={companyData.phone || ''}
                      onChange={(e) => {
                        setCompanyData(prev => ({ ...prev, phone: e.target.value }));
                        debouncedValidate({ ...companyData, phone: e.target.value });
                      }}
                      placeholder="+1 (555) 123-4567"
                      className={getFieldError('phone') ? 'border-destructive' : ''}
                    />
                    {getFieldError('phone') ? (
                      <div className="flex items-center gap-2 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        {getFieldError('phone')}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Primary contact phone number</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={companyData.email || ''}
                      onChange={(e) => {
                        setCompanyData(prev => ({ ...prev, email: e.target.value }));
                        debouncedValidate({ ...companyData, email: e.target.value });
                      }}
                      placeholder="contact@company.com"
                      className={getFieldError('email') ? 'border-destructive' : ''}
                    />
                    {getFieldError('email') ? (
                      <div className="flex items-center gap-2 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        {getFieldError('email')}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Primary contact email address</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={companyData.country || 'Kenya'}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, country: e.target.value }))}
                      placeholder="Kenya"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Tab - Logo & Brand Color */}
        <TabsContent value="branding" className="space-y-4">
          {/* Logo & Branding */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Logo & Branding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-6">
                <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-muted-foreground/25 relative">
                  {uploading ? (
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="text-xs mt-1">Uploading...</span>
                    </div>
                  ) : companyData.logo_url && !logoLoadError ? (
                    <img
                      key={logoRefreshKey}
                      src={companyData.logo_url}
                      alt="Company Logo"
                      className="w-full h-full object-contain"
                      onError={() => {
                        console.error('❌ Logo failed to load:', companyData.logo_url);
                        setLogoLoadError(true);
                      }}
                      onLoad={() => {
                        console.log('✅ Logo loaded successfully:', companyData.logo_url);
                        setLogoLoadError(false);
                      }}
                    />
                  ) : logoLoadError ? (
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <svg className="h-6 w-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                      <span className="text-xs">Load Failed</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Image className="h-6 w-6 mb-1" />
                      <span className="text-xs">No Logo</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Company Logo</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload your company logo. Recommended size: 200x200px, max 5MB. Supports PNG, JPG, GIF, WebP.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                    <Button
                      variant="outline"
                      onClick={handleChooseFile}
                      disabled={uploading}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      {uploading ? 'Uploading...' : 'Upload Logo'}
                    </Button>
                    {companyData.logo_url && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCompanyData(prev => ({ ...prev, logo_url: '' }));
                            setLogoLoadError(false);
                            toast.success('Logo removed. Click Save Settings to apply changes.');
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          Remove Logo
                        </Button>
                        {logoLoadError && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCompanyData(prev => ({ ...prev, logo_url: '' }));
                              setLogoLoadError(false);
                              toast.info('Invalid logo cleared. Save to apply.');
                            }}
                            className="text-orange-600 hover:text-orange-700"
                          >
                            Clear Invalid Logo
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                  {companyData.logo_url && (
                    <div className="space-y-2 pt-2">
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>
                          <span className="font-medium">Current URL:</span> {companyData.logo_url.startsWith('data:') ? 'Local storage (Base64)' : 'Remote server'}
                        </p>
                        {companyData.logo_url.startsWith('data:') && (
                          <div className="bg-orange-50 border border-orange-200 rounded p-2 text-orange-700 space-y-1">
                            <p>⚠️ <span className="font-medium">Corrupted Logo Detected:</span></p>
                            <p>This logo is stored as Base64 data, which indicates a failed upload. Please re-upload your logo.</p>
                            <div className="flex gap-2 mt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setCompanyData(prev => ({ ...prev, logo_url: '' }));
                                  setLogoLoadError(false);
                                  toast.info('Invalid logo cleared. You can now upload a new one.');
                                }}
                                className="text-orange-600 hover:text-orange-700"
                              >
                                Clear & Re-upload
                              </Button>
                            </div>
                          </div>
                        )}
                        {logoLoadError && !companyData.logo_url.startsWith('data:') && (
                          <div className="bg-red-50 border border-red-200 rounded p-2 text-red-700 space-y-1">
                            <p>❌ <span className="font-medium">Failed to Load Logo:</span></p>
                            <p>The logo URL exists but the image cannot be loaded. This may be a network or server issue.</p>
                            <div className="flex gap-2 mt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setLogoRefreshKey(prev => prev + 1)}
                                className="text-red-600 hover:text-red-700"
                              >
                                Retry Load
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setCompanyData(prev => ({ ...prev, logo_url: '' }));
                                  setLogoLoadError(false);
                                  toast.info('Logo URL cleared. Please save and re-upload.');
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                Clear URL
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Brand Color */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Brand Color</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="primary-color">Primary Color</Label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      id="primary-color"
                      value={companyData.primary_color || '#FF8C42'}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, primary_color: e.target.value }))}
                      className="h-12 w-20 rounded border-2 border-input cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={companyData.primary_color || '#FF8C42'}
                      onChange={(e) => {
                        const color = e.target.value;
                        if (/^#[0-9A-F]{6}$/i.test(color)) {
                          setCompanyData(prev => ({ ...prev, primary_color: color }));
                        }
                      }}
                      placeholder="#FF8C42"
                      maxLength={7}
                      className="font-mono text-sm w-24"
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {['#FF8C42', '#2563EB', '#DC2626', '#059669', '#7C3AED', '#1F2937'].map(color => (
                      <button
                        key={color}
                        onClick={() => setCompanyData(prev => ({ ...prev, primary_color: color }))}
                        className="h-8 w-8 rounded border-2 transition-all hover:scale-110"
                        style={{
                          backgroundColor: color,
                          borderColor: companyData.primary_color === color ? '#000' : '#e5e7eb'
                        }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  This color will be applied to PDFs, buttons, and other UI elements throughout the application.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* PDF Template Selector */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>PDF Template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pdf-template">Document Template</Label>
                <select
                  id="pdf-template"
                  value={companyData.pdf_template || 'default'}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, pdf_template: e.target.value }))}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {getAvailableTemplates().map(template => (
                    <option key={template.name} value={template.name}>
                      {template.label} - {template.description}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Select the default PDF template used for invoices, quotations, and other documents.
                </p>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-semibold text-foreground">Available Templates:</div>
                <div className="space-y-2">
                  {getAvailableTemplates().map((template, index) => (
                    <div
                      key={template.name}
                      className={`p-3 rounded-lg border-2 transition-all cursor-pointer flex items-center justify-between ${
                        companyData.pdf_template === template.name
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div
                        className="flex-1"
                        onClick={() => setCompanyData(prev => ({ ...prev, pdf_template: template.name }))}
                      >
                        <div className="font-medium text-sm">{template.label}</div>
                        <div className="text-xs text-muted-foreground">{template.description}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenPreview(index);
                        }}
                        className="ml-3 flex items-center gap-2"
                        title="Preview this template"
                      >
                        <Eye className="h-4 w-4" />
                        Preview
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

        </TabsContent>

        {/* Defaults Tab - Default Settings */}
        <TabsContent value="defaults" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Default Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                <Label htmlFor="currency">Default Currency</Label>
                <Input
                  id="currency"
                  value={companyData.currency || ''}
                  onChange={(e) => {
                    setCompanyData(prev => ({ ...prev, currency: e.target.value }));
                    debouncedValidate({ ...companyData, currency: e.target.value });
                  }}
                  placeholder="KES"
                  maxLength={3}
                  className={getFieldError('currency') ? 'border-destructive' : ''}
                />
                {getFieldError('currency') ? (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {getFieldError('currency')}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">3-letter ISO 4217 currency code (e.g., USD, KES, EUR)</p>
                )}
              </div>
                <div className="space-y-2">
                  <Label htmlFor="fiscal-year">Fiscal Year Start Month</Label>
                  <select
                    id="fiscal-year"
                    value={companyData.fiscal_year_start || 1}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, fiscal_year_start: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="1">January</option>
                    <option value="2">February</option>
                    <option value="3">March</option>
                    <option value="4">April</option>
                    <option value="5">May</option>
                    <option value="6">June</option>
                    <option value="7">July</option>
                    <option value="8">August</option>
                    <option value="9">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                  </select>
                  <p className="text-xs text-muted-foreground">Select the month your fiscal year begins</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city-default">City</Label>
                  <Input
                    id="city-default"
                    value={companyData.city || ''}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-sm">Location Reference</Label>
                  <div className="text-xs text-muted-foreground p-3 bg-muted rounded-md border border-border">
                    <p className="mb-1"><strong>Current Country:</strong> {companyData.country || 'Kenya'}</p>
                    <p className="text-xs">To change the country, go to the <strong>General</strong> tab</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    value={companyData.state || ''}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, state: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal-code">Postal Code</Label>
                  <Input
                    id="postal-code"
                    value={companyData.postal_code || ''}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, postal_code: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Taxes Tab */}
        <TabsContent value="taxes" className="space-y-4">
          {currentCompany && (
            <ForceTaxSettings companyId={currentCompany.id} />
          )}
        </TabsContent>

        {/* Advanced Tab - Placeholder for future use */}
        <TabsContent value="advanced" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">Advanced settings will be available soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* PDF Template Preview Modal */}
      <PDFTemplatePreviewModal
        open={previewModalOpen}
        onOpenChange={setPreviewModalOpen}
        templateName={getAvailableTemplates()[previewTemplateIndex]?.name || 'default'}
        companyData={{
          name: companyData.name || 'Sample Company',
          address: companyData.address || '',
          city: companyData.city || '',
          country: companyData.country || 'Kenya',
          phone: companyData.phone || '',
          email: companyData.email || '',
          logo_url: companyData.logo_url || '',
          primary_color: companyData.primary_color || '#FF8C42',
          tax_number: companyData.tax_number || ''
        }}
        primaryColor={companyData.primary_color || '#FF8C42'}
      />
    </div>
  );
}

// Tax Edit Form Component
interface TaxEditFormProps {
  tax: any;
  onSave: (updates: any) => void;
  onCancel: () => void;
}

function TaxEditForm({ tax, onSave, onCancel }: TaxEditFormProps) {
  const [editData, setEditData] = useState({
    name: tax?.name || '',
    rate: tax?.rate || 0,
    is_active: tax?.is_active || false,
    is_default: tax?.is_default || false
  });

  return (
    <div className="flex-1 grid gap-4 md:grid-cols-4">
      <Input
        value={editData.name || ''}
        onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
      />
      <Input
        type="number"
        step="0.01"
        value={editData.rate || 0}
        onChange={(e) => setEditData(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
      />
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Switch
            checked={editData.is_active}
            onCheckedChange={(checked) => setEditData(prev => ({ ...prev, is_active: checked }))}
          />
          <span className="text-sm">Active</span>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={editData.is_default}
            onCheckedChange={(checked) => setEditData(prev => ({ ...prev, is_default: checked }))}
          />
          <span className="text-sm">Default</span>
        </div>
      </div>
      <div className="flex space-x-2">
        <Button size="sm" onClick={() => onSave(editData)}>
          <Check className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
