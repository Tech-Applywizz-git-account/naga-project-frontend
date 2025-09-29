# 🚨 IMPORTANT: Database Setup Required

## Issue: Missing Database Columns

The error you're seeing (`Could not find the 'paid_at' column of 'leads' in the schema cache`) means that the database schema hasn't been set up yet in your Supabase instance.

## 🔧 Quick Fix Steps

### Step 1: Open Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Open your project: `xficomhdacoloehbzmlt`

### Step 2: Run Database Schema
1. Click on **"SQL Editor"** in the left sidebar
2. Click **"New Query"**
3. Copy and paste the entire content from `database/schema.sql`
4. Click **"Run"** to execute the SQL

### Step 3: Verify Tables Created
After running the SQL, you should see these new tables:
- `user_payments` - Tracks PayPal transactions
- Updated `leads` table with payment columns
- Functions: `user_has_paid()` and `get_user_payment_status()`

## 📋 Alternative: Manual Table Creation

If you prefer to create tables manually:

### 1. Create user_payments table:
```sql
CREATE TABLE public.user_payments (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    payment_id VARCHAR(255) UNIQUE NOT NULL,
    payer_id VARCHAR(255),
    payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    payment_method VARCHAR(50) NOT NULL DEFAULT 'paypal',
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    transaction_details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. Update leads table:
```sql
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
```

### 3. Create payment verification function:
```sql
CREATE OR REPLACE FUNCTION public.user_has_paid(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.user_payments 
        WHERE email = user_email 
        AND payment_status = 'completed'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## ✅ Test After Setup

1. **Restart your app**: The schema cache will refresh
2. **Try the payment flow**: 
   - Click "Buy Now" 
   - Complete PayPal payment
   - Create account
   - Access dashboard

## 🛠️ Code Compatibility

The application code has been updated to handle missing columns gracefully:
- **Fallback logic**: If database functions don't exist, it uses direct table queries
- **Conditional inserts**: Only adds payment columns if they exist
- **Error handling**: Graceful degradation if schema is incomplete

## 🆘 Still Having Issues?

If you continue to see errors:

1. **Check Supabase logs**: Go to Logs tab in your Supabase dashboard
2. **Verify RLS policies**: Ensure Row Level Security is properly configured
3. **Test with simple query**: Try a basic `SELECT * FROM leads` in SQL Editor

## 📞 Need Help?

The database schema is essential for the payment system to work. If you need assistance with the setup, the complete SQL is in the `database/schema.sql` file and needs to be executed in your Supabase SQL Editor.