# Transport Management Module - Complete Setup Guide

## Overview

You now have a fully functional Transport Management Module with:

- **Driver Management** - Track and manage drivers
- **Vehicle Management** - Track and manage your fleet
- **Material Management** - Manage materials being transported
- **Finance Tracking** - Track all financial aspects of transport operations with auto-calculated profit/loss
- **Analytics & Views** - Built-in views for reporting and analysis

## What Was Created

### Frontend Components

**Pages:**
- `src/pages/Transport.tsx` - Main transport management page with 4 tabs

**Components:**
- `src/components/transport/CreateDriverModal.tsx` - Create driver dialog
- `src/components/transport/EditDriverModal.tsx` - Edit driver dialog
- `src/components/transport/CreateVehicleModal.tsx` - Create vehicle dialog
- `src/components/transport/EditVehicleModal.tsx` - Edit vehicle dialog
- `src/components/transport/CreateMaterialModal.tsx` - Create material dialog
- `src/components/transport/EditMaterialModal.tsx` - Edit material dialog
- `src/components/transport/TransportFinanceModal.tsx` - Create finance record dialog
- `src/components/transport/EditTransportFinanceModal.tsx` - Edit finance record dialog

**Hooks:**
- `src/hooks/useTransport.ts` - Re-exports all transport-specific database hooks
- `src/hooks/useDatabase.ts` - Updated with all transport database operations

**Menu:**
- Added "Transport" menu item to sidebar

### Database Tables

**4 Core Tables:**
1. `drivers` - Driver information
2. `vehicles` - Fleet management
3. `materials` - Material/cargo types
4. `transport_finance` - Financial records with auto-calculated profit/loss

**4 Analytics Views:**
1. `transport_finance_summary` - Finance records with vehicle/material names
2. `daily_transport_summary` - Daily aggregated statistics
3. `vehicle_utilization` - Vehicle performance metrics
4. `material_profitability` - Material performance analytics

### SQL Files

1. **sql/transport_schema.sql** - Full schema with all features
2. **sql/transport_quick_setup.sql** - Quick copy-paste version
3. **sql/TRANSPORT_SETUP.md** - Setup instructions
4. **sql/TRANSPORT_SQL_REFERENCE.md** - Complete SQL reference guide

## Setup Instructions

### Step 1: Set Up Database Schema

#### Option A: Quick Setup (Recommended)

1. Go to [Supabase Dashboard](https://supabase.com)
2. Open your project → **SQL Editor**
3. Click **+ New Query**
4. **Copy** the entire content from `sql/transport_quick_setup.sql`
5. **Paste** into the SQL editor
6. Click **Run**
7. Wait for completion (should see no errors)

#### Option B: Full Setup with All Features

If you want audit logging and advanced RLS:

1. Follow the same steps but use `sql/transport_schema.sql` instead

### Step 2: Verify Installation

Run this query in Supabase to verify all tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('drivers', 'vehicles', 'materials', 'transport_finance')
ORDER BY table_name;
```

You should see:
```
 drivers
 materials
 transport_finance
 vehicles
```

### Step 3: Access the Module

The Transport module is now available in your app:

1. Click on **"Transport"** in the sidebar
2. You'll see 4 tabs: **Drivers**, **Vehicles**, **Materials**, **Finance**
3. Start by:
   - Adding at least one **Vehicle**
   - Adding at least one **Material**
   - Then you can create **Finance Records**

## Core Features

### 1. Drivers Management
- Add drivers with name, phone, and license number
- Set status (active/inactive)
- Search and filter drivers
- Edit and delete drivers

### 2. Vehicles Management
- Add vehicles with registration number, type, and capacity
- Set status (active/inactive/maintenance)
- Track vehicle capacity in kg
- Edit and delete vehicles

### 3. Materials Management
- Add materials/cargo types
- Define unit of measurement (kg, tons, liters, pieces, etc.)
- Set status (active/inactive)
- Edit and delete materials

### 4. Finance Tracking
**Key Features:**
- **Automatic Profit/Loss Calculation** - No manual calculation needed
- **Comprehensive Cost Tracking:**
  - Buying Price (cost of goods/materials)
  - Fuel Cost
  - Driver Fees
  - Other Expenses
- **Revenue Tracking** - Selling price
- **Payment Status** - Track paid/unpaid/pending payments
- **Customer Information** - Link to customers
- **Date Tracking** - Know when each transaction occurred

**Formula:**
```
Profit/Loss = Selling Price - (Buying Price + Fuel Cost + Driver Fees + Other Expenses)
```

## Key Features Highlighted

### Auto-Calculated Profit/Loss
You don't need to calculate profit/loss manually. The database automatically computes it whenever you create or update a finance record.

### Real-Time Finance Overview Card
The finance modal shows a live profit/loss indicator that updates as you enter values:
- **Green** = Profit
- **Red** = Loss

### Company Isolation
All data is automatically isolated by company. Users can only see their company's data thanks to Row Level Security policies.

### Data Validation
- Vehicle numbers must be unique per company
- Material names must be unique per company
- Cannot delete vehicles or materials that have finance records
- All required fields must be filled

## Useful SQL Queries

### Get Total Profit for a Date Range
```sql
SELECT SUM(profit_loss) as total_profit
FROM transport_finance
WHERE company_id = 'YOUR_COMPANY_ID'
AND date BETWEEN '2025-01-01' AND '2025-01-31';
```

### Get Most Profitable Vehicle
```sql
SELECT v.vehicle_number, SUM(tf.profit_loss) as total_profit
FROM transport_finance tf
JOIN vehicles v ON tf.vehicle_id = v.id
WHERE tf.company_id = 'YOUR_COMPANY_ID'
GROUP BY v.vehicle_number
ORDER BY total_profit DESC
LIMIT 1;
```

### Get Outstanding Payments
```sql
SELECT * FROM transport_finance
WHERE company_id = 'YOUR_COMPANY_ID'
AND payment_status IN ('unpaid', 'pending')
ORDER BY date DESC;
```

### Get Profit Margin by Material
```sql
SELECT 
  m.name,
  COUNT(*) as shipments,
  ROUND((SUM(tf.profit_loss) / SUM(tf.selling_price) * 100)::numeric, 2) as margin_pct
FROM transport_finance tf
JOIN materials m ON tf.material_id = m.id
WHERE tf.company_id = 'YOUR_COMPANY_ID'
GROUP BY m.name
ORDER BY margin_pct DESC;
```

See `sql/TRANSPORT_SQL_REFERENCE.md` for more examples.

## Testing the Module

### Quick Test Workflow

1. **Create a Vehicle**
   - Click "Transport" → "Vehicles" tab
   - Click "Add Vehicle"
   - Fill: Vehicle Number (e.g., "ABC 123"), Type (e.g., "Truck"), Capacity (e.g., "5000")
   - Click "Create Vehicle"

2. **Create a Material**
   - Click "Materials" tab
   - Click "Add Material"
   - Fill: Name (e.g., "Rockland"), Unit (e.g., "kg")
   - Click "Create Material"

3. **Create a Finance Record**
   - Click "Finance" tab
   - Click "Add Record"
   - Fill:
     - Vehicle: Select the vehicle you created
     - Material: Select the material you created
     - Buying Price: 16800
     - Fuel Cost: 4000
     - Driver Fees: 1600
     - Other Expenses: 500
     - Selling Price: 25200
     - Payment Status: Unpaid
     - Customer Name: Test Customer
   - Watch the profit/loss card update
   - Should show **Profit: 2300**
   - Click "Create Record"

4. **View the Record**
   - You should see the new record in the Finance table
   - All columns should be populated correctly
   - Profit/Loss should be calculated

## Troubleshooting

### Tables Not Created?
- Check you have admin privileges in Supabase
- Check the SQL editor shows any error messages
- Try creating one table at a time to identify the issue

### Can't Add Finance Records?
- Make sure you have at least one vehicle and one material created first
- Check that vehicle_id and material_id dropdowns have values
- Verify foreign key constraints are not blocking

### Profit/Loss Showing 0?
- Make sure you entered all the cost fields
- The calculation happens automatically - don't try to set profit_loss manually
- Check that selling_price is greater than total expenses

### No Data Showing?
- Verify you're in the correct company
- Check that the records were created successfully
- Try refreshing the page

### Permission Denied Error?
- Check your Supabase RLS policies
- Verify your user has a company_id set
- Contact support if RLS is misconfigured

## Next Steps

1. **Use the Module** - Start tracking your transport operations
2. **Customize** - Add custom fields if needed
3. **Integrate** - Connect with other modules in the system
4. **Analyze** - Use the built-in views for reporting
5. **Monitor** - Track vehicle utilization and material profitability

## File Locations

### Frontend Code
```
src/
  pages/
    Transport.tsx                    # Main page
  components/
    transport/                       # All modal components
      CreateDriverModal.tsx
      EditDriverModal.tsx
      CreateVehicleModal.tsx
      EditVehicleModal.tsx
      CreateMaterialModal.tsx
      EditMaterialModal.tsx
      TransportFinanceModal.tsx
      EditTransportFinanceModal.tsx
  hooks/
    useTransport.ts                  # Transport hooks
    useDatabase.ts                   # Updated with transport operations
  layout/
    Sidebar.tsx                      # Updated with Transport menu item
  App.tsx                            # Updated with Transport route
```

### SQL & Documentation
```
sql/
  transport_schema.sql               # Full schema with all features
  transport_quick_setup.sql          # Quick setup version
  TRANSPORT_SETUP.md                 # Setup instructions
  TRANSPORT_SQL_REFERENCE.md         # Complete SQL reference
TRANSPORT_MODULE_SETUP.md            # This file
```

## Architecture

### Frontend Flow
```
App.tsx (Route: /app/transport)
  ↓
Transport.tsx (Main page with 4 tabs)
  ├── Drivers Tab
  │   ├── Create/Edit/Delete via modals
  │   ├── useDrivers() - Fetch drivers
  │   ├── useCreateDriver() - Create
  │   ├── useUpdateDriver() - Edit
  │   └── useDeleteDriver() - Delete
  │
  ├── Vehicles Tab
  │   ├── Create/Edit/Delete via modals
  │   ├── useVehicles() - Fetch vehicles
  │   ├── useCreateVehicle() - Create
  │   ├── useUpdateVehicle() - Edit
  │   └── useDeleteVehicle() - Delete
  │
  ├── Materials Tab
  │   ├── Create/Edit/Delete via modals
  │   ├── useMaterials() - Fetch materials
  │   ├── useCreateMaterial() - Create
  │   ├── useUpdateMaterial() - Edit
  │   └── useDeleteMaterial() - Delete
  │
  └── Finance Tab
      ├── Create/Edit/Delete via modals
      ├── useTransportFinance() - Fetch records
      ├── useCreateTransportFinance() - Create
      ├── useUpdateTransportFinance() - Edit
      └── useDeleteTransportFinance() - Delete
```

### Database Flow
```
Application (React)
  ↓
Hooks (useTransport, useDatabase)
  ↓
Supabase Client (supabase.ts)
  ↓
Supabase Database
  ├── drivers table
  ├── vehicles table
  ├── materials table
  ├── transport_finance table
  └── Views (for analytics)
```

## Support & Documentation

- **Setup Issues?** See `sql/TRANSPORT_SETUP.md`
- **SQL Examples?** See `sql/TRANSPORT_SQL_REFERENCE.md`
- **Need More Help?** [Supabase Docs](https://supabase.com/docs)

## What's Next?

1. ✅ **Database Schema** - Created
2. ✅ **Frontend Components** - Created
3. ✅ **Hooks & Integration** - Created
4. ✅ **Menu Integration** - Added
5. 📋 **Your Turn** - Set up the database and start using!

---

## Quick Checklist

- [ ] Copied SQL from `sql/transport_quick_setup.sql`
- [ ] Pasted into Supabase SQL Editor
- [ ] Ran the SQL query
- [ ] Verified all 4 tables were created
- [ ] Clicked "Transport" in the sidebar
- [ ] Created at least one Vehicle
- [ ] Created at least one Material
- [ ] Created a Finance Record
- [ ] Verified profit/loss was calculated correctly
- [ ] Started tracking transport operations!

---

**Created:** January 2025
**Version:** 1.0
**Status:** Ready for Production Use

Enjoy managing your transport operations! 🚚💰
