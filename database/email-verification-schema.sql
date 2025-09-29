-- ==================================================
-- EMAIL VERIFICATION ENHANCEMENT FOR PAYMENT FLOW
-- ==================================================

-- 1. ADD EMAIL VERIFICATION COLUMNS TO USER_PAYMENTS
ALTER TABLE public.user_payments
ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS email_verification_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS signup_link_used BOOLEAN DEFAULT FALSE;

-- 2. CREATE EMAIL VERIFICATION TOKENS TABLE (ALTERNATIVE APPROACH)
CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_id VARCHAR(255) NOT NULL REFERENCES public.user_payments(payment_id),
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
    used_at TIMESTAMPTZ,
    is_used BOOLEAN DEFAULT FALSE
);

-- 3. CREATE FUNCTION TO GENERATE VERIFICATION TOKEN
CREATE OR REPLACE FUNCTION public.generate_email_verification_token(
    payment_id_param VARCHAR(255),
    email_param VARCHAR(255)
)
RETURNS TABLE (
    success BOOLEAN,
    token VARCHAR(255),
    expires_at TIMESTAMPTZ
) AS $$
DECLARE
    new_token VARCHAR(255);
    expiry_time TIMESTAMPTZ;
BEGIN
    -- Generate a secure random token
    new_token := encode(gen_random_bytes(32), 'base64');
    expiry_time := NOW() + INTERVAL '24 hours';
    
    -- Insert verification token
    INSERT INTO public.email_verification_tokens (
        payment_id, email, token, expires_at
    ) VALUES (
        payment_id_param, email_param, new_token, expiry_time
    );
    
    -- Update user_payments table
    UPDATE public.user_payments 
    SET 
        email_verification_token = new_token,
        email_verification_sent_at = NOW(),
        email_verification_expires_at = expiry_time
    WHERE payment_id = payment_id_param;
    
    RETURN QUERY SELECT TRUE, new_token, expiry_time;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT FALSE, NULL::VARCHAR(255), NULL::TIMESTAMPTZ;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. CREATE FUNCTION TO VERIFY EMAIL TOKEN
CREATE OR REPLACE FUNCTION public.verify_email_token(
    token_param VARCHAR(255)
)
RETURNS TABLE (
    success BOOLEAN,
    payment_id VARCHAR(255),
    email VARCHAR(255),
    message TEXT
) AS $$
DECLARE
    token_record RECORD;
BEGIN
    -- Get token record
    SELECT * INTO token_record
    FROM public.email_verification_tokens 
    WHERE token = token_param;
    
    -- Check if token exists
    IF token_record IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::VARCHAR(255), NULL::VARCHAR(255), 'Invalid verification token'::TEXT;
        RETURN;
    END IF;
    
    -- Check if token is already used
    IF token_record.is_used THEN
        RETURN QUERY SELECT FALSE, token_record.payment_id, token_record.email, 'Token already used'::TEXT;
        RETURN;
    END IF;
    
    -- Check if token is expired
    IF token_record.expires_at < NOW() THEN
        RETURN QUERY SELECT FALSE, token_record.payment_id, token_record.email, 'Token expired'::TEXT;
        RETURN;
    END IF;
    
    -- Mark token as used
    UPDATE public.email_verification_tokens 
    SET is_used = TRUE, used_at = NOW()
    WHERE token = token_param;
    
    -- Update user_payments record
    UPDATE public.user_payments 
    SET email_verified_at = NOW()
    WHERE payment_id = token_record.payment_id;
    
    RETURN QUERY SELECT TRUE, token_record.payment_id, token_record.email, 'Email verified successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. CREATE FUNCTION TO SEND VERIFICATION EMAIL (PLACEHOLDER)
CREATE OR REPLACE FUNCTION public.send_verification_email(
    payment_id_param VARCHAR(255),
    email_param VARCHAR(255),
    payment_amount VARCHAR(10) DEFAULT '3.99'
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    verification_token VARCHAR(255)
) AS $$
DECLARE
    token_result RECORD;
    verification_url TEXT;
BEGIN
    -- Generate verification token
    SELECT * INTO token_result
    FROM public.generate_email_verification_token(payment_id_param, email_param);
    
    IF NOT token_result.success THEN
        RETURN QUERY SELECT FALSE, 'Failed to generate verification token'::TEXT, NULL::VARCHAR(255);
        RETURN;
    END IF;
    
    -- Create verification URL (will be used by frontend)
    verification_url := format('https://your-domain.com/verify-email?token=%s', token_result.token);
    
    -- In a real implementation, you would send the email here
    -- For now, we'll return the token for frontend handling
    
    RETURN QUERY SELECT TRUE, 'Verification email prepared'::TEXT, token_result.token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. CREATE FUNCTION TO RESEND VERIFICATION EMAIL
CREATE OR REPLACE FUNCTION public.resend_verification_email(
    payment_id_param VARCHAR(255)
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    new_token VARCHAR(255)
) AS $$
DECLARE
    payment_record RECORD;
    token_result RECORD;
BEGIN
    -- Get payment record
    SELECT * INTO payment_record
    FROM public.user_payments 
    WHERE payment_id = payment_id_param;
    
    IF payment_record IS NULL THEN
        RETURN QUERY SELECT FALSE, 'Payment not found'::TEXT, NULL::VARCHAR(255);
        RETURN;
    END IF;
    
    -- Mark old tokens as expired
    UPDATE public.email_verification_tokens 
    SET expires_at = NOW() - INTERVAL '1 hour'
    WHERE payment_id = payment_id_param AND NOT is_used;
    
    -- Generate new token
    SELECT * INTO token_result
    FROM public.generate_email_verification_token(payment_id_param, payment_record.email);
    
    RETURN QUERY SELECT token_result.success, 'New verification email prepared'::TEXT, token_result.token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON public.email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_payment_id ON public.email_verification_tokens(payment_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_email ON public.email_verification_tokens(email);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires_at ON public.email_verification_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_payments_verification_token ON public.user_payments(email_verification_token);

-- 8. ENABLE RLS FOR EMAIL VERIFICATION TOKENS
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for email verification tokens
CREATE POLICY "Users can access their own verification tokens" ON public.email_verification_tokens
    FOR ALL USING (email = auth.jwt() ->> 'email' OR auth.jwt() ->> 'role' = 'service_role');

-- 9. GRANT PERMISSIONS
GRANT SELECT, INSERT, UPDATE ON public.email_verification_tokens TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_email_verification_token(VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_email_token(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_verification_email(VARCHAR, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resend_verification_email(VARCHAR) TO authenticated;

-- Grant sequence permissions
GRANT USAGE ON SEQUENCE public.email_verification_tokens_id_seq TO authenticated;

-- 10. CREATE CLEANUP FUNCTION FOR EXPIRED TOKENS
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

-- ==================================================
-- VERIFICATION QUERIES FOR TESTING
-- ==================================================

-- Test token generation
-- SELECT * FROM public.generate_email_verification_token('test_payment_123', 'test@example.com');

-- Test token verification
-- SELECT * FROM public.verify_email_token('your_token_here');

-- Test sending verification email
-- SELECT * FROM public.send_verification_email('test_payment_123', 'test@example.com');

-- Check verification tokens
-- SELECT * FROM public.email_verification_tokens WHERE email = 'test@example.com';

-- Cleanup expired tokens
-- SELECT public.cleanup_expired_tokens();

-- ==================================================
-- EMAIL VERIFICATION SCHEMA COMPLETE
-- ==================================================