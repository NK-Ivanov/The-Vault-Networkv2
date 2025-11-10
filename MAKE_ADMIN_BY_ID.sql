-- Quick Guide: Make Yourself Admin Using Your User ID

-- STEP 1: Find your User ID
-- Run this query in Supabase SQL Editor to see all users:
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC;

-- Copy your user ID (it's a UUID that looks like: 123e4567-e89b-12d3-a456-426614174000)

-- STEP 2: Assign Admin Role Using Your User ID
-- Replace 'YOUR_USER_ID_HERE' with the ID you copied from Step 1:
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR_USER_ID_HERE', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;

-- STEP 3: Verify it worked
SELECT 
  ur.user_id,
  ur.role,
  u.email
FROM public.user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE ur.user_id = 'YOUR_USER_ID_HERE';  -- Use your user ID here

-- After running this, log out and log back in to access the admin dashboard!

