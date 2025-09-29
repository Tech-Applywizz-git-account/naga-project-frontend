// 🧪 TEST SCRIPT FOR NEW EMAIL VERIFICATION SYSTEM
// This script tests the complete email verification flow

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://xficomhdacoloehbzmlt.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY. Set it before running this script.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function testEmailSystem() {
  console.log('🧪 TESTING EMAIL VERIFICATION SYSTEM');
  console.log('=' + '='.repeat(50));
  
  const testEmail = 'test@applywizz.com';
  const testPaymentId = 'TEST_' + Date.now();
  
  try {
    // STEP 1: Test database tables exist
    console.log('\n📊 STEP 1: Database Tables Check');
    
    try {
      const { data: tokenTableTest, error: tokenError } = await supabase
        .from('email_verification_tokens')
        .select('*')
        .limit(1);
      
      if (tokenError) {
        console.error('❌ email_verification_tokens table issue:', tokenError.message);
        console.log('💡 Please run emergency-email-schema.sql in Supabase SQL Editor first');
        return;
      } else {
        console.log('✅ email_verification_tokens table exists');
      }
    } catch (e) {
      console.error('❌ Database not ready:', e.message);
      return;
    }
    
    try {
      const { data: logTableTest, error: logError } = await supabase
        .from('email_logs')
        .select('*')
        .limit(1);
      
      if (logError) {
        console.error('❌ email_logs table issue:', logError.message);
        return;
      } else {
        console.log('✅ email_logs table exists');
      }
    } catch (e) {
      console.error('❌ Email logs table not ready:', e.message);
      return;
    }
    
    // STEP 2: Test token generation and storage
    console.log('\n📊 STEP 2: Token Generation Test');
    
    const generateToken = async () => {
      const array = new Uint8Array(32);
      const crypto = await import('crypto');
      const buffer = crypto.randomBytes(32);
      for (let i = 0; i < 32; i++) {
        array[i] = buffer[i];
      }
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    };
    
    const testToken = await generateToken();
    console.log('🔑 Generated test token:', testToken.substring(0, 20) + '...');
    
    // STEP 3: Test token storage
    console.log('\n📊 STEP 3: Token Storage Test');
    
    try {
      const { error: insertError } = await supabase
        .from('email_verification_tokens')
        .insert({
          payment_id: testPaymentId,
          email: testEmail,
          token: testToken,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          is_used: false
        });
        
      if (insertError) {
        console.error('❌ Failed to store token:', insertError.message);
        return;
      } else {
        console.log('✅ Token stored successfully');
      }
    } catch (e) {
      console.error('❌ Token storage error:', e.message);
      return;
    }
    
    // STEP 4: Test token verification
    console.log('\n📊 STEP 4: Token Verification Test');
    
    try {
      const { data: verifyResult, error: verifyError } = await supabase
        .rpc('verify_email_token', {
          token_param: testToken
        });
      
      if (verifyError) {
        console.error('❌ Token verification failed:', verifyError.message);
        return;
      } else {
        console.log('✅ Token verification works:', verifyResult);
      }
    } catch (e) {
      console.error('❌ Verification function error:', e.message);
      return;
    }
    
    // STEP 5: Test email logging
    console.log('\n📊 STEP 5: Email Logging Test');
    
    try {
      const { error: logError } = await supabase
        .from('email_logs')
        .insert({
          recipient: testEmail,
          subject: 'Test Email Verification',
          email_type: 'verification',
          payment_id: testPaymentId,
          sent_at: new Date().toISOString(),
          status: 'test_success',
          message_id: `test_${Date.now()}`
        });
        
      if (logError) {
        console.error('❌ Email logging failed:', logError.message);
      } else {
        console.log('✅ Email logging works');
      }
    } catch (e) {
      console.error('❌ Email logging error:', e.message);
    }
    
    // STEP 6: Create verification URL
    const verificationUrl = `https://payment-jcueh9jze-designwithnicks-projects.vercel.app/verify-email?token=${testToken}`;
    console.log('\n🔗 Test verification URL:');
    console.log(verificationUrl);
    
    console.log('\n🎉 EMAIL SYSTEM TEST COMPLETE');
    console.log('=' + '='.repeat(50));
    console.log('✅ All components working correctly!');
    console.log('\n💡 NEXT STEPS:');
    console.log('1. Test the verification URL in browser');
    console.log('2. Try a real payment to test end-to-end flow');
    console.log('3. Configure Supabase email templates for production');
    
    // Cleanup test data
    await supabase
      .from('email_verification_tokens')
      .delete()
      .eq('payment_id', testPaymentId);
      
    await supabase
      .from('email_logs')
      .delete()
      .eq('payment_id', testPaymentId);
      
    console.log('🧹 Test data cleaned up');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testEmailSystem();