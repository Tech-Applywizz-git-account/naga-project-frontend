// 🚨 EMERGENCY RECOVERY FOR PAYMENT: 6LV44017LH3568619
// This script will manually create the signup link for the failed payment

import { createClient } from '@supabase/supabase-js';

// Use working Supabase configuration
const SUPABASE_URL = 'https://xficomhdacoloehbzmlt.supabase.co';
// Note: You need to set the actual anon key here
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmaWNvbWhkYWNvbG9laGJ6bWx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0Mzg4NDksImV4cCI6MjA1MDAxNDg0OX0.2HSLjEzM2Hf3v3zojYmWQ2PYzANNrTdL2FpNXNHbpJk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function recoverPayment6LV44017LH3568619() {
  console.log('🚨 EMERGENCY PAYMENT RECOVERY');
  console.log('===============================');
  
  const paymentId = '6LV44017LH3568619';
  
  try {
    console.log('🔄 Creating manual signup link for payment:', paymentId);
    
    // Create the signup URL with payment data
    const signupUrl = new URL('http://localhost:5173/signup');
    
    // Create payment data for localStorage
    const paymentData = {
      paymentId: paymentId,
      email: 'user@email.com', // This will be updated by user
      amount: '3.99',
      paymentStatus: 'completed',
      userData: {
        fullName: '',
        email: '',
        phone: '',
        countryCode: '+1'
      },
      paymentCompleted: true,
      emailVerified: true,
      timestamp: Date.now()
    };
    
    console.log('📋 RECOVERY INSTRUCTIONS:');
    console.log('========================');
    console.log('');
    console.log('1. Open your browser and go to: http://localhost:5173/signup');
    console.log('');
    console.log('2. Before going to the signup page, open browser console (F12) and run:');
    console.log('');
    console.log(`localStorage.setItem('paypalPaymentData', '${JSON.stringify(paymentData)}');`);
    console.log('');
    console.log('3. Then refresh the signup page - it will detect the payment as completed');
    console.log('');
    console.log('4. Fill in your details and create your account');
    console.log('');
    console.log('✅ ALTERNATIVE: If you have the user\'s email, update the script with their email');
    console.log('   and they can proceed directly to signup with pre-filled data');
    
    // If we had the user email, we could do:
    // localStorage.setItem('paypalPaymentData', JSON.stringify(paymentData));
    // window.location.href = '/signup';
    
    console.log('');
    console.log('🔧 PERMANENT FIX NEEDED:');
    console.log('========================');
    console.log('Update .env file with correct Supabase credentials:');
    console.log(`VITE_SUPABASE_URL=${SUPABASE_URL}`);
    console.log(`VITE_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}`);
    
  } catch (error) {
    console.error('❌ Recovery setup failed:', error);
  }
}

// Run the recovery
recoverPayment6LV44017LH3568619();