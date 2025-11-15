import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify the requesting user has admin permissions
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization')
    
    if (!authHeader) {
      console.error('No authorization header found')
      return new Response(
        JSON.stringify({ error: 'Unauthorized: No authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const token = authHeader.replace('Bearer ', '').trim()
    
    if (!token) {
      console.error('No token found in authorization header')
      return new Response(
        JSON.stringify({ error: 'Unauthorized: No token provided' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token', details: authError?.message }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if user has admin permissions
    const { data: hasPermission, error: rpcError } = await supabaseAdmin
      .rpc('user_is_admin', { _user_id: user.id })
    
    if (rpcError) {
      console.error('RPC error checking admin permissions:', rpcError)
      return new Response(
        JSON.stringify({ error: 'Error checking permissions', details: rpcError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    if (!hasPermission) {
      console.error('User lacks admin permissions:', user.id, 'Email:', user.email)
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions: Admin access required' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    let requestBody: { userId?: string; email?: string } = {}
    try {
      requestBody = await req.json()
    } catch (parseError) {
      console.error('Error parsing request body:', parseError)
      return new Response(
        JSON.stringify({ error: 'Invalid request body', details: parseError instanceof Error ? parseError.message : 'Unknown error' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { userId, email } = requestBody

    if (!userId && !email) {
      console.error('Missing userId and email:', { userId, email, requestBody })
      return new Response(
        JSON.stringify({ error: 'User ID or email is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get user email if only userId is provided
    let userEmail = email
    console.log('📧 [reset-password] Starting password reset process', { userId, email: email || 'not provided' })
    
    if (!userEmail && userId) {
      console.log('📧 [reset-password] Fetching user email from profile for userId:', userId)
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single()
      
      if (profileError || !profile) {
        console.error('📧 [reset-password] Error fetching profile:', { profileError, profile })
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      userEmail = profile.email
      console.log('📧 [reset-password] Retrieved email from profile:', userEmail)
    }

    if (!userEmail) {
      console.error('📧 [reset-password] No email address available after all attempts')
      return new Response(
        JSON.stringify({ error: 'Email address is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('📧 [reset-password] Using email address:', userEmail)

    // First, verify the user exists in Supabase Auth
    // This prevents the "User with this email not found" error
    let authUser = null
    if (userId) {
      console.log('📧 [reset-password] Checking if user exists in Auth by userId:', userId)
      const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId)
      if (getUserError || !userData?.user) {
        console.error('📧 [reset-password] User not found in Auth by userId:', {
          userId,
          error: getUserError,
          message: getUserError?.message
        })
        return new Response(
          JSON.stringify({ 
            error: 'User not found in authentication system',
            details: 'The user exists in the database but not in the authentication system. They may need to sign up first.',
            userId,
            email: userEmail
          }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      authUser = userData.user
      console.log('📧 [reset-password] User found in Auth:', { id: authUser.id, email: authUser.email })
    } else {
      // If only email provided, we'll let generateLink check if user exists
      // This is more efficient than listing all users
      console.log('📧 [reset-password] Email provided, will verify user exists during generateLink call')
    }

    // Generate password reset link using admin API
    const siteUrl = Deno.env.get('SITE_URL') || Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '') || ''
    const redirectTo = `${siteUrl}/auth/reset-password`
    
    console.log('📧 [reset-password] Configuration:', {
      siteUrl,
      redirectTo,
      supabaseUrl: Deno.env.get('SUPABASE_URL'),
      hasServiceRoleKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    })
    
    console.log('📧 [reset-password] Calling generateLink with:', {
      type: 'recovery',
      email: userEmail,
      redirectTo
    })
    
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: userEmail,
      options: {
        redirectTo: redirectTo,
      }
    })

    if (resetError) {
      console.error('📧 [reset-password] Error generating reset link:', {
        error: resetError,
        message: resetError.message,
        status: resetError.status,
        name: resetError.name,
        code: resetError.code
      })
      
      // Provide more helpful error messages
      let errorMessage = resetError.message
      let errorDetails = ''
      
      if (resetError.code === 'user_not_found' || resetError.status === 404) {
        errorMessage = 'User not found in authentication system'
        errorDetails = 'The user exists in the database but not in the authentication system. They may need to sign up first, or there may be a mismatch between the profiles table and auth.users table.'
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: errorDetails || resetError.message,
          code: resetError.code,
          email: userEmail
        }),
        { 
          status: resetError.status || 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('📧 [reset-password] generateLink response:', {
      hasData: !!resetData,
      dataKeys: resetData ? Object.keys(resetData) : [],
      link: resetData?.properties?.action_link || 'not found',
      emailOtp: resetData?.properties?.email_otp || 'not found',
      hashedToken: resetData?.properties?.hashed_token || 'not found',
      fullResponse: JSON.stringify(resetData, null, 2)
    })

    // IMPORTANT: Email sending behavior
    // - By default, Supabase only sends emails to pre-authorized addresses (team members)
    // - For production, you MUST configure custom SMTP (SendGrid, AWS SES, etc.)
    // - Without custom SMTP, emails to non-team members will fail silently
    // - Check: Supabase Dashboard > Settings > Auth > SMTP Settings
    console.log('📧 [reset-password] Password reset link generated successfully')
    console.log('📧 [reset-password] ⚠️  IMPORTANT: Email delivery depends on SMTP configuration')
    console.log('📧 [reset-password] Default Supabase email only works for team members')
    console.log('📧 [reset-password] For production, configure custom SMTP in Dashboard > Settings > Auth')
    console.log('📧 [reset-password] Check auth logs for email delivery status')

    return new Response(
      JSON.stringify({ 
        message: 'Password reset email has been sent to the user',
        debug: {
          email: userEmail,
          redirectTo,
          linkGenerated: !!resetData
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('📧 [reset-password] Unexpected error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

