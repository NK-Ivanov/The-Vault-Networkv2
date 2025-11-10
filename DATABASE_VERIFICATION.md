# Database Connection Verification Guide

## Quick Check: Are You Connected to the Right Database?

When you sign up, check the browser console (F12) for these messages:

### 1. Connection Info
Look for: `🔗 Connecting to Supabase:`
- **URL**: Should match your Supabase project URL
- **Key Prefix**: First 20 characters of your API key
- **Origin**: Your website URL

### 2. Database Connection Test
Look for: `✅ Database connection verified` or `❌ Database connection test failed`
- If it fails, you're likely connected to the wrong database or credentials are incorrect

### 3. User Creation
Look for: `👤 User created with ID: [uuid]`
- This confirms the user was created in `auth.users` table

### 4. Profile Creation
Look for: `✅ Profile created successfully` or `⚠️ Profile not created automatically`
- If profile isn't created, the database trigger may not be set up

## Steps to Verify Database Connection

### Step 1: Check Environment Variables

**In Netlify:**
1. Go to Site Settings → Environment Variables
2. Verify these exist:
   - `VITE_SUPABASE_URL` - Should be: `https://[your-project-ref].supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` - Should start with `eyJ...`

**In Local Development:**
1. Check `.env` file in project root
2. Should contain:
   ```
   VITE_SUPABASE_URL=https://[your-project-ref].supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
   ```

### Step 2: Verify Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to Settings → API
4. Compare:
   - **Project URL** should match `VITE_SUPABASE_URL`
   - **anon/public key** should match `VITE_SUPABASE_PUBLISHABLE_KEY`

### Step 3: Check Database Tables

In Supabase Dashboard → Table Editor:

1. **Check `auth.users` table:**
   - Go to Authentication → Users
   - After signup, you should see the new user
   - Check if email is confirmed

2. **Check `profiles` table:**
   - Go to Database → Tables → `profiles`
   - After signup, profile should be created automatically
   - If missing, the trigger isn't working

### Step 4: Verify Database Trigger

1. Go to Database → Triggers
2. Look for trigger named: `on_auth_user_created`
3. Should be:
   - **Table**: `auth.users`
   - **Event**: `INSERT`
   - **Function**: `handle_new_user()`

If trigger is missing, run this SQL in SQL Editor:

```sql
-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Step 5: Check Email Settings

1. Go to Authentication → Settings
2. Check **"Enable email confirmations"**:
   - **ON**: User must confirm email before profile is created (normal behavior)
   - **OFF**: User is auto-logged in, profile created immediately

3. If emails aren't being sent:
   - Go to Authentication → Email Templates
   - Configure SMTP settings OR use Supabase Email service
   - Or disable email confirmation for testing

## Common Issues

### Issue: Wrong Database URL
**Symptoms:**
- Console shows different URL than expected
- Database connection test fails
- Users created but can't be found

**Solution:**
- Update `VITE_SUPABASE_URL` in Netlify/local environment
- Redeploy/restart dev server

### Issue: Wrong API Key
**Symptoms:**
- Authentication errors
- "Invalid API key" messages

**Solution:**
- Use the **anon/public** key, NOT the service_role key
- Update `VITE_SUPABASE_PUBLISHABLE_KEY` in environment variables

### Issue: Trigger Not Working
**Symptoms:**
- User created in `auth.users`
- Profile NOT created in `profiles`
- Console shows: "Profile not created automatically"

**Solution:**
- Run the trigger creation SQL (see Step 4)
- Check Database → Functions → `handle_new_user()` exists
- Verify RLS policies allow trigger to insert

### Issue: Email Confirmation Required
**Symptoms:**
- User created but no session
- No email received
- Profile not created

**Solution:**
- Check Authentication → Settings → Email confirmations
- Either configure email service OR disable for testing
- If disabled, user will auto-login and profile will be created

## Testing Checklist

After making changes:

- [ ] Console shows correct Supabase URL
- [ ] Database connection test passes
- [ ] User appears in `auth.users` table
- [ ] Profile appears in `profiles` table (or email confirmation is pending)
- [ ] Console shows success messages
- [ ] No error messages in console

## Still Having Issues?

1. **Check Console Logs**: Look for error messages with ❌
2. **Check Supabase Logs**: Dashboard → Logs → Filter by "auth"
3. **Verify RLS Policies**: Database → Policies → Check `profiles` table policies
4. **Test Directly**: Try creating a user manually in Supabase Dashboard

