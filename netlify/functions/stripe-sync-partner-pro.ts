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

  try {
    const { monthlyPrice } = JSON.parse(event.body || '{}');
    const priceAmount = monthlyPrice || 24.99; // Default to $24.99/month

    // Create or retrieve Partner Pro product
    let product: Stripe.Product;
    
    // Check if product already exists
    const existingProducts = await stripe.products.search({
      query: 'name:"Partner Pro" AND metadata["subscription_type"]:"partner_pro"',
      limit: 1,
    });

    if (existingProducts.data.length > 0) {
      product = existingProducts.data[0];
      console.log('Found existing Partner Pro product:', product.id);
    } else {
      // Create new product
      product = await stripe.products.create({
        name: 'Partner Pro',
        description: 'Professional tier subscription for Vault Network partners. Includes 45% commission, 50+ premium automations, advanced tools, and priority support.',
        metadata: {
          subscription_type: 'partner_pro',
        },
      });
      console.log('Created new Partner Pro product:', product.id);
    }

    // Create or retrieve monthly subscription price
    let price: Stripe.Price;
    
    // Check if price already exists for this product
    const existingPrices = await stripe.prices.list({
      product: product.id,
      active: true,
      type: 'recurring',
      limit: 1,
    });

    if (existingPrices.data.length > 0) {
      const existingPrice = existingPrices.data[0];
      // Check if the amount matches
      if (existingPrice.unit_amount === Math.round(priceAmount * 100)) {
        price = existingPrice;
        console.log('Found existing Partner Pro price:', price.id);
      } else {
        // Deactivate old price and create new one
        await stripe.prices.update(existingPrice.id, { active: false });
        price = await stripe.prices.create({
          product: product.id,
          unit_amount: Math.round(priceAmount * 100),
          currency: 'usd',
          recurring: {
            interval: 'month',
          },
          metadata: {
            subscription_type: 'partner_pro',
          },
        });
        console.log('Created new Partner Pro price (old one deactivated):', price.id);
      }
    } else {
      // Create new price
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(priceAmount * 100),
        currency: 'usd',
        recurring: {
          interval: 'month',
        },
        metadata: {
          subscription_type: 'partner_pro',
        },
      });
      console.log('Created new Partner Pro price:', price.id);
    }

    // Store the price ID in environment variable suggestion or return it
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        product_id: product.id,
        price_id: price.id,
        message: 'Partner Pro product and price synced with Stripe successfully. Please set STRIPE_PARTNER_PRO_PRICE_ID environment variable to: ' + price.id,
      }),
    };
  } catch (error: any) {
    console.error('Error syncing Partner Pro with Stripe:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Failed to sync Partner Pro with Stripe',
        message: error.message,
      }),
    };
  }
};

