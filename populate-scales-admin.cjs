const { createClient } = require('@supabase/supabase-js');

// Leggi le variabili d'ambiente
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variabili d\'ambiente Supabase mancanti');
  process.exit(1);
}

// Usa service role per bypassare RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function populateScalesWithAdmin() {
  console.log('🔍 Popolamento tabella scales con privilegi admin...\n');

  try {
    // 1. Verifica tabella scales
    console.log('1️⃣ Verifica tabella scales...');
    const { data: allScales, error: scalesError } = await supabase
      .from('scales')
      .select('*')
      .limit(10);

    if (scalesError) {
      console.error('❌ Errore nel recupero della tabella scales:', scalesError);
      return;
    }

    console.log(`📊 Record trovati nella tabella scales: ${allScales.length}`);
    if (allScales.length > 0) {
      console.table(allScales);
      console.log('✅ Tabella già popolata, nessuna azione necessaria');
      return;
    }

    // 2. Popola con dati standard
    console.log('\n2️⃣ Popolamento con dati standard...');
    
    const standardScales = [
      // Scala A - 8% provvigione minima
      { Scala: 'A', Provv: 0.08, Sconto: 0, minprov: true },
      { Scala: 'A', Provv: 0.10, Sconto: 0.05, minprov: false },
      { Scala: 'A', Provv: 0.12, Sconto: 0.10, minprov: false },
      
      // Scala B - 5% provvigione minima  
      { Scala: 'B', Provv: 0.05, Sconto: 0, minprov: true },
      { Scala: 'B', Provv: 0.07, Sconto: 0.05, minprov: false },
      { Scala: 'B', Provv: 0.09, Sconto: 0.10, minprov: false },
      
      // Scala C - 4% provvigione minima (come da esempio utente)
      { Scala: 'C', Provv: 0.04, Sconto: 0, minprov: true },
      { Scala: 'C', Provv: 0.06, Sconto: 0.05, minprov: false },
      { Scala: 'C', Provv: 0.08, Sconto: 0.10, minprov: false },
      
      // Scala D - 6% provvigione minima
      { Scala: 'D', Provv: 0.06, Sconto: 0, minprov: true },
      { Scala: 'D', Provv: 0.08, Sconto: 0.05, minprov: false },
      { Scala: 'D', Provv: 0.10, Sconto: 0.10, minprov: false },
      
      // Scala E - 3% provvigione minima
      { Scala: 'E', Provv: 0.03, Sconto: 0, minprov: true },
      { Scala: 'E', Provv: 0.05, Sconto: 0.05, minprov: false },
      { Scala: 'E', Provv: 0.07, Sconto: 0.10, minprov: false },
      
      // Scala P - 2% provvigione minima
      { Scala: 'P', Provv: 0.02, Sconto: 0, minprov: true },
      { Scala: 'P', Provv: 0.04, Sconto: 0.05, minprov: false },
      { Scala: 'P', Provv: 0.06, Sconto: 0.10, minprov: false }
    ];

    const { data: insertedScales, error: insertError } = await supabase
      .from('scales')
      .insert(standardScales)
      .select();

    if (insertError) {
      console.error('❌ Errore nell\'inserimento delle scale:', insertError);
      return;
    }

    console.log(`✅ Inserite ${insertedScales.length} scale nella tabella`);
    
    // 3. Mostra le scale con provvigione minima
    console.log('\n3️⃣ Scale con provvigione minima inserite:');
    const minProvScales = insertedScales.filter(s => s.minprov === true);
    console.table(minProvScales);

    // 4. Forza il ricalcolo dei prodotti
    console.log('\n4️⃣ Forzatura ricalcolo prodotti...');
    const { error: updateError } = await supabase
      .from('products')
      .update({ updated_at: new Date().toISOString() })
      .not('apprli', 'is', null);

    if (updateError) {
      console.error('❌ Errore nel forzare il ricalcolo:', updateError);
    } else {
      console.log('✅ Forzato il ricalcolo dei prodotti');
    }

    console.log('\n✅ Popolamento completato!');
    console.log('\n📋 Riepilogo scale con provvigione minima:');
    minProvScales.forEach(scale => {
      const percentage = (scale.Provv * 100).toFixed(0) + '%';
      console.log(`- Scala ${scale.Scala}: ${percentage}`);
    });

  } catch (error) {
    console.error('❌ Errore generale:', error);
  }
}

// Esegui lo script
populateScalesWithAdmin();