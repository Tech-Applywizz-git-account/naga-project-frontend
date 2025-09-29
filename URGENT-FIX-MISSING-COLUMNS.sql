-- 🚨 URGENT: Fix Missing Columns in leads table
-- This will solve the 5-day issue once and for all
-- Run this IMMEDIATELY in Supabase SQL Editor

-- Step 1: Check current leads table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Add ALL missing columns that the code expects
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS payment_reference_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Step 3: Create index for performance
CREATE INDEX IF NOT EXISTS idx_leads_payment_reference ON public.leads(payment_reference_id);
CREATE INDEX IF NOT EXISTS idx_leads_payment_status ON public.leads(payment_status);
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads(user_id);

-- Step 4: Update existing records to be consistent
UPDATE public.leads 
SET 
  payment_status = 'pending',
  is_email_verified = FALSE
WHERE payment_status IS NULL OR is_email_verified IS NULL;

-- Step 5: Verify all columns now exist
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND table_schema = 'public'
AND column_name IN (
  'payment_reference_id', 
  'payment_status', 
  'paid_at', 
  'is_email_verified', 
  'email_verification_token',
  'user_id'
)
ORDER BY column_name;

-- Success confirmation
SELECT 'SUCCESS: All missing columns have been added to leads table!' as result;