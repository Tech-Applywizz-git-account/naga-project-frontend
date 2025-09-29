import React, { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowLeft, Mail, Clock } from 'lucide-react';
import supabase from '../utils/supabase';
import emailService from '../utils/emailService';

const PaymentFirstPage: React.FC = () => {
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'error' | 'email-sent'>('pending');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [verificationEmail, setVerificationEmail] = useState<string>('');
  const [verificationUrl, setVerificationUrl] = useState<string>('');

  const paypalOptions = {
    clientId: "AWJD_HcpuWHxMFBL5ZHhGbVY7MaJVjafDIw19k7LpcWuMb581I1qEN6yvsXhUS38hQ1MWsam37CWJtLS",
    currency: "USD",
    intent: "capture",
  };

  const createOrder = (data: any, actions: any) => {
    return actions.order.create({
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: "3.99",
          },
          description: "H1B Sponsor Database - Lifetime Access",
        },
      ],
      application_context: {
        user_action: "PAY_NOW",
      },
    });
  };

  const onApprove = async (data: any, actions: any) => {
    setIsProcessing(true);
    try {
      console.log('PayPal onApprove called with data:', data);
      
      // Capture the payment
      const details = await actions.order.capture();
      console.log('PayPal capture response:', details);
      
      // CRITICAL: Strict validation of payment completion
      if (!details || !details.status) {
        throw new Error('Invalid payment response from PayPal');
      }
      
      if (details.status !== 'COMPLETED') {
        console.error('Payment not completed. Status:', details.status);
        setPaymentStatus('error');
        setErrorMessage(`Payment failed. Status: ${details.status}`);
        return;
      }
      
      // CRITICAL: Validate payer information exists
      if (!details.payer || !details.payer.email_address) {
        console.error('Missing payer information:', details.payer);
        setPaymentStatus('error');
        setErrorMessage('Payment completed but payer information is missing. Please contact support.');
        return;
      }
      
      // Additional validation: Check payment amount
      const purchaseUnit = details.purchase_units?.[0];
      if (!purchaseUnit || !purchaseUnit.payments || !purchaseUnit.payments.captures) {
        console.error('Missing payment capture information');
        setPaymentStatus('error');
        setErrorMessage('Payment validation failed. Please contact support.');
        return;
      }
      
      const capturedAmount = purchaseUnit.payments.captures[0]?.amount?.value;
      if (capturedAmount !== '3.99') {
        console.error('Payment amount mismatch. Expected: 3.99, Got:', capturedAmount);
        setPaymentStatus('error');
        setErrorMessage('Payment amount validation failed. Please contact support.');
        return;
      }
      
      console.log('✅ Payment validation successful');
      
      // Extract ALL available PayPal user data
      const paypalEmail = details.payer.email_address;
      const paypalName = details.payer.name;
      const paypalAddress = details.payer.address;
      
      // Map country codes to phone prefixes
      const getPhonePrefix = (countryCode: string) => {
        const countryToPhone: { [key: string]: string } = {
          'US': '+1', 'CA': '+1', 'UK': '+44', 'GB': '+44', 'IN': '+91',
          'AU': '+61', 'DE': '+49', 'FR': '+33', 'CN': '+86', 'JP': '+81',
          'KR': '+82', 'BR': '+55', 'MX': '+52', 'IT': '+39', 'ES': '+34',
          'NL': '+31', 'SG': '+65', 'MY': '+60', 'TH': '+66', 'VN': '+84'
        };
        return countryToPhone[countryCode.toUpperCase()] || '';
      };
      
      // Build comprehensive user data from PayPal
      const shippingInfo = purchaseUnit?.shipping;
      const shippingPhone = shippingInfo?.phone_number?.national_number ||
        shippingInfo?.phone_number?.phone_number ||
        shippingInfo?.phone_number ||
        '';
      const shippingCountryCode = shippingInfo?.address?.country_code || '';

      const paypalUserData = {
        email: paypalEmail,
        firstName: paypalName?.given_name || '',
        lastName: paypalName?.surname || '',
        fullName: paypalName ? `${paypalName.given_name || ''} ${paypalName.surname || ''}`.trim() : '',
        countryCode: paypalAddress?.country_code ? getPhonePrefix(paypalAddress.country_code) : shippingCountryCode ? getPhonePrefix(shippingCountryCode) : '',
        // Enhanced phone extraction - try multiple PayPal phone paths
        phone: details.payer.phone?.phone_number?.national_number || 
               details.payer.phone?.phone_number?.phone_number ||
               details.payer.phone?.national_number ||
               details.payer.phone?.phone_number ||
               details.payer.phone ||
               shippingPhone ||
               '',
        // Additional PayPal data
        payerId: details.payer.payer_id,
        addressLine1: paypalAddress?.address_line_1 || '',
        addressLine2: paypalAddress?.address_line_2 || '',
        adminArea1: paypalAddress?.admin_area_1 || '', // State/Province
        adminArea2: paypalAddress?.admin_area_2 || '', // City
        postalCode: paypalAddress?.postal_code || ''
      };
      
      console.log('📊 PayPal user data extracted:');
      console.log('📧 Email:', paypalUserData.email);
      console.log('👤 Name:', paypalUserData.fullName);
      console.log('🌍 Country Code:', paypalUserData.countryCode);
      console.log('📱 Phone:', paypalUserData.phone);
      console.log('📊 Full PayPal payer object:', JSON.stringify(details.payer, null, 2));
      
      const tempPaymentData = {
        payment_id: details.id,
        payer_id: details.payer.payer_id,
        payer_email: paypalEmail,
        amount: '3.99',
        currency: 'USD',
        payment_method: 'paypal',
        payment_date: new Date().toISOString(),
        transaction_details: details,
        // Include extracted user data
        userData: paypalUserData
      };
      
      console.log('Saving payment to database:', tempPaymentData);
      
      // Store payment in database immediately
      const { error: paymentError } = await supabase
        .from('user_payments')
        .insert([
          {
            email: paypalEmail,
            payer_email: paypalEmail,
            payment_id: details.id,
            payer_id: details.payer.payer_id,
            payment_status: 'completed',
            amount: '3.99',
            currency: 'USD',
            payment_method: 'paypal',
            payment_date: new Date().toISOString(),
            transaction_details: details,
          }
        ]);

      if (paymentError) {
        console.error('Database error saving payment:', paymentError);
        console.error('Payment ID that failed to save:', details.id);
        console.error('PayPal email used:', paypalEmail);
        console.error('Full error details:', JSON.stringify(paymentError, null, 2));
        
        setPaymentStatus('error');
        setErrorMessage(`Payment successful but failed to save. Database error: ${paymentError.message}. Please contact support with payment ID: ${details.id}`);
        return;
      }
      
      console.log('✅ Payment saved to database successfully');
      
      // Wait 3 seconds then verify payment was recorded (webhook backup check)
      setTimeout(async () => {
        try {
          const { data: verifyPayment } = await supabase
            .from('user_payments')
            .select('payment_id, payment_status')
            .eq('payment_id', details.id)
            .single();
          
          if (!verifyPayment || verifyPayment.payment_status !== 'completed') {
            console.warn('⚠️ Payment not found in database after 3 seconds - webhook may have failed');
            // Could trigger a manual retry or alert here
          } else {
            console.log('✅ Payment verification successful - database is consistent');
          }
        } catch (verifyError) {
          console.error('Payment verification check failed:', verifyError);
        }
      }, 3000);
      
      // Store payment data and email for state passing
      setPaymentData(tempPaymentData);
      setVerificationEmail(paypalEmail);

      // 🔁 NEW FLOW: Send them straight to the signup flow with ALL PayPal data
      navigate('/signup', {
        state: {
          paymentId: details.id,
          email: paypalEmail,
          amount: '3.99',
          paymentStatus: 'completed',
          // Pass ALL PayPal user data for pre-filling
          userData: paypalUserData,
          fullPaymentData: tempPaymentData
        },
      });
      return;
      
      // OLD FLOW: Email verification (commented out to bypass broken email system)
      // setPaymentStatus('success');
      // console.log('Attempting to send verification email...');
      
      try {
        const emailResult = await emailService.generateAndSendVerificationEmail(
          details.id,
          paypalEmail
        );
        
        console.log('Email service result:', emailResult);
        
        if (emailResult.success) {
          console.log('✅ Verification email sent successfully');
          setPaymentStatus('email-sent');
          setVerificationUrl(emailResult.verificationUrl || '');
        } else {
          throw new Error(emailResult.message);
        }
      } catch (emailError) {
        console.error('Error sending verification email:', emailError);
        setPaymentStatus('error');
        setErrorMessage('Payment successful but failed to send verification email. Please contact support with payment ID: ' + details.id);
      }
        
    } catch (error) {
      console.error('Critical error in payment processing:', error);
      setPaymentStatus('error');
      setErrorMessage('Payment processing failed: ' + (error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const onError = async (err: any) => {
    console.error('PayPal error occurred:', err);
    
    // EXPERT FIX: Send failure email with retry payment link
    try {
      const userEmail = verificationEmail || 'user@example.com'; // Fallback email
      const retryUrl = `${window.location.origin}/payment`;
      
      await emailService.sendPaymentFailureEmail({
        to: userEmail,
        firstName: 'Valued Customer',
        failureReason: err.message || 'payment processing error',
        retryUrl: retryUrl
      });
      
      console.log('✅ Payment failure email sent successfully');
    } catch (emailError) {
      console.error('Failed to send payment failure email:', emailError);
    }
    
    setPaymentStatus('error');
    setErrorMessage('Payment failed: ' + (err.message || 'Please try again. A retry link has been sent to your email.'));
    setIsProcessing(false);
  };

  const onCancel = async (data: any) => {
    console.log('Payment cancelled by user:', data);
    
    // EXPERT FIX: Send failure email for cancelled payments with retry link
    try {
      const userEmail = verificationEmail || 'user@example.com'; // Fallback email
      const retryUrl = `${window.location.origin}/payment`;
      
      await emailService.sendPaymentFailureEmail({
        to: userEmail,
        firstName: 'Valued Customer',
        failureReason: 'payment was cancelled',
        retryUrl: retryUrl
      });
      
      console.log('✅ Payment cancellation email sent successfully');
    } catch (emailError) {
      console.error('Failed to send payment cancellation email:', emailError);
    }
    
    setPaymentStatus('error');
    setErrorMessage('Payment was cancelled. A new payment link has been sent to your email.');
    setIsProcessing(false);
  };

  const handleRetryPayment = () => {
    setPaymentStatus('pending');
    setErrorMessage('');
  };

  const handleResendEmail = async () => {
    if (!paymentData?.payment_id) return;
    
    setIsProcessing(true);
    try {
      const result = await emailService.resendVerificationEmail(paymentData.payment_id);
      if (result.success) {
        setVerificationUrl(result.verificationUrl || '');
        alert('Verification email sent successfully!');
      } else {
        alert('Failed to resend email: ' + result.message);
      }
    } catch (error) {
      console.error('Error resending email:', error);
      alert('Failed to resend verification email');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <div className="mb-8">
          <button
            onClick={handleGoBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Secure Your Lifetime Access
          </h1>
          <p className="text-gray-600">
            Complete your one-time payment to unlock the H1B sponsor database
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {paymentStatus === 'pending' && (
            <div className="space-y-8">
              {/* Payment Component */}
              <div className="w-full max-w-md mx-auto">
                <div className="bg-white p-6 rounded-lg shadow-lg border">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Complete Your Payment
                    </h3>
                    <div className="text-3xl font-bold text-blue-600 mb-1">$3.99</div>
                    <p className="text-sm text-gray-600">One-time payment • Lifetime access</p>
                  </div>

                  <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">What you'll get:</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>✓ Access to 500+ verified H1B sponsors</li>
                      <li>✓ Company names, domains & career links</li>
                      <li>✓ Weekly list updates included</li>
                      <li>✓ Lifetime login access</li>
                    </ul>
                  </div>

                  {isProcessing && (
                    <div className="text-center py-4">
                      <div className="inline-flex items-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-gray-600">Processing payment...</span>
                      </div>
                    </div>
                  )}

                  <PayPalScriptProvider options={paypalOptions}>
                    <PayPalButtons
                      style={{
                        layout: "vertical",
                        color: "blue",
                        shape: "rect",
                        label: "pay",
                      }}
                      createOrder={createOrder}
                      onApprove={onApprove}
                      onError={onError}
                      onCancel={onCancel}
                      disabled={isProcessing}
                    />
                  </PayPalScriptProvider>

                  <div className="mt-4 text-xs text-gray-500 text-center">
                    Secure payment powered by PayPal
                  </div>
                </div>
              </div>

              {/* Why Pay First Section */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Why payment first?</h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-green-600 text-xs">✓</span>
                    </div>
                    <p>Immediate access after account creation - no waiting</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-green-600 text-xs">✓</span>
                    </div>
                    <p>Secure your spot before creating your account</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-green-600 text-xs">✓</span>
                    </div>
                    <p>One-time payment guarantees lifetime access</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {paymentStatus === 'email-sent' && (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <Mail className="h-16 w-16 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Verification Email Sent!
              </h2>
              <p className="text-gray-600 mb-6">
                We've sent a verification email to <strong>{verificationEmail}</strong>
              </p>
              
              <div className="bg-blue-50 p-6 rounded-lg mb-6">
                <div className="flex items-center justify-center mb-4">
                  <Clock className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-blue-800 font-medium">Next Steps:</span>
                </div>
                <ol className="text-left text-blue-700 space-y-2">
                  <li>1. Check your email inbox (and spam folder)</li>
                  <li>2. Click the verification link in the email</li>
                  <li>3. Complete your account setup</li>
                  <li>4. Access your H1B sponsor database</li>
                </ol>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg mb-6">
                <p className="text-yellow-800 text-sm">
                  ⏰ <strong>Important:</strong> The verification link expires in 24 hours
                </p>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={handleResendEmail}
                  disabled={isProcessing}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? 'Sending...' : 'Resend Verification Email'}
                </button>
                
                {verificationUrl && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-2">Development: Direct verification link</p>
                    <a
                      href={verificationUrl}
                      className="text-blue-600 hover:underline text-sm break-all"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {verificationUrl}
                    </a>
                  </div>
                )}
                
                <button
                  onClick={handleGoBack}
                  className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Back to Home
                </button>
              </div>
            </div>
          )}

          {paymentStatus === 'success' && (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Payment Successful!
              </h2>
              <p className="text-gray-600 mb-6">
                Thank you for your payment! A verification email has been sent to your PayPal email address. Please check your inbox to continue.
              </p>
              <div className="bg-green-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-green-800 mb-2">Payment Successful! Next Steps:</h3>
                <p className="text-sm text-green-700">
                  1. Check your email: <strong>{verificationEmail}</strong><br/>
                  2. Click the verification link in the email<br/>
                  3. Complete your account setup<br/>
                  4. Access your H1B sponsor database
                </p>
              </div>
              <p className="text-sm text-gray-500">
                Please check your email to continue with account setup.
              </p>
            </div>
          )}

          {paymentStatus === 'error' && (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Payment Failed
              </h2>
              <p className="text-gray-600 mb-4">
                {errorMessage || 'There was an issue processing your payment.'}
              </p>
              
              {/* EXPERT ENHANCEMENT: Clear instructions for next steps */}
              <div className="bg-blue-50 p-6 rounded-lg mb-6">
                <h3 className="font-semibold text-blue-800 mb-3">What happens next:</h3>
                <ul className="text-left text-blue-700 space-y-2">
                  <li>• We've sent a new payment link to your email</li>
                  <li>• Check your inbox (and spam folder)</li>
                  <li>• Click the payment link to try again</li>
                  <li>• Or use the retry button below</li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={handleRetryPayment}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  ♾ Retry Payment Now
                </button>
                <button
                  onClick={handleGoBack}
                  className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Go Back to Home
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Need help? Contact us at{' '}
            <a href="mailto:support@example.com" className="text-blue-600 hover:underline">
              support@example.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentFirstPage;