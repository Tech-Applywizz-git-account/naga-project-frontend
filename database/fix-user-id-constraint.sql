-- =====================================================
-- FIX FOR user_id FOREIGN KEY CONSTRAINT VIOLATION
-- =====================================================

-- STEP 1: Make user_id column NULLABLE (allow NULL values)
ALTER TABLE public.user_payments 
ALTER COLUMN user_id DROP NOT NULL;

-- STEP 2: Drop existing RLS policies that require user_id
DROP POLICY IF EXISTS "Users can view their own payments" ON public.user_payments;
DROP POLICY IF EXISTS "Users can insert their own payments" ON public.user_payments;

-- STEP 3: Create new RLS policies that work with email-based authentication
-- Allow users to view payments by email (without requiring user_id)
CREATE POLICY "Users can view payments by email" ON public.user_payments
    FOR SELECT USING (
        auth.jwt() ->> 'email' = email 
        OR auth.jwt() ->> 'role' = 'service_role'
        OR auth.uid() = user_id  -- Still allow user_id if present
    );

-- Allow users to insert payments by email (without requiring user_id)
CREATE POLICY "Users can insert payments by email" ON public.user_payments
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'email' = email 
        OR auth.jwt() ->> 'role' = 'service_role'
        OR auth.uid() = user_id  -- Still allow user_id if present
    );

-- Allow service role (webhooks) to manage all payments
CREATE POLICY "Service role can manage all payments" ON public.user_payments
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- STEP 4: Add an index for email-based queries (performance optimization)
CREATE INDEX IF NOT EXISTS idx_user_payments_email_lower ON public.user_payments(LOWER(email));

-- STEP 5: Verify the fix by testing a sample insert
-- This insert should now work without user_id
/*
INSERT INTO public.user_payments (
    email, 
    payer_email, 
    payment_id, 
    payer_id, 
    payment_status, 
    amount, 
    currency, 
    payment_method, 
    payment_date, 
    transaction_details
) VALUES (
    'test@example.com',
    'test@example.com', 
    'TEST_PAYMENT_12345',
    'TEST_PAYER_123',
    'completed',
    3.99,
    'USD',
    'paypal',
    NOW(),
    '{"test": true}'::jsonb
);
*/

-- =====================================================
-- EXPLANATION:
-- 
-- The original issue was that the user_payments table required 
-- a user_id that references auth.users(id), but our PayPal
-- payment flow happens BEFORE user account creation.
-- 
-- This fix allows payments to be recorded with just email
-- information, and user_id can be added later during signup.
-- =====================================================