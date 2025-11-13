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
    const { sellerId, sellerEmail } = JSON.parse(event.body || '{}');

    if (!sellerId || !sellerEmail) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Missing required fields',
          message: 'sellerId and sellerEmail are required',
        }),
      };
    }

    // Check if seller already has active subscription
    const { data: seller, error: sellerError } = await supabase
      .from('sellers')
      .select('id, partner_pro_subscription_status, partner_pro_subscription_id')
      .eq('id', sellerId)
      .single();

    if (sellerError) {
      console.error('Error fetching seller:', sellerError);
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Seller not found',
          message: sellerError.message,
        }),
      };
    }

    if (seller.partner_pro_subscription_status === 'active') {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Already subscribed',
          message: 'You already have an active Partner Pro subscription',
        }),
      };
    }

    // Get or create Stripe Price ID for Partner Pro
    let priceId = process.env.STRIPE_PARTNER_PRO_PRICE_ID;

    // If price ID is not set, try to find or create it automatically
    if (!priceId) {
      console.log('STRIPE_PARTNER_PRO_PRICE_ID not set, attempting to find or create Partner Pro price...');
      
      try {
        // Search for existing Partner Pro product
        const existingProducts = await stripe.products.search({
          query: 'name:"Partner Pro" AND metadata["subscription_type"]:"partner_pro"',
          limit: 1,
        });

        let product: Stripe.Product;
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

        // Find or create price for $24.99/month
        const existingPrices = await stripe.prices.list({
          product: product.id,
          active: true,
          type: 'recurring',
          limit: 1,
        });

        if (existingPrices.data.length > 0) {
          const existingPrice = existingPrices.data[0];
          // Check if the amount matches $24.99
          if (existingPrice.unit_amount === 2499) {
            priceId = existingPrice.id;
            console.log('Found existing Partner Pro price:', priceId);
          } else {
            // Deactivate old price and create new one
            await stripe.prices.update(existingPrice.id, { active: false });
            const newPrice = await stripe.prices.create({
              product: product.id,
              unit_amount: 2499, // $24.99
              currency: 'usd',
              recurring: {
                interval: 'month',
              },
              metadata: {
                subscription_type: 'partner_pro',
              },
            });
            priceId = newPrice.id;
            console.log('Created new Partner Pro price (old one deactivated):', priceId);
          }
        } else {
          // Create new price
          const newPrice = await stripe.prices.create({
            product: product.id,
            unit_amount: 2499, // $24.99
            currency: 'usd',
            recurring: {
              interval: 'month',
            },
            metadata: {
              subscription_type: 'partner_pro',
            },
          });
          priceId = newPrice.id;
          console.log('Created new Partner Pro price:', priceId);
        }
      } catch (autoCreateError: any) {
        console.error('Error auto-creating Partner Pro price:', autoCreateError);
        return {
          statusCode: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            error: 'Server configuration error',
            message: 'Partner Pro price is not configured and could not be created automatically. Please set STRIPE_PARTNER_PRO_PRICE_ID environment variable or use the admin panel to sync Partner Pro with Stripe.',
            details: autoCreateError.message,
          }),
        };
      }
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: sellerEmail,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        seller_id: sellerId,
        subscription_type: 'partner_pro',
      },
      success_url: `${process.env.APP_URL || process.env.VITE_APP_URL || 'http://localhost:8080'}/partner-dashboard?session_id={CHECKOUT_SESSION_ID}&subscription=success`,
      cancel_url: `${process.env.APP_URL || process.env.VITE_APP_URL || 'http://localhost:8080'}/partner-dashboard?subscription=canceled`,
      payment_method_types: ['card'],
      subscription_data: {
        metadata: {
          seller_id: sellerId,
          subscription_type: 'partner_pro',
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
        url: session.url,
        sessionId: session.id,
      }),
    };
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
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

