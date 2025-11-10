-- Admin Role Assignment for User ID: d60b415e-8e2f-4461-9d4b-035726caacc4
-- Just run this entire script in Supabase SQL Editor

-- Assign admin role
INSERT INTO public.user_roles (user_id, role)
VALUES ('d60b415e-8e2f-4461-9d4b-035726caacc4', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify the role was assigned
SELECT 
  ur.user_id,
  ur.role,
  u.email,
  ur.created_at as role_assigned_at
FROM public.user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE ur.user_id = 'd60b415e-8e2f-4461-9d4b-035726caacc4';

-- If you see your email with role = 'admin', you're all set!
-- Log out and log back in to access the admin dashboard.

