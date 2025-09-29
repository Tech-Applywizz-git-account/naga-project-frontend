-- 🚨 URGENT: Create Missing Database Function
-- Run this in Supabase SQL Editor to fix the function error

-- STEP 1: Create the secure signup function
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

-- STEP 2: Grant permissions
GRANT EXECUTE ON FUNCTION public.secure_signup_with_payment_verification(TEXT, VARCHAR, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- STEP 3: Verify function was created
SELECT 'Function created successfully!' as result;