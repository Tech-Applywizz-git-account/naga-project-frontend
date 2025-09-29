// test-database-access.js - Test direct database access
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🧪 Testing Database Access...');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDatabaseAccess() {
  console.log('\n1️⃣ Testing leads table access...');
  
  try {
    // Test simple select
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`  ❌ SELECT Error: ${error.message}`);
    } else {
      console.log('  ✅ SELECT works - leads table accessible');
    }
  } catch (err) {
    console.log(`  ❌ SELECT Exception: ${err.message}`);
  }

  console.log('\n2️⃣ Testing leads table insert (the actual problem)...');
  
  try {
    // Test insert with dummy data
    const { data, error } = await supabase
      .from('leads')
      .insert({
        email: 'test@example.com',
        full_name: 'Test User',
        phone: '1234567890',
        country_code: '+1',
        promo_code: 'TEST'
      })
      .select();
    
    if (error) {
      console.log(`  ❌ INSERT Error: ${error.message}`);
      console.log(`  🔍 Error Details:`, error);
      
      if (error.message.includes('row-level security') || error.message.includes('policy')) {
        console.log('\n  🚨 CONFIRMED: RLS POLICY ERROR');
        console.log('  📋 Need to manually disable RLS in Supabase Dashboard');
      }
    } else {
      console.log('  ✅ INSERT works - RLS is disabled!');
      
      // Clean up test data
      await supabase
        .from('leads')
        .delete()
        .eq('email', 'test@example.com');
      console.log('  🧹 Test data cleaned up');
    }
  } catch (err) {
    console.log(`  ❌ INSERT Exception: ${err.message}`);
  }

  console.log('\n3️⃣ Testing user_payments table...');
  
  try {
    const { data, error } = await supabase
      .from('user_payments')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`  ❌ user_payments Error: ${error.message}`);
    } else {
      console.log('  ✅ user_payments accessible');
    }
  } catch (err) {
    console.log(`  ❌ user_payments Exception: ${err.message}`);
  }

  console.log('\n📋 NEXT STEPS:');
  console.log('  1. If you see RLS policy errors above, go to Supabase Dashboard');
  console.log('  2. Navigate to: Database → Tables → leads → Settings (gear icon)');
  console.log('  3. UNCHECK "Enable Row Level Security"');
  console.log('  4. Repeat for user_payments table');
  console.log('  5. Test signup again');
}

testDatabaseAccess().catch(console.error);