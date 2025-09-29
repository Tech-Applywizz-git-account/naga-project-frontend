// 🚨 URGENT PAYMENT RECOVERY FOR: 436297204H702220X
// Payment was successful but failed to save due to Invalid API key

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🚨 URGENT PAYMENT RECOVERY');
console.log('Payment ID: 436297204H702220X');
console.log('Status: Payment successful, failed to save');
console.log('='.repeat(60));

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes('example_get_real_key')) {
  console.log('❌ CRITICAL: Fix your .env file first!');
  console.log('1. Go to Supabase Dashboard → Settings → API');
  console.log('2. Copy the real anon key');
  console.log('3. Replace the placeholder in .env file');
  console.log('4. Run this script again');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function recoverPayment() {
  const paymentId = '436297204H702220X';
  
  try {
    // Step 1: Check if payment already exists in database
    console.log('\n🔍 STEP 1: Checking if payment exists in database...');
    
    const { data: existingPayment, error: checkError } = await supabase
      .from('user_payments')
      .select('*')
      .eq('payment_id', paymentId)
      .single();
    
    if (existingPayment) {
      console.log('✅ Payment already exists in database!');
      console.log('Payment details:', {
        payment_id: existingPayment.payment_id,
        email: existingPayment.email || existingPayment.payer_email,
        status: existingPayment.payment_status,
        amount: existingPayment.amount
      });
      
      if (existingPayment.payment_status === 'completed') {
        console.log('🎉 Payment is already marked as completed!');
        console.log('✅ You can proceed with signup using this email:', existingPayment.email || existingPayment.payer_email);
        console.log('🔗 Go to: http://localhost:5176/signup');
        return;
      }
    }
    
    if (checkError && !checkError.message.includes('No rows returned')) {
      console.log('❌ Database connection error:', checkError.message);
      
      if (checkError.message.includes('Invalid API key')) {
        console.log('🚨 STILL GETTING INVALID API KEY ERROR!');
        console.log('Your .env file still has placeholder values.');
        console.log('Please get the real anon key from Supabase Dashboard.');
        return;
      }
    }
    
    // Step 2: If payment doesn't exist, we need PayPal details to create it
    console.log('\n📝 STEP 2: Payment not found in database');
    console.log('This means the payment succeeded in PayPal but failed to save.');
    console.log('');
    console.log('📋 MANUAL RECOVERY OPTIONS:');
    console.log('');
    console.log('OPTION 1: Check PayPal for details');
    console.log('1. Go to: https://www.paypal.com/myaccount/transactions');
    console.log(`2. Search for transaction: ${paymentId}`);
    console.log('3. Get the payer email from the transaction');
    console.log('4. Manually insert payment record (see SQL below)');
    console.log('');
    console.log('OPTION 2: Use the email you remember using for PayPal');
    console.log('1. Replace YOUR_PAYPAL_EMAIL in the SQL below');
    console.log('2. Run the SQL in Supabase SQL Editor');
    console.log('3. Then go to signup page');

    console.log('\n💾 SQL TO RUN IN SUPABASE:');
    console.log('-- Copy this entire SQL and run in Supabase SQL Editor');
    console.log(`
-- PAYMENT RECOVERY FOR ${paymentId}
INSERT INTO public.user_payments (
  email,
  payer_email, 
  payment_id,
  payer_id,
  payment_status,
  amount,
  currency,
  payment_method,
  payment_date,
  transaction_details
) VALUES (
  'YOUR_PAYPAL_EMAIL_HERE',      -- Replace with actual PayPal email
  'YOUR_PAYPAL_EMAIL_HERE',      -- Replace with actual PayPal email
  '${paymentId}',
  'PAYPAL_PAYER_ID',             -- Optional, can be 'RECOVERED_${Date.now()}'
  'completed',
  3.99,
  'USD',
  'paypal',
  NOW(),
  '{"recovery": true, "manual_insert": true, "recovered_at": "${new Date().toISOString()}"}'::jsonb
);

-- Verify the insert worked
SELECT * FROM public.user_payments WHERE payment_id = '${paymentId}';
    `);
    
    console.log('\n🔗 AFTER RUNNING SQL:');
    console.log('1. Verify the payment appears in the database');
    console.log('2. Go to: http://localhost:5176/signup');
    console.log('3. Use the same email you used for PayPal payment');
    console.log('4. Complete your account setup');
    
  } catch (error) {
    console.error('❌ Recovery failed:', error.message);
    
    if (error.message.includes('Invalid API key')) {
      console.log('\n🚨 API KEY ISSUE CONFIRMED');
      console.log('Your environment variables are still not correctly set.');
      console.log('Fix the .env file and try again.');
    }
  }
}

async function testConnection() {
  console.log('\n🧪 Testing database connection...');
  
  try {
    const { data, error } = await supabase
      .from('user_payments')
      .select('count(*)')
      .limit(1);
    
    if (error) {
      console.log('❌ Connection failed:', error.message);
      return false;
    } else {
      console.log('✅ Database connection successful');
      return true;
    }
  } catch (err) {
    console.log('❌ Connection exception:', err.message);
    return false;
  }
}

async function main() {
  const connected = await testConnection();
  if (connected) {
    await recoverPayment();
  } else {
    console.log('\n📋 FIX ENVIRONMENT VARIABLES FIRST:');
    console.log('1. Go to Supabase Dashboard');
    console.log('2. Settings → API'); 
    console.log('3. Copy anon/public key');
    console.log('4. Update .env file');
    console.log('5. Run this script again');
  }
}

main().catch(console.error);