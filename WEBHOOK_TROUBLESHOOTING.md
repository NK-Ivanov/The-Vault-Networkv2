# Webhook Setup Troubleshooting Guide

## Problem: Payment completed but database not updated

This means the Stripe webhook isn't receiving or processing events correctly.

## Step 1: Check Webhook Setup in Stripe Dashboard

1. Go to **Stripe Dashboard → Developers → Webhooks**
2. Make sure you're in **Test mode** (toggle in top right)
3. Check if you have a webhook endpoint configured:
   - Endpoint URL: `https://vaultnet.work/.netlify/functions/stripe-webhook`
   - Events: `checkout.session.completed` and `invoice.payment_succeeded`

**If webhook doesn't exist:**
1. Click **"Add endpoint"**
2. Endpoint URL: `https://vaultnet.work/.netlify/functions/stripe-webhook`
3. Select events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
4. Click **"Add endpoint"**
5. Copy the **Signing secret** (starts with `whsec_test_...`)

## Step 2: Add Webhook Secret to Netlify

1. Go to **Netlify Dashboard → Site settings → Environment variables**
2. Add variable:
   - **Key:** `STRIPE_WEBHOOK_SECRET`
   - **Value:** `whsec_test_...` (from Stripe Dashboard)
3. **Redeploy** your site

## Step 3: Check Webhook Logs

1. Go to **Stripe Dashboard → Developers → Webhooks**
2. Click on your webhook endpoint
3. Click **"Logs"** tab
4. Look for recent events - you should see `checkout.session.completed`
5. Click on an event to see:
   - **Status:** Should be "Succeeded" (200) or show error
   - **Response:** Should show what your webhook returned

## Step 4: Check Netlify Function Logs

1. Go to **Netlify Dashboard → Functions → stripe-webhook → Logs**
2. Look for errors or success messages
3. Common errors:
   - "Missing stripe-signature header" → Webhook not configured correctly
   - "Webhook signature verification failed" → Wrong webhook secret
   - "Client automation not found" → Metadata issue

## Step 5: Test Webhook Manually

### Option A: Use Stripe Dashboard
1. Go to **Stripe Dashboard → Payments** (test mode)
2. Find your test payment
3. Click on it
4. Look for the checkout session ID
5. Go to **Developers → Events**
6. Find `checkout.session.completed` event
7. Click **"Send test webhook"** → Select your endpoint

### Option B: Use Stripe CLI (if installed)
```bash
stripe trigger checkout.session.completed
```

## Step 6: Verify Metadata is Being Sent

The webhook needs `automation_id` and `client_id` in the checkout session metadata.

Check in Stripe Dashboard:
1. Go to **Payments → [Your Payment]**
2. Click on the **Checkout Session**
3. Scroll to **Metadata** section
4. Should see:
   - `automation_id`: [UUID]
   - `automation_name`: [Name]
   - `client_id`: [UUID]

If metadata is missing, the webhook will log: "Missing metadata in checkout session"

## Common Issues:

### Issue 1: Webhook Secret Not Set
**Symptom:** Webhook returns 500 error
**Fix:** Add `STRIPE_WEBHOOK_SECRET` to Netlify environment variables

### Issue 2: Wrong Webhook Secret
**Symptom:** "Webhook signature verification failed"
**Fix:** Make sure you're using the test webhook secret (`whsec_test_...`) for test mode

### Issue 3: Webhook Not Receiving Events
**Symptom:** No events in Stripe webhook logs
**Fix:** Make sure webhook endpoint URL is correct and deployed

### Issue 4: Metadata Missing
**Symptom:** "Missing metadata in checkout session" in logs
**Fix:** Check `stripe-checkout.ts` is sending metadata correctly

## Quick Fix Checklist:

- [ ] Webhook endpoint exists in Stripe Dashboard (test mode)
- [ ] Webhook endpoint URL: `https://vaultnet.work/.netlify/functions/stripe-webhook`
- [ ] Events selected: `checkout.session.completed` and `invoice.payment_succeeded`
- [ ] `STRIPE_WEBHOOK_SECRET` set in Netlify (starts with `whsec_test_...`)
- [ ] Site redeployed after adding webhook secret
- [ ] Check webhook logs in Stripe Dashboard for recent events
- [ ] Check Netlify function logs for errors

## After Fixing:

1. Make a new test payment
2. Check Stripe webhook logs - should see event received
3. Check Netlify function logs - should see "Payment processed successfully"
4. Refresh Client Dashboard - payment status should update to "Paid"

