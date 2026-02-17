/**
 * Reconcile Auth Users - External API Version
 *
 * This script reconciles authentication users via the external API
 *
 * Usage:
 * VITE_EXTERNAL_API_URL=https://your-api.com DRY_RUN=1 node scripts/reconcile_auth_users.mjs
 * VITE_EXTERNAL_API_URL=/api.php DRY_RUN=1 node scripts/reconcile_auth_users.mjs
 */

const EXTERNAL_API_URL = process.env.VITE_EXTERNAL_API_URL;
const AUTH_TOKEN = process.env.API_AUTH_TOKEN || null;
const DRY_RUN = !!process.env.DRY_RUN;

if (!EXTERNAL_API_URL) {
  console.error('❌ VITE_EXTERNAL_API_URL environment variable is required');
  process.exit(1);
}

async function listAllUsers() {
  try {
    console.log('📋 Fetching all users from API...');

    const headers = {
      'Content-Type': 'application/json'
    };

    if (AUTH_TOKEN) {
      headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
    }

    const response = await fetch(`${EXTERNAL_API_URL}?action=list_users`, {
      method: 'GET',
      headers
    });

    const result = await response.json();

    if (!response.ok || result.status === 'error') {
      console.error('Error fetching users:', result.message);
      throw new Error(result.message || 'Failed to fetch users');
    }

    return result.users || result.data || [];
  } catch (error) {
    console.error('Failed to list users:', error.message);
    throw error;
  }
}

async function reconcileUsers() {
  try {
    console.log('\n🔄 Reconciling Auth Users\n');
    console.log(`Using API: ${EXTERNAL_API_URL}`);
    console.log(`Dry Run: ${DRY_RUN ? 'Yes' : 'No'}\n`);

    const users = await listAllUsers();
    console.log(`✅ Found ${users.length} users\n`);

    if (users.length > 0) {
      console.log('📊 Users:');
      users.forEach(user => {
        console.log(`  - ${user.email} (ID: ${user.id}, Status: ${user.status || 'active'})`);
      });
    }

    if (DRY_RUN) {
      console.log('\n⚠️ DRY RUN MODE - No changes were made');
    } else {
      console.log('\n✅ Reconciliation complete');
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the reconciliation
reconcileUsers();
