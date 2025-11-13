-- Migration: Add contact_email column to clients table
-- This allows storing contact email addresses for clients

ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- Add index for faster lookups by email
CREATE INDEX IF NOT EXISTS idx_clients_contact_email ON public.clients(contact_email) WHERE contact_email IS NOT NULL;

