# Testing Stripe Payments Locally

## Option 1: Stripe Test Mode (Easiest)

### Setup:
1. **Use Test API Keys:**
   - In Netlify, use your **test** keys:
     - `STRIPE_SECRET_KEY` = `sk_test_...` (not `sk_live_...`)
     - `VITE_STRIPE_PUBLISHABLE_KEY` = `pk_test_...` (not `pk_live_...`)

2. **Test Card Numbers:**
   Use these cards in checkout (any future expiry, any CVC):
   - ✅ **Success:** `4242 4242 4242 4242`
   - ✅ **Success:** `5555 5555 5555 4444`
   - ❌ **Decline:** `4000 0000 0000 0002`
   - ❌ **Insufficient Funds:** `4000 0000 0000 9995`

3. **Test Webhook:**
   - In Stripe Dashboard → Developers → Webhooks
   - Create webhook endpoint pointing to your **test mode**
   - Use test webhook secret: `whsec_test_...`

### Testing Flow:
1. Go to Client Dashboard
2. Click "Purchase Now" on an automation
3. Use test card: `4242 4242 4242 4242`
4. Complete checkout
5. Check Stripe Dashboard → Payments (test mode) to see the payment
6. Check webhook logs to verify it processed

---

## Option 2: Stripe CLI (Best for Local Development)

### Install Stripe CLI:
```bash
# Windows (using Scoop or Chocolatey)
scoop install stripe
# OR
choco install stripe

# Or download from: https://stripe.com/docs/stripe-cli
```

### Login to Stripe CLI:
```bash
stripe login
```

### Forward Webhooks to Local Dev Server:
```bash
# If using Netlify Dev
stripe listen --forward-to http://localhost:8888/.netlify/functions/stripe-webhook

# If using Vite dev server (port 8080)
# Note: You'll need to proxy webhooks through Netlify Dev
stripe listen --forward-to http://localhost:8888/.netlify/functions/stripe-webhook
```

### Trigger Test Events:
```bash
# Simulate checkout.session.completed
stripe trigger checkout.session.completed

# Simulate invoice.payment_succeeded
stripe trigger invoice.payment_succeeded
```

### Get Webhook Secret for Local Testing:
```bash
stripe listen --print-secret
```
Copy the secret (starts with `whsec_`) and add to your `.env`:
```
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Option 3: Stripe Dashboard Test Mode Webhooks

### Setup Test Webhook:
1. Go to Stripe Dashboard → Developers → Webhooks
2. Make sure you're in **Test mode** (toggle in top right)
3. Click "Add endpoint"
4. Endpoint URL: `https://vaultnet.work/.netlify/functions/stripe-webhook`
5. Select events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
6. Copy the **Signing secret** (starts with `whsec_test_...`)
7. Add to Netlify environment variables as `STRIPE_WEBHOOK_SECRET`

### Test Payment Flow:
1. Use test card `4242 4242 4242 4242` in checkout
2. Complete payment
3. Check webhook logs in Stripe Dashboard → Webhooks → Your endpoint → Logs
4. Verify payment status updated in your database

---

## Testing Checklist

- [ ] Using test API keys (`sk_test_...` and `pk_test_...`)
- [ ] Test webhook endpoint configured
- [ ] Test webhook secret added to Netlify
- [ ] Test payment completed with test card
- [ ] Webhook received and processed (check Stripe Dashboard logs)
- [ ] Payment status updated to "paid" in database
- [ ] Transaction records created
- [ ] Client total_spent updated

---

## Common Test Scenarios

### Test Successful Payment:
1. Use card: `4242 4242 4242 4242`
2. Complete checkout
3. Verify: Payment marked as "paid" in database

### Test Declined Payment:
1. Use card: `4000 0000 0000 0002`
2. Checkout will fail (as expected)
3. Payment should NOT be marked as paid

### Test Monthly Recurring Payment:
1. Complete initial payment with test card
2. Wait for next billing cycle OR
3. Use Stripe CLI: `stripe trigger invoice.payment_succeeded`
4. Verify: Monthly transaction created

---

## Switching Between Test and Live Mode

### For Testing:
- Use `sk_test_...` and `pk_test_...` keys
- Use test webhook secret `whsec_test_...`
- Use test cards

### For Production:
- Use `sk_live_...` and `pk_live_...` keys
- Use live webhook secret `whsec_live_...`
- Real cards will be charged

**Important:** Never use live keys in development or test cards in production!

