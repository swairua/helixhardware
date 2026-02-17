/**
 * Supabase Client Replacement
 * Provides backward-compatible interface backed by external API (med.wayrus.co.ke/api.php)
 * All Supabase-style calls map to the external API
 */

import { supabaseCompat, apiClient } from '../api';

// Export the backward-compatible interface as "supabase"
export const supabase = supabaseCompat;

// Also export the direct API client for components that want to use it
export { apiClient };
export const externalAPIAdapter = apiClient;
