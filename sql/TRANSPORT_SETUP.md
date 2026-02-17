# Transport Module Setup Guide

This guide will help you set up the Transport Management Module in your database.

## Overview

The Transport module includes:
- **Drivers Management** - Track and manage drivers
- **Vehicles Management** - Track and manage vehicles
- **Materials Management** - Track materials being transported
- **Transport Finance** - Track all financial aspects of transport operations

## Database Tables

### 1. `drivers`
Stores driver information.

**Columns:**
- `id` (UUID) - Primary key
- `company_id` (UUID) - Company association
- `name` (VARCHAR) - Driver full name
- `phone` (VARCHAR) - Phone number
- `license_number` (VARCHAR) - Driver's license number
- `status` (VARCHAR) - 'active' or 'inactive'
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

**Indexes:**
- company_id, status, name

### 2. `vehicles`
Stores vehicle information and fleet management.

**Columns:**
- `id` (UUID) - Primary key
- `company_id` (UUID) - Company association
- `vehicle_number` (VARCHAR) - Vehicle registration number (e.g., KCE 2838)
- `vehicle_type` (VARCHAR) - Type of vehicle (Truck, Van, Motorcycle, etc.)
- `capacity` (INTEGER) - Vehicle capacity in kg
- `status` (VARCHAR) - 'active', 'inactive', or 'maintenance'
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

**Indexes:**
- company_id, status, vehicle_number
- Unique constraint: (company_id, vehicle_number)

### 3. `materials`
Stores materials/cargo types that can be transported.

**Columns:**
- `id` (UUID) - Primary key
- `company_id` (UUID) - Company association
- `name` (VARCHAR) - Material name
- `description` (TEXT) - Material description
- `unit` (VARCHAR) - Unit of measurement (kg, tons, liters, pieces)
- `status` (VARCHAR) - 'active' or 'inactive'
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

**Indexes:**
- company_id, status, name
- Unique constraint: (company_id, name)

### 4. `transport_finance`
Stores all financial records for transport operations.

**Columns:**
- `id` (UUID) - Primary key
- `company_id` (UUID) - Company association
- `vehicle_id` (UUID) - Reference to vehicle
- `material_id` (UUID) - Reference to material
- `buying_price` (DECIMAL) - Cost of goods/materials
- `fuel_cost` (DECIMAL) - Fuel expenses
- `driver_fees` (DECIMAL) - Driver compensation
- `other_expenses` (DECIMAL) - Additional costs
- `selling_price` (DECIMAL) - Revenue from transport
- `profit_loss` (DECIMAL) - **Auto-calculated** profit/loss
- `payment_status` (VARCHAR) - 'paid', 'unpaid', or 'pending'
- `customer_name` (VARCHAR) - Customer/destination name
- `date` (DATE) - Transaction date
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

**Indexes:**
- company_id, vehicle_id, material_id, payment_status, date, customer_name

**Features:**
- Auto-calculates profit/loss = selling_price - (buying_price + fuel_cost + driver_fees + other_expenses)
- Triggers automatically compute profit/loss on insert/update

## Views (Analytics)

### 1. `transport_finance_summary`
Shows finance records with vehicle and material names included.

```sql
SELECT * FROM transport_finance_summary WHERE company_id = 'your-company-id';
```

### 2. `daily_transport_summary`
Shows daily aggregated statistics:
- Transaction count
- Total expenses
- Total revenue
- Total profit/loss
- Breakdown by payment status

```sql
SELECT * FROM daily_transport_summary WHERE company_id = 'your-company-id';
```

### 3. `vehicle_utilization`
Shows vehicle performance metrics:
- Number of trips
- Profitable vs loss trips
- Total profit/loss per vehicle
- Average profit per trip
- Last used date

```sql
SELECT * FROM vehicle_utilization WHERE company_id = 'your-company-id';
```

### 4. `material_profitability`
Shows material performance metrics:
- Total shipments
- Total buying vs selling price
- Profit margin percentage
- Average profit per shipment

```sql
SELECT * FROM material_profitability WHERE company_id = 'your-company-id';
```

## Installation Steps

### Step 1: Connect to Supabase
If you haven't already, [Connect to Supabase](#open-mcp-popover) through the MCP interface.

### Step 2: Execute the SQL Schema

1. Go to **Supabase Dashboard** → Your Project
2. Click on **SQL Editor**
3. Click **+ New Query**
4. Copy the entire content from `sql/transport_schema.sql`
5. Paste it into the SQL editor
6. Click **Run**

Wait for the schema to be created. You should see confirmation messages.

### Step 3: Verify Tables

Run this query to verify all tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('drivers', 'vehicles', 'materials', 'transport_finance');
```

You should see all 4 tables listed.

### Step 4: Grant Permissions (if needed)

If you're using Row Level Security (RLS), ensure your auth policies are set up. The schema includes RLS policies that use the `company_id` from JWT claims.

## API Usage Examples

### Get All Drivers
```typescript
import { supabase } from '@/integrations/supabase/client';

const { data: drivers, error } = await supabase
  .from('drivers')
  .select('*')
  .eq('company_id', companyId);
```

### Create a Vehicle
```typescript
const { data, error } = await supabase
  .from('vehicles')
  .insert([{
    company_id: companyId,
    vehicle_number: 'KCE 2838',
    vehicle_type: 'Truck',
    capacity: 5000,
    status: 'active'
  }]);
```

### Get Transport Finance with Details
```typescript
const { data: finances, error } = await supabase
  .from('transport_finance_summary')
  .select('*')
  .eq('company_id', companyId)
  .order('date', { ascending: false });
```

### Get Daily Summary
```typescript
const { data: summary, error } = await supabase
  .from('daily_transport_summary')
  .select('*')
  .eq('company_id', companyId)
  .order('date', { ascending: false });
```

## Key Features

### Auto-Calculated Profit/Loss
The `profit_loss` field is automatically calculated using a database trigger:

```
profit_loss = selling_price - (buying_price + fuel_cost + driver_fees + other_expenses)
```

You don't need to calculate it in the frontend - the database handles it!

### Company Isolation
All tables include `company_id` to ensure multi-company support. Row Level Security policies ensure users can only see their company's data.

### Audit Logging
All changes to transport tables are automatically logged in the `audit_logs` table for compliance and tracking.

### Constraints
- Vehicle numbers must be unique per company
- Material names must be unique per company
- Foreign key constraints prevent orphaned records

## Troubleshooting

### Tables Not Created
- Check your Supabase connection
- Ensure you have admin privileges
- Check the browser console for SQL errors

### Permission Denied
- Verify you're logged in to Supabase
- Check RLS policies are not blocking your user
- Ensure your JWT includes the `company_id` claim

### Profit/Loss Not Calculating
- Verify the `calculate_transport_profit` trigger exists
- Check that you're not manually setting the `profit_loss` field
- The field should be auto-calculated

## Accessing the Transport Module

Once the database schema is set up, the Transport module is available at:

```
/app/transport
```

In the menu sidebar, look for the **Transport** option.

## Sample Data

If you want to add sample data for testing, uncomment the INSERT statements at the end of `transport_schema.sql`:

```sql
-- Uncomment these sections to add sample data
INSERT INTO drivers (company_id, name, phone, license_number, status) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'John Kipchoge', '+254700123456', 'DL001', 'active');
```

Replace `'550e8400-e29b-41d4-a716-446655440000'` with your actual company UUID.

## Support

If you encounter any issues:
1. Check that all tables exist in your database
2. Verify RLS policies are correctly configured
3. Check browser console for error messages
4. Verify your company_id is correctly passed to all queries

For additional help, refer to the [Supabase Documentation](https://supabase.com/docs).
