#!/usr/bin/env node
/**
 * Create First Admin User - External API Version
 *
 * This script creates the first admin user via the configured API endpoint
 *
 * Usage:
 *   VITE_EXTERNAL_API_URL=https://your-api.com/api.php node scripts/create-first-admin.js [email] [password] [fullName]
 *   OR set environment variables:
 *   VITE_EXTERNAL_API_URL=https://your-api.com/api.php ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=secure123 node scripts/create-first-admin.js
 *
 * Examples:
 *   VITE_EXTERNAL_API_URL=https://api.example.com/api.php node scripts/create-first-admin.js admin@example.com "SecurePassword123!" "Admin User"
 *   VITE_EXTERNAL_API_URL=/api.php ADMIN_EMAIL=admin@example.app ADMIN_PASSWORD=pass123 node scripts/create-first-admin.js
 */

const readline = require('readline');

const EXTERNAL_API_URL = process.env.VITE_EXTERNAL_API_URL;
if (!EXTERNAL_API_URL) {
  console.error('❌ VITE_EXTERNAL_API_URL environment variable is required');
  console.error('Usage: VITE_EXTERNAL_API_URL=https://your-api.com/api.php node scripts/create-first-admin.js');
  process.exit(1);
}

const AUTH_TOKEN = process.env.API_AUTH_TOKEN || null;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

async function createFirstAdmin() {
  console.log('🔐 Creating First Admin User\n');

  try {
    // Get credentials from args or env vars
    let email = process.argv[2] || process.env.ADMIN_EMAIL;
    let password = process.argv[3] || process.env.ADMIN_PASSWORD;
    let fullName = process.argv[4] || process.env.ADMIN_FULL_NAME;

    // Prompt if not provided
    if (!email) {
      email = await question('Enter admin email: ');
    }

    if (!password) {
      password = await question('Enter admin password: ');
    }

    if (!fullName) {
      fullName = await question('Enter admin full name (optional): ');
    }

    // Validate inputs
    if (!email || !password) {
      console.error('❌ Email and password are required');
      process.exit(1);
    }

    const headers = {
      'Content-Type': 'application/json'
    };

    if (AUTH_TOKEN) {
      headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
    }

    console.log(`\n📝 Creating admin user: ${email}`);

    // Call external API to create admin user
    const response = await fetch(`${EXTERNAL_API_URL}?action=admin_create_user`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email,
        password,
        full_name: fullName || null,
        role: 'super_admin',
        company_id: 'default' // Use a default company or ask user
      })
    });

    const result = await response.json();

    if (!response.ok || result.status === 'error') {
      console.error('❌ Error creating admin:', result.message || 'Unknown error');
      process.exit(1);
    }

    if (result.success && result.user_id) {
      console.log('✅ Admin user created successfully!');
      console.log(`   User ID: ${result.user_id}`);
      console.log(`   Email: ${email}`);
      console.log(`   Role: super_admin`);
      console.log('\n✅ You can now log in with these credentials');
    } else {
      console.error('❌ Failed to create admin user');
      console.error(result);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

createFirstAdmin();
