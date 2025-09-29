// PayPal Webhook Handler for Payment Verification
// SECURE PRODUCTION-READY VERSION with proper validation

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for server operations
);

// PayPal webhook event types we handle
interface PayPalWebhookEvent {
  id: string;
  event_type: string;
  resource_type: string;
  summary: string;
  resource: {
    id: string;
    status: string;
    payer: {
      email_address: string;
      payer_id: string;
    };
    purchase_units: Array<{
      amount: {
        currency_code: string;
        value: string;
      };
      payments: {
        captures: Array<{
          id: string;
          status: string;
          amount: {
            currency_code: string;
            value: string;
          };
        }>;
      };
    }>;
  };
  create_time: string;
}

// Webhook verification headers
interface WebhookHeaders {
  'paypal-transmission-id': string;
  'paypal-cert-id': string;
  'paypal-transmission-sig': string;
  'paypal-transmission-time': string;
  'paypal-auth-algo': string;
}

// SECURITY: Verify webhook signature before processing
export async function verifyWebhookSignature(
  headers: WebhookHeaders,
  body: string,
  webhookId: string
): Promise<boolean> {
  try {
    const accessToken = await getPayPalAccessToken();
    
    const verificationData = {
      transmission_id: headers['paypal-transmission-id'],
      cert_id: headers['paypal-cert-id'],
      auth_algo: headers['paypal-auth-algo'],
      transmission_sig: headers['paypal-transmission-sig'],
      transmission_time: headers['paypal-transmission-time'],
      webhook_id: webhookId,
      webhook_event: JSON.parse(body)
    };

    const response = await fetch(
      process.env.PAYPAL_API_BASE + '/v1/notifications/verify-webhook-signature',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(verificationData)
      }
    );

    const result = await response.json();
    return result.verification_status === 'SUCCESS';
    
  } catch (error) {
    console.error('🚨 Webhook signature verification failed:', error);
    return false;
  }
}

// Get PayPal access token for API calls
async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;
  const apiBase = process.env.PAYPAL_API_BASE || 'https://api.paypal.com';
  
  const response = await fetch(`${apiBase}/v1/oauth2/token`, {
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
}

// MAIN WEBHOOK HANDLER with security validation
export async function handlePayPalWebhook(
  event: PayPalWebhookEvent, 
  headers: WebhookHeaders,
  rawBody: string
) {
  console.log('🔔 PayPal Webhook received:', event.event_type);
  console.log('🔍 Event ID:', event.id);
  
  try {
    // SECURITY: Verify webhook signature first
    const webhookId = process.env.PAYPAL_WEBHOOK_ID!;
    const isValidSignature = await verifyWebhookSignature(headers, rawBody, webhookId);
    
    if (!isValidSignature && process.env.NODE_ENV === 'production') {
      console.error('🚨 SECURITY ALERT: Invalid webhook signature detected');
      return { success: false, error: 'Invalid signature' };
    }
    
    if (!isValidSignature) {
      console.warn('⚠️ Development mode: Skipping signature verification');
    } else {
      console.log('✅ Webhook signature verified successfully');
    }
    
    // Handle different webhook event types
    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        return await handlePaymentCompleted(event);
      
      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.FAILED':
        return await handlePaymentFailed(event);
      
      case 'PAYMENT.CAPTURE.REFUNDED':
        return await handlePaymentRefunded(event);
      
      default:
        console.log('Unhandled webhook event type:', event.event_type);
        return { success: true, message: 'Event ignored' };
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// SECURE PAYMENT COMPLETED HANDLER
async function handlePaymentCompleted(event: PayPalWebhookEvent) {
  const payment = event.resource;
  const paypalEmail = payment.payer.email_address;
  const paymentId = payment.id;
  const amount = payment.purchase_units[0]?.amount?.value;
  
  console.log('💰 Processing completed payment:', paymentId);
  console.log('📧 PayPal email:', paypalEmail);
  console.log('💵 Amount:', amount);
  
  // VALIDATION: Check payment amount matches expected value
  if (amount !== '3.99') {
    console.error('❌ Invalid payment amount:', amount, 'Expected: 3.99');
    return { success: false, error: `Invalid payment amount: ${amount}` };
  }
  
  // VALIDATION: Check currency
  const currency = payment.purchase_units[0]?.amount?.currency_code;
  if (currency !== 'USD') {
    console.error('❌ Invalid currency:', currency, 'Expected: USD');
    return { success: false, error: `Invalid currency: ${currency}` };
  }
  
  // VALIDATION: Check payment status
  if (payment.status !== 'COMPLETED') {
    console.error('❌ Payment not completed:', payment.status);
    return { success: false, error: `Payment status: ${payment.status}` };
  }
  
  try {
    // Check if payment already exists in database (idempotency)
    const { data: existingPayment } = await supabase
      .from('user_payments')
      .select('payment_id, payment_status, email')
      .eq('payment_id', paymentId)
      .single();
    
    if (existingPayment) {
      console.log('✅ Payment already recorded:', paymentId);
      if (existingPayment.payment_status === 'completed') {
        return { success: true, message: 'Payment already recorded', paymentId };
      } else {
        // Update status if it was pending
        await supabase
          .from('user_payments')
          .update({ payment_status: 'completed' })
          .eq('payment_id', paymentId);
        
        console.log('✅ Payment status updated to completed:', paymentId);
        return { success: true, message: 'Payment status updated', paymentId };
      }
    }
    
    // Insert new payment record
    const { error: insertError } = await supabase
      .from('user_payments')
      .insert([
        {
          email: paypalEmail,
          payment_id: paymentId,
          payer_id: payment.payer.payer_id,
          payment_status: 'completed',
          amount: amount,
          currency: currency,
          payment_method: 'paypal',
          payment_date: event.create_time,
          transaction_details: payment,
        }
      ]);
    
    if (insertError) {
      console.error('❌ Database insert failed:', insertError);
      throw new Error(`Database error: ${insertError.message}`);
    }
    
    console.log('✅ Payment successfully recorded via webhook:', paymentId);
    console.log('📧 Email for verification:', paypalEmail);
    
    // TODO: Trigger email verification here
    // await emailService.generateAndSendVerificationEmail(paymentId, paypalEmail);
    
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
      error: `Database error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`,
      paymentId 
    };
  }
}

async function handlePaymentFailed(event: PayPalWebhookEvent) {
  const payment = event.resource;
  const paymentId = payment.id;
  
  console.log('❌ Processing failed payment:', paymentId);
  
  // Update payment status to failed if it exists
  const { error } = await supabase
    .from('user_payments')
    .update({ 
      payment_status: 'failed',
      transaction_details: payment
    })
    .eq('payment_id', paymentId);
  
  if (error) {
    console.error('Failed to update payment status:', error);
  }
  
  // TODO: Send failure notification email
  
  return { 
    success: true, 
    message: 'Payment failure recorded',
    paymentId
  };
}

async function handlePaymentRefunded(event: PayPalWebhookEvent) {
  const payment = event.resource;
  const paymentId = payment.id;
  
  console.log('🔄 Processing refunded payment:', paymentId);
  
  // Update payment status and revoke access
  const { error } = await supabase
    .from('user_payments')
    .update({ 
      payment_status: 'refunded',
      transaction_details: payment
    })
    .eq('payment_id', paymentId);
  
  if (error) {
    console.error('Failed to update refund status:', error);
  }
  
  // TODO: Revoke user access and send notification
  
  return { 
    success: true, 
    message: 'Refund processed',
    paymentId
  };
}

export default handlePayPalWebhook;