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

    // Verifica autenticazione tramite JWT dell'utente loggato (Authorization header)
    const authHeader = req.headers.get('authorization') || ''
    const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/i)
    if (!tokenMatch) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const accessToken = tokenMatch[1]
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(accessToken)
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: 'Utente non autenticato' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verifica ruolo admin tramite profilo custom
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, is_active')
      .eq('email', userData.user.email)
      .maybeSingle()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Profilo non trovato' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    // Azzeramento massivo dei campi promo su tutti i prodotti che hanno almeno un campo promo valorizzato.
    // Equivalente SQL:
    //   UPDATE public.products
    //   SET "promoDAL" = NULL, "promoAL" = NULL, "promoPrezzo" = NULL
    //   WHERE "promoDAL" IS NOT NULL OR "promoAL" IS NOT NULL OR "promoPrezzo" IS NOT NULL;
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('products')
      .update({
        promoDAL: null,
        promoAL: null,
        promoPrezzo: null,
        updated_at: new Date().toISOString(),
      })
      .or('promoDAL.not.is.null,promoAL.not.is.null,promoPrezzo.not.is.null')
      .select('id')

    if (updateError) {
      return new Response(
        JSON.stringify({ error: updateError.message, details: updateError }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ updated_count: updated?.length ?? 0 }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})