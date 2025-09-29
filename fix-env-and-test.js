// fix-env-and-test.js - Fix environment and test database
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

console.log('🔧 ENVIRONMENT AND DATABASE FIXER');
console.log('===================================');

// Step 1: Check current environment
console.log('\n1️⃣ CHECKING CURRENT ENVIRONMENT:');
const envContent = fs.readFileSync('.env', 'utf8');
console.log('Current .env contents:');
console.log(envContent);

if (envContent.includes('REPLACE_WITH_XFICOM_ANON_KEY') || envContent.includes('placeholder')) {
  console.log('\n❌ CRITICAL ISSUE: Your .env file has placeholder values!');
  console.log('\n📋 TO FIX THIS:');
  console.log('1. Go to your Supabase Dashboard');
  console.log('2. Project Settings → API');
  console.log('3. Copy your actual Project URL and anon/public key');
  console.log('4. Replace the placeholder values in your .env file');
  console.log('\nExample format:');
  console.log('VITE_SUPABASE_URL=https://your-project-ref.supabase.co');
  console.log('VITE_SUPABASE_ANON_KEY=your-actual-anon-key-starting-with-eyJ...');
  console.log('\n⚠️  Cannot proceed with database tests until .env is fixed!');
  process.exit(1);
}

// Step 2: Test with current environment
console.log('\n2️⃣ TESTING WITH CURRENT ENVIRONMENT:');
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

console.log('URL:', SUPABASE_URL);
console.log('ANON_KEY:', SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY.substring(0, 20) + '...' : 'Missing');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes('REPLACE')) {
  console.log('❌ Environment variables are not properly set!');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDatabaseConnection() {
  console.log('\n3️⃣ TESTING DATABASE CONNECTION:');
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('leads')
      .select('count(*)')
      .limit(1);
    
    if (error) {
      console.log(`❌ Connection failed: ${error.message}`);
      
      if (error.message.includes('Invalid API key')) {
        console.log('\n📋 This confirms your .env file needs real Supabase credentials!');
      }
      return false;
    } else {
      console.log('✅ Database connection successful');
      return true;
    }
  } catch (err) {
    console.log(`❌ Connection exception: ${err.message}`);
    return false;
  }
}

async function testRLSIssue() {
  console.log('\n4️⃣ TESTING RLS ISSUE:');
  
  try {
    const testData = {
      email: `test-${Date.now()}@example.com`,
      full_name: 'RLS Test User',
      phone: '1234567890',
      country_code: '+1',
      promo_code: 'TEST'
    };

    const { data, error } = await supabase
      .from('leads')
      .insert(testData)
      .select();
    
    if (error) {
      if (error.code === '42501' && error.message.includes('row-level security')) {
        console.log('🚨 CONFIRMED: RLS Policy Error!');
        console.log('\n📋 SOLUTION: Run this SQL in Supabase Dashboard:');
        console.log('ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;');
        return false;
      } else {
        console.log(`❌ Different error: ${error.message}`);
        return false;
      }
    } else {
      console.log('✅ INSERT works! RLS is disabled.');
      
      // Clean up
      await supabase
        .from('leads')
        .delete()
        .eq('email', testData.email);
      console.log('🧹 Test data cleaned up');
      return true;
    }
  } catch (err) {
    console.log(`❌ Test exception: ${err.message}`);
    return false;
  }
}

async function runTests() {
  const connectionOk = await testDatabaseConnection();
  if (!connectionOk) {
    console.log('\n❌ Cannot proceed - fix environment variables first!');
    return;
  }
  
  const rlsOk = await testRLSIssue();
  
  console.log('\n🎯 SUMMARY:');
  console.log('==========');
  if (rlsOk) {
    console.log('✅ All tests passed! Your database is working correctly.');
    console.log('🚀 You can now test the signup functionality.');
  } else {
    console.log('❌ RLS policy is blocking inserts.');
    console.log('📋 Action required: Disable RLS in Supabase Dashboard.');
  }
}

runTests().catch(console.error);