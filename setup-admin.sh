#!/bin/bash

# Medical Supplies - Admin User Setup Script
# This script creates the first admin user in the system

# Configuration
SUPABASE_URL="https://mfcdlqixqydyrcflkmag.supabase.co"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mY2RscWl4cXlkeXJjZmxrbWFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzMxMjYzMiwiZXhwIjoyMDgyODg4NjMyfQ.2fc49KHwDtF9FtE_h7CGBSvogyTE3JZDgfpRfNIx20w"

# Admin credentials (customize as needed)
ADMIN_EMAIL="${1:-admin@mail.com}"
ADMIN_PASSWORD="${2:-Admin.12}"
ADMIN_FULL_NAME="${3:-System Admin}"

echo "🚀 >> Medical Supplies - Admin User Setup"
echo "═════════════════════════════════════════"
echo ""
echo "📧 Email: $ADMIN_EMAIL"
echo "🔐 Password: $ADMIN_PASSWORD"
echo "👤 Full Name: $ADMIN_FULL_NAME"
echo ""

# Run the admin creation script
SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY" \
VITE_SUPABASE_URL="$SUPABASE_URL" \
node scripts/create-first-admin.js "$ADMIN_EMAIL" "$ADMIN_PASSWORD" "$ADMIN_FULL_NAME"

echo ""
echo "✅ Setup complete!"
