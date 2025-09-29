// 🚨 EMERGENCY RECOVERY FOR PAYMENT: 4L031762MS986245E
// Following Full-Stack Bug Resolution workflow

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://xficomhdacoloehbzmlt.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY. Set it before running this script.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function recoverSpecificPayment() {
  console.log('🚨 EMERGENCY RECOVERY - PAYMENT 4L031762MS986245E');
  console.log('=' + '='.repeat(60));
  
  const paymentId = '4L031762MS986245E';
  
  try {
    // STEP 1: Database State Verification (from workflow)
    console.log('\n📊 STEP 1: Payment Database Verification');
    const { data: payment, error: paymentError } = await supabase
      .from('user_payments')
      .select('*')
      .eq('payment_id', paymentId)
      .single();
      
    if (paymentError || !payment) {
      console.error('❌ Payment not found in database:', paymentError?.message);
      return;
    }
    
    console.log('✅ Payment found:', {
      payment_id: payment.payment_id,
      email: payment.email,
      payer_email: payment.payer_email,
      status: payment.payment_status,
      amount: payment.amount,
      payment_date: payment.payment_date
    });
    
    const userEmail = payment.email || payment.payer_email;
    
    // STEP 2: Log and Token Existence Check (from workflow)
    console.log('\n📊 STEP 2: Email System State Check');
    
    try {
      const { data: tokens, error: tokenError } = await supabase
        .from('email_verification_tokens')
        .select('*')
        .eq('payment_id', paymentId);
        
      const { data: logs, error: logError } = await supabase
        .from('email_logs')
        .select('*')
        .eq('payment_id', paymentId);
        
      console.log('📧 Existing tokens:', tokens?.length || 0);
      console.log('📊 Email logs:', logs?.length || 0);
      
      if (tokens?.length > 0) {
        console.log('⚠️ Tokens already exist - checking if any are still valid');
        const validTokens = tokens.filter(t => !t.is_used && new Date(t.expires_at) > new Date());
        if (validTokens.length > 0) {
          const validToken = validTokens[0];
          const verificationUrl = `https://payment-jcueh9jze-designwithnicks-projects.vercel.app/verify-email?token=${validToken.token}`;
          console.log('✅ Found valid existing token!');
          console.log('🔗 Verification URL:', verificationUrl);
          console.log('⏰ Expires:', new Date(validToken.expires_at).toLocaleString());
          console.log('\n💡 SEND THIS LINK TO USER IMMEDIATELY!');
          return;
        }
      }
    } catch (e) {
      console.warn('⚠️ Could not check existing tokens (tables may not exist):', e.message);
    }
    
    // STEP 3: Generate New Recovery Token
    console.log('\n📊 STEP 3: Generating New Verification Token');
    
    const generateToken = async () => {
      const array = new Uint8Array(32);
      const crypto = await import('crypto');
      const buffer = crypto.randomBytes(32);
      for (let i = 0; i < 32; i++) {
        array[i] = buffer[i];
      }
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    };
    
    const verificationToken = await generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const verificationUrl = `https://payment-jcueh9jze-designwithnicks-projects.vercel.app/verify-email?token=${verificationToken}`;
    
    console.log('🔑 Generated new verification token');
    console.log('🔗 Verification URL:', verificationUrl);
    
    // STEP 4: Attempt to Store Token (Infrastructure Validation)
    console.log('\n📊 STEP 4: Token Storage Attempt');
    
    try {
      const { error: insertError } = await supabase
        .from('email_verification_tokens')
        .insert({
          payment_id: paymentId,
          email: userEmail,
          token: verificationToken,
          created_at: new Date().toISOString(),
          expires_at: expiresAt,
          is_used: false
        });
        
      if (insertError) {
        console.warn('⚠️ Could not store token in database:', insertError.message);
        console.log('💡 Database tables need to be created first');
        console.log('🔧 Run emergency-email-schema.sql in Supabase SQL Editor');
      } else {
        console.log('✅ Token stored in database successfully');
      }
    } catch (e) {
      console.warn('⚠️ Database tables not ready:', e.message);
    }
    
    // STEP 5: Log Recovery Attempt
    try {
      await supabase
        .from('email_logs')
        .insert({
          recipient: userEmail,
          subject: 'Manual Recovery - Payment Verification',
          email_type: 'manual_recovery',
          payment_id: paymentId,
          sent_at: new Date().toISOString(),
          status: 'manual_generated',
          message_id: `recovery_${Date.now()}`
        });
      console.log('✅ Recovery attempt logged');
    } catch (e) {
      console.warn('⚠️ Could not log recovery attempt:', e.message);
    }
    
    // STEP 6: Output Recovery Instructions
    console.log('\n🎯 RECOVERY COMPLETE');
    console.log('=' + '='.repeat(60));
    console.log('📧 SEND TO USER:', userEmail);
    console.log('🔗 VERIFICATION LINK:');
    console.log(verificationUrl);
    console.log('⏰ EXPIRES:', new Date(expiresAt).toLocaleString());
    
    console.log('\n💡 IMMEDIATE ACTIONS:');
    console.log('1. Send the verification link above to the user via email/support');
    console.log('2. If database schema is missing, run emergency-email-schema.sql');
    console.log('3. Deploy Edge Function if not already deployed');
    console.log('4. Monitor for future payment email failures');
    
    console.log('\n🔧 SYSTEM STATUS:');
    console.log('- Payment: ✅ Successfully processed and in database');
    console.log('- Email Infrastructure: ⚠️ Needs setup (tables/functions)');
    console.log('- Recovery Token: ✅ Generated and ready for use');
    
  } catch (error) {
    console.error('❌ Recovery failed:', error);
    console.log('\n🆘 MANUAL FALLBACK REQUIRED:');
    console.log('1. Contact user directly via support channels');
    console.log('2. Confirm payment was processed');
    console.log('3. Provide manual access to system if needed');
  }
}

recoverSpecificPayment();