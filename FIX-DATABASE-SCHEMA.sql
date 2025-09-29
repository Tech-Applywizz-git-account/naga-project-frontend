-- 🚨 URGENT: Fix Database Schema Cache Issue
-- Run this in Supabase SQL Editor to ensure is_email_verified column exists

-- First, check if column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND table_schema = 'public'
AND column_name = 'is_email_verified';

-- If not found, add the column
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT FALSE;

-- Update existing records where payment is completed
UPDATE public.leads 
SET is_email_verified = TRUE 
WHERE payment_status = 'completed' AND is_email_verified IS NULL;

-- Verify the column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Success message
SELECT 'Database schema updated successfully!' as result;