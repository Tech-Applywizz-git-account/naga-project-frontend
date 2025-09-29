-- =====================================================
-- REAL EMAIL VERIFICATION SYSTEM
-- Add proper token storage and email logging
-- =====================================================

-- 1. CREATE EMAIL VERIFICATION TOKENS TABLE
CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_id VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
    used_at TIMESTAMPTZ,
    is_used BOOLEAN DEFAULT FALSE,
    
    -- Foreign key to user_payments
    CONSTRAINT fk_payment_id 
        FOREIGN KEY (payment_id) 
        REFERENCES public.user_payments(payment_id) 
        ON DELETE CASCADE
);

-- 2. CREATE EMAIL LOGS TABLE (Track all email activity)
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    email_type VARCHAR(50) NOT NULL, -- 'verification', 'failure', 'welcome', etc.
    payment_id VARCHAR(255),
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'pending', -- 'sent', 'failed', 'pending'
    error_message TEXT,
    message_id VARCHAR(255) -- External email service message ID
);

-- 3. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON public.email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_payment_id ON public.email_verification_tokens(payment_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_email ON public.email_verification_tokens(email);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires_at ON public.email_verification_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON public.email_logs(recipient);
CREATE INDEX IF NOT EXISTS idx_email_logs_payment_id ON public.email_logs(payment_id);

-- 4. ENABLE RLS
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- 5. CREATE RLS POLICIES
-- Email verification tokens
CREATE POLICY "Users can access their own verification tokens" ON public.email_verification_tokens
    FOR ALL USING (
        email = auth.jwt() ->> 'email' 
        OR auth.jwt() ->> 'role' = 'service_role'
    );

-- Email logs (read-only for users, full access for service role)
CREATE POLICY "Users can view their own email logs" ON public.email_logs
    FOR SELECT USING (
        recipient = auth.jwt() ->> 'email' 
        OR auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "Service role can manage email logs" ON public.email_logs
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- 6. CREATE FUNCTION TO VERIFY EMAIL TOKEN
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
    
    -- Return success
    RETURN QUERY SELECT 
        TRUE, 
        'Email verification successful'::TEXT, 
        token_record.payment_id, 
        token_record.email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. CREATE FUNCTION TO STORE VERIFICATION TOKEN
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

-- 8. GRANT PERMISSIONS
GRANT SELECT, INSERT, UPDATE ON public.email_verification_tokens TO authenticated;
GRANT SELECT, INSERT ON public.email_logs TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_email_token(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.store_verification_token(VARCHAR, VARCHAR, VARCHAR) TO authenticated;

-- 9. CLEANUP FUNCTION (Run periodically to remove expired tokens)
CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.email_verification_tokens
    WHERE expires_at < NOW() - INTERVAL '7 days'; -- Keep for 7 days after expiry for audit
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- USAGE INSTRUCTIONS:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Set up Supabase Edge Function (send-email)
-- 3. Update emailService.ts to use real token storage
-- 4. Configure email provider (SendGrid/Mailgun)
-- =====================================================