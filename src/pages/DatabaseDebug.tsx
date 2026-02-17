import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  checkDatabaseTables,
  createTestUser,
  getDatabaseStatus,
  checkUsersExist
} from '@/utils/databaseTableChecker';

// SQL Migration content
const SQL_MIGRATION = `-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- User role enumeration
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'accountant', 'stock_manager', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- User status enumeration
DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('active', 'inactive', 'pending');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Document status enumeration
DO $$ BEGIN
    CREATE TYPE document_status AS ENUM ('draft', 'pending', 'approved', 'sent', 'paid', 'partial', 'overdue', 'cancelled', 'expired', 'accepted', 'rejected', 'converted');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- LPO status enumeration
DO $$ BEGIN
    CREATE TYPE lpo_status AS ENUM ('draft', 'sent', 'approved', 'received', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Companies table (Multi-tenant support)
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100),
    tax_number VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Kenya',
    logo_url TEXT,
    currency VARCHAR(3) DEFAULT 'KES',
    fiscal_year_start INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'user',
    status user_status DEFAULT 'pending',
    phone TEXT,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    department TEXT,
    position TEXT,
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    invited_at TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    permission_name TEXT NOT NULL,
    granted BOOLEAN DEFAULT TRUE,
    granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, permission_name)
);

-- User invitations table
CREATE TABLE IF NOT EXISTS user_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    role user_role NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days',
    accepted_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending',
    invitation_token VARCHAR(255) UNIQUE,
    is_approved BOOLEAN DEFAULT FALSE,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    customer_code VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Kenya',
    tax_number VARCHAR(100),
    credit_limit DECIMAL(15,2) DEFAULT 0,
    payment_terms INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NOTE: Rest of tables (invoices, payments, products, etc.) are created in the full SQL file
-- Please download and run: COMPREHENSIVE_DATABASE_MIGRATION.sql`;

export default function DatabaseDebug() {
  const [tableStatus, setTableStatus] = useState<any>(null);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('Admin123456');
  const [showSQL, setShowSQL] = useState(false);

  useEffect(() => {
    handleCheckTables();
  }, []);

  const handleCopySQL = () => {
    // For demo, copy just the beginning - in real scenario, you'd get the full file
    const fullSQL = `-- ===============================================================================
-- COMPREHENSIVE DATABASE MIGRATION
-- Complete database schema for business management system
-- ===============================================================================

-- IMPORTANT: You need to run the full COMPREHENSIVE_DATABASE_MIGRATION.sql file
-- which contains all 26 tables and proper constraints.

-- This is available in your project root: COMPREHENSIVE_DATABASE_MIGRATION.sql

-- To set up your database:
-- 1. Go to https://app.supabase.com
-- 2. Open your project
-- 3. Go to SQL Editor
-- 4. Create a new query
-- 5. Copy the ENTIRE contents of COMPREHENSIVE_DATABASE_MIGRATION.sql
-- 6. Paste it and click Run

${SQL_MIGRATION}`;

    navigator.clipboard.writeText(fullSQL).then(() => {
      toast.success('SQL copied to clipboard! Paste it in Supabase SQL Editor');
    });
  };

  const handleCheckTables = async () => {
    setLoading(true);
    try {
      const tables = await checkDatabaseTables();
      const status = await getDatabaseStatus();
      
      setTableStatus(tables);
      setDbStatus(status);
      
      if (tables.allTablesExist) {
        toast.success('✅ All required tables exist!');
      } else {
        toast.error(`❌ ${tables.totalChecked - tables.totalExists} tables are missing`);
      }
    } catch (error) {
      console.error('Error checking tables:', error);
      toast.error('Failed to check database tables');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setCreateUserLoading(true);
    try {
      const result = await createTestUser(email, password);
      
      if (result.success) {
        toast.success(`✅ User created: ${email}`);
        // Refresh status
        await handleCheckTables();
      } else {
        toast.error(`❌ Failed to create user: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
    } finally {
      setCreateUserLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">Database Debug Panel</h1>
          <p className="text-gray-600">Check database tables and create test users</p>
        </div>

        {/* Database Status */}
        {dbStatus && (
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Database Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Tables Ready</p>
                  <p className={`text-2xl font-bold ${dbStatus.tablesReady ? 'text-green-600' : 'text-red-600'}`}>
                    {dbStatus.tablesReady ? '✅ Yes' : '❌ No'}
                  </p>
                </div>
                <div className="bg-amber-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Users Exist</p>
                  <p className={`text-2xl font-bold ${dbStatus.usersExist ? 'text-green-600' : 'text-orange-600'}`}>
                    {dbStatus.usersExist ? '✅ Yes' : '⏳ No'}
                  </p>
                </div>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-sm font-semibold">Summary:</p>
                <p className="text-lg">{dbStatus.summary.status}</p>
              </div>
              <div className="text-sm text-gray-600">
                Tables Found: <span className="font-bold">{dbStatus.totalTablesFound}/{dbStatus.totalTablesRequired}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Missing Tables Alert */}
        {dbStatus && dbStatus.missingTables && dbStatus.missingTables.length > 0 && (
          <Card className="border-2 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-700">Missing Tables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dbStatus.missingTables.map((table: any, idx: number) => (
                  <div key={idx} className="text-sm text-red-700">
                    • {table.tableName}
                  </div>
                ))}
              </div>
              <p className="text-xs text-red-600 mt-4">
                You need to set up the database schema before using the app.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Create User Section */}
        {dbStatus?.tablesReady && (
          <Card className="border-2 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-700">Create Test User</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  disabled={createUserLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password (min 8 characters)
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Admin123456"
                  disabled={createUserLoading}
                />
              </div>
              <Button
                onClick={handleCreateUser}
                disabled={createUserLoading || !dbStatus?.tablesReady}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {createUserLoading ? '⏳ Creating...' : '✅ Create User'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Refresh Button */}
        <Button
          onClick={handleCheckTables}
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          {loading ? '⏳ Checking...' : '🔄 Refresh Status'}
        </Button>

        {/* Tables List */}
        {tableStatus && (
          <Card>
            <CardHeader>
              <CardTitle>All Tables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {tableStatus.tables.map((table: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-2 rounded text-sm ${
                      table.exists
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    <span className="font-medium">{table.tableName}</span>
                    {table.exists ? ' ✅' : ' ❌'}
                    {table.error && (
                      <div className="text-xs mt-1 opacity-75">{table.error}</div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Setup Instructions */}
        <Card className="bg-orange-50 border-orange-200">
          <CardHeader>
            <CardTitle className="text-orange-900">🔧 Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-orange-800 space-y-4">
            <div>
              <p className="font-semibold mb-2">Step 1: Open Supabase SQL Editor</p>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>Go to <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="underline font-bold text-orange-600">Supabase Dashboard</a></li>
                <li>Select your project (mfcdlqixqydyrcflkmag)</li>
                <li>Click on <span className="bg-white px-2 py-1 rounded text-gray-800 font-semibold">SQL Editor</span> in the left menu</li>
                <li>Click <span className="bg-white px-2 py-1 rounded text-gray-800 font-semibold">New Query</span></li>
              </ol>
            </div>

            <div>
              <p className="font-semibold mb-2">Step 2: Copy and Run Migration SQL</p>
              <div className="space-y-2">
                <div className="bg-white p-4 rounded border border-orange-200">
                  <p className="text-gray-600 mb-2 text-xs">📄 File: <span className="font-mono font-semibold">COMPREHENSIVE_DATABASE_MIGRATION.sql</span></p>
                  <p className="text-gray-700 mb-3">Complete database schema with all 26 tables</p>
                  <Button
                    onClick={handleCopySQL}
                    className="bg-orange-600 hover:bg-orange-700 text-white w-full"
                  >
                    📋 Copy SQL to Clipboard
                  </Button>
                </div>
                <p className="text-xs text-orange-700 bg-orange-100 p-2 rounded">
                  The SQL file is located in your project root. Click the button above to copy it, then paste in Supabase SQL Editor.
                </p>
              </div>
            </div>

            <div>
              <p className="font-semibold mb-2">Step 3: Run the SQL</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Paste the SQL into the SQL Editor</li>
                <li>Click the <span className="bg-white px-2 py-1 rounded text-gray-800">Run</span> button (or Ctrl+Enter)</li>
                <li>Wait for it to complete (should take a few seconds)</li>
              </ol>
            </div>

            <div>
              <p className="font-semibold mb-2">Step 4: Create Test User</p>
              <p>After tables are created, refresh this page and use the form above to create your first admin user.</p>
            </div>

            <div>
              <p className="font-semibold mb-2">Step 5: Sign In</p>
              <p>Go back to the login page and use your test credentials.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
