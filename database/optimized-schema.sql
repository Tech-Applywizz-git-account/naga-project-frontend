-- =====================================================
-- OPTIMIZED PAYMENT-GATED AUTHENTICATION SCHEMA
-- Thinking Like Elon: First Principles + Zero Tolerance
-- =====================================================

-- STEP 1: CLEAN UP REDUNDANT TABLES
-- Drop unnecessary/duplicate payment tracking tables
DROP TABLE IF EXISTS public.payments_temp CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- STEP 2: OPTIMIZE USER_PAYMENTS AS SINGLE SOURCE OF TRUTH
-- This will be our authoritative payment record
ALTER TABLE public.user_payments
ADD COLUMN IF NOT EXISTS payer_email VARCHAR(255), -- Store PayPal email separately
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- STEP 3: ENHANCE LEADS TABLE FOR PAYMENT-FIRST FLOW
-- Keep leads simple but connected to payments
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS payment_reference_id VARCHAR(255), -- Link to user_payments.payment_id
ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT FALSE;

-- STEP 4: CREATE EMAIL VERIFICATION FUNCTION
CREATE OR REPLACE FUNCTION public.verify_payment_email_match(
    paypal_email TEXT,
    signup_email TEXT,
    payment_id_param VARCHAR(255)
)
RETURNS BOOLEAN AS $$
DECLARE
    email_match BOOLEAN := FALSE;
    payment_exists BOOLEAN := FALSE;
BEGIN
    -- Check if emails match (case insensitive)
    email_match := LOWER(TRIM(paypal_email)) = LOWER(TRIM(signup_email));
    
    -- Check if payment exists and is completed
    SELECT EXISTS(
        SELECT 1 FROM public.user_payments 
        WHERE payment_id = payment_id_param 
        AND payment_status = 'completed'
        AND LOWER(TRIM(COALESCE(payer_email, email))) = LOWER(TRIM(paypal_email))
    ) INTO payment_exists;
    
    -- Return true only if both conditions are met
    RETURN email_match AND payment_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 5: STRICT PAYMENT VERIFICATION FUNCTION
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

-- STEP 6: SECURE SIGNUP FUNCTION (EMAIL MATCHING ENFORCED)
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
    email_verified BOOLEAN := FALSE;
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
        email = signup_email  -- Ensure consistency
    WHERE payment_id = payment_id_param;
    
    RETURN QUERY SELECT TRUE, 'Signup successful with verified payment'::TEXT, new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 7: SECURE LOGIN VERIFICATION
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

-- STEP 8: CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_user_payments_email_lower ON public.user_payments(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_user_payments_payer_email_lower ON public.user_payments(LOWER(payer_email));
CREATE INDEX IF NOT EXISTS idx_user_payments_verification ON public.user_payments(email_verified, verification_status);
CREATE INDEX IF NOT EXISTS idx_leads_email_lower ON public.leads(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_leads_payment_ref ON public.leads(payment_reference_id);

-- STEP 9: ENHANCED RLS POLICIES
DROP POLICY IF EXISTS "Strict payment access" ON public.user_payments;
CREATE POLICY "Strict payment access" ON public.user_payments
    FOR ALL USING (
        auth.jwt() ->> 'email' = email 
        OR auth.jwt() ->> 'email' = payer_email
        OR auth.jwt() ->> 'role' = 'service_role'
    );

DROP POLICY IF EXISTS "Strict lead access" ON public.leads;
CREATE POLICY "Strict lead access" ON public.leads
    FOR ALL USING (
        auth.jwt() ->> 'email' = email 
        OR auth.jwt() ->> 'role' = 'service_role'
    );

-- STEP 10: GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION public.verify_payment_email_match(TEXT, TEXT, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_verified_payment_status(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.secure_signup_with_payment_verification(TEXT, VARCHAR, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_user_login(TEXT) TO authenticated;

-- =====================================================
-- VERIFICATION TESTS
-- =====================================================

-- Test 1: Check if payment verification works
-- SELECT * FROM public.get_verified_payment_status('test@example.com');

-- Test 2: Check login authorization
-- SELECT * FROM public.can_user_login('test@example.com');

-- Test 3: Verify email matching
-- SELECT public.verify_payment_email_match('paypal@example.com', 'signup@example.com', 'payment_123');

-- =====================================================
-- ELON'S PRINCIPLE: "Delete more than you add"
-- This schema eliminates redundancy and enforces strict rules
-- =====================================================