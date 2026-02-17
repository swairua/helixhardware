#!/usr/bin/env node

/**
 * Admin CLI Script: Reset Password
 * 
 * Usage:
 * npx ts-node scripts/admin/reset-password.ts \
 *   --email user@example.com \
 *   --user-id <uuid> \
 *   --admin-id <admin-uuid> \
 *   --redirect-url "https://yourapp.com/reset" (optional)
 * 
 * Or with environment variables:
 * VITE_EXTERNAL_API_URL=... API_AUTH_TOKEN=... \
 * npm run admin:reset-password
 */

import { adminResetPassword } from '../../src/server/lib/adminResetPassword';

interface CliArgs {
  email: string;
  userId: string;
  adminId: string;
  redirectUrl?: string;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const parsed: Record<string, string | undefined> = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '').replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    const value = args[i + 1];
    parsed[key] = value;
  }

  if (!parsed.email || !parsed.userId || !parsed.adminId) {
    console.error('Missing required arguments:');
    console.error('  --email <email>');
    console.error('  --user-id <uuid>');
    console.error('  --admin-id <admin-uuid>');
    console.error('\nOptional arguments:');
    console.error('  --redirect-url <url>');
    process.exit(1);
  }

  return {
    email: parsed.email,
    userId: parsed.userId,
    adminId: parsed.adminId,
    redirectUrl: parsed.redirectUrl
  };
}

async function main() {
  const apiUrl = process.env.VITE_EXTERNAL_API_URL;
  if (!apiUrl) {
    console.error('❌ VITE_EXTERNAL_API_URL environment variable is required');
    console.error('Usage: VITE_EXTERNAL_API_URL=https://your-api.com npm run admin:reset-password');
    process.exit(1);
  }

  const authToken = process.env.API_AUTH_TOKEN;

  const args = parseArgs();

  console.log('\n🔐 Resetting password via external API...\n');
  console.log(`API URL: ${apiUrl}`);
  console.log(`Email: ${args.email}`);
  console.log(`User ID: ${args.userId}`);
  console.log(`Admin ID: ${args.adminId}`);
  if (args.redirectUrl) console.log(`Redirect URL: ${args.redirectUrl}`);
  console.log('');

  const result = await adminResetPassword(
    {
      email: args.email,
      user_id: args.userId,
      admin_id: args.adminId,
      redirectUrl: args.redirectUrl
    },
    apiUrl,
    authToken
  );

  if (result.success) {
    console.log('✅ Password reset email sent successfully!');
    console.log('User should receive a password reset email shortly.\n');
  } else {
    console.error('❌ Failed to reset password:');
    console.error(`Error: ${result.error}\n`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
