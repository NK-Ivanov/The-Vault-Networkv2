-- Script to delete all test accounts except:
-- 1. vanovvaultnetwork@gmail.com
-- 2. system@vaultnetwork.internal
--
-- WARNING: This will permanently delete all user accounts except the two specified above
-- Related records in profiles, user_roles, sellers, clients, learners, notifications, etc.
-- will be automatically deleted due to ON DELETE CASCADE constraints
--
-- Run this in your Supabase SQL Editor

DO $$
DECLARE
  user_count INT;
  deleted_count INT;
  remaining_email TEXT;
BEGIN
  -- Count total users before deletion
  SELECT COUNT(*) INTO user_count FROM auth.users;
  
  RAISE NOTICE 'Total users before deletion: %', user_count;
  
  -- Count users to be kept
  SELECT COUNT(*) INTO deleted_count 
  FROM auth.users 
  WHERE email IN ('vanovvaultnetwork@gmail.com', 'system@vaultnetwork.internal');
  
  RAISE NOTICE 'Users to keep: %', deleted_count;
  
  -- Temporarily disable the lock_seller_id trigger on clients table
  -- This trigger prevents seller_id updates, which conflicts with ON DELETE SET NULL
  -- when sellers are deleted
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'lock_seller_id' 
    AND tgrelid = 'public.clients'::regclass
  ) THEN
    RAISE NOTICE 'Temporarily disabling lock_seller_id trigger';
    ALTER TABLE public.clients DISABLE TRIGGER lock_seller_id;
  END IF;
  
  -- Delete all users except the two specified emails
  -- This will cascade delete related records in:
  -- - profiles (ON DELETE CASCADE)
  -- - user_roles (ON DELETE CASCADE)
  -- - sellers (ON DELETE CASCADE) - which will set client.seller_id to NULL (if trigger is disabled)
  -- - clients (ON DELETE CASCADE) - clients linked to deleted users
  -- - learners (ON DELETE CASCADE)
  -- - notifications (ON DELETE CASCADE)
  -- Note: Some tables like tickets use ON DELETE SET NULL, so those records will remain with null user_id
  
  DELETE FROM auth.users
  WHERE email NOT IN ('vanovvaultnetwork@gmail.com', 'system@vaultnetwork.internal');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RAISE NOTICE 'Deleted % test user accounts', deleted_count;
  
  -- Re-enable the lock_seller_id trigger
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'lock_seller_id' 
    AND tgrelid = 'public.clients'::regclass
  ) THEN
    RAISE NOTICE 'Re-enabling lock_seller_id trigger';
    ALTER TABLE public.clients ENABLE TRIGGER lock_seller_id;
  END IF;
  
  RAISE NOTICE 'Remaining users: %', (SELECT COUNT(*) FROM auth.users);
  
  -- Show remaining users for verification
  RAISE NOTICE 'Remaining users:';
  FOR remaining_email IN 
    SELECT email FROM auth.users ORDER BY email
  LOOP
    RAISE NOTICE '  - %', remaining_email;
  END LOOP;
END $$;

-- Verify remaining users
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at IS NOT NULL as email_confirmed
FROM auth.users
ORDER BY email;

-- Check if profiles exist for remaining users
SELECT 
  p.id,
  p.email,
  p.full_name,
  ur.role
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.id = ur.user_id
ORDER BY p.email;

