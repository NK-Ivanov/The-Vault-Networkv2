# Netlify Environment Variables Setup

## Required Variables for Netlify Dashboard

Go to: **Netlify Dashboard > Your Site > Site settings > Environment variables**

### Required Variables (7 total):

```env
# Stripe Configuration (server-side only)
STRIPE_SECRET_KEY=sk_test_... (or sk_live_... for production)

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (anon/public key)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (service_role key)

# App URL Configuration
APP_URL=https://vaultnet.work
VITE_APP_URL=https://vaultnet.work
```

## Variable Breakdown:

### 1. STRIPE_SECRET_KEY
- **Type**: Secret (server-side only)
- **Purpose**: Used by Netlify Functions to create Stripe products/prices and checkout sessions
- **Where used**: `stripe-sync-automation.ts`, `stripe-checkout.ts`
- **Security**: Never expose this to client-side code

### 2. SUPABASE_URL
- **Type**: Server-side only
- **Purpose**: Used by Netlify Functions to connect to Supabase
- **Where used**: `stripe-sync-automation.ts`, `stripe-checkout.ts`
- **Note**: Functions check both `SUPABASE_URL` and `VITE_SUPABASE_URL` for compatibility

### 3. VITE_SUPABASE_URL
- **Type**: Public (exposed to client-side)
- **Purpose**: Used by React app to connect to Supabase
- **Where used**: React components, client-side code
- **Security**: This is safe to expose (it's a public URL)

### 4. VITE_SUPABASE_PUBLISHABLE_KEY ⚠️ REQUIRED
- **Type**: Public (exposed to client-side)
- **Purpose**: Used by React app for authentication and database queries (respects RLS)
- **Where used**: `src/integrations/supabase/client.ts` - **REQUIRED for app to work!**
- **Security**: Safe to expose (it's the "anon" or "public" key from Supabase)
- **Note**: This is different from the service role key - this one respects RLS policies

### 5. SUPABASE_SERVICE_ROLE_KEY
- **Type**: Secret (server-side only)
- **Purpose**: Used by Netlify Functions to bypass RLS policies
- **Where used**: `stripe-sync-automation.ts`, `stripe-checkout.ts`
- **Security**: Never expose this to client-side code
- **Note**: This is different from the publishable key - this bypasses RLS

### 6. APP_URL
- **Type**: Server-side only
- **Purpose**: Used by Netlify Functions for redirect URLs
- **Where used**: `stripe-checkout.ts` (for success/cancel URLs)
- **Value**: `https://vaultnet.work`

### 7. VITE_APP_URL
- **Type**: Public (exposed to client-side)
- **Purpose**: Used by React app to determine function URLs
- **Where used**: `src/lib/netlify-functions.ts`
- **Value**: `https://vaultnet.work`

## Key Differences:

### Publishable Key vs Service Role Key:

| Key Type | Variable Name | Used By | RLS Behavior | Security |
|----------|--------------|---------|--------------|----------|
| **Publishable/Anon** | `VITE_SUPABASE_PUBLISHABLE_KEY` | React App | Respects RLS | Safe to expose |
| **Service Role** | `SUPABASE_SERVICE_ROLE_KEY` | Netlify Functions | Bypasses RLS | Keep secret |

**You need BOTH:**
- **Publishable Key**: For your React app to authenticate users and query data
- **Service Role Key**: For Netlify Functions to perform admin operations

## Where to Find Your Supabase Keys:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings → API**
4. You'll see:
   - **Project URL** → Use for `VITE_SUPABASE_URL` and `SUPABASE_URL`
   - **anon public** key → Use for `VITE_SUPABASE_PUBLISHABLE_KEY`
   - **service_role** key → Use for `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

## How to Set in Netlify:

1. Go to your Netlify site dashboard
2. Click **Site settings**
3. Click **Environment variables** in the left sidebar
4. Click **Add a variable** for each variable above
5. Set the **Scope**:
   - **All scopes** (default) - applies to all deployments
   - Or specific scopes (production, deploy previews, branch deploys)

## Important Notes:

- **VITE_ prefix**: Variables with `VITE_` are exposed to client-side code (browser)
- **No VITE_ prefix**: Variables without `VITE_` are server-side only (Netlify Functions)
- **Never commit secrets**: These should only be in Netlify dashboard, not in `.env` file in git
- **Test vs Live**: Use `sk_test_...` for Stripe test mode, `sk_live_...` for production

## Quick Setup Checklist:

- [ ] STRIPE_SECRET_KEY (from Stripe Dashboard)
- [ ] SUPABASE_URL (from Supabase Dashboard)
- [ ] VITE_SUPABASE_URL (same as SUPABASE_URL)
- [ ] **VITE_SUPABASE_PUBLISHABLE_KEY** (anon/public key from Supabase) ⚠️ REQUIRED
- [ ] SUPABASE_SERVICE_ROLE_KEY (service_role key from Supabase)
- [ ] APP_URL (https://vaultnet.work)
- [ ] VITE_APP_URL (https://vaultnet.work)

## After Setting Variables:

1. **Redeploy** your site (or push a new commit)
2. Netlify Functions will automatically have access to these variables
3. Test by syncing an automation in Admin Dashboard

