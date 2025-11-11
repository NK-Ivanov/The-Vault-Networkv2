import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const handler = async (event: any) => {
  // Get Stripe signature from headers
  const sig = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
  
  if (!sig) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Missing stripe-signature header' }),
    };
  }

  // Validate environment variables
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('Missing Stripe configuration');
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Server configuration error',
        message: 'Stripe webhook secret not configured',
      }),
    };
  }

  let stripeEvent: Stripe.Event;

  try {
    // Verify webhook signature
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: `Webhook Error: ${err.message}` }),
    };
  }

  try {
    // Handle the event
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object as Stripe.Checkout.Session;
        
        // Get metadata from session
        const automationId = session.metadata?.automation_id;
        const clientId = session.metadata?.client_id;
        
        if (!automationId || !clientId) {
          console.error('Missing metadata in checkout session', session.id);
          break;
        }

        // Find the client_automation record
        const { data: clientAutomation, error: fetchError } = await supabase
          .from('client_automations')
          .select('*')
          .eq('client_id', clientId)
          .eq('automation_id', automationId)
          .maybeSingle();

        if (fetchError) {
          console.error('Error fetching client_automation:', fetchError);
          break;
        }

        if (!clientAutomation) {
          console.error('Client automation not found', { clientId, automationId });
          break;
        }

        // Update payment status
        const { error: updateError } = await supabase
          .from('client_automations')
          .update({
            payment_status: 'paid',
            paid_at: new Date().toISOString(),
            stripe_checkout_session_id: session.id,
            stripe_subscription_id: session.subscription as string | null,
          })
          .eq('id', clientAutomation.id);

        if (updateError) {
          console.error('Error updating client_automation:', updateError);
          break;
        }

        // Create transaction records
        const automation = await supabase
          .from('automations')
          .select('setup_price, monthly_price')
          .eq('id', automationId)
          .single();

        if (automation.data) {
          // Create setup fee transaction
          await supabase.from('transactions').insert({
            client_id: clientId,
            seller_id: clientAutomation.seller_id,
            automation_id: automationId,
            amount: automation.data.setup_price,
            transaction_type: 'setup',
            status: 'completed',
          });

          // Create first month transaction
          await supabase.from('transactions').insert({
            client_id: clientId,
            seller_id: clientAutomation.seller_id,
            automation_id: automationId,
            amount: automation.data.monthly_price,
            transaction_type: 'monthly',
            status: 'completed',
          });

          // Update client total_spent
          const totalAmount = automation.data.setup_price + automation.data.monthly_price;
          const { data: clientData } = await supabase
            .from('clients')
            .select('total_spent')
            .eq('id', clientId)
            .single();
          
          if (clientData) {
            await supabase
              .from('clients')
              .update({ total_spent: (clientData.total_spent || 0) + totalAmount })
              .eq('id', clientId);
          }
        }

        console.log('Payment processed successfully', { clientId, automationId });
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = stripeEvent.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (!subscriptionId) break;

        // Find client_automation by subscription_id
        const { data: clientAutomation, error: fetchError } = await supabase
          .from('client_automations')
          .select('*')
          .eq('stripe_subscription_id', subscriptionId)
          .maybeSingle();

        if (fetchError || !clientAutomation) {
          console.error('Client automation not found for subscription', subscriptionId);
          break;
        }

        // Create monthly transaction
        const automation = await supabase
          .from('automations')
          .select('monthly_price')
          .eq('id', clientAutomation.automation_id)
          .single();

        if (automation.data) {
          await supabase.from('transactions').insert({
            client_id: clientAutomation.client_id,
            seller_id: clientAutomation.seller_id,
            automation_id: clientAutomation.automation_id,
            amount: automation.data.monthly_price,
            transaction_type: 'monthly',
            status: 'completed',
          });

          // Update client total_spent
          const { data: clientData } = await supabase
            .from('clients')
            .select('total_spent')
            .eq('id', clientAutomation.client_id)
            .single();
          
          if (clientData) {
            await supabase
              .from('clients')
              .update({ total_spent: (clientData.total_spent || 0) + automation.data.monthly_price })
              .eq('id', clientAutomation.client_id);
          }
        }

        console.log('Monthly payment processed', { subscriptionId });
        break;
      }

      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ received: true }),
    };
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Webhook processing failed',
        message: error.message,
      }),
    };
  }
};

