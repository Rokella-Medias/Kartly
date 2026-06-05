import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Verify requesting user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user: requestingUser }, error: userError } = await userClient.auth.getUser()
    if (userError || !requestingUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check admin role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)
    const { data: roleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch all auth users using admin API
    const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers({
      perPage: 1000,
    })

    if (listError) {
      return new Response(JSON.stringify({ error: listError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch all roles
    const { data: allRoles } = await adminClient
      .from('user_roles')
      .select('user_id, role')

    const roleMap: Record<string, string[]> = {}
    ;(allRoles || []).forEach((r: any) => {
      if (!roleMap[r.user_id]) roleMap[r.user_id] = []
      roleMap[r.user_id].push(r.role)
    })

    // Fetch profiles
    const { data: profiles } = await adminClient
      .from('profiles')
      .select('user_id, full_name, business_name')

    const profileMap: Record<string, any> = {}
    ;(profiles || []).forEach((p: any) => {
      profileMap[p.user_id] = p
    })

    // Fetch order stats
    const { data: orders } = await adminClient
      .from('orders')
      .select('user_id, total_amount')

    const orderStats: Record<string, { count: number; revenue: number }> = {}
    ;(orders || []).forEach((o: any) => {
      if (!orderStats[o.user_id]) orderStats[o.user_id] = { count: 0, revenue: 0 }
      orderStats[o.user_id].count++
      orderStats[o.user_id].revenue += Number(o.total_amount)
    })

    // Fetch upload counts
    const { data: uploads } = await adminClient
      .from('csv_uploads')
      .select('user_id')

    const uploadCounts: Record<string, number> = {}
    ;(uploads || []).forEach((u: any) => {
      uploadCounts[u.user_id] = (uploadCounts[u.user_id] || 0) + 1
    })

    // Combine all data
    const enrichedUsers = users.map((u: any) => ({
      id: u.id,
      email: u.email,
      email_confirmed: !!u.email_confirmed_at,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      full_name: profileMap[u.id]?.full_name || null,
      business_name: profileMap[u.id]?.business_name || null,
      roles: roleMap[u.id] || ['user'],
      order_count: orderStats[u.id]?.count || 0,
      total_revenue: orderStats[u.id]?.revenue || 0,
      upload_count: uploadCounts[u.id] || 0,
    }))

    return new Response(JSON.stringify({ users: enrichedUsers }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
