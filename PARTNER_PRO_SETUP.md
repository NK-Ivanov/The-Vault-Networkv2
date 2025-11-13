# Partner Pro Subscription Setup Guide

## Overview
Partner Pro is a paid subscription tier ($24.99/month) that unlocks premium features for Verified partners. This guide explains how to set up the Stripe integration.

## Prerequisites
1. Stripe account with API keys
2. Netlify Functions support (already configured)
3. Environment variables set up

## Setup Steps

### 1. Create Stripe Price for Partner Pro

In your Stripe Dashboard:
1. Go to **Products** → **Add Product**
2. Create a new product:
   - **Name**: Partner Pro
   - **Description**: Premium subscription for Vault Network partners
   - **Pricing**: 
     - **Recurring**: Monthly
     - **Price**: $24.99 USD
3. Copy the **Price ID** (starts with `price_...`)

### 2. Set Environment Variable

Add to your Netlify environment variables (Site settings > Environment variables):

```
STRIPE_PARTNER_PRO_PRICE_ID=price_xxxxxxxxxxxxx
```

Replace `price_xxxxxxxxxxxxx` with the actual Price ID from Step 1.

### 3. Run Database Migration

Run the migration in your Supabase SQL Editor:
```sql
-- File: supabase/migrations/add_partner_pro_subscription.sql
```

This adds:
- `partner_pro_subscription_id` - Stripe subscription ID
- `partner_pro_subscription_status` - 'active', 'canceled', 'past_due', 'inactive'
- `partner_pro_subscription_started_at` - When subscription started
- `partner_pro_subscription_ends_at` - When current period ends

### 4. Configure Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://vaultnet.work/.netlify/functions/stripe-webhook`
3. Select events:
   - `checkout.session.completed` - When subscription is purchased
   - `customer.subscription.updated` - When subscription status changes
   - `customer.subscription.deleted` - When subscription is canceled
4. Copy the webhook signing secret (starts with `whsec_...`)
5. Add to Netlify environment variables:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

## How It Works

### Subscription Flow:
1. User at Verified rank clicks "Upgrade to Partner Pro"
2. Calls `partner-pro-checkout` Netlify function
3. Creates Stripe Checkout Session
4. User completes payment on Stripe
5. Redirects back to dashboard with success
6. `verify-partner-pro-subscription` function verifies and activates subscription
7. Webhook also handles activation as backup

### Subscription Management:
- Webhook automatically updates subscription status on:
  - Payment success
  - Payment failure
  - Subscription cancellation
  - Subscription renewal

### UI Updates:
- When subscription is active:
  - Rank display shows "Partner Pro" instead of "Verified"
  - Partner Pro badge appears
  - XP bars show Partner Pro status
  - All upgrade prompts are hidden

## Features Unlocked with Partner Pro:
- Premium automation templates
- Advanced analytics dashboard
- Priority support & dedicated assistance
- Enhanced commission rates (45%)
- Exclusive community access
- Advanced training & masterclasses

## Testing

### Test Mode:
1. Use Stripe test mode API keys
2. Use test card: `4242 4242 4242 4242`
3. Any future expiry date and CVC

### Production:
1. Switch to live Stripe API keys
2. Use real payment methods
3. Monitor webhook events in Stripe Dashboard

## Troubleshooting

### Subscription not activating:
- Check webhook is receiving events in Stripe Dashboard
- Verify `STRIPE_WEBHOOK_SECRET` is set correctly
- Check Netlify function logs for errors
- Verify `STRIPE_PARTNER_PRO_PRICE_ID` is correct

### Subscription status not updating:
- Check webhook events are being sent
- Verify seller_id is in subscription metadata
- Check Supabase logs for update errors

