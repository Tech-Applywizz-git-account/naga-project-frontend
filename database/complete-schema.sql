-- ==================================================
-- PAYMENT-GATED AUTHENTICATION DATABASE SCHEMA
-- ==================================================

-- 1. CREATE USER_PAYMENTS TABLE
-- Track all PayPal payment transactions
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

-- 2. UPDATE LEADS TABLE
-- Add payment status columns to existing leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_user_payments_user_id ON public.user_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_payments_email ON public.user_payments(email);
CREATE INDEX IF NOT EXISTS idx_user_payments_payment_status ON public.user_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_user_payments_payment_id ON public.user_payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_leads_payment_status ON public.leads(payment_status);
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);

-- 4. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.user_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 5. CREATE RLS POLICIES FOR USER_PAYMENTS
-- Users can only view their own payment records
CREATE POLICY "Users can view their own payments" ON public.user_payments
    FOR SELECT USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = email);

-- Users can insert their own payment records
CREATE POLICY "Users can insert their own payments" ON public.user_payments
    FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.jwt() ->> 'email' = email);

-- Service role can manage all payment records
CREATE POLICY "Service role can manage payments" ON public.user_payments
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- 6. CREATE RLS POLICIES FOR LEADS
-- Users can view their own lead records
CREATE POLICY "Users can view their own leads" ON public.leads
    FOR SELECT USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = email);

-- Users can insert their own lead records
CREATE POLICY "Users can insert their own leads" ON public.leads
    FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.jwt() ->> 'email' = email);

-- Users can update their own lead records
CREATE POLICY "Users can update their own leads" ON public.leads
    FOR UPDATE USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = email);

-- 7. CREATE FUNCTION: user_has_paid()
-- Simple boolean check if user has completed payment
CREATE OR REPLACE FUNCTION public.user_has_paid(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check both user_payments and leads tables for completed payments
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

-- 8. CREATE FUNCTION: get_user_payment_status()
-- Detailed payment status information
CREATE OR REPLACE FUNCTION public.get_user_payment_status(user_email TEXT)
RETURNS TABLE (
    has_paid BOOLEAN,
    payment_date TIMESTAMPTZ,
    payment_method VARCHAR(50),
    payment_amount DECIMAL(10, 2),
    payment_id VARCHAR(255)
) AS $$
BEGIN
    -- First check user_payments table (most recent/detailed)
    RETURN QUERY
    SELECT 
        TRUE as has_paid,
        up.payment_date,
        up.payment_method,
        up.amount as payment_amount,
        up.payment_id
    FROM public.user_payments up
    WHERE up.email = user_email 
    AND up.payment_status = 'completed'
    ORDER BY up.payment_date DESC
    LIMIT 1;
    
    -- If no records in user_payments, check leads table
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            CASE 
                WHEN l.payment_status = 'completed' THEN TRUE 
                ELSE FALSE 
            END as has_paid,
            l.paid_at as payment_date,
            'paypal'::VARCHAR(50) as payment_method,
            3.99::DECIMAL(10, 2) as payment_amount,
            NULL::VARCHAR(255) as payment_id
        FROM public.leads l
        WHERE l.email = user_email
        ORDER BY l.paid_at DESC NULLS LAST
        LIMIT 1;
    END IF;
    
    -- If no records found anywhere, return default
    IF NOT FOUND THEN
        RETURN QUERY SELECT 
            FALSE::BOOLEAN, 
            NULL::TIMESTAMPTZ, 
            'none'::VARCHAR(50), 
            NULL::DECIMAL(10, 2),
            NULL::VARCHAR(255);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. CREATE FUNCTION: process_payment_success()
-- Helper function to update payment status across tables
CREATE OR REPLACE FUNCTION public.process_payment_success(
    user_email TEXT,
    user_id_param UUID,
    payment_id_param VARCHAR(255),
    payer_id_param VARCHAR(255),
    amount_param DECIMAL(10, 2),
    transaction_details_param JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    payment_timestamp TIMESTAMPTZ := NOW();
BEGIN
    -- Insert into user_payments table
    INSERT INTO public.user_payments (
        user_id, email, payment_id, payer_id, payment_status, 
        amount, currency, payment_method, payment_date, transaction_details
    ) VALUES (
        user_id_param, user_email, payment_id_param, payer_id_param, 'completed',
        amount_param, 'USD', 'paypal', payment_timestamp, transaction_details_param
    )
    ON CONFLICT (payment_id) DO UPDATE SET
        payment_status = 'completed',
        payment_date = payment_timestamp,
        transaction_details = transaction_details_param;
    
    -- Update leads table if record exists
    UPDATE public.leads 
    SET 
        payment_status = 'completed',
        paid_at = payment_timestamp,
        user_id = COALESCE(user_id, user_id_param)
    WHERE email = user_email;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the transaction
        RAISE WARNING 'Error processing payment success: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. CREATE TRIGGER FOR AUTOMATIC TIMESTAMP UPDATES
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to user_payments table
DROP TRIGGER IF EXISTS update_user_payments_updated_at ON public.user_payments;
CREATE TRIGGER update_user_payments_updated_at
    BEFORE UPDATE ON public.user_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 11. GRANT NECESSARY PERMISSIONS
-- Grant usage on sequences
GRANT USAGE ON SEQUENCE public.user_payments_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE public.user_payments_id_seq TO anon;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE ON public.user_payments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.leads TO authenticated;

-- Grant function execution permissions
GRANT EXECUTE ON FUNCTION public.user_has_paid(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_paid(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_payment_status(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_payment_status(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.process_payment_success(TEXT, UUID, VARCHAR, VARCHAR, DECIMAL, JSONB) TO authenticated;

-- ==================================================
-- VERIFICATION QUERIES (Optional - for testing)
-- ==================================================

-- Test if tables exist
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('user_payments', 'leads');

-- Test if functions exist
-- SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name IN ('user_has_paid', 'get_user_payment_status');

-- Test function calls (replace with actual email)
-- SELECT public.user_has_paid('test@example.com');
-- SELECT * FROM public.get_user_payment_status('test@example.com');

-- ==================================================
-- SETUP COMPLETE
-- ==================================================