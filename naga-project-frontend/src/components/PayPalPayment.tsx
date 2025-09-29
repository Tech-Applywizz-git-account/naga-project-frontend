import React, { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import supabase from '../utils/supabase';

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
        // Update user payment status in Supabase
        const { error } = await supabase
          .from('user_payments')
          .insert([
            {
              user_id: userId,
              email: userEmail,
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

        if (error) {
          console.error('Error saving payment to database:', error);
          onPaymentError('Payment successful but failed to update database. Please contact support.');
          return;
        }

        // Also update the user's paid status
        const { error: updateError } = await supabase
          .from('leads')
          .update({ payment_status: 'completed', paid_at: new Date().toISOString() })
          .eq('email', userEmail);

        if (updateError) {
          console.error('Error updating user paid status:', updateError);
        }

        onPaymentSuccess();
      } else {
        onPaymentError('Payment was not completed successfully.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      onPaymentError('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const onError = (err: any) => {
    console.error('PayPal error:', err);
    onPaymentError('Payment failed. Please try again.');
  };

  const onCancel = (data: any) => {
    console.log('Payment cancelled:', data);
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