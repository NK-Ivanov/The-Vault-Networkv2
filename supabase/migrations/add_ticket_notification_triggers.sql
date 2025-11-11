-- Add missing notification triggers for tickets
-- Run this if you've already run create_ticketing_system.sql but don't have notifications

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

-- Update the existing function to also send notifications on new messages
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

-- Update the notify_ticket_update function to only notify on meaningful status changes
-- This prevents redundant "Ticket Status Updated" notifications for automatic status changes
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
