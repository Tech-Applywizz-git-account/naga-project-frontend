import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://xficomhdacoloehbzmlt.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY. Set it in your environment before running this script.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkPayments() {
  console.log('📋 Checking recent payments in database...');
  
  const { data, error } = await supabase
    .from('user_payments')
    .select('payment_id, email, payer_email, payment_status, created_at')
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log(`✅ Found ${data?.length || 0} payments:`);
  data?.forEach((p, i) => {
    console.log(`${i+1}. ID: ${p.payment_id}, Email: ${p.email}, Status: ${p.payment_status}`);
  });
  
  const { data: specificPayment } = await supabase
    .from('user_payments')
    .select('*')
    .eq('payment_id', '7YC53569NK9906143');
    
  console.log('\n🔍 Payment 7YC53569NK9906143 search result:', specificPayment);
}

checkPayments();
