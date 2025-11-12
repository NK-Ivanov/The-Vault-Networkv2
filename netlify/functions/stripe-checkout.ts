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
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Validate environment variables
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('Missing STRIPE_SECRET_KEY environment variable');
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Server configuration error',
        message: 'STRIPE_SECRET_KEY is not set',
      }),
    };
  }

  // Validate that it's a SECRET key, not a publishable key
  if (process.env.STRIPE_SECRET_KEY.startsWith('pk_')) {
    console.error('STRIPE_SECRET_KEY appears to be a publishable key (pk_...), not a secret key (sk_...)');
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Server configuration error',
        message: 'STRIPE_SECRET_KEY must be a secret key (sk_test_... or sk_live_...), not a publishable key (pk_...)',
      }),
    };
  }

  if (!process.env.SUPABASE_URL && !process.env.VITE_SUPABASE_URL) {
    console.error('Missing SUPABASE_URL environment variable');
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Server configuration error',
        message: 'SUPABASE_URL is not set',
      }),
    };
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Server configuration error',
        message: 'SUPABASE_SERVICE_ROLE_KEY is not set',
      }),
    };
  }

  try {
    const { automationId, clientEmail, clientId, paymentType } = JSON.parse(event.body);

    if (!automationId || !clientEmail || !paymentType) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Missing required fields: automationId, clientEmail, and paymentType are required' }),
      };
    }

    if (paymentType !== 'setup_fee' && paymentType !== 'monthly_subscription') {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Invalid paymentType. Must be "setup_fee" or "monthly_subscription"' }),
      };
    }

    // Fetch automation from Supabase
    const { data: automation, error: fetchError } = await supabase
      .from('automations')
      .select('*')
      .eq('id', automationId)
      .single();

    if (fetchError || !automation) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Automation not found' }),
      };
    }

    // Check if client_automation exists
    const { data: clientAutomation } = await supabase
      .from('client_automations')
      .select('*')
      .eq('client_id', clientId)
      .eq('automation_id', automationId)
      .maybeSingle();

    if (!clientAutomation) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Client automation not found' }),
      };
    }

    // Validate payment type against current status
    if (paymentType === 'setup_fee') {
      if (clientAutomation.setup_status !== 'pending_setup') {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Setup fee already paid or automation is in wrong status' }),
        };
      }
      if (!automation.stripe_setup_price_id) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Automation setup fee not synced with Stripe. Please sync it first.' }),
        };
      }
    } else if (paymentType === 'monthly_subscription') {
      if (clientAutomation.setup_status !== 'setup_complete') {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Setup must be complete before paying for monthly subscription' }),
        };
      }
      if (!automation.stripe_monthly_price_id) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Automation monthly subscription not synced with Stripe. Please sync it first.' }),
        };
      }
    }

    // Create Stripe checkout session based on payment type
    let session;
    
    if (paymentType === 'setup_fee') {
      // One-time payment for setup fee
      session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: clientEmail,
        line_items: [
          {
            price: automation.stripe_setup_price_id,
            quantity: 1,
          },
        ],
        metadata: {
          automation_id: automationId,
          automation_name: automation.name,
          client_id: clientId || '',
          payment_type: 'setup_fee',
        },
        success_url: `${process.env.APP_URL || process.env.VITE_APP_URL || 'http://localhost:8080'}/client-dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.APP_URL || process.env.VITE_APP_URL || 'http://localhost:8080'}/client-dashboard`,
        payment_method_types: ['card'],
      });
    } else {
      // Subscription for monthly payments
      session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer_email: clientEmail,
        line_items: [
          {
            price: automation.stripe_monthly_price_id,
            quantity: 1,
          },
        ],
        metadata: {
          automation_id: automationId,
          automation_name: automation.name,
          client_id: clientId || '',
          payment_type: 'monthly_subscription',
        },
        success_url: `${process.env.APP_URL || process.env.VITE_APP_URL || 'http://localhost:8080'}/client-dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.APP_URL || process.env.VITE_APP_URL || 'http://localhost:8080'}/client-dashboard`,
        payment_method_types: ['card'],
        subscription_data: {
          metadata: {
            automation_id: automationId,
            automation_name: automation.name,
            client_id: clientId || '',
          },
        },
      });
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        url: session.url,
        session_id: session.id,
      }),
    };
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Failed to create checkout session',
        message: error.message,
      }),
    };
  }
};

