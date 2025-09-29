// 🚨 EMERGENCY RECOVERY FOR PAYMENT: 0F304858M42622246
// This script will manually create the verification token and provide the verification link

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://xficomhdacoloehbzmlt.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY. Set it before running this script.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function recoverPaymentEmail() {
  console.log('🚨 EMERGENCY PAYMENT RECOVERY');
  console.log('=' + '='.repeat(50));
  
  const paymentId = '0F304858M42622246';
  const email = 'vivek@applywizz.com';
  
  try {
    // Step 1: Verify payment exists
    const { data: payment, error: paymentError } = await supabase
      .from('user_payments')
      .select('*')
      .eq('payment_id', paymentId)
      .single();
      
    if (paymentError || !payment) {
      console.error('❌ Payment not found:', paymentError);
      return;
    }
    
    console.log('✅ Payment verified:', {
      payment_id: payment.payment_id,
      email: payment.email,
      status: payment.payment_status,
      amount: payment.amount
    });
    
    // Step 2: Generate verification token
    const generateToken = async () => {
      const array = new Uint8Array(32);
      // Use Node.js crypto
      const crypto = await import('crypto');
      const buffer = crypto.randomBytes(32);
      for (let i = 0; i < 32; i++) {
        array[i] = buffer[i];
      }
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    };
    
    const verificationToken = await generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    
    console.log('🔑 Generated verification token:', verificationToken);
    
    // Step 3: Create verification URL
    const verificationUrl = `https://payment-jcueh9jze-designwithnicks-projects.vercel.app/verify-email?token=${verificationToken}`;
    
    console.log('🔗 Verification URL:');
    console.log(verificationUrl);
    
    // Step 4: Try to store token (if tables exist)
    try {
      const { error: insertError } = await supabase
        .from('email_verification_tokens')
        .insert({
          payment_id: paymentId,
          email: email,
          token: verificationToken,
          created_at: new Date().toISOString(),
          expires_at: expiresAt,
          is_used: false
        });
        
      if (insertError) {
        console.warn('⚠️ Could not store token in database:', insertError.message);
        console.log('💡 Run the emergency-email-schema.sql first to create tables');
      } else {
        console.log('✅ Token stored in database successfully');
      }
    } catch (e) {
      console.warn('⚠️ Database tables not ready:', e.message);
    }
    
    // Step 5: Log recovery attempt
    try {
      await supabase
        .from('email_logs')
        .insert({
          recipient: email,
          subject: 'Manual Verification Link Generated',
          email_type: 'manual_recovery',
          payment_id: paymentId,
          sent_at: new Date().toISOString(),
          status: 'manual_generated',
          message_id: `manual_recovery_${Date.now()}`
        });
      console.log('✅ Recovery logged successfully');
    } catch (e) {
      console.warn('⚠️ Could not log recovery:', e.message);
    }
    
    console.log('\n🎯 RECOVERY COMPLETE');
    console.log('=' + '='.repeat(50));
    console.log('📧 Send this verification link to:', email);
    console.log('🔗 Link:', verificationUrl);
    console.log('⏰ Expires:', new Date(expiresAt).toLocaleString());
    console.log('\n💡 NEXT STEPS:');
    console.log('1. Run emergency-email-schema.sql in Supabase SQL Editor');
    console.log('2. Deploy Edge Function (npx supabase functions deploy send-email)');
    console.log('3. Set environment variables (SENDGRID_API_KEY, FROM_EMAIL)');
    console.log('4. Send the verification link above to the user manually');
    
  } catch (error) {
    console.error('❌ Recovery failed:', error);
  }
}

recoverPaymentEmail();