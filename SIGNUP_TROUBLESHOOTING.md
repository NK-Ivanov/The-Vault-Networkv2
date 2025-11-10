# Signup Troubleshooting Guide

## Common Issues and Solutions

### Issue: Signup doesn't create user or send email

**Possible Causes:**

1. **Email Confirmation is Enabled but Email Service Not Configured**
   - Supabase requires email confirmation by default
   - If email service isn't configured, emails won't be sent
   - Users are still created in the database, but can't log in until email is confirmed

2. **Supabase Project Settings**
   - Check Authentication → Email Auth settings
   - Verify "Enable email confirmations" setting
   - If enabled, configure email service (SMTP or Supabase Email)

**Solutions:**

### Option 1: Disable Email Confirmation (Development/Testing)
1. Go to Supabase Dashboard → Authentication → Settings
2. Find "Enable email confirmations"
3. Toggle it OFF
4. Users will be automatically logged in after signup

### Option 2: Configure Email Service (Production)
1. Go to Supabase Dashboard → Authentication → Email Templates
2. Configure SMTP settings OR use Supabase Email service
3. Test email delivery

### Option 3: Check Database
1. Go to Supabase Dashboard → Table Editor
2. Check `auth.users` table - user should be created even if email isn't sent
3. Check `profiles` table - profile should be created automatically via trigger

## How to Verify Signup is Working

1. **Check Browser Console**
   - Open Developer Tools (F12)
   - Look for console logs when signing up
   - Should see: "Attempting signup for: [email]"
   - Should see: "Signup response: { user: ..., session: ... }"

2. **Check Supabase Dashboard**
   - Authentication → Users
   - Should see new user listed
   - Check if email is confirmed

3. **Check Database**
   - Table Editor → `profiles`
   - Should see profile record with matching user ID

## Testing Signup Flow

1. Fill in all fields (Name, Email, Password)
2. Click "Sign Up"
3. Check browser console for errors
4. Check toast notification for success/error message
5. If email confirmation required, check email inbox
6. If auto-login enabled, should redirect to home page

## Debugging Steps

If signup still doesn't work:

1. **Check Network Tab**
   - Open Developer Tools → Network
   - Look for POST request to `/auth/v1/signup`
   - Check response for errors

2. **Check Supabase Logs**
   - Go to Supabase Dashboard → Logs
   - Look for authentication errors

3. **Verify Environment Variables**
   - Check `.env` file or Netlify environment variables
   - Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are set

4. **Test Database Trigger**
   - Manually insert a user in `auth.users` table
   - Check if profile is created automatically
   - If not, trigger may need to be recreated

## Code Changes Made

The signup handler now includes:
- Input validation
- Better error handling
- Console logging for debugging
- Profile creation verification
- Clearer user feedback

Check `src/pages/Login.tsx` for the updated `handleSignup` function.

