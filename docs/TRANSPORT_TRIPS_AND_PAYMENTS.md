# Transport Trips and Payment Management System

## Overview

The transport module now includes a comprehensive trip and payment management system that allows admins to:
- Create transport trips with full cost breakdown
- Assign full or partial payments to trips
- Track payment status automatically
- Record multiple payment methods
- View payment history and summaries

## Key Features

### 1. Create Trips
Located at `/app/transport/finance` → "Create Trip" button

**Trip Details:**
- Vehicle selection
- Material selection
- Trip date
- Customer name
- Financial breakdown:
  - Buying price (cost of goods)
  - Fuel cost
  - Driver fees
  - Other expenses
  - Selling price (revenue)
- Profit/Loss (auto-calculated: selling_price - total_expenses)
- Payment status (unpaid/pending/paid - auto-updated)

### 2. Record Payments
Click the "Payment" button on any trip to record full or partial payments

**Payment Details:**
- Payment amount (validated against balance due)
- Payment date
- Payment method:
  - Cash
  - Check
  - Bank Transfer
  - Mobile Money
  - Card
  - Other
- Reference number (check #, transaction ID, etc.)
- Notes for additional details

### 3. Automatic Payment Status Updates
The system automatically updates trip payment status based on total paid:
- **Unpaid**: No payments recorded, or 0% of trip amount paid
- **Pending**: Partial payment received (1-99% of trip amount paid)
- **Paid**: Full payment received (100% or more of trip amount paid)

### 4. Payment Tracking
Each trip displays:
- Trip amount (selling price)
- Total paid (sum of all payments)
- Balance due (trip amount - total paid)
- Payment count (number of payment records)
- Last payment date

## Database Schema

### transport_finance Table
```sql
CREATE TABLE transport_finance (
  id UUID PRIMARY KEY,
  company_id UUID,
  vehicle_id UUID,
  material_id UUID,
  buying_price DECIMAL(15,2),
  fuel_cost DECIMAL(15,2),
  driver_fees DECIMAL(15,2),
  other_expenses DECIMAL(15,2),
  selling_price DECIMAL(15,2),
  profit_loss DECIMAL(15,2),
  payment_status VARCHAR(50), -- paid, unpaid, pending
  customer_name VARCHAR(255),
  date DATE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### transport_payments Table (NEW)
```sql
CREATE TABLE transport_payments (
  id UUID PRIMARY KEY,
  company_id UUID,
  trip_id UUID REFERENCES transport_finance(id),
  payment_amount DECIMAL(15,2),
  payment_date DATE,
  payment_method VARCHAR(50), -- cash, check, bank_transfer, etc.
  reference_number VARCHAR(100),
  notes TEXT,
  recorded_by UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### transport_payments_summary View (NEW)
Provides aggregated payment information for each trip:
```sql
SELECT
  trip_id,
  company_id,
  selling_price,
  profit_loss,
  payment_status,
  total_paid,
  balance_due,
  payment_count,
  last_payment_date
FROM transport_payments_summary;
```

## API Hooks

### Trip Management
- `useTransportFinance(companyId)` - Fetch all trips
- `useCreateTransportFinance()` - Create new trip
- `useUpdateTransportFinance()` - Update trip details
- `useDeleteTransportFinance()` - Delete trip

### Payment Management
- `useTransportPayments(tripId)` - Fetch payments for specific trip
- `useTransportPaymentsSummary(companyId)` - Fetch payment summaries
- `useCreateTransportPayment()` - Record new payment
- `useUpdateTransportPayment()` - Update payment details
- `useDeleteTransportPayment()` - Delete payment record

## Components

### CreateTripModal
- Located: `src/components/transport/TransportFinanceModal.tsx`
- Creates new transport trips with cost breakdown
- Auto-calculates profit/loss

### EditTripModal
- Located: `src/components/transport/EditTransportFinanceModal.tsx`
- Edit existing trip details

### RecordTripPaymentModal
- Located: `src/components/transport/RecordTripPaymentModal.tsx`
- Record single or multiple payments per trip
- Validates payment amount against balance
- Prevents overpayment
- Shows real-time balance calculations

## UI Views

### Finance Section (`/app/transport/finance`)
Displays all trips with:
- Date
- Vehicle information
- Customer name
- Trip amount
- Profit/Loss
- Payment status badge
- Actions:
  - Record Payment (disabled if fully paid)
  - Edit trip details
  - Delete trip

## Payment Workflow

### Typical Flow:
1. **Create Trip**: Admin creates a trip with:
   - Vehicle and material details
   - All costs and revenue
   - Initial payment status (unpaid)

2. **Record Payment**: Admin clicks "Payment" to record:
   - First payment: Sets status to "pending"
   - Partial payments: Maintains "pending" status
   - Full payment: Sets status to "paid"

3. **Multiple Payments**: Trip can have multiple payments recorded:
   - Each payment tracked separately
   - Payment method and reference recorded
   - Automatic rollup of total paid vs balance

4. **Complete Trip**: Once fully paid, trip shows "Paid" badge

## Validation Rules

- Payment amount must be greater than 0
- Payment amount cannot exceed balance due
- Trip amount must be set before recording payments
- At least one vehicle and material must be selected for a trip
- Payment date defaults to today but can be set to any date

## Data Integrity

- All payments linked to specific trip via `trip_id`
- Company isolation via `company_id` in both tables
- Row-level security policies enforce company isolation
- Cascading delete on trip deletion (payments auto-deleted)
- Auto-updated timestamps on modifications

## Future Enhancements

Potential features to add:
- Payment reminders/notifications
- Partial payment installment plans
- Payment reconciliation reports
- Integration with accounting system
- Payment receipt generation
- Bulk payment recording
- Payment allocation by expense type (fuel, driver, etc.)
