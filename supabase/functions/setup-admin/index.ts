import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
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

    // Check if admin already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', 'btc123')
      .single()

    if (existingProfile) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Admin user already exists',
          username: 'btc123'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create admin user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: 'btc123@platform.local',
      password: '@Vip1u2',
      email_confirm: true,
      user_metadata: {
        username: 'btc123'
      }
    })

    if (authError) {
      console.error('Auth error:', authError)
      throw authError
    }

    if (!authData.user) {
      throw new Error('Failed to create user')
    }

    console.log('User created:', authData.user.id)

    // Add admin role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: 'admin'
      })

    if (roleError) {
      console.error('Role error:', roleError)
      throw roleError
    }

    console.log('Admin role assigned')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Admin user created successfully',
        username: 'btc123',
        password: '@Vip1u2'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in setup-admin:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})