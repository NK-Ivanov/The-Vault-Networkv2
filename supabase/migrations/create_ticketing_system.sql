-- Migration: Enhanced Ticketing and Messaging System
-- Creates tickets with chat functionality and seller-to-Vault Network messaging

-- Create tickets table (replaces/enhances enquiries)
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES public.sellers(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open', -- open, in_progress, waiting_for_client, waiting_for_seller, needs_vault_help, resolved, closed
  priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
  needs_vault_help BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create ticket_messages table for conversation threads
CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false, -- For internal notes visible only to admins
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create seller_messages table for seller-to-Vault Network communication
CREATE TABLE IF NOT EXISTS public.seller_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open', -- open, in_progress, resolved, closed
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create seller_message_replies table for conversation threads
CREATE TABLE IF NOT EXISTS public.seller_message_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_message_id UUID REFERENCES public.seller_messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_from_seller BOOLEAN DEFAULT true, -- true if from seller, false if from admin
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_client_id ON public.tickets(client_id);
CREATE INDEX IF NOT EXISTS idx_tickets_seller_id ON public.tickets(seller_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON public.ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_seller_messages_seller_id ON public.seller_messages(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_messages_status ON public.seller_messages(status);
CREATE INDEX IF NOT EXISTS idx_seller_message_replies_message_id ON public.seller_message_replies(seller_message_id);

-- Enable RLS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_message_replies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tickets
DROP POLICY IF EXISTS "Clients can view their own tickets" ON public.tickets;
CREATE POLICY "Clients can view their own tickets"
  ON public.tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.user_id = auth.uid() AND c.id = tickets.client_id
    )
  );

DROP POLICY IF EXISTS "Sellers can view their clients' tickets" ON public.tickets;
CREATE POLICY "Sellers can view their clients' tickets"
  ON public.tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid() AND s.id = tickets.seller_id
    )
  );

DROP POLICY IF EXISTS "Admins can view all tickets" ON public.tickets;
CREATE POLICY "Admins can view all tickets"
  ON public.tickets FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Clients can create tickets" ON public.tickets;
CREATE POLICY "Clients can create tickets"
  ON public.tickets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.user_id = auth.uid() AND c.id = tickets.client_id
    )
  );

DROP POLICY IF EXISTS "Sellers can update their clients' tickets" ON public.tickets;
CREATE POLICY "Sellers can update their clients' tickets"
  ON public.tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid() AND s.id = tickets.seller_id
    )
  );

DROP POLICY IF EXISTS "Admins can manage all tickets" ON public.tickets;
CREATE POLICY "Admins can manage all tickets"
  ON public.tickets FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for ticket_messages
DROP POLICY IF EXISTS "Users can view messages for their tickets" ON public.ticket_messages;
CREATE POLICY "Users can view messages for their tickets"
  ON public.ticket_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_messages.ticket_id
        AND (
          EXISTS (SELECT 1 FROM public.clients c WHERE c.user_id = auth.uid() AND c.id = t.client_id)
          OR EXISTS (SELECT 1 FROM public.sellers s WHERE s.user_id = auth.uid() AND s.id = t.seller_id)
          OR public.has_role(auth.uid(), 'admin')
        )
    )
  );

DROP POLICY IF EXISTS "Users can create messages for their tickets" ON public.ticket_messages;
CREATE POLICY "Users can create messages for their tickets"
  ON public.ticket_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_messages.ticket_id
        AND (
          EXISTS (SELECT 1 FROM public.clients c WHERE c.user_id = auth.uid() AND c.id = t.client_id)
          OR EXISTS (SELECT 1 FROM public.sellers s WHERE s.user_id = auth.uid() AND s.id = t.seller_id)
          OR public.has_role(auth.uid(), 'admin')
        )
    )
  );

-- RLS Policies for seller_messages
DROP POLICY IF EXISTS "Sellers can view their own messages" ON public.seller_messages;
CREATE POLICY "Sellers can view their own messages"
  ON public.seller_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid() AND s.id = seller_messages.seller_id
    )
  );

DROP POLICY IF EXISTS "Admins can view all seller messages" ON public.seller_messages;
CREATE POLICY "Admins can view all seller messages"
  ON public.seller_messages FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Sellers can create messages" ON public.seller_messages;
CREATE POLICY "Sellers can create messages"
  ON public.seller_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid() AND s.id = seller_messages.seller_id
    )
  );

DROP POLICY IF EXISTS "Admins can update seller messages" ON public.seller_messages;
CREATE POLICY "Admins can update seller messages"
  ON public.seller_messages FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for seller_message_replies
DROP POLICY IF EXISTS "Users can view replies to their messages" ON public.seller_message_replies;
CREATE POLICY "Users can view replies to their messages"
  ON public.seller_message_replies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.seller_messages sm
      WHERE sm.id = seller_message_replies.seller_message_id
        AND (
          EXISTS (SELECT 1 FROM public.sellers s WHERE s.user_id = auth.uid() AND s.id = sm.seller_id)
          OR public.has_role(auth.uid(), 'admin')
        )
    )
  );

DROP POLICY IF EXISTS "Users can create replies" ON public.seller_message_replies;
CREATE POLICY "Users can create replies"
  ON public.seller_message_replies FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.seller_messages sm
      WHERE sm.id = seller_message_replies.seller_message_id
        AND (
          EXISTS (SELECT 1 FROM public.sellers s WHERE s.user_id = auth.uid() AND s.id = sm.seller_id)
          OR public.has_role(auth.uid(), 'admin')
        )
    )
  );

-- Function to update ticket updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_ticket_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger to update ticket timestamp
DROP TRIGGER IF EXISTS update_ticket_timestamp ON public.tickets;
CREATE TRIGGER update_ticket_timestamp
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ticket_timestamp();

-- Function to update ticket status when message is added
CREATE OR REPLACE FUNCTION public.update_ticket_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  ticket_client_id UUID;
  ticket_seller_id UUID;
  message_user_role TEXT;
  seller_user_id UUID;
  client_user_id UUID;
BEGIN
  -- Get ticket info
  SELECT client_id, seller_id INTO ticket_client_id, ticket_seller_id
  FROM public.tickets
  WHERE id = NEW.ticket_id;

  -- Determine who sent the message
  SELECT role INTO message_user_role
  FROM public.user_roles
  WHERE user_id = NEW.user_id
  LIMIT 1;

  -- Update ticket status based on who replied
  IF message_user_role = 'client' THEN
    UPDATE public.tickets
    SET status = 'waiting_for_seller', updated_at = NOW()
    WHERE id = NEW.ticket_id;
    
    -- Notify seller/partner when client replies
    IF ticket_seller_id IS NOT NULL THEN
      SELECT user_id INTO seller_user_id
      FROM public.sellers
      WHERE id = ticket_seller_id;
      
      IF seller_user_id IS NOT NULL THEN
        PERFORM public.create_notification(
          seller_user_id,
          'ticket_message_new',
          'New Message on Ticket',
          'Your client has replied to a ticket',
          '/partner-dashboard',
          NEW.ticket_id
        );
      END IF;
    END IF;
    
  ELSIF message_user_role = 'seller' THEN
    UPDATE public.tickets
    SET status = 'waiting_for_client', updated_at = NOW()
    WHERE id = NEW.ticket_id;
    
    -- Notify client when seller replies
    IF ticket_client_id IS NOT NULL THEN
      SELECT user_id INTO client_user_id
      FROM public.clients
      WHERE id = ticket_client_id;
      
      IF client_user_id IS NOT NULL THEN
        PERFORM public.create_notification(
          client_user_id,
          'ticket_message_new',
          'New Message on Ticket',
          'Your partner has replied to your ticket',
          '/client-dashboard',
          NEW.ticket_id
        );
      END IF;
    END IF;
    
  ELSIF message_user_role = 'admin' THEN
    UPDATE public.tickets
    SET status = 'in_progress', updated_at = NOW()
    WHERE id = NEW.ticket_id;
    
    -- Notify both client and seller when admin replies
    IF ticket_client_id IS NOT NULL THEN
      SELECT user_id INTO client_user_id
      FROM public.clients
      WHERE id = ticket_client_id;
      
      IF client_user_id IS NOT NULL THEN
        PERFORM public.create_notification(
          client_user_id,
          'ticket_message_new',
          'New Message on Ticket',
          'An admin has replied to your ticket',
          '/client-dashboard',
          NEW.ticket_id
        );
      END IF;
    END IF;
    
    IF ticket_seller_id IS NOT NULL THEN
      SELECT user_id INTO seller_user_id
      FROM public.sellers
      WHERE id = ticket_seller_id;
      
      IF seller_user_id IS NOT NULL THEN
        PERFORM public.create_notification(
          seller_user_id,
          'ticket_message_new',
          'New Message on Ticket',
          'An admin has replied to a ticket',
          '/partner-dashboard',
          NEW.ticket_id
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger to update ticket status on new message
DROP TRIGGER IF EXISTS on_ticket_message_added ON public.ticket_messages;
CREATE TRIGGER on_ticket_message_added
  AFTER INSERT ON public.ticket_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ticket_on_message();

-- Function to notify users when ticket is updated
CREATE OR REPLACE FUNCTION public.notify_ticket_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  client_user_id UUID;
  seller_user_id UUID;
BEGIN
  -- Only notify on meaningful status changes (not automatic message-based status changes)
  -- Skip notifications for: open, waiting_for_seller, waiting_for_client, in_progress
  -- Only notify for: resolved, closed, needs_vault_help
  IF NEW.status != OLD.status AND NEW.client_id IS NOT NULL THEN
    -- Only notify for resolved/closed status changes (manual changes)
    IF NEW.status IN ('resolved', 'closed') THEN
      SELECT user_id INTO client_user_id
      FROM public.clients
      WHERE id = NEW.client_id;

      IF client_user_id IS NOT NULL THEN
        PERFORM public.create_notification(
          client_user_id,
          'ticket_updated',
          'Ticket ' || INITCAP(NEW.status),
          'Your ticket "' || NEW.title || '" has been ' || NEW.status,
          '/client-dashboard',
          NEW.id
        );
      END IF;
      
      -- Also notify seller if ticket is resolved/closed
      IF NEW.seller_id IS NOT NULL THEN
        SELECT user_id INTO seller_user_id
        FROM public.sellers
        WHERE id = NEW.seller_id;

        IF seller_user_id IS NOT NULL THEN
          PERFORM public.create_notification(
            seller_user_id,
            'ticket_updated',
            'Ticket ' || INITCAP(NEW.status),
            'Ticket "' || NEW.title || '" has been ' || NEW.status,
            '/partner-dashboard',
            NEW.id
          );
        END IF;
      END IF;
    END IF;
  END IF;

  -- Notify seller if ticket needs help
  IF NEW.needs_vault_help = true AND OLD.needs_vault_help = false AND NEW.seller_id IS NOT NULL THEN
    SELECT user_id INTO seller_user_id
    FROM public.sellers
    WHERE id = NEW.seller_id;

    IF seller_user_id IS NOT NULL THEN
      PERFORM public.create_notification(
        seller_user_id,
        'ticket_needs_help',
        'Ticket Needs Vault Help',
        'Ticket "' || NEW.title || '" has been marked as needing Vault Network assistance',
        '/partner-dashboard',
        NEW.id
      );
    END IF;
  END IF;

  -- Notify admins if ticket needs help
  IF NEW.needs_vault_help = true AND OLD.needs_vault_help = false THEN
    FOR seller_user_id IN
      SELECT DISTINCT ur.user_id
      FROM public.user_roles ur
      WHERE ur.role = 'admin'
    LOOP
      PERFORM public.create_notification(
        seller_user_id,
        'ticket_needs_help',
        'Ticket Needs Vault Help',
        'Ticket "' || NEW.title || '" from seller needs Vault Network assistance',
        '/admin-dashboard?tab=tickets',
        NEW.id
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger for ticket updates
DROP TRIGGER IF EXISTS on_ticket_updated ON public.tickets;
CREATE TRIGGER on_ticket_updated
  AFTER UPDATE ON public.tickets
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status OR NEW.needs_vault_help IS DISTINCT FROM OLD.needs_vault_help)
  EXECUTE FUNCTION public.notify_ticket_update();

-- Function to notify when a new ticket is created
CREATE OR REPLACE FUNCTION public.notify_new_ticket()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  seller_user_id UUID;
  admin_user_id UUID;
BEGIN
  -- Notify seller/partner if ticket has a seller_id
  IF NEW.seller_id IS NOT NULL THEN
    SELECT user_id INTO seller_user_id
    FROM public.sellers
    WHERE id = NEW.seller_id;

    IF seller_user_id IS NOT NULL THEN
      PERFORM public.create_notification(
        seller_user_id,
        'ticket_new',
        'New Ticket from Your Client',
        'New ticket from client: ' || COALESCE((SELECT business_name FROM public.clients WHERE id = NEW.client_id), 'Unknown'),
        '/partner-dashboard',
        NEW.id
      );
    END IF;
  END IF;

  -- Notify all admins
  FOR admin_user_id IN
    SELECT DISTINCT ur.user_id
    FROM public.user_roles ur
    WHERE ur.role = 'admin'
  LOOP
    PERFORM public.create_notification(
      admin_user_id,
      'ticket_new',
      'New Ticket Created',
      CASE 
        WHEN NEW.seller_id IS NOT NULL THEN
          'New ticket from client: ' || COALESCE((SELECT business_name FROM public.clients WHERE id = NEW.client_id), 'Unknown')
        ELSE
          'New ticket: ' || NEW.title
      END,
      '/admin-dashboard?tab=tickets',
      NEW.id
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Trigger for new ticket creation
DROP TRIGGER IF EXISTS on_ticket_created ON public.tickets;
CREATE TRIGGER on_ticket_created
  AFTER INSERT ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_ticket();

-- Function to notify when new seller message is created
CREATE OR REPLACE FUNCTION public.notify_new_seller_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Notify all admins
  FOR admin_user_id IN
    SELECT DISTINCT ur.user_id
    FROM public.user_roles ur
    WHERE ur.role = 'admin'
  LOOP
    PERFORM public.create_notification(
      admin_user_id,
      'seller_message_new',
      'New Message from Partner',
      'New message from partner: ' || NEW.subject,
      '/admin-dashboard?tab=seller-messages',
      NEW.id
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Trigger for new seller messages
DROP TRIGGER IF EXISTS on_seller_message_created ON public.seller_messages;
CREATE TRIGGER on_seller_message_created
  AFTER INSERT ON public.seller_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_seller_message();

