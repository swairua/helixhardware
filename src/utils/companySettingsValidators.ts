/**
 * Company Settings Validators
 * Comprehensive validation utilities for company settings form fields
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface CompanyDataValidation {
  name: ValidationResult;
  email: ValidationResult;
  phone: ValidationResult;
  website: ValidationResult;
  address: ValidationResult;
  city: ValidationResult;
  state: ValidationResult;
  postal_code: ValidationResult;
  country: ValidationResult;
  currency: ValidationResult;
  registration_number: ValidationResult;
  tax_number: ValidationResult;
  fiscal_year_start: ValidationResult;
}

/**
 * Validate company name
 * Required, 1-255 characters, trim whitespace
 */
export const validateCompanyName = (name: string): ValidationResult => {
  if (!name || !name.trim()) {
    return { valid: false, error: 'Company name is required' };
  }

  const trimmed = name.trim();
  if (trimmed.length > 255) {
    return { valid: false, error: 'Company name must be less than 255 characters' };
  }

  return { valid: true };
};

/**
 * Validate email address
 * Optional, but if provided must be valid RFC 5322 format
 */
export const validateCompanyEmail = (email: string): ValidationResult => {
  if (!email || !email.trim()) {
    return { valid: true }; // Email is optional
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }

  if (email.length > 255) {
    return { valid: false, error: 'Email must be less than 255 characters' };
  }

  return { valid: true };
};

/**
 * Validate phone number
 * Optional, but if provided should be reasonable length
 */
export const validateCompanyPhone = (phone: string): ValidationResult => {
  if (!phone || !phone.trim()) {
    return { valid: true }; // Phone is optional
  }

  if (phone.length > 50) {
    return { valid: false, error: 'Phone number must be less than 50 characters' };
  }

  // Optional: Check if it contains at least one digit
  if (!/\d/.test(phone)) {
    return { valid: false, error: 'Phone number must contain at least one digit' };
  }

  return { valid: true };
};

/**
 * Validate website URL
 * Optional, but if provided should be valid URL format
 */
export const validateWebsite = (website: string): ValidationResult => {
  if (!website || !website.trim()) {
    return { valid: true }; // Website is optional
  }

  if (website.length > 255) {
    return { valid: false, error: 'Website URL must be less than 255 characters' };
  }

  // Basic URL validation - must start with http/https or be a valid domain
  const urlRegex = /^(https?:\/\/|www\.)?([-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&/=]*)?)$/;
  if (!urlRegex.test(website.toLowerCase())) {
    return { valid: false, error: 'Please enter a valid website URL' };
  }

  return { valid: true };
};

/**
 * Validate address
 * Optional, reasonable length for address
 */
export const validateAddress = (address: string): ValidationResult => {
  if (!address || !address.trim()) {
    return { valid: true }; // Address is optional
  }

  if (address.length > 500) {
    return { valid: false, error: 'Address must be less than 500 characters' };
  }

  return { valid: true };
};

/**
 * Validate city
 * Optional, reasonable length
 */
export const validateCity = (city: string): ValidationResult => {
  if (!city || !city.trim()) {
    return { valid: true }; // City is optional
  }

  if (city.length > 100) {
    return { valid: false, error: 'City name must be less than 100 characters' };
  }

  return { valid: true };
};

/**
 * Validate state/province
 * Optional, reasonable length
 */
export const validateState = (state: string): ValidationResult => {
  if (!state || !state.trim()) {
    return { valid: true }; // State is optional
  }

  if (state.length > 100) {
    return { valid: false, error: 'State/Province must be less than 100 characters' };
  }

  return { valid: true };
};

/**
 * Validate postal code
 * Optional, but reasonable length and format
 */
export const validatePostalCode = (postalCode: string): ValidationResult => {
  if (!postalCode || !postalCode.trim()) {
    return { valid: true }; // Postal code is optional
  }

  if (postalCode.length > 20) {
    return { valid: false, error: 'Postal code must be less than 20 characters' };
  }

  return { valid: true };
};

/**
 * Validate country
 * Required, reasonable length
 */
export const validateCountry = (country: string): ValidationResult => {
  if (!country || !country.trim()) {
    return { valid: false, error: 'Country is required' };
  }

  if (country.length > 100) {
    return { valid: false, error: 'Country name must be less than 100 characters' };
  }

  return { valid: true };
};

/**
 * Validate currency code
 * Optional, must be exactly 3 uppercase letters if provided (ISO 4217)
 */
export const validateCurrency = (currency: string): ValidationResult => {
  if (!currency || !currency.trim()) {
    return { valid: true }; // Currency is optional
  }

  const trimmed = currency.trim().toUpperCase();

  if (trimmed.length !== 3) {
    return { valid: false, error: 'Currency code must be exactly 3 characters (e.g., USD, KES, EUR)' };
  }

  if (!/^[A-Z]{3}$/.test(trimmed)) {
    return { valid: false, error: 'Currency code must be 3 letters (e.g., USD, KES, EUR)' };
  }

  return { valid: true };
};

/**
 * Validate registration number
 * Optional, reasonable length
 */
export const validateRegistrationNumber = (regNumber: string): ValidationResult => {
  if (!regNumber || !regNumber.trim()) {
    return { valid: true }; // Registration number is optional
  }

  if (regNumber.length > 100) {
    return { valid: false, error: 'Registration number must be less than 100 characters' };
  }

  return { valid: true };
};

/**
 * Validate tax number
 * Optional, reasonable length
 */
export const validateTaxNumber = (taxNumber: string): ValidationResult => {
  if (!taxNumber || !taxNumber.trim()) {
    return { valid: true }; // Tax number is optional
  }

  if (taxNumber.length > 100) {
    return { valid: false, error: 'Tax number must be less than 100 characters' };
  }

  return { valid: true };
};

/**
 * Validate fiscal year start month
 * Optional, must be 1-12 if provided
 */
export const validateFiscalYearStart = (fiscalYearStart: number | string): ValidationResult => {
  if (fiscalYearStart === null || fiscalYearStart === undefined || fiscalYearStart === '') {
    return { valid: true }; // Fiscal year start is optional
  }

  const month = typeof fiscalYearStart === 'string' ? parseInt(fiscalYearStart) : fiscalYearStart;

  if (isNaN(month)) {
    return { valid: false, error: 'Fiscal year start must be a valid month number' };
  }

  if (month < 1 || month > 12) {
    return { valid: false, error: 'Fiscal year start must be between 1 (January) and 12 (December)' };
  }

  return { valid: true };
};

/**
 * Validate color in hex format
 * Must be valid hex color (#RRGGBB)
 */
export const validateHexColor = (color: string): ValidationResult => {
  if (!color) {
    return { valid: false, error: 'Color is required' };
  }

  const hexRegex = /^#[0-9A-F]{6}$/i;
  if (!hexRegex.test(color)) {
    return { valid: false, error: 'Please enter a valid hex color (e.g., #FF8C42)' };
  }

  return { valid: true };
};

/**
 * Validate entire company data object
 * Returns an object with validation results for each field
 */
export const validateCompanyData = (data: {
  name?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  currency?: string;
  registration_number?: string;
  tax_number?: string;
  fiscal_year_start?: number | string;
  primary_color?: string;
}): CompanyDataValidation => {
  return {
    name: validateCompanyName(data.name || ''),
    email: validateCompanyEmail(data.email || ''),
    phone: validateCompanyPhone(data.phone || ''),
    website: validateWebsite(data.website || ''),
    address: validateAddress(data.address || ''),
    city: validateCity(data.city || ''),
    state: validateState(data.state || ''),
    postal_code: validatePostalCode(data.postal_code || ''),
    country: validateCountry(data.country || ''),
    currency: validateCurrency(data.currency || ''),
    registration_number: validateRegistrationNumber(data.registration_number || ''),
    tax_number: validateTaxNumber(data.tax_number || ''),
    fiscal_year_start: validateFiscalYearStart(data.fiscal_year_start || ''),
  };
};

/**
 * Get all validation errors as an array of strings
 * Useful for displaying all errors at once
 */
export const getValidationErrors = (validation: CompanyDataValidation): string[] => {
  const errors: string[] = [];

  Object.values(validation).forEach((result) => {
    if (!result.valid && result.error) {
      errors.push(result.error);
    }
  });

  return errors;
};

/**
 * Check if all validations passed
 */
export const isValidCompanyData = (validation: CompanyDataValidation): boolean => {
  return Object.values(validation).every((result) => result.valid);
};

/**
 * Get the first validation error for a specific field
 */
export const getFieldError = (fieldName: keyof CompanyDataValidation, validation: CompanyDataValidation): string | undefined => {
  return validation[fieldName]?.error;
};
