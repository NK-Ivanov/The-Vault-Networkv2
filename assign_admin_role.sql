-- Admin Role Assignment Script
-- Run this in your Supabase SQL Editor

-- OPTION 1: Assign admin role to a user by email (replace with your email)
-- This will find your user ID from auth.users and assign the admin role

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'YOUR_EMAIL_HERE@example.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- OPTION 2: If you know your user ID, use this instead:
-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('YOUR_USER_ID_HERE', 'admin')
-- ON CONFLICT (user_id, role) DO NOTHING;

-- OPTION 3: To find your user ID first, run this query:
-- SELECT id, email, created_at 
-- FROM auth.users 
-- ORDER BY created_at DESC;

-- After running the INSERT, verify the role was assigned:
-- SELECT ur.*, u.email 
-- FROM public.user_roles ur
-- JOIN auth.users u ON ur.user_id = u.id
-- WHERE ur.role = 'admin';

