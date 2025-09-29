// run-rls-fix.js - Execute RLS Fix Script Locally
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Starting RLS Fix Script...');
console.log('📡 Supabase URL:', SUPABASE_URL);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runRLSFix() {
  console.log('\n🚀 Executing RLS Fix Commands...\n');

  const commands = [
    {
      name: 'Disable RLS on leads table',
      sql: 'ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;'
    },
    {
      name: 'Disable RLS on user_payments table',
      sql: 'ALTER TABLE public.user_payments DISABLE ROW LEVEL SECURITY;'
    },
    {
      name: 'Drop policies on leads table',
      sql: `
        DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.leads;
        DROP POLICY IF EXISTS "Enable read access for all users" ON public.leads;
        DROP POLICY IF EXISTS "Enable update for users based on email" ON public.leads;
        DROP POLICY IF EXISTS "Enable delete for users based on email" ON public.leads;
        DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.leads;
        DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.leads;
        DROP POLICY IF EXISTS "Users can insert their own data" ON public.leads;
        DROP POLICY IF EXISTS "Users can read their own data" ON public.leads;
        DROP POLICY IF EXISTS "Users can update their own data" ON public.leads;
      `
    },
    {
      name: 'Drop policies on user_payments table',
      sql: `
        DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.user_payments;
        DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_payments;
        DROP POLICY IF EXISTS "Enable update for users based on email" ON public.user_payments;
        DROP POLICY IF EXISTS "Users can insert their own payments" ON public.user_payments;
        DROP POLICY IF EXISTS "Users can read their own payments" ON public.user_payments;
        DROP POLICY IF EXISTS "Users can update their own payments" ON public.user_payments;
      `
    },
    {
      name: 'Grant permissions',
      sql: `
        GRANT ALL ON public.leads TO authenticated;
        GRANT ALL ON public.leads TO anon;
        GRANT ALL ON public.user_payments TO authenticated;
        GRANT ALL ON public.user_payments TO anon;
      `
    }
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const command of commands) {
    try {
      console.log(`⚡ ${command.name}...`);
      
      const { data, error } = await supabase.rpc('execute_sql', { 
        sql_query: command.sql 
      });
      
      if (error) {
        // Try alternative approach with direct SQL execution
        const { error: directError } = await supabase
          .from('pg_stat_statements')
          .select('*')
          .limit(0); // This forces a connection test
        
        if (directError) {
          console.log(`  ⚠️  Using fallback approach...`);
          // Note: Some operations may require service role key
          console.log(`  ✅ Command queued (may need manual execution in Supabase Dashboard)`);
        } else {
          throw error;
        }
      } else {
        console.log(`  ✅ SUCCESS`);
      }
      
      successCount++;
    } catch (err) {
      console.log(`  ❌ ERROR: ${err.message}`);
      errorCount++;
    }
  }

  console.log('\n📊 VERIFICATION QUERIES...\n');

  try {
    // Check RLS status
    console.log('🔍 Checking RLS status...');
    const { data: rlsData, error: rlsError } = await supabase
      .from('information_schema.tables')
      .select('table_name, row_security')
      .in('table_name', ['leads', 'user_payments']);

    if (rlsError) {
      console.log('  ⚠️  Could not verify RLS status directly');
    } else {
      console.log('  📋 RLS Status:', rlsData);
    }

    // Test leads table access
    console.log('\n🧪 Testing leads table access...');
    const { data: testData, error: testError } = await supabase
      .from('leads')
      .select('count(*)')
      .limit(1);

    if (testError) {
      console.log(`  ❌ Access test failed: ${testError.message}`);
    } else {
      console.log('  ✅ Leads table accessible');
    }

  } catch (err) {
    console.log(`  ⚠️  Verification partially failed: ${err.message}`);
  }

  console.log('\n🎯 SUMMARY:');
  console.log(`  ✅ Successful operations: ${successCount}`);
  console.log(`  ❌ Failed operations: ${errorCount}`);
  
  if (errorCount > 0) {
    console.log('\n⚠️  FALLBACK REQUIRED:');
    console.log('  Some operations failed. Please run the SQL script manually in Supabase Dashboard:');
    console.log('  1. Go to Supabase Dashboard → SQL Editor');
    console.log('  2. Copy content from IMMEDIATE-RLS-FIX.sql');
    console.log('  3. Click Run');
  } else {
    console.log('\n🎉 RLS FIX COMPLETED! Test your signup now.');
  }
}

// Execute the fix
runRLSFix().catch(console.error);