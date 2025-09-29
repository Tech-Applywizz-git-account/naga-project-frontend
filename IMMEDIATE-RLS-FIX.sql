-- IMMEDIATE RLS POLICY FIX
-- Run this script in your Supabase SQL Editor to completely disable RLS

-- 1. DISABLE ROW LEVEL SECURITY for leads table
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;

-- 2. DROP ALL EXISTING POLICIES for leads table (if any exist)
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.leads;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.leads;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.leads;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON public.leads;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.leads;
DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.leads;
DROP POLICY IF EXISTS "Users can insert their own data" ON public.leads;
DROP POLICY IF EXISTS "Users can read their own data" ON public.leads;
DROP POLICY IF EXISTS "Users can update their own data" ON public.leads;

-- 3. DISABLE ROW LEVEL SECURITY for user_payments table (just in case)
ALTER TABLE public.user_payments DISABLE ROW LEVEL SECURITY;

-- 4. DROP ALL EXISTING POLICIES for user_payments table (if any exist)
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.user_payments;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_payments;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.user_payments;
DROP POLICY IF EXISTS "Users can insert their own payments" ON public.user_payments;
DROP POLICY IF EXISTS "Users can read their own payments" ON public.user_payments;
DROP POLICY IF EXISTS "Users can update their own payments" ON public.user_payments;

-- 5. GRANT FULL PERMISSIONS TO ENSURE NO ACCESS ISSUES
GRANT ALL ON public.leads TO authenticated;
GRANT ALL ON public.leads TO anon;
GRANT ALL ON public.user_payments TO authenticated;
GRANT ALL ON public.user_payments TO anon;

-- 6. VERIFY RLS IS DISABLED
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('leads', 'user_payments');

-- This should return rowsecurity = false for both tables

-- 7. CHECK FOR ANY REMAINING POLICIES
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('leads', 'user_payments');

-- This should return no rows if all policies are removed

-- CONFIRMATION MESSAGE
SELECT 'RLS has been completely disabled for leads and user_payments tables' as status;