// test-env-fix.js - Quick test of environment variables
import 'dotenv/config';

console.log('🔧 TESTING ENVIRONMENT VARIABLES');
console.log('================================');

console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'Set ✅' : 'Missing ❌');

if (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY) {
  console.log('✅ Environment variables are properly configured!');
  console.log('🚀 The payment -> signup flow should now work without API key errors.');
} else {
  console.log('❌ Environment variables are still missing.');
  console.log('💡 Make sure your .env file is in the correct location.');
}