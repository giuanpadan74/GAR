
// @ts-ignore
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, prefer',
}

// @ts-ignore
Deno.serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        console.log('🔧 Inizializzazione Edge Function admin-create-user')
        
        // 1. Initialize Supabase Admin Client
        const supabaseAdmin = createClient(
            // @ts-ignore
            Deno.env.get('SUPABASE_URL') ?? '',
            // @ts-ignore
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // 2. Authorization: Verify the caller is an authenticated admin
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            console.error('❌ Missing Authorization header')
            return new Response(
                JSON.stringify({ error: 'Missing Authorization header' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const token = authHeader.replace('Bearer ', '')
        console.log('🔐 Verifica token utente...')
        
        const { data: { user: caller }, error: userError } = await supabaseAdmin.auth.getUser(token)

        if (userError) {
            console.error('❌ Errore verifica token:', userError)
            return new Response(
                JSON.stringify({ error: 'Invalid token', details: userError.message }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (!caller) {
            console.error('❌ Nessun utente trovato per il token')
            return new Response(
                JSON.stringify({ error: 'User not found' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        console.log('👤 Utente autenticato:', caller.id)

        // Check if caller has admin role in profiles
        console.log('🔍 Verifica ruolo admin...')
        const { data: callerProfile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', caller.id)
            .single()

        if (profileError) {
            console.error('❌ Errore recupero profilo:', profileError)
            return new Response(
                JSON.stringify({ error: 'Failed to verify admin role', details: profileError.message }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (!callerProfile) {
            console.error('❌ Profilo non trovato per utente:', caller.id)
            return new Response(
                JSON.stringify({ error: 'Profile not found' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (callerProfile.role !== 'admin') {
            console.error('❌ Utente non è admin:', callerProfile.role)
            return new Response(
                JSON.stringify({ error: 'Forbidden: Admin access required', userRole: callerProfile.role }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        console.log('✅ Utente è admin, procedo con creazione utente')

        // 3. Parse Request Body
        console.log('📝 Parsing request body...')
        const {
            email,
            password,
            username,
            full_name,
            phone_number,
            role,
            territories
        } = await req.json()

        console.log('📋 Dati ricevuti:', { email, username, full_name, role })

        if (!email || !password || !username || !full_name || !role) {
            console.error('❌ Campi mancanti:', { email: !!email, password: !!password, username: !!username, full_name: !!full_name, role: !!role })
            return new Response(
                JSON.stringify({ error: 'Missing required fields' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 3.5 Check if user already exists
        console.log('🔍 Verifica se utente esiste già...')
        const { data: existingProfile } = await supabaseAdmin
            .from('profiles')
            .select('email, username')
            .or(`email.eq.${email},username.eq.${username}`)
            .maybeSingle()

        if (existingProfile) {
            console.error('❌ Utente già esistente')
            const field = existingProfile.email === email ? 'email' : 'username'
            return new Response(
                JSON.stringify({ error: `Utente già esistente con questa ${field}` }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        console.log('✅ Utente non esistente, procedo con creazione')

        // 4. Create Auth User
        const profileColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
        
        console.log('👤 Creazione utente auth...')
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                username,
                full_name,
                phone_number: phone_number || '',
                role,
                color: profileColor,
                is_active: true
            }
        })

        if (authError) {
            console.error('❌ Errore creazione auth user:', authError)
            return new Response(
                JSON.stringify({ error: authError.message }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const newUser = authData.user
        if (!newUser) {
            console.error('❌ Auth user creato ma vuoto')
            return new Response(
                JSON.stringify({ error: 'User creation failed without error message' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        console.log('✅ Auth user creato:', newUser.id)

        // 5. Create Profile Record
        console.log('📝 Creazione profilo...')
        const { data: newProfile, error: insertError } = await supabaseAdmin
            .from('profiles')
            .insert({
                id: newUser.id,
                email,
                username,
                full_name,
                phone_number: phone_number || null,
                role,
                color: profileColor,
                is_active: true
            })
            .select()
            .single()

        if (insertError) {
            console.error('❌ Errore creazione profilo:', insertError)
            console.log('🔄 Rollback: eliminazione auth user...')
            await supabaseAdmin.auth.admin.deleteUser(newUser.id)
            return new Response(
                JSON.stringify({ error: 'Failed to create profile: ' + insertError.message }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        console.log('✅ Profilo creato')

        // 6. Assign Territories (if any)
        if (territories && Array.isArray(territories) && territories.length > 0) {
            console.log('🗺️ Assegnazione territori:', territories.length)
            const territoryInserts = territories.map((code: string) => ({
                user_id: newUser.id,
                municipality_code: parseInt(code)
            }))

            const { error: territoryError } = await supabaseAdmin
                .from('user_municipalities')
                .insert(territoryInserts)

            if (territoryError) {
                console.error('⚠️ Errore assegnazione territori:', territoryError)
            } else {
                console.log('✅ Territori assegnati')
            }
        }

        // 7. Return Success
        console.log('🎉 Creazione utente completata con successo')
        return new Response(
            JSON.stringify({ user: newUser, profile: newProfile }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (err) {
        console.error('💥 Errore non gestito:', err)
        return new Response(
            JSON.stringify({ error: err.message || 'Unknown error', stack: err.stack }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
