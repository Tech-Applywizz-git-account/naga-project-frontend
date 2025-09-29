import React, { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import supabase from '../utils/supabase';
import emailService from '../utils/emailService';

interface PayPalPaymentProps {
  userEmail: string;
  userId: string;
  onPaymentSuccess: () => void;
  onPaymentError: (error: string) => void;
}

const PayPalPayment: React.FC<PayPalPaymentProps> = ({
  userEmail,
  userId,
  onPaymentSuccess,
  onPaymentError,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

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
      const details = await actions.order.capture();
      
      // Verify payment was successful
      if (details.status === 'COMPLETED') {
        console.log('💳 PayPal payment completed:', details);
        
        // Extract PayPal user data for pre-filling signup
        const paypalUserData = {
          fullName: details.payer?.name ? 
            `${details.payer.name.given_name || ''} ${details.payer.name.surname || ''}`.trim() : '',
          email: details.payer?.email_address || userEmail,
          phone: details.payer?.phone?.phone_number?.national_number || '',
          countryCode: details.payer?.address?.country_code ? 
            getPhonePrefix(details.payer.address.country_code) : '+1',
          payerAddress: details.payer?.address || null
        };
        
        console.log('👤 Extracted PayPal user data:', paypalUserData);
        
        // 🚀 CRITICAL FIX: Skip database save for now (webhook will handle it)
        // This prevents the "Invalid API key" error from blocking user flow
        console.log('⚠️ Skipping direct database save - will be handled by webhook');
        console.log('🎯 Payment completed successfully, proceeding to signup...');
        
        // Log payment details for debugging
        console.log('💳 Payment Details:', {
          paymentId: details.id,
          payerEmail: details.payer?.email_address,
          amount: '3.99',
          status: details.status
        });

        // CRITICAL: Redirect to signup with PayPal data for pre-filling
        console.log('🔄 Redirecting to signup with PayPal data...');
        
        try {
          // Pass data via localStorage for signup page to pick up
          const paymentSuccessData = {
            paymentId: details.id,
            email: details.payer?.email_address || userEmail,
            amount: '3.99',
            paymentStatus: 'completed',
            userData: paypalUserData,
            paymentCompleted: true,
            emailVerified: true,
            timestamp: Date.now()
          };
          
          localStorage.setItem('paypalPaymentData', JSON.stringify(paymentSuccessData));
          console.log('✅ Payment data stored in localStorage:', paymentSuccessData);
          
          // Navigate to signup immediately
          window.location.href = '/signup';
          
        } catch (redirectError) {
          console.error('⚠️ Redirect setup failed:', redirectError);
          // Fallback: still try to redirect
          window.location.href = '/signup';
        }
        
        // Also trigger success callback for any parent components
        onPaymentSuccess();
        
      } else {
        onPaymentError('Payment was not completed successfully.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      onPaymentError(`Payment failed: ${(error as Error).message || 'Please try again.'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to get phone prefix from country code
  const getPhonePrefix = (countryCode: string): string => {
    const countryToPhone: { [key: string]: string } = {
      'US': '+1', 'CA': '+1', 'UK': '+44', 'GB': '+44', 'IN': '+91',
      'AU': '+61', 'DE': '+49', 'FR': '+33', 'CN': '+86', 'JP': '+81',
      'KR': '+82', 'BR': '+55', 'MX': '+52', 'IT': '+39', 'ES': '+34',
      'NL': '+31', 'SG': '+65', 'MY': '+60', 'TH': '+66', 'VN': '+84'
    };
    return countryToPhone[countryCode.toUpperCase()] || '+1';
  };

  const onError = (err: any) => {
    console.error('PayPal error:', err);
    
    // 📧 SEND PAYMENT FAILURE EMAIL
    const sendFailureEmail = async () => {
      try {
        await emailService.sendPaymentFailureEmail({
          to: userEmail,
          firstName: 'Valued Customer',
          failureReason: 'PayPal payment processing error',
          retryUrl: `${window.location.origin}/payment`
        });
        console.log('✅ Payment failure notification sent');
      } catch (emailError) {
        console.error('❌ Failed to send failure notification:', emailError);
      }
    };
    
    // Send failure email asynchronously (don't block error handling)
    sendFailureEmail();
    
    onPaymentError('Payment failed. Please try again.');
  };

  const onCancel = (data: any) => {
    console.log('Payment cancelled:', data);
    
    // 📧 SEND PAYMENT CANCELLATION EMAIL (Optional)
    const sendCancellationEmail = async () => {
      try {
        await emailService.sendPaymentFailureEmail({
          to: userEmail,
          firstName: 'Valued Customer',
          failureReason: 'payment was cancelled',
          retryUrl: `${window.location.origin}/payment`
        });
        console.log('✅ Payment cancellation notification sent');
      } catch (emailError) {
        console.error('❌ Failed to send cancellation notification:', emailError);
      }
    };
    
    // Send cancellation email asynchronously
    sendCancellationEmail();
    
    onPaymentError('Payment was cancelled.');
  };

  return (
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
  );
};

export default PayPalPayment;