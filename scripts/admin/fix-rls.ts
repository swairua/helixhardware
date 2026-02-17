#!/usr/bin/env node

/**
 * Admin CLI Script: Fix RLS Policies
 * 
 * Usage:
 * npx ts-node scripts/admin/fix-rls.ts
 * 
 * Or with environment variables:
 * VITE_EXTERNAL_API_URL=... API_AUTH_TOKEN=... \
 * npm run admin:fix-rls
 * 
 * Note: RLS management is now handled by the external API
 */

import { fixProfileRls } from '../../src/server/lib/fixProfileRls';

async function main() {
  const apiUrl = process.env.VITE_EXTERNAL_API_URL;
  if (!apiUrl) {
    console.error('❌ VITE_EXTERNAL_API_URL environment variable is required');
    console.error('Usage: VITE_EXTERNAL_API_URL=https://your-api.com npm run admin:fix-rls');
    process.exit(1);
  }

  const authToken = process.env.API_AUTH_TOKEN;

  console.log('\n🔐 Fixing RLS policies via external API...\n');
  console.log(`API URL: ${apiUrl}`);
  console.log('');

  const result = await fixProfileRls(apiUrl, authToken);

  if (result.success) {
    console.log('✅ RLS policies check complete!');
    console.log(`Message: ${result.message}`);
    console.log('');
  } else {
    console.error('❌ Failed to fix RLS:');
    console.error(`Error: ${result.error}`);
    console.error('');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
