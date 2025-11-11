# CORS Fix for Netlify Functions

## Problem
CORS errors when calling Netlify Functions from localhost during development.

## Solution Applied

### 1. Added CORS Headers to All Responses
Both `stripe-sync-automation.ts` and `stripe-checkout.ts` now include:
- `Access-Control-Allow-Origin: *` header in all responses
- OPTIONS handler for preflight requests
- Content-Type headers for proper JSON responses

### 2. Updated Function URL Logic
The `callNetlifyFunction` utility now:
- Detects local development (localhost/127.0.0.1)
- Uses Netlify Dev proxy URL (`http://localhost:8888`) for local dev
- Falls back to production URL for deployed environments

## For Local Development

### Option 1: Use Netlify Dev (Recommended)
```bash
npm install -g netlify-cli
netlify dev
```
This will:
- Start your Vite dev server on port 8080
- Start Netlify Functions proxy on port 8888
- Handle CORS automatically

Then update your `.env`:
```env
VITE_NETLIFY_DEV_URL=http://localhost:8888
```

### Option 2: Deploy Functions First
If you can't use Netlify Dev locally:
1. Deploy your functions to Netlify
2. The CORS headers will allow requests from any origin
3. Functions will work from localhost after deployment

### Option 3: Use Production URL
If you're testing against production:
- Make sure `VITE_APP_URL` is set to `https://vaultnet.work`
- CORS headers will allow the requests

## Testing

After deploying or running Netlify Dev:
1. Try syncing an automation in Admin Dashboard
2. Check browser console - CORS errors should be gone
3. Stripe sync should work successfully

## Security Note

The CORS headers use `*` (allow all origins) for simplicity. For production, you may want to restrict this to specific domains:

```typescript
'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
```

