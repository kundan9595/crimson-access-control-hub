
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
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if user has admin permissions
    const { data: hasPermission } = await supabaseAdmin
      .rpc('user_is_admin', { _user_id: user.id })
    
    if (!hasPermission) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const { 
      firstName, 
      lastName, 
      email, 
      phoneNumber, 
      department, 
      designation, 
      selectedRoles 
    } = await req.json()

    // Create user with admin client
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      }
    })

    if (createError) {
      console.error('Error creating user:', createError)
      return new Response(
        JSON.stringify({ error: createError.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!newUser.user) {
      return new Response(
        JSON.stringify({ error: 'Failed to create user' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create profile entry
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUser.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber || null,
        department: department || null,
        designation: designation || null,
      })
      .select()
      .single()
    
    if (profileError) {
      console.error('Error creating profile:', profileError)
      return new Response(
        JSON.stringify({ error: profileError.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    // Assign roles to the user
    if (selectedRoles && selectedRoles.length > 0) {
      const userRoles = selectedRoles.map((roleId: string) => ({
        user_id: newUser.user.id,
        role_id: roleId,
        assigned_by: user.id,
      }))

      const { error: rolesError } = await supabaseAdmin
        .from('user_roles')
        .insert(userRoles)
      
      if (rolesError) {
        console.error('Error assigning roles:', rolesError)
        return new Response(
          JSON.stringify({ error: rolesError.message }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }
    
    return new Response(
      JSON.stringify({ 
        user: newUser.user, 
        profile,
        message: 'User created successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
