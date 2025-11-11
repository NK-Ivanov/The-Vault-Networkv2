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
    const { automationId, clientEmail, clientId } = JSON.parse(event.body);

    if (!automationId || !clientEmail) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Missing required fields' }),
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

    if (!automation.stripe_setup_price_id || !automation.stripe_monthly_price_id) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Automation not synced with Stripe. Please sync it first.' }),
      };
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: clientEmail,
      line_items: [
        // One-time setup fee
        {
          price: automation.stripe_setup_price_id,
          quantity: 1,
        },
        // Monthly subscription
        {
          price: automation.stripe_monthly_price_id,
          quantity: 1,
        },
      ],
      metadata: {
        automation_id: automationId,
        automation_name: automation.name,
        client_id: clientId || '',
      },
      success_url: `${process.env.APP_URL || process.env.VITE_APP_URL || 'http://localhost:8080'}/client-dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL || process.env.VITE_APP_URL || 'http://localhost:8080'}/for-businesses`,
      payment_method_types: ['card'],
      subscription_data: {
        metadata: {
          automation_id: automationId,
          automation_name: automation.name,
        },
      },
    });

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

