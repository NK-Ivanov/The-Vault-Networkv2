-- Migration: Remake Ticket System
-- Makes Vault Network always part of ticket chats and simplifies the system

-- Add a helper function to check if a user is admin (simpler version)
CREATE OR REPLACE FUNCTION public.is_admin_user(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;

-- Update the ticket message trigger to always notify admins when a ticket is created
CREATE OR REPLACE FUNCTION public.notify_new_ticket()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  seller_user_id UUID;
  client_user_id UUID;
  admin_user_ids UUID[];
BEGIN
  -- Notify seller
  IF NEW.seller_id IS NOT NULL THEN
    SELECT user_id INTO seller_user_id
    FROM public.sellers
    WHERE id = NEW.seller_id;
    
    IF seller_user_id IS NOT NULL THEN
      PERFORM public.create_notification(
        seller_user_id,
        'ticket_message_new',
        'New Ticket from Your Client',
        'A new ticket has been created by your client',
        '/partner-dashboard',
        NEW.id
      );
    END IF;
  END IF;
  
  -- Always notify all admins when a new ticket is created
  -- This makes Vault Network automatically part of every ticket
  SELECT ARRAY_AGG(user_id) INTO admin_user_ids
  FROM public.user_roles
  WHERE role = 'admin';
  
  IF admin_user_ids IS NOT NULL THEN
    FOREACH seller_user_id IN ARRAY admin_user_ids
    LOOP
      PERFORM public.create_notification(
        seller_user_id,
        'ticket_message_new',
        'New Ticket Created',
        'A new ticket has been created',
        '/admin-dashboard?tab=tickets',
        NEW.id
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update ticket message trigger to simplify notifications
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
  is_admin_message BOOLEAN;
  admin_user_ids UUID[];
BEGIN
  -- Get ticket info
  SELECT client_id, seller_id INTO ticket_client_id, ticket_seller_id
  FROM public.tickets
  WHERE id = NEW.ticket_id;

  -- Check if sender is admin
  SELECT public.is_admin_user(NEW.user_id) INTO is_admin_message;
  
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
    
    -- Notify seller and admins when client replies
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
    
    -- Notify admins
    SELECT ARRAY_AGG(user_id) INTO admin_user_ids
    FROM public.user_roles
    WHERE role = 'admin';
    
    IF admin_user_ids IS NOT NULL THEN
      FOREACH seller_user_id IN ARRAY admin_user_ids
      LOOP
        PERFORM public.create_notification(
          seller_user_id,
          'ticket_message_new',
          'New Message on Ticket',
          'A client has replied to a ticket',
          '/admin-dashboard?tab=tickets',
          NEW.ticket_id
        );
      END LOOP;
    END IF;
    
  ELSIF message_user_role = 'seller' THEN
    UPDATE public.tickets
    SET status = 'waiting_for_client', updated_at = NOW()
    WHERE id = NEW.ticket_id;
    
    -- Notify client and admins when seller replies
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
    
    -- Notify admins
    SELECT ARRAY_AGG(user_id) INTO admin_user_ids
    FROM public.user_roles
    WHERE role = 'admin';
    
    IF admin_user_ids IS NOT NULL THEN
      FOREACH seller_user_id IN ARRAY admin_user_ids
      LOOP
        PERFORM public.create_notification(
          seller_user_id,
          'ticket_message_new',
          'New Message on Ticket',
          'A partner has replied to a ticket',
          '/admin-dashboard?tab=tickets',
          NEW.ticket_id
        );
      END LOOP;
    END IF;
    
  ELSIF is_admin_message OR message_user_role = 'admin' THEN
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
          'The Vault Network has replied to your ticket',
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
          'The Vault Network has replied to a ticket',
          '/partner-dashboard',
          NEW.ticket_id
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Update the notify_ticket_update function to handle needs_vault_help properly
CREATE OR REPLACE FUNCTION public.notify_ticket_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  client_user_id UUID;
  seller_user_id UUID;
  admin_user_ids UUID[];
BEGIN
  -- Only notify on meaningful status changes (not automatic message-based status changes)
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

  -- When seller requests help, notify all admins and move ticket to Vault Network tab
  IF NEW.needs_vault_help = true AND OLD.needs_vault_help = false THEN
    -- Notify all admins
    SELECT ARRAY_AGG(user_id) INTO admin_user_ids
    FROM public.user_roles
    WHERE role = 'admin';
    
    IF admin_user_ids IS NOT NULL THEN
      FOREACH seller_user_id IN ARRAY admin_user_ids
      LOOP
        PERFORM public.create_notification(
          seller_user_id,
          'ticket_updated',
          'Ticket Needs Vault Network Help',
          'A partner has requested help with ticket: ' || NEW.title,
          '/admin-dashboard?tab=tickets&subtab=vault-network',
          NEW.id
        );
      END LOOP;
    END IF;
    
    -- Also notify the seller that help was requested
    IF NEW.seller_id IS NOT NULL THEN
      SELECT user_id INTO seller_user_id
      FROM public.sellers
      WHERE id = NEW.seller_id;

      IF seller_user_id IS NOT NULL THEN
        PERFORM public.create_notification(
          seller_user_id,
          'ticket_updated',
          'Help Requested',
          'You have requested help from The Vault Network',
          '/partner-dashboard',
          NEW.id
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Ensure triggers are set up correctly
DROP TRIGGER IF EXISTS on_ticket_created ON public.tickets;
CREATE TRIGGER on_ticket_created
  AFTER INSERT ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_ticket();

DROP TRIGGER IF EXISTS on_ticket_message_added ON public.ticket_messages;
CREATE TRIGGER on_ticket_message_added
  AFTER INSERT ON public.ticket_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ticket_on_message();

DROP TRIGGER IF EXISTS on_ticket_updated ON public.tickets;
CREATE TRIGGER on_ticket_updated
  AFTER UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_ticket_update();

