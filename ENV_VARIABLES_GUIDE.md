# Stripe Integration - Environment Variables Guide

## Local Development (.env file)

Create a `.env` file in the root directory with these variables:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App URL
APP_URL=http://localhost:8080
VITE_APP_URL=http://localhost:8080
```

## Netlify Deployment

Set these environment variables in Netlify Dashboard:
**Site settings > Environment variables**

### Required Variables:
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `SUPABASE_URL` - Your Supabase project URL (for server-side functions)
- `VITE_SUPABASE_URL` - Your Supabase project URL (for client-side code)
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `APP_URL` - Your production URL (e.g., https://vaultnet.work)
- `VITE_APP_URL` - Your production URL (for client-side code)

## Important Notes:

1. **VITE_ Prefix**: Variables with `VITE_` prefix are exposed to client-side code (browser)
   - Use for public keys and URLs that need to be accessible in the browser
   - Example: `VITE_SUPABASE_URL`, `VITE_APP_URL`

2. **No VITE_ Prefix**: Variables without `VITE_` prefix are server-side only
   - Use for secret keys and sensitive data
   - Only accessible in Netlify Functions (server-side)
   - Example: `STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

3. **Netlify Functions**: 
   - Can access both `VITE_` and non-`VITE_` variables
   - Use non-`VITE_` versions for security (e.g., `SUPABASE_URL` instead of `VITE_SUPABASE_URL`)
   - The functions are updated to check both versions for compatibility

4. **Local Development**:
   - Create `.env` file in root directory
   - Vite automatically loads `.env` file
   - Netlify Functions can access these via `process.env`

5. **Security**:
   - Never commit `.env` file to git (should be in `.gitignore`)
   - Use `.env.example` as a template
   - Use test keys for development, live keys for production

