-- Create user_payments table to track payment transactions
CREATE TABLE IF NOT EXISTS public.user_payments (
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

-- Add payment status columns to existing leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_payments_user_id ON public.user_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_payments_email ON public.user_payments(email);
CREATE INDEX IF NOT EXISTS idx_user_payments_payment_status ON public.user_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_leads_payment_status ON public.leads(payment_status);
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE public.user_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_payments
CREATE POLICY "Users can view their own payments" ON public.user_payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments" ON public.user_payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create a function to check if user has paid
CREATE OR REPLACE FUNCTION public.user_has_paid(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.user_payments 
        WHERE email = user_email 
        AND payment_status = 'completed'
    ) OR EXISTS (
        SELECT 1 
        FROM public.leads 
        WHERE email = user_email 
        AND payment_status = 'completed'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get user payment status
CREATE OR REPLACE FUNCTION public.get_user_payment_status(user_email TEXT)
RETURNS TABLE (
    has_paid BOOLEAN,
    payment_date TIMESTAMPTZ,
    payment_method VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN up.payment_status = 'completed' OR l.payment_status = 'completed' 
            THEN TRUE 
            ELSE FALSE 
        END as has_paid,
        COALESCE(up.payment_date, l.paid_at) as payment_date,
        COALESCE(up.payment_method, 'unknown') as payment_method
    FROM public.leads l
    LEFT JOIN public.user_payments up ON l.email = up.email
    WHERE l.email = user_email
    ORDER BY COALESCE(up.payment_date, l.paid_at) DESC
    LIMIT 1;
    
    -- If no record found, return default values
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE::BOOLEAN, NULL::TIMESTAMPTZ, 'none'::VARCHAR(50);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;