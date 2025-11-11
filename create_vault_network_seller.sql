-- Migration: Create "The Vault Network" seller account
-- This seller account is for clients who sign up without a referral code
-- Run this in your Supabase SQL Editor

-- First, check if we need to create a system user for The Vault Network
-- We'll use a special email that won't conflict
DO $$
DECLARE
  vault_user_id UUID;
  vault_seller_id UUID;
BEGIN
  -- Check if Vault Network seller already exists
  SELECT id INTO vault_seller_id
  FROM public.sellers
  WHERE referral_code = 'VAULT-NETWORK'
  LIMIT 1;

  -- If it doesn't exist, create it
  IF vault_seller_id IS NULL THEN
    -- Create a system user for The Vault Network (if it doesn't exist)
    -- Note: This user won't be able to log in, but it's needed for the seller record
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      confirmation_token,
      recovery_token
    )
    SELECT 
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'system@vaultnetwork.internal',
      crypt('system_account_not_for_login', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"The Vault Network"}',
      false,
      '',
      ''
    WHERE NOT EXISTS (
      SELECT 1 FROM auth.users WHERE email = 'system@vaultnetwork.internal'
    )
    RETURNING id INTO vault_user_id;

    -- If user was created, get its ID
    IF vault_user_id IS NULL THEN
      SELECT id INTO vault_user_id FROM auth.users WHERE email = 'system@vaultnetwork.internal';
    END IF;

    -- Create The Vault Network seller account
    INSERT INTO public.sellers (
      user_id,
      business_name,
      referral_code,
      status,
      commission_rate
    )
    VALUES (
      vault_user_id,
      'The Vault Network',
      'VAULT-NETWORK',
      'approved',
      0.00  -- No commission for system account
    )
    ON CONFLICT (referral_code) DO NOTHING
    RETURNING id INTO vault_seller_id;

    -- Create profile for the system user
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
      vault_user_id,
      'system@vaultnetwork.internal',
      'The Vault Network'
    )
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE 'Vault Network seller account created with ID: %', vault_seller_id;
  ELSE
    RAISE NOTICE 'Vault Network seller account already exists with ID: %', vault_seller_id;
  END IF;

  -- Assign ALL existing automations to The Vault Network seller
  INSERT INTO public.seller_automations (seller_id, automation_id)
  SELECT vault_seller_id, id
  FROM public.automations
  WHERE is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM public.seller_automations 
      WHERE seller_id = vault_seller_id 
        AND automation_id = automations.id
    );

  RAISE NOTICE 'Assigned all active automations to The Vault Network seller';
END $$;

-- Verify the seller was created
SELECT id, business_name, referral_code, status 
FROM public.sellers 
WHERE referral_code = 'VAULT-NETWORK';

-- Verify automations were assigned
SELECT 
  sa.id,
  a.name as automation_name,
  sa.created_at as assigned_at
FROM public.seller_automations sa
JOIN public.automations a ON sa.automation_id = a.id
JOIN public.sellers s ON sa.seller_id = s.id
WHERE s.referral_code = 'VAULT-NETWORK'
ORDER BY sa.created_at DESC;

