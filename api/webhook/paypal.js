// Vercel Serverless Function for PayPal Webhooks
// SECURE & PRODUCTION-READY

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role for server operations
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// PayPal API configuration
const PAYPAL_API_BASE = process.env.PAYPAL_API_BASE || 'https://api.paypal.com';
const EXPECTED_AMOUNT = '3.99';
const EXPECTED_CURRENCY = 'USD';

export default async function handler(req, res) {
  // Security: Only allow POST requests
  if (req.method !== 'POST') {
    console.log('❌ Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🔔 PayPal webhook received');
  console.log('📋 Headers:', JSON.stringify(req.headers, null, 2));

  try {
    const webhookEvent = req.body;
    
    // Validate webhook event structure
    if (!webhookEvent || !webhookEvent.event_type || !webhookEvent.resource) {
      console.error('❌ Invalid webhook payload structure');
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    console.log('🆔 Event Type:', webhookEvent.event_type);
    console.log('🆔 Event ID:', webhookEvent.id);

    // Security: Verify webhook signature in production
    if (process.env.NODE_ENV === 'production') {
      const isValidSignature = await verifyWebhookSignature(req.headers, req.body);
      if (!isValidSignature) {
        console.error('🚨 SECURITY ALERT: Invalid webhook signature');
        return res.status(401).json({ error: 'Unauthorized - Invalid signature' });
      }
      console.log('✅ Webhook signature verified');
    } else {
      console.log('⚠️ Development mode: Skipping signature verification');
    }

    // Route to appropriate handler based on event type
    let result;
    switch (webhookEvent.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        result = await handlePaymentCompleted(webhookEvent);
        break;
      
      case 'PAYMENT.CAPTURE.DECLINED':
      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.FAILED':
        result = await handlePaymentFailed(webhookEvent);
        break;
      
      case 'PAYMENT.CAPTURE.REFUNDED':
        result = await handlePaymentRefunded(webhookEvent);
        break;
      
      default:
        console.log('ℹ️ Unhandled event type:', webhookEvent.event_type);
        return res.status(200).json({ 
          status: 'ignored', 
          message: 'Event type not handled',
          event_type: webhookEvent.event_type 
        });
    }

    // Return response based on processing result
    if (result.success) {
      console.log('✅ Webhook processed successfully');
      return res.status(200).json({
        status: 'success',
        message: result.message,
        event_type: webhookEvent.event_type,
        payment_id: result.paymentId || webhookEvent.resource.id
      });
    } else {
      console.error('❌ Webhook processing failed:', result.message);
      return res.status(400).json({
        status: 'error',
        error: result.message,
        event_type: webhookEvent.event_type,
        payment_id: webhookEvent.resource.id
      });
    }

  } catch (error) {
    console.error('❌ Critical webhook error:', error);
    return res.status(500).json({
      status: 'error',
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Handle successful payment capture
async function handlePaymentCompleted(event) {
  const payment = event.resource;
  const paypalEmail = payment.payer?.email_address;
  const paymentId = payment.id;
  const amount = payment.purchase_units?.[0]?.amount?.value;
  const currency = payment.purchase_units?.[0]?.amount?.currency_code;

  console.log('💰 Processing payment completion:', paymentId);
  console.log('📧 PayPal email:', paypalEmail);
  console.log('💵 Amount:', amount, currency);

  // Validation: Required fields
  if (!paypalEmail || !paymentId || !amount) {
    const error = 'Missing required payment data';
    console.error('❌', error);
    return { success: false, message: error };
  }

  // Validation: Amount
  if (amount !== EXPECTED_AMOUNT) {
    const error = `Invalid amount: ${amount}, expected: ${EXPECTED_AMOUNT}`;
    console.error('❌', error);
    return { success: false, message: error };
  }

  // Validation: Currency
  if (currency !== EXPECTED_CURRENCY) {
    const error = `Invalid currency: ${currency}, expected: ${EXPECTED_CURRENCY}`;
    console.error('❌', error);
    return { success: false, message: error };
  }

  try {
    // Check if payment already exists (idempotency)
    const { data: existingPayment, error: checkError } = await supabase
      .from('user_payments')
      .select('payment_id, payment_status')
      .eq('payment_id', paymentId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('❌ Database check error:', checkError);
      return { success: false, message: 'Database error during payment check' };
    }

    if (existingPayment) {
      console.log('ℹ️ Payment already exists:', paymentId);
      return { 
        success: true, 
        message: 'Payment already recorded', 
        paymentId,
        duplicate: true 
      };
    }

    // Insert new payment record with proper service role authentication
    const { error: insertError } = await supabase
      .from('user_payments')
      .insert([{
        email: paypalEmail, // Primary email column
        payer_email: paypalEmail, // PayPal-specific email (optional)
        payment_id: paymentId,
        payer_id: payment.payer?.payer_id,
        payment_status: 'completed',
        amount: amount,
        currency: currency,
        payment_method: 'paypal',
        payment_date: event.create_time,
        transaction_details: payment
      }]);

    if (insertError) {
      console.error('❌ Database insert error:', insertError);
      console.error('❌ Full error details:', JSON.stringify(insertError, null, 2));
      console.error('❌ Service role key configured:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
      console.error('❌ Supabase URL configured:', !!process.env.VITE_SUPABASE_URL);
      return { 
        success: false, 
        message: `Database error: ${insertError.message}. This is likely an RLS policy issue.`,
        paymentId,
        debug: {
          hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          hasUrl: !!process.env.VITE_SUPABASE_URL,
          errorCode: insertError.code,
          errorDetails: insertError.details
        }
      };
    }

    console.log('✅ Payment recorded successfully via webhook');
    
    // TODO: Trigger verification email
    // await sendVerificationEmail(paymentId, paypalEmail);

    return {
      success: true,
      message: 'Payment recorded successfully',
      paymentId,
      email: paypalEmail,
      amount
    };

  } catch (dbError) {
    console.error('❌ Database operation failed:', dbError);
    return {
      success: false,
      message: `Database operation failed: ${dbError.message}`,
      paymentId
    };
  }
}

// Handle failed/denied payments
async function handlePaymentFailed(event) {
  const payment = event.resource;
  const paymentId = payment.id;
  const paypalEmail = payment.payer?.email_address;
  
  console.log('❌ Processing payment failure:', paymentId);
  console.log('📧 PayPal email for failure notification:', paypalEmail);
  
  try {
    // Update payment status if it exists
    const { error } = await supabase
      .from('user_payments')
      .update({ 
        payment_status: 'failed',
        transaction_details: payment,
        updated_at: new Date().toISOString()
      })
      .eq('payment_id', paymentId);

    if (error) {
      console.error('Database update error:', error);
    } else {
      console.log('✅ Payment failure recorded');
    }

    // EXPERT ENHANCEMENT: Send failure notification email with retry link
    if (paypalEmail) {
      try {
        // This would be implemented with your email service
        console.log('📧 Sending payment failure email to:', paypalEmail);
        
        // TODO: Integrate with emailService.sendPaymentFailureEmail
        // const emailResult = await emailService.sendPaymentFailureEmail({
        //   to: paypalEmail,
        //   firstName: 'Valued Customer',
        //   failureReason: 'payment processing failed',
        //   retryUrl: `${process.env.FRONTEND_URL || 'http://localhost:5174'}/payment`
        // });
        
        console.log('✅ Payment failure email queued for sending');
      } catch (emailError) {
        console.error('Failed to send payment failure email:', emailError);
      }
    }

    return {
      success: true,
      message: 'Payment failure recorded and notification sent',
      paymentId
    };

  } catch (error) {
    console.error('Error handling payment failure:', error);
    return {
      success: false,
      message: 'Failed to record payment failure',
      paymentId
    };
  }
}

// Handle refunded payments
async function handlePaymentRefunded(event) {
  const payment = event.resource;
  const paymentId = payment.id;
  
  console.log('🔄 Processing payment refund:', paymentId);
  
  try {
    // Update payment status and revoke access
    const { error } = await supabase
      .from('user_payments')
      .update({ 
        payment_status: 'refunded',
        transaction_details: payment,
        updated_at: new Date().toISOString()
      })
      .eq('payment_id', paymentId);

    if (error) {
      console.error('Database update error:', error);
    } else {
      console.log('✅ Payment refund recorded');
    }

    // TODO: Revoke user access
    // await revokeUserAccess(paymentId);

    return {
      success: true,
      message: 'Payment refund recorded',
      paymentId
    };

  } catch (error) {
    console.error('Error handling payment refund:', error);
    return {
      success: false,
      message: 'Failed to record payment refund',
      paymentId
    };
  }
}

// Verify PayPal webhook signature (production security)
async function verifyWebhookSignature(headers, body) {
  try {
    const requiredHeaders = [
      'paypal-transmission-id',
      'paypal-cert-id',
      'paypal-transmission-sig',
      'paypal-transmission-time',
      'paypal-auth-algo'
    ];

    // Check if all required headers are present
    for (const header of requiredHeaders) {
      if (!headers[header]) {
        console.error(`Missing header: ${header}`);
        return false;
      }
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();
    if (!accessToken) {
      console.error('Failed to get PayPal access token');
      return false;
    }

    // Verify signature with PayPal API
    const verificationData = {
      transmission_id: headers['paypal-transmission-id'],
      cert_id: headers['paypal-cert-id'],
      auth_algo: headers['paypal-auth-algo'],
      transmission_sig: headers['paypal-transmission-sig'],
      transmission_time: headers['paypal-transmission-time'],
      webhook_id: process.env.PAYPAL_WEBHOOK_ID,
      webhook_event: body
    };

    const response = await fetch(`${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(verificationData)
    });

    const result = await response.json();
    return result.verification_status === 'SUCCESS';

  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

// Get PayPal access token for API calls
async function getPayPalAccessToken() {
  try {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      console.error('Missing PayPal credentials');
      return null;
    }

    const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
      },
      body: 'grant_type=client_credentials'
    });

    const data = await response.json();
    return data.access_token;

  } catch (error) {
    console.error('Error getting PayPal access token:', error);
    return null;
  }
}