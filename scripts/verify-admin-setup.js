#!/usr/bin/env node
/**
 * Verify Admin Setup - External API Version
 *
 * This script verifies that admin setup is complete via the configured API endpoint
 *
 * Usage:
 *   VITE_EXTERNAL_API_URL=https://your-api.com/api.php node scripts/verify-admin-setup.js
 */

const EXTERNAL_API_URL = process.env.VITE_EXTERNAL_API_URL;
if (!EXTERNAL_API_URL) {
  console.error('❌ VITE_EXTERNAL_API_URL environment variable is required');
  console.error('Usage: VITE_EXTERNAL_API_URL=https://your-api.com/api.php node scripts/verify-admin-setup.js');
  process.exit(1);
}

const AUTH_TOKEN = process.env.API_AUTH_TOKEN || null;

async function verifyAdminSetup() {
  try {
    console.log('\n📋 Verifying Admin Setup...\n');

    const headers = {
      'Content-Type': 'application/json'
    };

    if (AUTH_TOKEN) {
      headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
    }

    // Call external API to verify admin setup
    const response = await fetch(`${EXTERNAL_API_URL}?action=verify_admin_setup`, {
      method: 'GET',
      headers
    });

    const result = await response.json();

    if (!response.ok || result.status === 'error') {
      console.error('❌ Setup verification failed:', result.message || 'Unknown error');
      process.exit(1);
    }

    if (result.setup_complete) {
      console.log('✅ Admin setup is complete!');
      console.log('\n📊 Setup Status:');
      console.log('  - Admin users configured: Yes');
      console.log('  - Database ready: Yes');
      console.log('  - API connection: Connected to ' + EXTERNAL_API_URL);
    } else {
      console.log('⚠️ Admin setup is not complete');
      console.log('\n📊 Missing Setup:');
      if (result.issues && Array.isArray(result.issues)) {
        result.issues.forEach(issue => {
          console.log('  - ' + issue);
        });
      }
      process.exit(1);
    }

    console.log('\n✅ All checks passed!\n');
  } catch (error) {
    console.error('❌ Error verifying setup:', error.message);
    process.exit(1);
  }
}

verifyAdminSetup();
