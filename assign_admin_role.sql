-- Admin Role Assignment Script
-- Run this in your Supabase SQL Editor
-- 
-- IMPORTANT: Run this directly in SQL Editor (not through the app)
-- This bypasses RLS policies since you're running as a database superuser

-- STEP 1: Find your user email or ID
-- Run this to see all users:
SELECT id, email, created_at, email_confirmed_at
FROM auth.users 
ORDER BY created_at DESC;

-- STEP 2: Assign admin role by email (replace with your email)
-- Change 'vanovvaultnetwork@gmail.com' to your actual email address
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'vanovvaultnetwork@gmail.com'  -- CHANGE THIS TO YOUR EMAIL
ON CONFLICT (user_id, role) DO NOTHING;

-- STEP 3: Verify the role was assigned
SELECT 
  ur.id,
  ur.user_id,
  ur.role,
  u.email,
  u.created_at as user_created_at,
  ur.created_at as role_assigned_at
FROM public.user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE ur.role = 'admin'
ORDER BY ur.created_at DESC;

-- ALTERNATIVE: If you know your user ID, use this simpler version:
-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('YOUR_USER_ID_HERE', 'admin'::app_role)
-- ON CONFLICT (user_id, role) DO NOTHING;

-- TROUBLESHOOTING:
-- If you get an RLS policy error, you can temporarily disable RLS:
-- ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
-- (Then re-enable it after: ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;)
