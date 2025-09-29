// CRITICAL EMAIL SYSTEM DIAGNOSIS
// Testing payment ID: 0F304858M42622246
// Email: vivek@applywizz.com

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://xficomhdacoloehbzmlt.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY. Set it before running this script.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function diagnoseEmailFailure() {
  console.log('🔍 DIAGNOSING EMAIL SYSTEM FAILURE');
  console.log('=' + '='.repeat(50));
  
  const paymentId = '0F304858M42622246';
  const email = 'vivek@applywizz.com';
  
  try {
    console.log('\n📋 STEP 1: Payment Validation');
    const { data: payment, error: paymentError } = await supabase
      .from('user_payments')
      .select('payment_status, email, amount, payment_id')
      .eq('payment_id', paymentId)
      .single();
    
    if (paymentError) {
      console.error('❌ Payment validation failed:', paymentError);
      return;
    }
    
    console.log('✅ Payment found:', {
      payment_id: payment.payment_id,
      status: payment.payment_status,
      email: payment.email,
      amount: payment.amount
    });
    
    console.log('\n📋 STEP 2: Database Schema Check');
    
    try {
      const { error: tokenError } = await supabase
        .from('email_verification_tokens')
        .select('*')
        .limit(1);
      
      if (tokenError) {
        console.error('❌ email_verification_tokens table issue:', tokenError);
      } else {
        console.log('✅ email_verification_tokens table exists');
      }
    } catch (e) {
      console.error('❌ email_verification_tokens table missing:', e.message);
    }
    
    try {
      const { error: logError } = await supabase
        .from('email_logs')
        .select('*')
        .limit(1);
      
      if (logError) {
        console.error('❌ email_logs table issue:', logError);
      } else {
        console.log('✅ email_logs table exists');
      }
    } catch (e) {
      console.error('❌ email_logs table missing:', e.message);
    }
    
    console.log('\n📋 STEP 3: Edge Function Test');
    
    try {
      const { data: functionResponse, error: functionError } = await supabase.functions.invoke('send-email', {
        body: {
          to: 'test@example.com',
          subject: 'Test Email',
          html: '<p>Test</p>',
          text: 'Test',
          paymentId: 'test',
          verificationToken: 'test'
        }
      });
      
      if (functionError) {
        console.error('❌ Edge Function error:', functionError);
      } else {
        console.log('✅ Edge Function response:', functionResponse);
      }
    } catch (e) {
      console.error('❌ Edge Function not available:', e.message);
    }
    
    console.log('\n📋 STEP 4: Database Functions Test');
    
    try {
      const { data: storeResult, error: storeError } = await supabase
        .rpc('store_verification_token', {
          payment_id_param: paymentId,
          email_param: email,
          token_param: 'test_token_' + Date.now()
        });
      
      if (storeError) {
        console.error('❌ store_verification_token function error:', storeError);
      } else {
        console.log('✅ store_verification_token function works:', storeResult);
      }
    } catch (e) {
      console.error('❌ store_verification_token function missing:', e.message);
    }
    
    console.log('\n📋 STEP 5: Manual Email Service Test');
    
    try {
      const testToken = 'test_token_' + Date.now();
      const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          to: email,
          subject: '🎉 Payment Successful - Verify Your Email to Access H1B Database',
          html: `
            <h1>Payment Successful!</h1>
            <p>Your payment ID: ${paymentId}</p>
            <p>Amount: $3.99</p>
            <a href="https://your-app.com/verify?token=${testToken}">Verify Email</a>
          `,
          text: `Payment successful! Payment ID: ${paymentId}`,
          paymentId,
          verificationToken: testToken
        }
      });
      
      if (emailError) {
        console.error('❌ Email service error:', emailError);
        console.log('🔍 This is likely the root cause of the email failure!');
      } else {
        console.log('✅ Email service works:', emailResult);
      }
      
    } catch (e) {
      console.error('❌ Email service exception:', e.message);
    }
    
    console.log('\n📋 STEP 6: Environment Check');
    console.log('⚠️ Cannot check environment variables from client side');
    console.log('💡 Check Supabase Dashboard > Settings > Edge Functions > Environment Variables');
    console.log('📝 Required: SENDGRID_API_KEY, FROM_EMAIL');
    
    console.log('\n🏁 DIAGNOSIS COMPLETE');
    console.log('=' + '='.repeat(50));
    
  } catch (error) {
    console.error('❌ Critical diagnosis error:', error);
  }
}

diagnoseEmailFailure();
