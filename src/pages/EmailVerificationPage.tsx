import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, Mail, ArrowLeft, AlertCircle } from 'lucide-react';
import supabase from '../utils/supabase';
import emailService from '../utils/emailService';

const EmailVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'error' | 'expired'>('verifying');
  const [message, setMessage] = useState<string>('');
  const [paymentData, setPaymentData] = useState<any>(null);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!token) {
      setVerificationStatus('error');
      setMessage('No verification token provided');
      return;
    }

    verifyEmailToken();
  }, [token]);

  const verifyEmailToken = async () => {
    try {
      if (!token) {
        setVerificationStatus('error');
        setMessage('No verification token provided');
        return;
      }
      
      // Use the emailService directly instead of missing database function
      const result = await emailService.verifyEmailToken(token);

      if (result.success) {
        // Get payment details
        const { data: paymentDetails, error: paymentError } = await supabase
          .from('user_payments')
          .select('*')
          .eq('payment_id', result.payment_id)
          .single();

        if (!paymentError && paymentDetails) {
          setPaymentData({
            payment_id: result.payment_id,
            email: result.email,
            payer_email: paymentDetails.payer_email,
            amount: paymentDetails.amount,
            payment_date: paymentDetails.payment_date,
            transaction_details: paymentDetails.transaction_details,
          });
        }

        setVerificationStatus('success');
        setMessage(result.message);
      } else {
        if (result.message.includes('expired')) {
          setVerificationStatus('expired');
        } else {
          setVerificationStatus('error');
        }
        setMessage(result.message);
      }
    } catch (error) {
      console.error('Error verifying email token:', error);
      setVerificationStatus('error');
      setMessage('Failed to verify email token');
    }
  };

  const handleResendEmail = async () => {
    if (!paymentData?.payment_id) return;

    setIsResending(true);
    try {
      const result = await emailService.resendVerificationEmail(paymentData.payment_id);
      if (result.success) {
        alert('New verification email sent successfully! Please check your inbox.');
      } else {
        alert('Failed to resend email: ' + result.message);
      }
    } catch (error) {
      console.error('Error resending email:', error);
      alert('Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  const handleProceedToSignup = () => {
    if (!paymentData) return;

    navigate('/signup', {
      state: {
        paymentCompleted: true,
        paymentData: paymentData,
        requiredEmail: paymentData.email,
        emailVerified: true
      }
    });
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <div className="mb-8">
          <button
            onClick={handleGoHome}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </button>
        </div>

        <div className="max-w-2xl mx-auto">
          {verificationStatus === 'verifying' && (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Verifying Your Email
              </h2>
              <p className="text-gray-600">
                Please wait while we verify your email address...
              </p>
            </div>
          )}

          {verificationStatus === 'success' && (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Email Verified Successfully!
              </h2>
              <p className="text-gray-600 mb-6">
                Your email has been verified and your payment confirmed. You can now create your account.
              </p>

              {paymentData && (
                <div className="bg-green-50 p-6 rounded-lg mb-6">
                  <h3 className="font-semibold text-green-800 mb-3">Payment Details Confirmed:</h3>
                  <div className="text-left text-green-700 space-y-2">
                    <div className="flex justify-between">
                      <span>Email:</span>
                      <span className="font-medium">{paymentData.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Amount:</span>
                      <span className="font-medium">${paymentData.amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payment ID:</span>
                      <span className="font-medium text-xs">{paymentData.payment_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className="font-medium">✅ Completed & Verified</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h4 className="font-semibold text-blue-800 mb-2">What's Next?</h4>
                <ul className="text-left text-blue-700 text-sm space-y-1">
                  <li>✅ Email verified</li>
                  <li>✅ Payment confirmed</li>
                  <li>🔄 Create your account (next step)</li>
                  <li>🎯 Access H1B sponsor database</li>
                </ul>
              </div>

              <button
                onClick={handleProceedToSignup}
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors mb-4"
              >
                Create Account & Access Database
              </button>

              <p className="text-xs text-gray-500">
                You'll use the verified email: <strong>{paymentData?.email}</strong>
              </p>
            </div>
          )}

          {verificationStatus === 'expired' && (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <Clock className="h-16 w-16 text-orange-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Verification Link Expired
              </h2>
              <p className="text-gray-600 mb-6">
                {message}
              </p>

              <div className="bg-orange-50 p-4 rounded-lg mb-6">
                <AlertCircle className="h-5 w-5 text-orange-600 mx-auto mb-2" />
                <p className="text-orange-800 text-sm">
                  Don't worry! Your payment is safe. We can send you a new verification link.
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleResendEmail}
                  disabled={isResending}
                  className="w-full bg-orange-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  {isResending ? 'Sending...' : 'Send New Verification Email'}
                </button>

                <button
                  onClick={handleGoHome}
                  className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Back to Home
                </button>
              </div>
            </div>
          )}

          {verificationStatus === 'error' && (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Verification Failed
              </h2>
              <p className="text-gray-600 mb-6">
                {message}
              </p>

              <div className="bg-red-50 p-4 rounded-lg mb-6">
                <AlertCircle className="h-5 w-5 text-red-600 mx-auto mb-2" />
                <p className="text-red-800 text-sm">
                  Please check your verification link or contact support if you continue to have issues.
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>

                <button
                  onClick={handleGoHome}
                  className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Back to Home
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Having trouble? Contact us at{' '}
            <a href="mailto:support@h1bsponsors.com" className="text-blue-600 hover:underline">
              support@h1bsponsors.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;