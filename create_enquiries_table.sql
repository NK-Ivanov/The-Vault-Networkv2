-- Create enquiries table (for customer inquiries and support)
-- Run this in your Supabase SQL Editor if you haven't already created the table

CREATE TABLE IF NOT EXISTS public.enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  business_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new', -- new, contacted, converted, closed
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for enquiries
-- Drop policies if they exist first, then create them
DROP POLICY IF EXISTS "Clients can view their own enquiries" ON public.enquiries;
CREATE POLICY "Clients can view their own enquiries"
  ON public.enquiries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.user_id = auth.uid()
        AND c.id = enquiries.client_id
    )
  );

DROP POLICY IF EXISTS "Anyone can insert enquiries" ON public.enquiries;
CREATE POLICY "Anyone can insert enquiries"
  ON public.enquiries FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage all enquiries" ON public.enquiries;
CREATE POLICY "Admins can manage all enquiries"
  ON public.enquiries FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

