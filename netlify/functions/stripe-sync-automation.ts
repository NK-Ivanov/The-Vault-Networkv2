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
    const { id, name, description, setup_price, monthly_price } = JSON.parse(event.body);

    if (!id || !name || setup_price === undefined || monthly_price === undefined) {
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
      .eq('id', id)
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

    // If no existing Stripe product, create one
    let productId = automation.stripe_product_id;
    let setupPriceId = automation.stripe_setup_price_id;
    let monthlyPriceId = automation.stripe_monthly_price_id;
    
    if (!productId) {
      const product = await stripe.products.create({
        name,
        description: description || '',
        metadata: {
          automation_id: id,
          source: 'vault_network',
        },
      });
      productId = product.id;
    } else {
      // Try to update existing product
      // If product was created with different mode (test vs live), this will fail
      // In that case, create a new product
      try {
        await stripe.products.update(productId, {
          name,
          description: description || '',
        });
      } catch (updateError: any) {
        // If update fails (e.g., product doesn't exist in current mode), create new one
        console.log('Failed to update existing product, creating new one:', updateError.message);
        const product = await stripe.products.create({
          name,
          description: description || '',
          metadata: {
            automation_id: id,
            source: 'vault_network',
          },
        });
        productId = product.id;
        // Reset price IDs since we're creating a new product
        setupPriceId = null;
        monthlyPriceId = null;
      }
    }

    // Create or update setup price (one-time)
    const setupAmount = Math.round(parseFloat(setup_price.toString()) * 100);

    if (!setupPriceId || setupAmount !== Math.round(parseFloat(automation.setup_price?.toString() || '0') * 100)) {
      // Create new price if it doesn't exist or amount changed
      const setupPrice = await stripe.prices.create({
        unit_amount: setupAmount,
        currency: 'usd',
        product: productId,
        nickname: `${name} - Setup Fee`,
      });
      setupPriceId = setupPrice.id;
    } else {
      // Verify price exists and belongs to the product
      try {
        const existingPrice = await stripe.prices.retrieve(setupPriceId);
        if (existingPrice.product !== productId) {
          // Price belongs to different product, create new one
          const setupPrice = await stripe.prices.create({
            unit_amount: setupAmount,
            currency: 'usd',
            product: productId,
            nickname: `${name} - Setup Fee`,
          });
          setupPriceId = setupPrice.id;
        }
      } catch (priceError: any) {
        // Price doesn't exist in current mode, create new one
        console.log('Failed to retrieve existing setup price, creating new one:', priceError.message);
        const setupPrice = await stripe.prices.create({
          unit_amount: setupAmount,
          currency: 'usd',
          product: productId,
          nickname: `${name} - Setup Fee`,
        });
        setupPriceId = setupPrice.id;
      }
    }

    // Create or update monthly price (recurring)
    const monthlyAmount = Math.round(parseFloat(monthly_price.toString()) * 100);

    if (!monthlyPriceId || monthlyAmount !== Math.round(parseFloat(automation.monthly_price?.toString() || '0') * 100)) {
      // Create new price if it doesn't exist or amount changed
      const monthlyPrice = await stripe.prices.create({
        unit_amount: monthlyAmount,
        currency: 'usd',
        product: productId,
        nickname: `${name} - Monthly Subscription`,
        recurring: {
          interval: 'month',
        },
      });
      monthlyPriceId = monthlyPrice.id;
    } else {
      // Verify price exists and belongs to the product
      try {
        const existingPrice = await stripe.prices.retrieve(monthlyPriceId);
        if (existingPrice.product !== productId) {
          // Price belongs to different product, create new one
          const monthlyPrice = await stripe.prices.create({
            unit_amount: monthlyAmount,
            currency: 'usd',
            product: productId,
            nickname: `${name} - Monthly Subscription`,
            recurring: {
              interval: 'month',
            },
          });
          monthlyPriceId = monthlyPrice.id;
        }
      } catch (priceError: any) {
        // Price doesn't exist in current mode, create new one
        console.log('Failed to retrieve existing monthly price, creating new one:', priceError.message);
        const monthlyPrice = await stripe.prices.create({
          unit_amount: monthlyAmount,
          currency: 'usd',
          product: productId,
          nickname: `${name} - Monthly Subscription`,
          recurring: {
            interval: 'month',
          },
        });
        monthlyPriceId = monthlyPrice.id;
      }
    }

    // Save Stripe IDs back to Supabase
    const { error: updateError } = await supabase
      .from('automations')
      .update({
        stripe_product_id: productId,
        stripe_setup_price_id: setupPriceId,
        stripe_monthly_price_id: monthlyPriceId,
      })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        stripe_product_id: productId,
        stripe_setup_price_id: setupPriceId,
        stripe_monthly_price_id: monthlyPriceId,
      }),
    };
  } catch (error: any) {
    console.error('Stripe sync error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Failed to sync with Stripe',
        message: error.message,
      }),
    };
  }
};

