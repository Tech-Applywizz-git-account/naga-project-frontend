import supabase from './supabase';

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface SendEmailParams {
  to: string;
  paymentId: string;
  amount: string;
  verificationToken: string;
}

interface SendFailureEmailParams {
  to: string;
  firstName?: string;
  failureReason?: string;
  retryUrl?: string;
}

class EmailService {
  private baseUrl: string;

  constructor() {
    // Use current domain or fallback to localhost for development
    this.baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : 'http://localhost:5174';
  }

  /**
   * Generate payment failure email template
   */
  private generatePaymentFailureEmailTemplate(
    email: string,
    firstName: string = 'Valued Customer',
    failureReason: string = 'payment attempt didn\'t go through',
    retryUrl: string = ''
  ): EmailTemplate {
    const retryLink = retryUrl || `${this.baseUrl}/payment`;
    
    const subject = '⚠️ Payment Attempt Failed - ApplyWizz H1B Database';
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Payment Failed</title>
</head>
<body style="margin:0; padding:0; font-family:Arial, sans-serif; background-color:#f8f9fc;">

  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f8f9fc; padding:40px 0;">
    <tr>
      <td align="center">

        <!-- Card Container -->
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background:#ffffff; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.08); padding:40px;">

          <!-- Logo / Header -->
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <img src="https://via.placeholder.com/120x40?text=ApplyWizz" alt="Logo" style="max-width:120px;">
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td align="center" style="font-size:22px; font-weight:bold; color:#333333; padding-bottom:12px;">
              Payment Attempt Failed
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="font-size:16px; line-height:1.6; color:#555555; text-align:left; padding-bottom:24px;">
              Hi <strong>${firstName}</strong>, <br><br>
              We noticed that your recent payment attempt didn't go through. Don't worry — this can happen for a variety of reasons (card declined, PayPal issue, or network interruption).
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <a href="${retryLink}" 
                 style="display:inline-block; background:#4f46e5; color:#ffffff; text-decoration:none; padding:14px 28px; border-radius:8px; font-size:16px; font-weight:600;">
                 Retry Payment
              </a>
            </td>
          </tr>

          <!-- Extra Info -->
          <tr>
            <td style="font-size:14px; line-height:1.6; color:#777777; text-align:left; padding-bottom:12px;">
              If you believe this was a mistake, we recommend:
              <ul style="margin:12px 0; padding-left:20px; color:#555555;">
                <li>Checking your card or PayPal account balance.</li>
                <li>Ensuring your billing details are up to date.</li>
                <li>Trying a different payment method if possible.</li>
              </ul>
              If you need help, simply reply to this email and our support team will get back to you.
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="font-size:13px; color:#999999; padding-top:24px; border-top:1px solid #eee;">
              Thank you for being with us, <br>
              <strong>The ApplyWizz Team</strong>
            </td>
          </tr>

        </table>
        <!-- /Card Container -->

      </td>
    </tr>
  </table>

</body>
</html>
    `;
    
    const text = `
      ⚠️ Payment Attempt Failed - ApplyWizz H1B Database
      
      Hi ${firstName},
      
      We noticed that your recent payment attempt didn't go through. This can happen for various reasons:
      - Card declined
      - PayPal issue
      - Network interruption
      
      What to do next:
      1. Check your card or PayPal account balance
      2. Ensure your billing details are up to date
      3. Try a different payment method
      
      Retry your payment: ${retryLink}
      
      If you need help, simply reply to this email and our support team will get back to you.
      
      Thank you for being with us,
      The ApplyWizz Team
    `;
    
    return { subject, html, text };
  }
  private generateVerificationEmailTemplate(
    email: string, 
    paymentId: string, 
    amount: string, 
    verificationToken: string
  ): EmailTemplate {
    const verificationUrl = `${this.baseUrl}/verify-email?token=${verificationToken}`;
    
    const subject = '🎉 Payment Successful - Verify Your Email to Access H1B Database';
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Payment Successful</title>
</head>
<body style="margin:0; padding:0; font-family:Arial, sans-serif; background-color:#f8f9fc;">

  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f8f9fc; padding:40px 0;">
    <tr>
      <td align="center">

        <!-- Card Container -->
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background:#ffffff; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.08); padding:40px;">

          <!-- Logo / Header -->
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <img src="https://via.placeholder.com/120x40?text=ApplyWizz" alt="Logo" style="max-width:120px;">
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td align="center" style="font-size:22px; font-weight:bold; color:#16a34a; padding-bottom:12px;">
              🎉 Payment Successful!
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="font-size:16px; line-height:1.6; color:#555555; text-align:left; padding-bottom:24px;">
              Hi <strong>Valued Customer</strong>, <br><br>
              We've received your payment successfully. Your access is now active and you can enjoy all the features without interruption.
            </td>
          </tr>

          <!-- Order Summary -->
          <tr>
            <td style="font-size:15px; line-height:1.6; color:#333333; text-align:left; padding-bottom:24px;">
              <strong>Payment Details</strong><br>
              • Amount: $${amount} USD <br>
              • Transaction ID: ${paymentId} <br>
              • Date: ${new Date().toLocaleDateString()}
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <a href="${verificationUrl}" 
                 style="display:inline-block; background:#16a34a; color:#ffffff; text-decoration:none; padding:14px 28px; border-radius:8px; font-size:16px; font-weight:600;">
                 Verify Email & Access Database
              </a>
            </td>
          </tr>

          <!-- Next Steps -->
          <tr>
            <td style="font-size:14px; line-height:1.6; color:#777777; text-align:left; padding-bottom:12px;">
              <strong>What's Next?</strong>
              <ul style="margin:12px 0; padding-left:20px; color:#555555;">
                <li>Click the button above to verify your email</li>
                <li>Complete your account setup</li>
                <li>Access 500+ verified H1B sponsors</li>
              </ul>
              <em>⏰ This verification link expires in 24 hours.</em>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="font-size:13px; color:#999999; padding-top:24px; border-top:1px solid #eee;">
              Thank you for being with us, <br>
              <strong>The ApplyWizz Team</strong>
            </td>
          </tr>

        </table>
        <!-- /Card Container -->

      </td>
    </tr>
  </table>

</body>
</html>
    `;
    
    const text = `
      🎉 Payment Successful - ApplyWizz H1B Database
      
      Hi Valued Customer,
      
      We've received your payment successfully! Your access is now active.
      
      Payment Details:
      • Amount: $${amount} USD
      • Transaction ID: ${paymentId}
      • Date: ${new Date().toLocaleDateString()}
      
      Next Steps:
      1. Verify your email: ${verificationUrl}
      2. Complete account setup
      3. Access 500+ verified H1B sponsors
      
      ⏰ Verification link expires in 24 hours.
      
      Thank you for being with us,
      The ApplyWizz Team
    `;
    
    return { subject, html, text };
  }

  /**
   * SIMPLIFIED: Store verification token and provide manual link
   */
  async sendVerificationEmailSimple(email: string, paymentId: string): Promise<{
    success: boolean;
    message: string;
    verificationUrl?: string;
  }> {
    try {
      console.log('📧 Creating verification token for manual distribution...');
      
      // Generate verification token
      const verificationToken = this.generateSecureToken();
      const verificationUrl = `${this.baseUrl}/verify-email?token=${verificationToken}`;
      
      // Store token in database
      try {
        const { error: insertError } = await supabase
          .from('email_verification_tokens')
          .insert({
            payment_id: paymentId,
            email: email,
            token: verificationToken,
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            is_used: false
          });
          
        if (insertError) {
          console.error('❌ Failed to store token:', insertError);
          return {
            success: false,
            message: 'Failed to store verification token. Please contact support.',
          };
        }
        
        console.log('✅ Token stored successfully');
        
        // Log the email attempt
        await supabase
          .from('email_logs')
          .insert({
            recipient: email,
            subject: 'Payment Verification Required',
            email_type: 'verification',
            payment_id: paymentId,
            sent_at: new Date().toISOString(),
            status: 'token_created',
            message_id: `manual_${Date.now()}`
          });
        
        console.log('🔗 Verification URL generated:', verificationUrl);
        
        return {
          success: true,
          message: 'Verification token created successfully. Please check your email for the verification link.',
          verificationUrl,
        };
        
      } catch (dbError) {
        console.error('❌ Database error:', dbError);
        return {
          success: false,
          message: 'Database error. Please contact support.',
        };
      }
      
    } catch (error) {
      console.error('❌ Critical error:', error);
      return {
        success: false,
        message: 'Failed to create verification token due to system error',
      };
    }
  }

  /**
   * Generate and send verification email via database function
   */
  async generateAndSendVerificationEmail(paymentId: string, email: string): Promise<{
    success: boolean;
    message: string;
    verificationToken?: string;
    verificationUrl?: string;
  }> {
    try {
      // CRITICAL: Validate payment exists and is completed BEFORE sending email
      console.log('Validating payment before sending email...');
      
      const { data: paymentValidation, error: validationError } = await supabase
        .from('user_payments')
        .select('payment_status, email, amount')
        .eq('payment_id', paymentId)
        .single();

      if (validationError || !paymentValidation) {
        console.error('Payment validation failed:', validationError);
        return {
          success: false,
          message: 'Payment not found in database. Cannot send verification email.',
        };
      }

      if (paymentValidation.payment_status !== 'completed') {
        console.error('Payment not completed. Status:', paymentValidation.payment_status);
        return {
          success: false,
          message: 'Payment not completed. Cannot send verification email.',
        };
      }

      if (paymentValidation.email !== email) {
        console.error('Email mismatch in payment record');
        return {
          success: false,
          message: 'Email mismatch. Cannot send verification email.',
        };
      }

      console.log('✅ Payment validation passed, proceeding with email generation...');

      // FIXED: Generate verification token directly instead of using missing DB function
      const verificationToken = this.generateSecureToken();
      const verificationUrl = `${this.baseUrl}/verify-email?token=${verificationToken}`;
      
      // Store the token in user_payments table (using existing columns)
      const { error: tokenUpdateError } = await supabase
        .from('user_payments')
        .update({
          // Keep the email column as primary source - remove payer_email update
          updated_at: new Date().toISOString()
        })
        .eq('payment_id', paymentId);

      if (tokenUpdateError) {
        console.error('Failed to update payment status:', tokenUpdateError);
        // Continue anyway - this is not critical for email sending
      }

      // Send the actual email
      const emailResult = await this.sendVerificationEmailSimple(
        email,
        paymentId
      );

      console.log('✅ Email generation and sending completed');

      return {
        success: emailResult.success,
        message: emailResult.message,
        verificationToken,
        verificationUrl: emailResult.verificationUrl,
      };

    } catch (error) {
      console.error('Error in generateAndSendVerificationEmail:', error);
      return {
        success: false,
        message: `Failed to send verification email: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
  
  /**
   * Generate a secure random token
   */
  private generateSecureToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  /**
   * Verify email token using REAL database function
   */
  async verifyEmailToken(token: string): Promise<{
    success: boolean;
    message: string;
    payment_id?: string;
    email?: string;
  }> {
    try {
      if (!token || token.length < 10) {
        return {
          success: false,
          message: 'Invalid verification token format',
        };
      }
      
      console.log('🔍 Verifying email token with database...');
      
      // Use REAL database function to verify token
      const { data: verificationResult, error: verificationError } = await supabase
        .rpc('verify_email_token', {
          token_param: token
        });

      if (verificationError) {
        console.error('❌ Token verification failed:', verificationError);
        return {
          success: false,
          message: 'Token verification failed due to database error',
        };
      }

      if (!verificationResult || verificationResult.length === 0) {
        return {
          success: false,
          message: 'Invalid or expired verification token',
        };
      }

      const result = verificationResult[0];
      
      if (!result.success) {
        return {
          success: false,
          message: result.message || 'Token verification failed',
        };
      }

      console.log('✅ Email token verified successfully');
      
      return {
        success: true,
        message: result.message || 'Email verification successful! You can now create your account.',
        payment_id: result.payment_id,
        email: result.email,
      };
      
    } catch (error) {
      console.error('❌ Error verifying email token:', error);
      return {
        success: false,
        message: 'Failed to verify email token due to system error',
      };
    }
  }

  /**
   * Send payment failure notification email using REAL email service
   */
  async sendPaymentFailureEmail({ to, firstName, failureReason, retryUrl }: SendFailureEmailParams): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      console.log('📧 Sending payment failure email to:', to);
      
      // Generate failure email template
      const template = this.generatePaymentFailureEmailTemplate(to, firstName, failureReason, retryUrl);
      
      // Send REAL email via Supabase Edge Function
      try {
        const { data, error } = await supabase.functions.invoke('send-email', {
          body: {
            to,
            subject: template.subject,
            html: template.html,
            text: template.text,
            paymentId: null, // No payment ID for failure emails
            verificationToken: null,
          },
        });
        
        if (!error && data?.success) {
          console.log('✅ Payment failure email sent successfully');
          return {
            success: true,
            message: 'Payment failure notification sent successfully',
          };
        } else {
          console.error('❌ Failed to send payment failure email:', error || data);
          return {
            success: false,
            message: `Failed to send failure notification: ${error?.message || data?.error || 'Unknown error'}`,
          };
        }
      } catch (edgeFunctionError) {
        console.error('❌ Edge Function unavailable for failure email:', edgeFunctionError);
        return {
          success: false,
          message: 'Email service unavailable for failure notification',
        };
      }
      
    } catch (error) {
      console.error('❌ Error sending payment failure email:', error);
      return {
        success: false,
        message: 'Failed to send payment failure notification due to system error',
      };
    }
  }

  /**
   * Resend verification email (simplified)
   */
  async resendVerificationEmail(paymentId: string): Promise<{
    success: boolean;
    message: string;
    verificationUrl?: string;
  }> {
    try {
      // Get payment details
      const { data: paymentData, error: paymentError } = await supabase
        .from('user_payments')
        .select('email, payment_status')
        .eq('payment_id', paymentId)
        .single();

      if (paymentError || !paymentData) {
        return {
          success: false,
          message: 'Payment not found',
        };
      }
      
      if (paymentData.payment_status !== 'completed') {
        return {
          success: false,
          message: 'Payment not completed',
        };
      }

      // Generate new verification token
      const newToken = this.generateSecureToken();
      const verificationUrl = `${this.baseUrl}/verify-email?token=${newToken}`;
      
      // Send the email
      const emailResult = await this.sendVerificationEmailSimple(
        paymentData.email,
        paymentId
      );

      return {
        success: emailResult.success,
        message: emailResult.message,
        verificationUrl: emailResult.verificationUrl,
      };

    } catch (error) {
      console.error('Error resending verification email:', error);
      return {
        success: false,
        message: 'Failed to resend verification email',
      };
    }
  }
}

export default new EmailService();