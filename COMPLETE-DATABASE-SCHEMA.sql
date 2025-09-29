-- =====================================================
-- COMPLETE DATABASE SCHEMA FOR PAYMENT-GATED AUTH FLOW
-- Payment-First → Email Verification → Signup → Dashboard
-- =====================================================

-- =====================================================
-- STEP 1: USER PAYMENTS TABLE (PRIMARY PAYMENT TRACKING)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_payments (
    id BIGSERIAL PRIMARY KEY,
    
    -- User Reference (NULL initially - payment happens before user creation)
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Email Information
    email VARCHAR(255) NOT NULL,                    -- User provided email
    payer_email VARCHAR(255),                       -- PayPal payer email
    
    -- Payment Details
    payment_id VARCHAR(255) UNIQUE NOT NULL,        -- PayPal transaction ID
    payer_id VARCHAR(255),                          -- PayPal payer ID
    payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    payment_method VARCHAR(50) NOT NULL DEFAULT 'paypal',
    
    -- Verification Status
    email_verified BOOLEAN DEFAULT FALSE,
    verification_status VARCHAR(50) DEFAULT 'pending',
    email_verification_token VARCHAR(255),
    email_verification_sent_at TIMESTAMPTZ,
    email_verification_expires_at TIMESTAMPTZ,
    email_verified_at TIMESTAMPTZ,
    
    -- Transaction Data
    transaction_details JSONB,                      -- Full PayPal response
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STEP 2: LEADS TABLE (USER PROFILES)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User Information
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(20),
    country_code VARCHAR(10),
    promo_code VARCHAR(50),
    
    -- Payment Link
    payment_reference_id VARCHAR(255),              -- Links to user_payments.payment_id
    payment_status VARCHAR(50) DEFAULT 'pending',
    paid_at TIMESTAMPTZ,
    
    -- Verification Status
    is_email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    
    -- User Account Link
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STEP 3: EMAIL VERIFICATION TOKENS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
    id BIGSERIAL PRIMARY KEY,
    
    -- Link to Payment
    payment_id VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    
    -- Token Details
    token VARCHAR(255) UNIQUE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT fk_payment_id FOREIGN KEY (payment_id) REFERENCES public.user_payments(payment_id)
);

-- =====================================================
-- STEP 4: EMAIL LOGS TABLE (AUDIT TRAIL)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.email_logs (
    id BIGSERIAL PRIMARY KEY,
    
    -- Email Details
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    email_type VARCHAR(50),                         -- 'verification', 'failure', 'welcome'
    
    -- Delivery Status
    status VARCHAR(50) DEFAULT 'pending',           -- 'sent', 'failed', 'pending'
    provider VARCHAR(50),                           -- 'sendgrid', 'supabase', 'manual'
    message_id VARCHAR(255),
    error_message TEXT,
    
    -- Links
    payment_id VARCHAR(255),
    verification_token VARCHAR(255),
    
    -- Timestamps
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ
);

-- =====================================================
-- STEP 5: INDEXES FOR PERFORMANCE
-- =====================================================

-- User Payments Indexes
CREATE INDEX IF NOT EXISTS idx_user_payments_email_lower ON public.user_payments(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_user_payments_payer_email_lower ON public.user_payments(LOWER(payer_email));
CREATE INDEX IF NOT EXISTS idx_user_payments_payment_id ON public.user_payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_user_payments_verification ON public.user_payments(email_verified, verification_status);
CREATE INDEX IF NOT EXISTS idx_user_payments_status ON public.user_payments(payment_status);

-- Leads Indexes
CREATE INDEX IF NOT EXISTS idx_leads_email_lower ON public.leads(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_leads_payment_ref ON public.leads(payment_reference_id);
CREATE INDEX IF NOT EXISTS idx_leads_payment_status ON public.leads(payment_status);
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads(user_id);

-- Email Verification Tokens Indexes
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_payment_id ON public.email_verification_tokens(payment_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON public.email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_email ON public.email_verification_tokens(email);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires_at ON public.email_verification_tokens(expires_at);

-- Email Logs Indexes
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON public.email_logs(recipient);
CREATE INDEX IF NOT EXISTS idx_email_logs_payment_id ON public.email_logs(payment_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON public.email_logs(sent_at);

-- =====================================================
-- STEP 6: ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.user_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- User Payments Policies
DROP POLICY IF EXISTS "Users can access their own payments" ON public.user_payments;
CREATE POLICY "Users can access their own payments" ON public.user_payments
    FOR ALL USING (
        auth.jwt() ->> 'email' = email 
        OR auth.jwt() ->> 'email' = payer_email
        OR auth.jwt() ->> 'role' = 'service_role'
        OR user_id = auth.uid()
    );

-- Leads Policies
DROP POLICY IF EXISTS "Users can access their own leads" ON public.leads;
CREATE POLICY "Users can access their own leads" ON public.leads
    FOR ALL USING (
        auth.jwt() ->> 'email' = email 
        OR auth.jwt() ->> 'role' = 'service_role'
        OR user_id = auth.uid()
    );

-- Email Verification Tokens Policies
DROP POLICY IF EXISTS "Users can access their own tokens" ON public.email_verification_tokens;
CREATE POLICY "Users can access their own tokens" ON public.email_verification_tokens
    FOR ALL USING (
        auth.jwt() ->> 'email' = email 
        OR auth.jwt() ->> 'role' = 'service_role'
    );

-- Email Logs Policies
DROP POLICY IF EXISTS "Users can view their own email logs" ON public.email_logs;
CREATE POLICY "Users can view their own email logs" ON public.email_logs
    FOR SELECT USING (
        recipient = auth.jwt() ->> 'email' 
        OR auth.jwt() ->> 'role' = 'service_role'
    );

-- =====================================================
-- STEP 7: DATABASE FUNCTIONS
-- =====================================================

-- Function: Get Payment Status for Email
CREATE OR REPLACE FUNCTION public.get_verified_payment_status(user_email TEXT)
RETURNS TABLE (
    has_paid BOOLEAN,
    payment_verified BOOLEAN,
    email_match BOOLEAN,
    payment_date TIMESTAMPTZ,
    payment_id VARCHAR(255),
    payer_email VARCHAR(255)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (up.payment_status = 'completed') as has_paid,
        (up.payment_status = 'completed' AND up.email_verified = TRUE) as payment_verified,
        (LOWER(TRIM(COALESCE(up.payer_email, up.email))) = LOWER(TRIM(user_email))) as email_match,
        up.payment_date,
        up.payment_id,
        up.payer_email
    FROM public.user_payments up
    WHERE LOWER(TRIM(up.email)) = LOWER(TRIM(user_email))
    OR LOWER(TRIM(up.payer_email)) = LOWER(TRIM(user_email))
    ORDER BY up.payment_date DESC
    LIMIT 1;
    
    -- If no payment found, return false values
    IF NOT FOUND THEN
        RETURN QUERY SELECT 
            FALSE::BOOLEAN, 
            FALSE::BOOLEAN, 
            FALSE::BOOLEAN,
            NULL::TIMESTAMPTZ, 
            NULL::VARCHAR(255),
            NULL::VARCHAR(255);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Secure Signup with Payment Verification
CREATE OR REPLACE FUNCTION public.secure_signup_with_payment_verification(
    signup_email TEXT,
    payment_id_param VARCHAR(255),
    full_name_param TEXT,
    phone_param TEXT DEFAULT NULL,
    country_code_param TEXT DEFAULT NULL,
    promo_code_param TEXT DEFAULT NULL
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    user_id UUID
) AS $$
DECLARE
    payment_record RECORD;
    new_user_id UUID;
BEGIN
    -- Step 1: Get payment record
    SELECT * INTO payment_record
    FROM public.user_payments 
    WHERE payment_id = payment_id_param 
    AND payment_status = 'completed';
    
    -- Step 2: Verify payment exists
    IF payment_record IS NULL THEN
        RETURN QUERY SELECT FALSE, 'Payment not found or not completed'::TEXT, NULL::UUID;
        RETURN;
    END IF;
    
    -- Step 3: CRITICAL - Verify email match
    IF LOWER(TRIM(COALESCE(payment_record.payer_email, payment_record.email))) != LOWER(TRIM(signup_email)) THEN
        RETURN QUERY SELECT FALSE, 'Email mismatch: PayPal email must match signup email'::TEXT, NULL::UUID;
        RETURN;
    END IF;
    
    -- Step 4: Check if user already exists
    IF EXISTS(SELECT 1 FROM public.leads WHERE LOWER(TRIM(email)) = LOWER(TRIM(signup_email))) THEN
        RETURN QUERY SELECT FALSE, 'User already exists with this email'::TEXT, NULL::UUID;
        RETURN;
    END IF;
    
    -- Step 5: Create lead record with verified payment
    INSERT INTO public.leads (
        email, full_name, phone, country_code, promo_code,
        payment_status, paid_at, payment_reference_id, is_email_verified
    ) VALUES (
        signup_email, full_name_param, phone_param, country_code_param, promo_code_param,
        'completed', payment_record.payment_date, payment_id_param, TRUE
    ) RETURNING id INTO new_user_id;
    
    -- Step 6: Update payment record with verification
    UPDATE public.user_payments 
    SET 
        email_verified = TRUE,
        verification_status = 'verified',
        email = signup_email
    WHERE payment_id = payment_id_param;
    
    RETURN QUERY SELECT TRUE, 'Signup successful with verified payment'::TEXT, new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check Login Authorization
CREATE OR REPLACE FUNCTION public.can_user_login(user_email TEXT)
RETURNS TABLE (
    can_login BOOLEAN,
    reason TEXT,
    payment_status TEXT
) AS $$
DECLARE
    payment_verified BOOLEAN := FALSE;
    email_match BOOLEAN := FALSE;
    has_completed_payment BOOLEAN := FALSE;
BEGIN
    -- Check comprehensive payment status
    SELECT 
        pvs.payment_verified,
        pvs.email_match,
        pvs.has_paid
    INTO payment_verified, email_match, has_completed_payment
    FROM public.get_verified_payment_status(user_email) pvs;
    
    -- Strict validation rules
    IF NOT has_completed_payment THEN
        RETURN QUERY SELECT FALSE, 'No completed payment found'::TEXT, 'no_payment'::TEXT;
    ELSIF NOT email_match THEN
        RETURN QUERY SELECT FALSE, 'Email verification failed'::TEXT, 'email_mismatch'::TEXT;
    ELSIF NOT payment_verified THEN
        RETURN QUERY SELECT FALSE, 'Payment not verified'::TEXT, 'unverified'::TEXT;
    ELSE
        RETURN QUERY SELECT TRUE, 'Login authorized'::TEXT, 'verified'::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Store Verification Token
CREATE OR REPLACE FUNCTION public.store_verification_token(
    payment_id_param VARCHAR(255),
    email_param VARCHAR(255),
    token_param VARCHAR(255)
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Insert verification token
    INSERT INTO public.email_verification_tokens (
        payment_id, email, token, created_at, expires_at, is_used
    ) VALUES (
        payment_id_param, 
        email_param, 
        token_param, 
        NOW(), 
        NOW() + INTERVAL '24 hours', 
        FALSE
    );
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Verify Email Token
CREATE OR REPLACE FUNCTION public.verify_email_token(token_param VARCHAR(255))
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    payment_id VARCHAR(255),
    email VARCHAR(255)
) AS $$
DECLARE
    token_record RECORD;
BEGIN
    -- Get token record
    SELECT * INTO token_record
    FROM public.email_verification_tokens
    WHERE token = token_param
    AND NOT is_used
    AND expires_at > NOW();
    
    -- Check if token exists and is valid
    IF token_record IS NULL THEN
        -- Check if token exists but is expired/used
        IF EXISTS(SELECT 1 FROM public.email_verification_tokens WHERE token = token_param) THEN
            RETURN QUERY SELECT FALSE, 'Token expired or already used'::TEXT, NULL::VARCHAR(255), NULL::VARCHAR(255);
        ELSE
            RETURN QUERY SELECT FALSE, 'Invalid token'::TEXT, NULL::VARCHAR(255), NULL::VARCHAR(255);
        END IF;
        RETURN;
    END IF;
    
    -- Mark token as used
    UPDATE public.email_verification_tokens
    SET is_used = TRUE, used_at = NOW()
    WHERE token = token_param;
    
    -- Update payment verification
    UPDATE public.user_payments
    SET email_verified = TRUE, email_verified_at = NOW()
    WHERE payment_id = token_record.payment_id;
    
    -- Return success
    RETURN QUERY SELECT 
        TRUE, 
        'Email verification successful'::TEXT, 
        token_record.payment_id, 
        token_record.email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 8: GRANT PERMISSIONS
-- =====================================================

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE ON public.user_payments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.leads TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.email_verification_tokens TO authenticated;
GRANT SELECT, INSERT ON public.email_logs TO authenticated;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION public.get_verified_payment_status(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.secure_signup_with_payment_verification(TEXT, VARCHAR, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_user_login(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.store_verification_token(VARCHAR, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_email_token(VARCHAR) TO authenticated;

-- Grant sequence permissions
GRANT USAGE ON SEQUENCE public.user_payments_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE public.email_verification_tokens_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE public.email_logs_id_seq TO authenticated;

-- =====================================================
-- STEP 9: CLEANUP FUNCTION FOR MAINTENANCE
-- =====================================================

CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.email_verification_tokens
    WHERE expires_at < NOW() - INTERVAL '7 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 10: VERIFICATION QUERIES
-- =====================================================

-- Test that all tables exist
SELECT 
    table_name,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('user_payments', 'leads', 'email_verification_tokens', 'email_logs')
GROUP BY table_name
ORDER BY table_name;

-- Test that all functions exist
SELECT proname as function_name 
FROM pg_proc 
WHERE proname IN (
    'get_verified_payment_status',
    'secure_signup_with_payment_verification', 
    'can_user_login',
    'store_verification_token',
    'verify_email_token',
    'cleanup_expired_tokens'
)
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Success message
SELECT '🎉 Complete Database Schema Created Successfully!' as result;

-- =====================================================
-- SCHEMA COMPLETE - READY FOR PAYMENT-GATED AUTH FLOW
-- =====================================================