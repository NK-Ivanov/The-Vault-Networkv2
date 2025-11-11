# Payment and Setup Status System - Setup Guide

## Overview
This system automatically tracks payment status when clients purchase automations via Stripe, and allows admins to manage setup status.

## Database Migration

Run this migration in Supabase SQL Editor:
```sql
-- File: supabase/migrations/add_payment_and_setup_status.sql
```

This adds:
- `payment_status` - 'unpaid' or 'paid'
- `setup_status` - 'pending_setup', 'setup_in_progress', or 'active'
- `stripe_checkout_session_id` - For tracking payments
- `stripe_subscription_id` - For recurring payments
- `paid_at` - Timestamp when payment was received

## Stripe Webhook Setup

### 1. Create Webhook Endpoint in Stripe Dashboard
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://vaultnet.work/.netlify/functions/stripe-webhook`
4. Select events to listen to:
   - `checkout.session.completed` - When client completes payment
   - `invoice.payment_succeeded` - When monthly payment succeeds

### 2. Get Webhook Secret
1. After creating webhook, click on it
2. Copy the "Signing secret" (starts with `whsec_...`)
3. Add to Netlify environment variables as `STRIPE_WEBHOOK_SECRET`

### 3. Environment Variables
Add to Netlify:
```
STRIPE_WEBHOOK_SECRET=whsec_... (from Stripe Dashboard)
```

## How It Works

### Payment Flow:
1. Client clicks "Purchase Now" → Stripe Checkout
2. Client completes payment
3. Stripe sends `checkout.session.completed` webhook
4. Webhook handler:
   - Marks automation as `paid`
   - Sets `paid_at` timestamp
   - Creates transaction records
   - Updates client `total_spent`

### Setup Status Flow:
1. Admin views "Client Automations" tab
2. Admin selects setup status dropdown
3. Status updates immediately
4. Client and Partner see updated status

## Features

✅ **Automatic Payment Tracking** - Webhook marks automations as paid
✅ **Setup Status Management** - Admin can update status (Pending Setup → Setup In Progress → Active)
✅ **Status Visibility** - Both Client and Partner dashboards show payment and setup status
✅ **Transaction Records** - All payments create transaction records
✅ **Monthly Payments** - Webhook handles recurring monthly payments automatically

## Testing

1. **Test Payment Flow:**
   - Assign automation to client (as Partner)
   - Client purchases automation
   - Check Stripe Dashboard for webhook events
   - Verify automation marked as "paid" in database

2. **Test Setup Status:**
   - Admin → Client Automations tab
   - Change setup status dropdown
   - Verify status updates
   - Check Client Dashboard shows updated status

## Troubleshooting

- **Payments not marking as paid:** Check Stripe webhook logs and verify `STRIPE_WEBHOOK_SECRET` is set
- **Status not updating:** Check RLS policies allow admin updates
- **Webhook not receiving events:** Verify webhook URL is correct and endpoint is deployed

