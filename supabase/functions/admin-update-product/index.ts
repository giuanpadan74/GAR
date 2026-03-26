
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, prefer',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const body = await req.json()
    const email = String(body?.email || '').trim().toLowerCase()
    const password = String(body?.password || '')
    const productId = String(body?.productId || '').trim()
    const updates = body?.updates

    if (!email || !password || !productId || !updates || typeof updates !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: profile, error: loginError } = await supabaseAdmin
      .rpc('login_profile', { p_email: email, p_password: password })
      .maybeSingle()

    if (loginError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Email o password non corretti' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!profile.is_active) {
      return new Response(
        JSON.stringify({ error: 'Account disattivato' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const allowedFields = new Set([
      'aplibint',
      'apcpro',
      'apcimb',
      'brand',
      'descrizione',
      'apdesi',
      'appesf',
      'apunmi',
      'xde40',
      'xde60',
      'apprli',
      'aplib1',
      'aplib7',
      'CONOU',
      'promoDAL',
      'promoAL',
      'promoPrezzo',
      'is_active',
      'obsoleto',
    ])

    const filteredUpdates: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.has(key)) {
        filteredUpdates[key] = value
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid fields to update' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const promoDAL = filteredUpdates.promoDAL
    const promoAL = filteredUpdates.promoAL
    if (typeof promoDAL === 'string' && typeof promoAL === 'string') {
      const startDate = new Date(promoDAL)
      const endDate = new Date(promoAL)
      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        return new Response(
          JSON.stringify({ error: 'Date promo non valide' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      if (startDate >= endDate) {
        return new Response(
          JSON.stringify({ error: 'La data di inizio promo deve essere precedente alla data di fine' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    if (typeof filteredUpdates.apprli === 'number' && (filteredUpdates.apprli <= 0 || filteredUpdates.apprli > 999999)) {
      return new Response(
        JSON.stringify({ error: 'Il prezzo deve essere compreso tra 0.01 e 999999' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (typeof filteredUpdates.appesf === 'number' && (filteredUpdates.appesf <= 0 || filteredUpdates.appesf > 9999)) {
      return new Response(
        JSON.stringify({ error: 'Il peso specifico deve essere compreso tra 0.01 e 9999' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (typeof filteredUpdates.CONOU === 'number' && (filteredUpdates.CONOU < 0 || filteredUpdates.CONOU > 999)) {
      return new Response(
        JSON.stringify({ error: 'La tassa CONOU deve essere compresa tra 0 e 999' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (typeof filteredUpdates.promoPrezzo === 'number' && filteredUpdates.promoPrezzo <= 0) {
      return new Response(
        JSON.stringify({ error: 'Il prezzo promo deve essere maggiore di 0' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('products')
      .update({
        ...filteredUpdates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId)
      .select(`
        *,
        minimo_agente,
        minima_provvigione,
        imponibile,
        provv
      `)
      .single()

    if (updateError) {
      return new Response(
        JSON.stringify({ error: updateError.message, details: updateError }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ product: updated }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
