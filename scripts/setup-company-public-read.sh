#!/bin/bash

# Setup script to enable public read access to companies table
# This allows the login page to display company branding without authentication

set -e

echo "🔐 Setting up public read access to companies table..."
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Read the SQL file
SQL_FILE="$(dirname "$0")/setup-company-public-read.sql"

if [ ! -f "$SQL_FILE" ]; then
    echo "❌ SQL file not found: $SQL_FILE"
    exit 1
fi

echo "📝 SQL to be executed:"
echo "---"
cat "$SQL_FILE"
echo "---"
echo ""

# Apply the SQL
echo "⏳ Applying RLS policy to companies table..."
supabase db execute < "$SQL_FILE"

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Verify company data exists in Supabase (Table Editor → companies)"
echo "2. Refresh the login page in your browser"
echo "3. You should see your company logo and name!"
echo ""
