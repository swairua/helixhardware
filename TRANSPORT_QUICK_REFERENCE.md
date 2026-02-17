# 🚚 Transport Module - Quick Reference Card

## Setup Command (Copy & Paste)

**Go to Supabase SQL Editor and run the content from:**
```
sql/transport_quick_setup.sql
```

**Takes:** 2 minutes ⏱️

---

## Access Points

| Feature | URL | Location |
|---------|-----|----------|
| Transport Module | `/app/transport` | Sidebar → Transport |
| Drivers Tab | Dashboard shows drivers table | Click "Drivers" tab |
| Vehicles Tab | Dashboard shows vehicles table | Click "Vehicles" tab |
| Materials Tab | Dashboard shows materials table | Click "Materials" tab |
| Finance Tab | Dashboard shows finance records | Click "Finance" tab |

---

## Key Database Tables

### drivers
```
id | company_id | name | phone | license_number | status
```

### vehicles
```
id | company_id | vehicle_number | vehicle_type | capacity | status
```

### materials
```
id | company_id | name | description | unit | status
```

### transport_finance
```
id | company_id | vehicle_id | material_id | 
buying_price | fuel_cost | driver_fees | other_expenses | 
selling_price | profit_loss (AUTO) | payment_status | customer_name | date
```

---

## Profit/Loss Formula

```
profit_loss = selling_price - (buying_price + fuel_cost + driver_fees + other_expenses)
```

**Automatic** - Database calculates it!

---

## Status Values

### Drivers
- `active` (default)
- `inactive`

### Vehicles
- `active` (default)
- `inactive`
- `maintenance`

### Materials
- `active` (default)
- `inactive`

### Finance Payments
- `unpaid` (default)
- `paid`
- `pending`

---

## Quick SQL Queries

### Daily Profit
```sql
SELECT SUM(profit_loss) FROM transport_finance 
WHERE company_id = 'YOUR_ID' AND date = CURRENT_DATE;
```

### Total Revenue
```sql
SELECT SUM(selling_price) FROM transport_finance 
WHERE company_id = 'YOUR_ID';
```

### Outstanding Payments
```sql
SELECT COUNT(*) FROM transport_finance 
WHERE company_id = 'YOUR_ID' AND payment_status != 'paid';
```

### Vehicle Profit
```sql
SELECT v.vehicle_number, SUM(tf.profit_loss)
FROM transport_finance tf
JOIN vehicles v ON tf.vehicle_id = v.id
WHERE tf.company_id = 'YOUR_ID'
GROUP BY v.vehicle_number;
```

---

## Component Tree

```
Transport.tsx (Main Page)
├── Drivers Tab
│   ├── Table of drivers
│   ├── Create/Edit/Delete buttons
│   └── Modals (Create + Edit)
├── Vehicles Tab
│   ├── Table of vehicles
│   ├── Create/Edit/Delete buttons
│   └── Modals (Create + Edit)
├── Materials Tab
│   ├── Table of materials
│   ├── Create/Edit/Delete buttons
│   └── Modals (Create + Edit)
└── Finance Tab
    ├── Table of finance records
    ├── Profit/Loss indicators
    ├── Create/Edit/Delete buttons
    └── Modals (Create + Edit)
```

---

## Hook Functions

### Drivers
```typescript
useDrivers(companyId)              // Get all drivers
useCreateDriver()                  // Create new driver
useUpdateDriver()                  // Update driver
useDeleteDriver()                  // Delete driver
```

### Vehicles
```typescript
useVehicles(companyId)             // Get all vehicles
useCreateVehicle()                 // Create new vehicle
useUpdateVehicle()                 // Update vehicle
useDeleteVehicle()                 // Delete vehicle
```

### Materials
```typescript
useMaterials(companyId)            // Get all materials
useCreateMaterial()                // Create new material
useUpdateMaterial()                // Update material
useDeleteMaterial()                // Delete material
```

### Finance
```typescript
useTransportFinance(companyId)     // Get all finance records
useCreateTransportFinance()        // Create new record
useUpdateTransportFinance()        // Update record
useDeleteTransportFinance()        // Delete record
```

---

## Example Usage

### Get Drivers
```typescript
const { data: drivers } = useDrivers(companyId);
```

### Create Vehicle
```typescript
await createVehicle.mutateAsync({
  vehicle_number: 'KCE 2838',
  vehicle_type: 'Truck',
  capacity: 5000,
  status: 'active',
  company_id: companyId
});
```

### Create Finance Record
```typescript
await createFinance.mutateAsync({
  vehicle_id: 'vehicle-uuid',
  material_id: 'material-uuid',
  buying_price: 16800,
  fuel_cost: 4000,
  driver_fees: 1600,
  other_expenses: 500,
  selling_price: 25200,
  // profit_loss is AUTO-CALCULATED - don't set it!
  payment_status: 'unpaid',
  customer_name: 'Customer Name',
  date: '2025-01-18',
  company_id: companyId
});
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Tables not created | Run `transport_quick_setup.sql` in Supabase SQL Editor |
| Can't add finance record | Create vehicle and material first |
| Profit/Loss showing 0 | All expense fields must have values |
| No data visible | Verify you're in correct company |
| Permission error | Check RLS policies in Supabase |
| Duplicate vehicle error | Vehicle numbers must be unique per company |

---

## File Locations

```
Frontend Code:
  src/pages/Transport.tsx
  src/components/transport/*.tsx (8 modal components)
  src/hooks/useTransport.ts
  src/hooks/useDatabase.ts (updated)
  src/App.tsx (updated)
  src/components/layout/Sidebar.tsx (updated)

SQL:
  sql/transport_quick_setup.sql (USE THIS!)
  sql/transport_schema.sql (full version)
  sql/TRANSPORT_SETUP.md
  sql/TRANSPORT_SQL_REFERENCE.md

Documentation:
  TRANSPORT_MODULE_SETUP.md (complete guide)
  TRANSPORT_DELIVERY_SUMMARY.md (what you got)
  TRANSPORT_QUICK_REFERENCE.md (this file)
```

---

## API Operations

### Insert Driver
```typescript
await supabase.from('drivers').insert({
  company_id: 'id',
  name: 'Name',
  phone: '+2547xx',
  license_number: 'DL001',
  status: 'active'
});
```

### Update Vehicle
```typescript
await supabase.from('vehicles')
  .update({ status: 'maintenance' })
  .eq('id', 'vehicle-id');
```

### Get Finance Summary
```typescript
await supabase.from('transport_finance_summary')
  .select('*')
  .eq('company_id', 'company-id');
```

### Mark Payment as Paid
```typescript
await supabase.from('transport_finance')
  .update({ payment_status: 'paid' })
  .eq('id', 'record-id');
```

---

## Reports You Can Generate

1. **Daily Profit Report** - Today's profit/loss
2. **Monthly Summary** - All metrics by month
3. **Vehicle Performance** - Profit by vehicle
4. **Material Profitability** - Profit by material
5. **Payment Status** - Outstanding payments
6. **Customer Summary** - Revenue by customer

See `sql/TRANSPORT_SQL_REFERENCE.md` for queries!

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Search | Ctrl+F (browser search) |
| Add Record | Click "Add" button |
| Edit Record | Click edit icon in table |
| Delete Record | Click trash icon, confirm |
| Close Modal | Esc or click X |

---

## Data Validation

### Required Fields
- **All tables:** company_id, status
- **Drivers:** name
- **Vehicles:** vehicle_number
- **Materials:** name
- **Finance:** vehicle_id, material_id, date

### Constraints
- Vehicle numbers unique per company
- Material names unique per company
- Dates must be valid
- Numeric fields must be numbers ≥ 0

---

## Performance Tips

1. ✓ Indexes created on all common query fields
2. ✓ Use date filters for large datasets
3. ✓ Archive old records if >10,000 rows
4. ✓ Use views for reporting (faster)
5. ✓ Search as you type for real-time filtering

---

## Security

- ✓ Row Level Security - Users only see company data
- ✓ Company Isolation - Data cannot be mixed
- ✓ Audit Logging - All changes tracked
- ✓ Auth Required - Must be logged in
- ✓ Foreign Keys - Prevent data corruption

---

## Version & Support

- **Version:** 1.0
- **Status:** Production Ready
- **License:** Same as parent project
- **Support:** See documentation files

---

## Next Steps

1. Copy `sql/transport_quick_setup.sql`
2. Paste into Supabase SQL Editor
3. Click Run
4. Wait for success message
5. Open Transport module
6. Start using!

---

**Questions?** See `TRANSPORT_MODULE_SETUP.md` or `sql/TRANSPORT_SQL_REFERENCE.md`

**Ready to go!** 🚀
