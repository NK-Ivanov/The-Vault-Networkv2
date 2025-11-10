-- Migration: Add automation assignment tables
-- This allows:
-- 1. Admins to assign automations to sellers
-- 2. Sellers to assign automations to their clients
-- 3. Clients to see automations assigned to them

-- Create seller_automations table (admin assigns automations to sellers)
CREATE TABLE IF NOT EXISTS public.seller_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE NOT NULL,
  automation_id UUID REFERENCES public.automations(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(seller_id, automation_id)
);

-- Create client_automations table (sellers assign automations to clients)
CREATE TABLE IF NOT EXISTS public.client_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  automation_id UUID REFERENCES public.automations(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES public.sellers(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active', -- active, inactive
  UNIQUE(client_id, automation_id)
);

-- Enable RLS
ALTER TABLE public.seller_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_automations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for seller_automations
-- Sellers can view their assigned automations
CREATE POLICY "Sellers can view their assigned automations"
  ON public.seller_automations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.id = seller_automations.seller_id
    )
  );

-- Admins can manage all seller_automations
CREATE POLICY "Admins can manage seller_automations"
  ON public.seller_automations FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for client_automations
-- Clients can view their assigned automations
CREATE POLICY "Clients can view their assigned automations"
  ON public.client_automations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.user_id = auth.uid()
        AND c.id = client_automations.client_id
    )
  );

-- Sellers can view automations for their clients
CREATE POLICY "Sellers can view their clients' automations"
  ON public.client_automations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.id = client_automations.seller_id
    )
  );

-- Sellers can assign automations to their clients
CREATE POLICY "Sellers can assign automations to their clients"
  ON public.client_automations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.id = client_automations.seller_id
        AND EXISTS (
          SELECT 1 FROM public.clients c
          WHERE c.id = client_automations.client_id
            AND c.seller_id = s.id
        )
        AND EXISTS (
          SELECT 1 FROM public.seller_automations sa
          WHERE sa.seller_id = s.id
            AND sa.automation_id = client_automations.automation_id
        )
    )
  );

-- Sellers can update automations for their clients
CREATE POLICY "Sellers can update their clients' automations"
  ON public.client_automations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.id = client_automations.seller_id
    )
  );

-- Admins can manage all client_automations
CREATE POLICY "Admins can manage all client_automations"
  ON public.client_automations FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

