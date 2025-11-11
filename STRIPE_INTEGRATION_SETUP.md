# Stripe Integration Setup Guide

## Overview
This integration automatically syncs automations with Stripe Products and Prices, enabling seamless payment processing.

## Prerequisites
1. Stripe account with API keys
2. Netlify Functions support (already configured)
3. Environment variables set up

## Environment Variables Required

Add these to your Netlify environment variables (Site settings > Environment variables):

```
STRIPE_SECRET_KEY=sk_test_... (or sk_live_... for production)
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
VITE_APP_URL=https://vaultnet.work (or your production URL)
```

## Installation Steps

### 1. Install Stripe Package
```bash
npm install stripe
npm install --save-dev @types/node
```

### 2. Run Database Migration
Run the migration file in your Supabase SQL Editor:
```sql
-- File: supabase/migrations/add_stripe_integration.sql
```

This adds three columns to the `automations` table:
- `stripe_product_id` - Stripe Product ID
- `stripe_setup_price_id` - Stripe Price ID for setup fee
- `stripe_monthly_price_id` - Stripe Price ID for monthly subscription

### 3. Deploy Netlify Functions
The functions are already created in `netlify/functions/`:
- `stripe-sync-automation.ts` - Syncs automation with Stripe
- `stripe-checkout.ts` - Creates checkout sessions

Make sure these are deployed with your Netlify site.

### 4. How It Works

#### When Admin Adds/Edits Automation:
1. Automation is saved to Supabase
2. Automatically calls `stripe-sync-automation` function
3. Creates/updates Stripe Product
4. Creates Stripe Prices (setup + monthly)
5. Saves Stripe IDs back to Supabase

#### When Client Purchases:
1. Client clicks "Buy Now" button
2. Calls `stripe-checkout` function
3. Creates Stripe Checkout Session
4. Redirects to Stripe payment page
5. After payment, redirects back to success page

## Features

✅ **Auto-sync on Create/Update** - Automations automatically sync with Stripe
✅ **Manual Sync Button** - Admins can manually sync any automation
✅ **Sync Status Indicator** - Visual indicator shows if automation is synced
✅ **Price Updates** - When prices change, new Stripe Prices are created
✅ **One-time + Recurring** - Supports both setup fee and monthly subscription

## Testing

1. Add a new automation in Admin Dashboard
2. Check that it shows "Synced" status
3. Verify in Stripe Dashboard that Product and Prices were created
4. Test checkout flow (use Stripe test cards)

## Next Steps (Optional)

1. **Webhook Handler** - Set up webhook to handle payment events
2. **Transaction Tracking** - Update transactions table on payment success
3. **Subscription Management** - Add UI to manage client subscriptions

