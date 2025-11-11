# Troubleshooting 502 Error on Netlify Functions

## Problem
Getting 502 Bad Gateway error when calling Stripe sync function on live site.

## Common Causes & Solutions

### 1. Missing Environment Variables ⚠️ MOST COMMON
The function needs these environment variables set in Netlify:
- `STRIPE_SECRET_KEY`
- `SUPABASE_URL` or `VITE_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

**Check:** Go to Netlify Dashboard → Site settings → Environment variables
**Fix:** Add missing variables and redeploy

### 2. Functions Not Deployed
Netlify Functions need to be deployed with your site.

**Check:** After deploying, check Netlify Dashboard → Functions tab
**Fix:** Make sure `netlify/functions/` directory exists and functions are committed

### 3. TypeScript Compilation Issues
Netlify needs to compile TypeScript functions.

**Check:** Look at Netlify build logs for TypeScript errors
**Fix:** Make sure `stripe` and `@supabase/supabase-js` are in `package.json` dependencies

### 4. Function Timeout
Functions might be timing out.

**Check:** Netlify function logs
**Fix:** Increased timeout to 10 seconds in `netlify.toml`

### 5. Missing Dependencies
Functions need `stripe` and `@supabase/supabase-js` packages.

**Check:** `package.json` should have both packages
**Fix:** They're already in `package.json` - make sure they're installed

## Debugging Steps

1. **Check Netlify Function Logs:**
   - Go to Netlify Dashboard → Functions → stripe-sync-automation
   - Check "Logs" tab for error messages
   - Look for environment variable errors

2. **Verify Environment Variables:**
   - Netlify Dashboard → Site settings → Environment variables
   - Make sure all 7 variables are set (including `VITE_SUPABASE_PUBLISHABLE_KEY`)

3. **Check Build Logs:**
   - Netlify Dashboard → Deploys → Latest deploy → Build log
   - Look for function compilation errors

4. **Test Function Directly:**
   - Try calling the function URL directly:
   ```
   POST https://vaultnet.work/.netlify/functions/stripe-sync-automation
   ```

## Quick Fix Checklist

- [ ] All 7 environment variables set in Netlify
- [ ] Functions directory exists: `netlify/functions/`
- [ ] `stripe` package in `package.json` dependencies
- [ ] `@supabase/supabase-js` package in `package.json` dependencies
- [ ] `netlify.toml` has `[functions]` section configured
- [ ] Site has been redeployed after adding environment variables

## After Fixing

1. **Redeploy your site** (push a new commit or trigger manual deploy)
2. **Wait for build to complete**
3. **Check Functions tab** in Netlify Dashboard - should show your functions
4. **Test again** - sync should work now

The updated functions now include better error messages that will tell you exactly what's missing!

