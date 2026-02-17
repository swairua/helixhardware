/**
 * Shared ExternalAPIAdapter Singleton
 * This module ensures all parts of the application use the same authenticated adapter instance
 * This solves the issue where multiple adapter instances would lose authentication state
 */

import { ExternalAPIAdapter } from './external-api-adapter';

let sharedAdapter: ExternalAPIAdapter | null = null;

/**
 * Get or create the shared ExternalAPIAdapter instance
 * All database operations should use this single instance to ensure consistent authentication
 * The adapter will use environment detection to determine the correct API URL
 */
export function getSharedExternalAdapter(): ExternalAPIAdapter {
  if (!sharedAdapter) {
    // Initialize adapter without explicit URL - it will use environment detection
    // This allows automatic detection of local vs cloud hosting
    try {
      sharedAdapter = new ExternalAPIAdapter();
      console.log('🎯 Shared ExternalAPIAdapter instance created - all DB operations will use this');
    } catch (error) {
      console.error('❌ Failed to create shared adapter:', error);
      throw error;
    }
  }
  return sharedAdapter;
}

/**
 * For testing: reset the shared adapter
 */
export function resetSharedAdapter(): void {
  sharedAdapter = null;
}
