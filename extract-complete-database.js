#!/usr/bin/env node

/**
 * Complete Database Extraction - External API Version
 * This script calls the external API for database operations
 *
 * Usage:
 *   VITE_EXTERNAL_API_URL=https://your-api.com API_AUTH_TOKEN=token node extract-complete-database.js
 *   Or for local/relative API:
 *   VITE_EXTERNAL_API_URL=/api.php node extract-complete-database.js
 */

const EXTERNAL_API_URL = process.env.VITE_EXTERNAL_API_URL;
const AUTH_TOKEN = process.env.API_AUTH_TOKEN || null;

if (!EXTERNAL_API_URL) {
  console.error('❌ Error: VITE_EXTERNAL_API_URL environment variable is required');
  console.error('\nUsage:');
  console.error('  VITE_EXTERNAL_API_URL=https://your-api.com node extract-complete-database.js');
  console.error('  VITE_EXTERNAL_API_URL=/api.php node extract-complete-database.js');
  process.exit(1);
}

async function extractDatabase() {
  console.log('🗄️ Extracting database schema via external API...');
  console.log('=====================================\n');

  try {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (AUTH_TOKEN) {
      headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
    }

    // Call the external API to get database schema
    const response = await fetch(`${EXTERNAL_API_URL}?action=export_schema`, {
      method: 'GET',
      headers
    });

    const result = await response.json();

    if (!response.ok || result.status === 'error') {
      console.error('❌ Error:', result.message || 'Failed to extract database');
      process.exit(1);
    }

    if (result.schema || result.data) {
      console.log('✅ Database schema extracted successfully');
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.error('❌ No schema data returned from API');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error extracting database:', error);
    process.exit(1);
  }
}

// Run the extraction
extractDatabase();
