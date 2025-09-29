import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';
import PayPalPayment from '../components/PayPalPayment';
import supabase from '../utils/supabase';

interface PaymentPageProps {}

const PaymentPage: React.FC<PaymentPageProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [userInfo, setUserInfo] = useState<{ email: string; userId: string; fullName: string } | null>(null);

  useEffect(() => {
    // Get user info from navigation state or check current user
    const stateUserInfo = location.state?.userInfo;
    if (stateUserInfo) {
      setUserInfo(stateUserInfo);
    } else {
      // Check if user is logged in
      const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Get user profile from leads table
          const { data: userData, error } = await supabase
            .from('leads')
            .select('full_name, email')
            .eq('email', user.email)
            .single();

          if (userData) {
            setUserInfo({
              email: user.email!,
              userId: user.id,
              fullName: userData.full_name
            });
          }
        } else {
          // No user logged in, redirect to signup
          navigate('/signup');
        }
      };
      checkUser();
    }
  }, [location.state, navigate]);

  const handlePaymentSuccess = () => {
    setPaymentStatus('success');
    // Navigate to dashboard after 3 seconds
    setTimeout(() => {
      navigate('/dashboard');
    }, 3000);
  };

  const handlePaymentError = (error: string) => {
    setPaymentStatus('error');
    setErrorMessage(error);
  };

  const handleRetryPayment = () => {
    setPaymentStatus('pending');
    setErrorMessage('');
  };

  const handleSkipForNow = () => {
    navigate('/');
  };

  if (!userInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {userInfo.fullName}!
          </h1>
          <p className="text-gray-600">
            Complete your payment to unlock lifetime access to H1B sponsor database
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {paymentStatus === 'pending' && (
            <div className="space-y-8">
              {/* Payment Component */}
              <PayPalPayment
                userEmail={userInfo.email}
                userId={userInfo.userId}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
              />

              {/* Alternative Options */}
              <div className="text-center">
                <button
                  onClick={handleSkipForNow}
                  className="text-gray-500 hover:text-gray-700 text-sm underline"
                >
                  Skip for now (Limited access)
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
                Thank you for your payment. You now have lifetime access to our H1B sponsor database.
              </p>
              <div className="bg-green-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-green-800 mb-2">What's next?</h3>
                <ul className="text-sm text-green-700 text-left">
                  <li>✓ Access to 500+ verified H1B sponsors</li>
                  <li>✓ Company contact information and career pages</li>
                  <li>✓ Weekly database updates</li>
                  <li>✓ Lifetime access to your account</li>
                </ul>
              </div>
              <p className="text-sm text-gray-500">
                Redirecting to your dashboard in a few seconds...
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
              <div className="space-y-4">
                <button
                  onClick={handleRetryPayment}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={handleSkipForNow}
                  className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Continue Without Payment
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

export default PaymentPage;