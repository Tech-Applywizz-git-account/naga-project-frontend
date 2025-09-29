-- 🚨 URGENT FIX: Add Missing Column to leads table
-- Run this in Supabase SQL Editor

-- Add the missing is_email_verified column
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT FALSE;

-- Also add other potentially missing columns from the schema
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS payment_reference_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Update existing records to mark payment-verified users
UPDATE public.leads 
SET is_email_verified = TRUE 
WHERE payment_status = 'completed';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Success message
SELECT 'Missing columns added successfully!' as result;