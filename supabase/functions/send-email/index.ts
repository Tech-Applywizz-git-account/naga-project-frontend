// @deno-types="https://deno.land/std@0.168.0/http/server.ts"
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @deno-types="https://esm.sh/@supabase/supabase-js@2"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Enhanced CORS headers for better compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false',
}

serve(async (req) => {
  // Enhanced CORS handling
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    })
  }

  // Health check endpoint
  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'send-email-function'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  // Validate request method
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ 
        error: 'Method not allowed',
        allowed: ['POST', 'OPTIONS', 'GET'],
        received: req.method
      }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  try {
    // Initialize Supabase client with enhanced validation
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    // Enhanced configuration validation
    if (!supabaseUrl) {
      console.error('Missing SUPABASE_URL environment variable')
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error',
          details: 'Missing Supabase URL configuration'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    if (!supabaseKey) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error',
          details: 'Missing Supabase service role key'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey)

    // Enhanced request body parsing with detailed error handling
    let requestBody
    try {
      const bodyText = await req.text()
      if (!bodyText || bodyText.trim() === '') {
        throw new Error('Empty request body')
      }
      requestBody = JSON.parse(bodyText)
    } catch (parseError) {
      console.error('Request body parsing error:', parseError)
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request body',
          details: 'Request body must be valid JSON',
          received_error: parseError.message
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { to, subject, html, text, paymentId, verificationToken } = requestBody

    // Enhanced field validation with specific error messages
    const missingFields: string[] = []
    if (!to) missingFields.push('to (recipient email)')
    if (!subject) missingFields.push('subject')
    if (!html) missingFields.push('html (email content)')
    
    if (missingFields.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          missing_fields: missingFields,
          received_fields: Object.keys(requestBody)
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid email format',
          field: 'to',
          value: to
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // 🚀 STEP 1: Send email FIRST (fail fast strategy)
    console.log('📧 Sending email via SendGrid...')
    const emailResponse = await sendEmailViaSendGrid({
      to,
      subject,
      html,
      text
    })

    if (!emailResponse.success) {
      console.error('❌ Email sending failed:', emailResponse.error)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send email', 
          details: emailResponse.error,
          success: false 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Email sent successfully')

    // 🔐 STEP 2: Store verification token ONLY after successful email
    if (paymentId && verificationToken) {
      console.log('🔐 Storing verification token...')
      try {
        const { error: tokenError } = await supabaseClient
          .from('email_verification_tokens')
          .insert({
            payment_id: paymentId,
            email: to,
            token: verificationToken,
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
            is_used: false
          })

        if (tokenError) {
          console.error('⚠️ Failed to store verification token:', tokenError)
          // Don't fail the entire process - email was sent successfully
          console.log('📧 Email sent but token storage failed - continuing')
        } else {
          console.log('✅ Verification token stored successfully')
        }
      } catch (tokenStoreError) {
        console.error('⚠️ Token storage exception:', tokenStoreError)
        // Continue - email was sent successfully
      }
    }

    // 📝 STEP 3: Log email activity with proper error handling
    try {
      await supabaseClient
        .from('email_logs')
        .insert({
          recipient: to,
          subject: subject,
          email_type: paymentId ? 'verification' : 'notification',
          payment_id: paymentId || null,
          sent_at: new Date().toISOString(),
          status: 'sent',
          message_id: emailResponse.messageId || 'unknown'
        })
      console.log('✅ Email activity logged')
    } catch (logError) {
      console.error('⚠️ Failed to log email activity:', logError)
      // Don't fail - email was sent successfully
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        messageId: emailResponse.messageId || 'unknown'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// 📧 Enhanced email sending with robust error handling and fallback options
async function sendEmailViaSendGrid({ to, subject, html, text }) {
  const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')
  const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@applywizz.com'
  
  // Improved API key validation (less strict for different key formats)
  if (!SENDGRID_API_KEY) {
    console.error('❌ Missing SendGrid API key')
    return { success: false, error: 'SendGrid API key not configured' }
  }
  
  if (SENDGRID_API_KEY.length < 10) {
    console.error('❌ SendGrid API key too short')
    return { success: false, error: 'Invalid SendGrid API key length' }
  }

  // Validate email addresses with better error messages
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(to)) {
    console.error('❌ Invalid recipient email:', to)
    return { success: false, error: `Invalid recipient email format: ${to}` }
  }
  if (!emailRegex.test(FROM_EMAIL)) {
    console.error('❌ Invalid sender email:', FROM_EMAIL)
    return { success: false, error: `Invalid sender email format: ${FROM_EMAIL}` }
  }

  try {
    console.log(`📤 Attempting to send email to: ${to}`)
    console.log(`📧 Using sender: ${FROM_EMAIL}`)
    
    // Enhanced request with timeout and better headers
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
    
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Supabase-Edge-Function/1.0',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: to }],
            subject: subject,
          },
        ],
        from: {
          email: FROM_EMAIL,
          name: 'ApplyWizz H1B Database'
        },
        content: [
          {
            type: 'text/plain',
            value: text || 'Please enable HTML to view this email.',
          },
          {
            type: 'text/html',
            value: html,
          },
        ],
        tracking_settings: {
          click_tracking: { enable: false },
          open_tracking: { enable: false }
        },
        // Add reply-to for better deliverability
        reply_to: {
          email: FROM_EMAIL,
          name: 'ApplyWizz Support'
        }
      }),
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)

    // Enhanced response handling
    let responseText = ''
    try {
      responseText = await response.text()
    } catch (textError) {
      console.warn('Failed to read response text:', textError)
    }
    
    console.log(`📬 SendGrid response status: ${response.status}`)
    if (responseText) {
      console.log(`📬 SendGrid response: ${responseText.substring(0, 200)}...`)
    }

    if (response.ok) {
      const messageId = response.headers.get('x-message-id') || 
                       response.headers.get('X-Message-Id') ||
                       `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      console.log(`✅ Email sent successfully with ID: ${messageId}`)
      return { 
        success: true, 
        messageId: messageId,
        status: response.status
      }
    } else {
      console.error(`❌ SendGrid error ${response.status}:`, responseText)
      
      // Enhanced error parsing with fallbacks
      let errorDetail = `SendGrid HTTP ${response.status}`
      try {
        if (responseText) {
          const errorData = JSON.parse(responseText)
          if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
            errorDetail = errorData.errors[0].message || errorDetail
          } else if (errorData.message) {
            errorDetail = errorData.message
          }
        }
      } catch (parseError) {
        console.warn('Failed to parse SendGrid error response:', parseError)
        errorDetail = `${errorDetail}: ${responseText.substring(0, 100)}`
      }
      
      return { 
        success: false, 
        error: errorDetail,
        status: response.status,
        raw_response: responseText
      }
    }
  } catch (error) {
    console.error(`❌ Network/timeout error sending email:`, error)
    
    // Enhanced error classification
    let errorMessage = 'Unknown network error'
    if (error.name === 'AbortError') {
      errorMessage = 'Email sending timeout (30 seconds exceeded)'
    } else if (error.message) {
      errorMessage = error.message
    }
    
    return { 
      success: false, 
      error: `Network error: ${errorMessage}`,
      error_type: error.name || 'NetworkError'
    }
  }
}

/* 
🚀 DEPLOYMENT INSTRUCTIONS:

1. Create this file in Supabase Edge Functions:
   supabase/functions/send-email/index.ts

2. Set environment variables in Supabase:
   - SENDGRID_API_KEY=your_sendgrid_api_key
   - FROM_EMAIL=noreply@yourdomain.com

3. Deploy the function:
   supabase functions deploy send-email

4. Update your emailService.ts to use this real endpoint
*/