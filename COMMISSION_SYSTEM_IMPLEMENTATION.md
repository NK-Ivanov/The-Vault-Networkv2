# Enhanced Commission System Implementation

## Overview
This document describes the complete commission system implementation where every sale splits between Vault's share and Seller's share, with flexible commission rate management.

## Database Changes

### Migration: `supabase/migrations/enhanced_commission_system.sql`
Run this migration to:
1. Add `commission_rate_used`, `vault_share`, and `seller_earnings` columns to `transactions` table
2. Create `calculate_commission()` function that determines commission based on:
   - Seller's custom commission rate (if set) - OVERRIDES automation default
   - Automation's default commission rate (if seller has no custom rate)
3. Create trigger to automatically update seller totals when transactions are created

### Key Database Function: `calculate_commission()`
```sql
SELECT * FROM public.calculate_commission(
  p_seller_id UUID,
  p_automation_id UUID,
  p_amount DECIMAL
);
```

Returns:
- `commission_rate` - The rate that was used (seller custom or automation default)
- `seller_earnings` - Amount seller earns
- `vault_share` - Amount Vault receives

## Commission Logic Flow

### When a Sale Happens:
1. **Check Seller's Custom Rate**
   - If `sellers.commission_rate` is NOT NULL → Use this rate for ALL automations
   - This overrides any automation default

2. **Fallback to Automation Default**
   - If seller has no custom rate → Use `automations.default_commission_rate`
   - Each automation can have its own default (e.g., 70%, 65%, 75%)

3. **Calculate Split**
   - Seller Earnings = Sale Amount × Commission Rate / 100
   - Vault Share = Sale Amount - Seller Earnings

4. **Store in Transaction**
   - `commission_rate_used` - Which rate was applied
   - `seller_earnings` - Seller's portion
   - `vault_share` - Vault's portion
   - `commission` - Same as seller_earnings (for backward compatibility)

## Admin Dashboard Features

### A. Automation Commission Settings
- **Location**: Automations tab
- **Features**:
  - View default commission rate for each automation
  - Edit default commission rate when creating/editing automations
  - Changing rate only affects FUTURE sales (not retroactive)

### B. Seller Commission Overrides
- **Location**: Partners tab → Click "View Details" on any seller
- **Features**:
  - View seller's current commission rate
  - Set custom commission rate (overrides all automation defaults)
  - Clear custom rate (seller uses automation defaults)
  - Visual indicator showing if seller has custom rate or uses defaults

### UI Improvements:
- Commission rate field shows placeholder "Auto (uses automation default)" when null
- Helper text explains: "Custom rate: X% (overrides all automation defaults)" or "Uses each automation's default commission rate"
- Toast notifications explain what happens when commission is updated

## Seller Dashboard Features

### Commission Rate Display
- Shows current commission rate in stats card
- Displays "Auto" if using automation defaults
- Shows custom rate percentage if seller has override
- Helper text explains whether rate is custom or default

### Transaction History & Earnings
- **New Section**: "Transaction History & Earnings"
- Shows all transactions with:
  - Date, Client, Automation, Type
  - Sale Amount (total)
  - Your Earnings (seller's portion)
  - Vault Share (platform's portion)
  - Rate Used (commission rate applied)
- Summary totals:
  - Total Sales
  - Total Earnings

## Stripe Webhook Updates

### Updated: `netlify/functions/stripe-webhook.ts`
- Now calculates commission for each transaction using `calculate_commission()` function
- Stores commission breakdown in transaction record:
  - `commission_rate_used`
  - `seller_earnings`
  - `vault_share`
- Applies to both setup fees and monthly payments

## Example Scenarios

### Scenario 1: Seller with Custom Rate
- Seller has custom rate: 80%
- Automation default: 70%
- **Result**: Seller gets 80% (custom rate overrides)

### Scenario 2: Seller without Custom Rate
- Seller commission_rate: NULL
- Automation default: 70%
- **Result**: Seller gets 70% (uses automation default)

### Scenario 3: Sale = £100, Rate = 70%
- Seller Earnings: £70
- Vault Share: £30
- Transaction stores: commission_rate_used=70, seller_earnings=70, vault_share=30

## Next Steps

1. **Run Database Migration**:
   ```sql
   -- Run in Supabase SQL Editor
   -- File: supabase/migrations/enhanced_commission_system.sql
   ```

2. **Verify Function Works**:
   ```sql
   -- Test the commission calculation
   SELECT * FROM public.calculate_commission(
     'seller_id_here',
     'automation_id_here',
     100.00
   );
   ```

3. **Update Existing Transactions** (Optional):
   - If you have existing transactions without commission data, you can backfill them
   - Use the `calculate_commission()` function to recalculate

4. **Test the Flow**:
   - Create an automation with default commission (e.g., 70%)
   - Assign it to a seller
   - Set seller's custom rate (e.g., 80%)
   - Complete a test purchase
   - Verify commission is calculated correctly in transaction record

## Notes

- Commission rates are stored as percentages (e.g., 70.00 = 70%)
- The system supports decimal rates (e.g., 70.5%)
- Seller totals (`total_sales`, `total_commission`) are automatically updated via trigger
- Commission calculation happens at transaction creation time (not retroactive)
- Changing commission rates only affects future sales

