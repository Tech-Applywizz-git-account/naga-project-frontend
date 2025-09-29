// check-rls-status.js - Check actual RLS policies and status
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 COMPREHENSIVE RLS ANALYSIS');
console.log('====================================');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkRLSStatus() {
  
  // Test 1: Check what authentication context we have
  console.log('\n1️⃣ AUTHENTICATION CONTEXT:');
  const { data: session } = await supabase.auth.getSession();
  console.log('  Current session:', session.session ? 'AUTHENTICATED' : 'ANONYMOUS');
  if (session.session) {
    console.log('  User ID:', session.session.user?.id);
    console.log('  User Email:', session.session.user?.email);
  }

  // Test 2: Check table structure and RLS status 
  console.log('\n2️⃣ TABLE STRUCTURE CHECK:');
  try {
    // Use raw SQL to check RLS status
    const { data: tables, error } = await supabase
      .rpc('sql', { 
        query: `
          SELECT 
            schemaname, 
            tablename, 
            rowsecurity as rls_enabled,
            tableowner
          FROM pg_tables 
          WHERE tablename IN ('leads', 'user_payments')
          AND schemaname = 'public';
        `
      });
    
    if (error) {
      console.log('  ❌ Could not check RLS status via RPC:', error.message);
    } else {
      console.log('  📋 Table RLS Status:', tables);
    }
  } catch (err) {
    console.log('  ⚠️  RPC method not available, using alternative approach');
  }

  // Test 3: Check active policies
  console.log('\n3️⃣ ACTIVE RLS POLICIES:');
  try {
    const { data: policies, error } = await supabase
      .rpc('sql', { 
        query: `
          SELECT 
            schemaname,
            tablename, 
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
          FROM pg_policies 
          WHERE tablename IN ('leads', 'user_payments')
          ORDER BY tablename, policyname;
        `
      });
    
    if (error) {
      console.log('  ❌ Could not check policies:', error.message);
    } else if (policies && policies.length > 0) {
      console.log('  🔒 Active Policies Found:');
      policies.forEach(policy => {
        console.log(`    • ${policy.tablename}.${policy.policyname}`);
        console.log(`      Command: ${policy.cmd}, Permissive: ${policy.permissive}`);
        console.log(`      Condition: ${policy.qual || 'N/A'}`);
        console.log(`      With Check: ${policy.with_check || 'N/A'}`);
      });
    } else {
      console.log('  ✅ No active policies found');
    }
  } catch (err) {
    console.log('  ⚠️  Could not query policies directly');
  }

  // Test 4: Test actual table access
  console.log('\n4️⃣ ACTUAL DATABASE ACCESS TEST:');
  
  // Test SELECT (should work)
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log(`  ❌ SELECT failed: ${error.message}`);
    } else {
      console.log('  ✅ SELECT works');
    }
  } catch (err) {
    console.log(`  ❌ SELECT exception: ${err.message}`);
  }

  // Test INSERT (this is what's failing)
  try {
    const testData = {
      email: `test-${Date.now()}@example.com`,
      full_name: 'RLS Test User',
      phone: '1234567890',
      country_code: '+1',
      promo_code: 'TEST'
    };

    console.log('  🧪 Testing INSERT with data:', testData);
    
    const { data, error } = await supabase
      .from('leads')
      .insert(testData)
      .select();
    
    if (error) {
      console.log(`  ❌ INSERT failed: ${error.message}`);
      console.log(`  🔍 Error code: ${error.code}`);
      console.log(`  🔍 Error details:`, error.details);
      console.log(`  🔍 Error hint:`, error.hint);
      
      // Check if it's specifically an RLS error
      if (error.code === '42501' && error.message.includes('row-level security')) {
        console.log('  🚨 CONFIRMED: This is an RLS policy violation');
        console.log('  📋 The leads table has active RLS policies blocking anonymous inserts');
      }
    } else {
      console.log('  ✅ INSERT works! Data:', data);
      
      // Clean up test data
      await supabase
        .from('leads')
        .delete()
        .eq('email', testData.email);
      console.log('  🧹 Test data cleaned up');
    }
  } catch (err) {
    console.log(`  ❌ INSERT exception: ${err.message}`);
  }

  // Test 5: Check column existence
  console.log('\n5️⃣ COLUMN STRUCTURE CHECK:');
  try {
    const { data: columns, error } = await supabase
      .rpc('sql', { 
        query: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = 'leads' 
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });
    
    if (error) {
      console.log('  ❌ Could not check columns:', error.message);
    } else {
      console.log('  📋 Leads table columns:');
      columns.forEach(col => {
        console.log(`    • ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
      });
    }
  } catch (err) {
    console.log('  ⚠️  Could not query column structure');
  }

  console.log('\n🎯 DIAGNOSIS SUMMARY:');
  console.log('====================================');
  console.log('Based on the tests above:');
  console.log('1. If RLS is enabled (rowsecurity = true), that\'s the root cause');
  console.log('2. If policies exist, they need to be dropped');
  console.log('3. The 42501 error confirms RLS policy violation');
  console.log('4. Anonymous users cannot insert due to RLS restrictions');
  
  console.log('\n💡 IMMEDIATE ACTION REQUIRED:');
  console.log('Run this in Supabase SQL Editor:');
  console.log('ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;');
}

checkRLSStatus().catch(console.error);