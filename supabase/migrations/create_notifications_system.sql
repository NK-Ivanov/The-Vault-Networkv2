-- Migration: Notifications System
-- Creates notifications table and triggers for enquiry updates

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'enquiry_new', 'enquiry_updated', 'enquiry_assigned', 'automation_assigned', 'payment_received', 'system_update'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT, -- Optional link to related resource
  related_id UUID, -- ID of related resource (enquiry_id, transaction_id, etc.)
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_link TEXT DEFAULT NULL,
  p_related_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, link, related_id)
  VALUES (p_user_id, p_type, p_title, p_message, p_link, p_related_id)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Trigger function to notify admins when new enquiry is created
CREATE OR REPLACE FUNCTION public.notify_new_enquiry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_user RECORD;
BEGIN
  -- Notify all admins
  FOR admin_user IN
    SELECT DISTINCT ur.user_id
    FROM public.user_roles ur
    WHERE ur.role = 'admin'
  LOOP
    PERFORM public.create_notification(
      admin_user.user_id,
      'enquiry_new',
      'New Enquiry Received',
      CASE 
        WHEN NEW.client_id IS NOT NULL THEN
          'New enquiry from registered client: ' || NEW.business_name
        ELSE
          'New enquiry from website visitor: ' || NEW.business_name
      END,
      '/admin-dashboard?tab=enquiries',
      NEW.id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new enquiries
DROP TRIGGER IF EXISTS on_enquiry_created ON public.enquiries;
CREATE TRIGGER on_enquiry_created
  AFTER INSERT ON public.enquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_enquiry();

-- Trigger function to notify when enquiry status changes
CREATE OR REPLACE FUNCTION public.notify_enquiry_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  client_user_id UUID;
BEGIN
  -- If enquiry has a client, notify them of status changes
  IF NEW.client_id IS NOT NULL AND NEW.status != OLD.status THEN
    SELECT user_id INTO client_user_id
    FROM public.clients
    WHERE id = NEW.client_id;
    
    IF client_user_id IS NOT NULL THEN
      PERFORM public.create_notification(
        client_user_id,
        'enquiry_updated',
        'Enquiry Status Updated',
        'Your enquiry status has been updated to: ' || NEW.status,
        '/client-dashboard',
        NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for enquiry status changes
DROP TRIGGER IF EXISTS on_enquiry_status_change ON public.enquiries;
CREATE TRIGGER on_enquiry_status_change
  AFTER UPDATE OF status ON public.enquiries
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION public.notify_enquiry_status_change();

-- Add seller_id to enquiries table for partner notifications (optional)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'enquiries' 
    AND column_name = 'seller_id'
  ) THEN
    ALTER TABLE public.enquiries ADD COLUMN seller_id UUID REFERENCES public.sellers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Function to notify partner when enquiry is assigned to their client
CREATE OR REPLACE FUNCTION public.notify_partner_enquiry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  seller_user_id UUID;
BEGIN
  -- If enquiry is linked to a client with a seller, notify the seller
  IF NEW.client_id IS NOT NULL THEN
    SELECT s.user_id INTO seller_user_id
    FROM public.clients c
    JOIN public.sellers s ON s.id = c.seller_id
    WHERE c.id = NEW.client_id;
    
    IF seller_user_id IS NOT NULL THEN
      PERFORM public.create_notification(
        seller_user_id,
        'enquiry_new',
        'New Enquiry from Your Client',
        'New enquiry from client: ' || NEW.business_name,
        '/partner-dashboard',
        NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update the new enquiry trigger to also notify partners
DROP TRIGGER IF EXISTS on_enquiry_created ON public.enquiries;
CREATE TRIGGER on_enquiry_created
  AFTER INSERT ON public.enquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_enquiry();

-- Also trigger partner notification
DROP TRIGGER IF EXISTS on_enquiry_created_partner ON public.enquiries;
CREATE TRIGGER on_enquiry_created_partner
  AFTER INSERT ON public.enquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_partner_enquiry();

