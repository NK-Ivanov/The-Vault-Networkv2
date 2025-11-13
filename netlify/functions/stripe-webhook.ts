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
        
        // Check if this is a Partner Pro subscription
        const subscriptionType = session.metadata?.subscription_type;
        if (subscriptionType === 'partner_pro') {
          const sellerId = session.metadata?.seller_id;
          if (!sellerId) {
            console.error('Missing seller_id in Partner Pro checkout session');
            break;
          }

          // Get subscription details
          const subscriptionId = session.subscription as string;
          if (!subscriptionId) {
            console.error('Missing subscription ID in checkout session');
            break;
          }

          // Retrieve subscription from Stripe
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);

          // Update seller subscription status and set commission_rate to 45%
          const { error: updateError } = await supabase
            .from('sellers')
            .update({
              partner_pro_subscription_id: subscription.id,
              partner_pro_subscription_status: subscription.status === 'active' ? 'active' : 'inactive',
              partner_pro_subscription_started_at: new Date(subscription.created * 1000).toISOString(),
              partner_pro_subscription_ends_at: subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000).toISOString()
                : null,
              commission_rate: 45.00, // Partner Pro gets 45% commission regardless of rank
            })
            .eq('id', sellerId);

          if (updateError) {
            console.error('Error updating Partner Pro subscription:', updateError);
            break;
          }

          // Get seller user_id for notification
          const { data: sellerData } = await supabase
            .from('sellers')
            .select('user_id, business_name')
            .eq('id', sellerId)
            .single();

          if (sellerData?.user_id) {
            await supabase.rpc('create_notification', {
              p_user_id: sellerData.user_id,
              p_type: 'subscription_activated',
              p_title: 'Partner Pro Activated!',
              p_message: 'Your Partner Pro subscription is now active. Enjoy all premium features!',
              p_link: '/partner-dashboard',
              p_related_id: null
            });
          }

          console.log('Partner Pro subscription activated', { sellerId, subscriptionId });
          break;
        }
        
        // Get metadata from session
        const automationId = session.metadata?.automation_id;
        const clientId = session.metadata?.client_id;
        const paymentType = session.metadata?.payment_type; // 'setup_fee' or 'monthly_subscription'
        
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

        // Get automation data
        const { data: automationData } = await supabase
          .from('automations')
          .select('setup_price, monthly_price, name')
          .eq('id', automationId)
          .single();

        if (!automationData) {
          console.error('Automation not found', automationId);
          break;
        }

        const automationName = automationData.name || 'Unknown Automation';

        // Handle setup fee payment
        if (paymentType === 'setup_fee') {
          // Update status to setup_in_progress
          const { error: updateError } = await supabase
            .from('client_automations')
            .update({
              payment_status: 'paid',
              paid_at: new Date().toISOString(),
              stripe_checkout_session_id: session.id,
              setup_status: 'setup_in_progress',
            })
            .eq('id', clientAutomation.id);

          if (updateError) {
            console.error('Error updating client_automation:', updateError);
            break;
          }

          // Calculate commission for setup fee
          const { data: setupCommission, error: setupCommError } = await supabase
            .rpc('calculate_commission', {
              p_seller_id: clientAutomation.seller_id,
              p_automation_id: automationId,
              p_amount: automationData.setup_price
            });

          const setupComm = setupCommission?.[0] || { commission_rate: 0, seller_earnings: 0, vault_share: automationData.setup_price };

          // Create setup fee transaction
          await supabase.from('transactions').insert({
            client_id: clientId,
            seller_id: clientAutomation.seller_id,
            automation_id: automationId,
            amount: automationData.setup_price,
            commission: setupComm.seller_earnings,
            seller_earnings: setupComm.seller_earnings,
            vault_share: setupComm.vault_share,
            commission_rate_used: setupComm.commission_rate,
            transaction_type: 'setup',
            status: 'completed',
          });

          // Update client total_spent
          const { data: clientData } = await supabase
            .from('clients')
            .select('total_spent, business_name')
            .eq('id', clientId)
            .single();
          
          if (clientData) {
            await supabase
              .from('clients')
              .update({ total_spent: (clientData.total_spent || 0) + automationData.setup_price })
              .eq('id', clientId);

            // Notify seller if they exist
            if (clientAutomation.seller_id) {
              const { data: sellerData } = await supabase
                .from('sellers')
                .select('user_id')
                .eq('id', clientAutomation.seller_id)
                .single();

              if (sellerData?.user_id) {
                await supabase.rpc('create_notification', {
                  p_user_id: sellerData.user_id,
                  p_type: 'payment_received',
                  p_title: 'Setup Fee Paid',
                  p_message: `${clientData.business_name || 'A client'} has paid the setup fee for ${automationName}. Amount: $${automationData.setup_price.toFixed(2)}`,
                  p_link: '/partner-dashboard',
                  p_related_id: null
                });
              }
            }

            // Notify all admins
            const { data: adminUsers } = await supabase
              .from('user_roles')
              .select('user_id')
              .eq('role', 'admin');

            if (adminUsers && adminUsers.length > 0) {
              for (const admin of adminUsers) {
                await supabase.rpc('create_notification', {
                  p_user_id: admin.user_id,
                  p_type: 'payment_received',
                  p_title: 'Setup Fee Paid',
                  p_message: `${clientData.business_name || 'A client'} has paid the setup fee for ${automationName}. Amount: $${automationData.setup_price.toFixed(2)}`,
                  p_link: '/admin-dashboard',
                  p_related_id: null
                });
              }
            }
          }

          console.log('Setup fee payment processed successfully', { clientId, automationId });
        }
        // Handle monthly subscription payment
        else if (paymentType === 'monthly_subscription') {
          // Update status to active and save subscription ID
          const { error: updateError } = await supabase
            .from('client_automations')
            .update({
              payment_status: 'paid',
              paid_at: new Date().toISOString(),
              stripe_checkout_session_id: session.id,
              stripe_subscription_id: session.subscription as string | null,
              setup_status: 'active',
            })
            .eq('id', clientAutomation.id);

          if (updateError) {
            console.error('Error updating client_automation:', updateError);
            break;
          }

          // Calculate commission for monthly fee
          const { data: monthlyCommission, error: monthlyCommError } = await supabase
            .rpc('calculate_commission', {
              p_seller_id: clientAutomation.seller_id,
              p_automation_id: automationId,
              p_amount: automationData.monthly_price
            });

          const monthlyComm = monthlyCommission?.[0] || { commission_rate: 0, seller_earnings: 0, vault_share: automationData.monthly_price };

          // Create first month transaction
          await supabase.from('transactions').insert({
            client_id: clientId,
            seller_id: clientAutomation.seller_id,
            automation_id: automationId,
            amount: automationData.monthly_price,
            commission: monthlyComm.seller_earnings,
            seller_earnings: monthlyComm.seller_earnings,
            vault_share: monthlyComm.vault_share,
            commission_rate_used: monthlyComm.commission_rate,
            transaction_type: 'monthly',
            status: 'completed',
          });

          // Update client total_spent
          const { data: clientData } = await supabase
            .from('clients')
            .select('total_spent, business_name')
            .eq('id', clientId)
            .single();
          
          if (clientData) {
            await supabase
              .from('clients')
              .update({ total_spent: (clientData.total_spent || 0) + automationData.monthly_price })
              .eq('id', clientId);

            // Notify seller if they exist
            if (clientAutomation.seller_id) {
              const { data: sellerData } = await supabase
                .from('sellers')
                .select('user_id')
                .eq('id', clientAutomation.seller_id)
                .single();

              if (sellerData?.user_id) {
                await supabase.rpc('create_notification', {
                  p_user_id: sellerData.user_id,
                  p_type: 'payment_received',
                  p_title: 'Monthly Payment Received',
                  p_message: `${clientData.business_name || 'A client'} has paid for the first month of ${automationName}. Amount: $${automationData.monthly_price.toFixed(2)}`,
                  p_link: '/partner-dashboard',
                  p_related_id: null
                });
              }
            }

            // Notify all admins
            const { data: adminUsers } = await supabase
              .from('user_roles')
              .select('user_id')
              .eq('role', 'admin');

            if (adminUsers && adminUsers.length > 0) {
              for (const admin of adminUsers) {
                await supabase.rpc('create_notification', {
                  p_user_id: admin.user_id,
                  p_type: 'payment_received',
                  p_title: 'Monthly Payment Received',
                  p_message: `${clientData.business_name || 'A client'} has paid for the first month of ${automationName}. Amount: $${automationData.monthly_price.toFixed(2)}`,
                  p_link: '/admin-dashboard',
                  p_related_id: null
                });
              }
            }
          }

          console.log('Monthly subscription payment processed successfully', { clientId, automationId });
        } else {
          console.error('Unknown payment type in checkout session', { paymentType, sessionId: session.id });
        }

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
          // Calculate commission for monthly payment
          const { data: monthlyCommission, error: monthlyCommError } = await supabase
            .rpc('calculate_commission', {
              p_seller_id: clientAutomation.seller_id,
              p_automation_id: clientAutomation.automation_id,
              p_amount: automation.data.monthly_price
            });

          if (monthlyCommError) {
            console.error('Error calculating monthly commission:', monthlyCommError);
            console.error('Details:', { seller_id: clientAutomation.seller_id, automation_id: clientAutomation.automation_id, amount: automation.data.monthly_price });
          }

          if (!monthlyCommission || monthlyCommission.length === 0) {
            console.error('No commission result returned for recurring monthly fee', { seller_id: clientAutomation.seller_id, automation_id: clientAutomation.automation_id });
          }

          const monthlyComm = monthlyCommission?.[0] || { commission_rate: 0, seller_earnings: 0, vault_share: automation.data.monthly_price };
          
          console.log('Recurring monthly commission calculated:', {
            rate: monthlyComm.commission_rate,
            seller_earnings: monthlyComm.seller_earnings,
            vault_share: monthlyComm.vault_share,
            amount: automation.data.monthly_price
          });

          await supabase.from('transactions').insert({
            client_id: clientAutomation.client_id,
            seller_id: clientAutomation.seller_id,
            automation_id: clientAutomation.automation_id,
            amount: automation.data.monthly_price,
            commission: monthlyComm.seller_earnings,
            seller_earnings: monthlyComm.seller_earnings,
            vault_share: monthlyComm.vault_share,
            commission_rate_used: monthlyComm.commission_rate,
            transaction_type: 'monthly',
            status: 'completed',
          });

          // Update client total_spent
          const { data: clientData } = await supabase
            .from('clients')
            .select('total_spent, business_name')
            .eq('id', clientAutomation.client_id)
            .single();
          
          if (clientData) {
            await supabase
              .from('clients')
              .update({ total_spent: (clientData.total_spent || 0) + automation.data.monthly_price })
              .eq('id', clientAutomation.client_id);
          }

          // Get automation name for notification
          const { data: automationData } = await supabase
            .from('automations')
            .select('name')
            .eq('id', clientAutomation.automation_id)
            .single();

          const automationName = automationData?.name || 'Unknown Automation';

          // Notify seller if they exist
          if (clientAutomation.seller_id) {
            const { data: sellerData } = await supabase
              .from('sellers')
              .select('user_id')
              .eq('id', clientAutomation.seller_id)
              .single();

            if (sellerData?.user_id) {
              await supabase.rpc('create_notification', {
                p_user_id: sellerData.user_id,
                p_type: 'payment_received',
                p_title: 'Monthly Payment Received',
                p_message: `${clientData?.business_name || 'A client'} has paid monthly fee for ${automationName}. Amount: $${automation.data.monthly_price.toFixed(2)}`,
                p_link: '/partner-dashboard',
                p_related_id: null
              });
            }
          }

          // Notify all admins
          const { data: adminUsers } = await supabase
            .from('user_roles')
            .select('user_id')
            .eq('role', 'admin');

          if (adminUsers && adminUsers.length > 0) {
            for (const admin of adminUsers) {
              await supabase.rpc('create_notification', {
                p_user_id: admin.user_id,
                p_type: 'payment_received',
                p_title: 'Monthly Payment Received',
                p_message: `${clientData?.business_name || 'A client'} has paid monthly fee for ${automationName}. Amount: $${automation.data.monthly_price.toFixed(2)}`,
                p_link: '/admin-dashboard',
                p_related_id: null
              });
            }
          }
        }

        console.log('Monthly payment processed', { subscriptionId });
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        
        // Check if this is a Partner Pro subscription
        if (subscription.metadata?.subscription_type === 'partner_pro') {
          const sellerId = subscription.metadata?.seller_id;
          if (!sellerId) {
            console.error('Missing seller_id in subscription metadata');
            break;
          }

          // Determine status based on subscription state
          let status = 'inactive';
          if (stripeEvent.type === 'customer.subscription.deleted') {
            status = 'canceled';
          } else if (subscription.status === 'active') {
            status = 'active';
          } else if (subscription.status === 'past_due') {
            status = 'past_due';
          } else {
            status = 'inactive';
          }

          // Update seller subscription status and commission rate
          // If active, set commission_rate to 45%; if inactive/canceled, set to NULL to use rank-based rates
          const updateData: any = {
            partner_pro_subscription_status: status,
            partner_pro_subscription_ends_at: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null,
          };

          // Set commission_rate to 45% if active, NULL if inactive/canceled
          if (status === 'active') {
            updateData.commission_rate = 45.00;
          } else {
            // When subscription is canceled/inactive, set commission_rate to NULL
            // This allows the seller to use their rank-based commission rate
            updateData.commission_rate = null;
          }

          const { error: updateError } = await supabase
            .from('sellers')
            .update(updateData)
            .eq('partner_pro_subscription_id', subscription.id);

          if (updateError) {
            console.error('Error updating Partner Pro subscription status:', updateError);
            break;
          }

          console.log('Partner Pro subscription updated', { sellerId, subscriptionId: subscription.id, status, commission_rate: updateData.commission_rate });
        }
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

