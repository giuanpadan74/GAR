import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tctndvmemnllloctyrpn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjdG5kdm1lbW5sbGxvY3R5cnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3Njk0NzEsImV4cCI6MjA3NTM0NTQ3MX0._UkcN1RRxVS2uW2jVjJNtfHMyNYA-NPnT-8njsRqQr0'
);

async function testQ8Fix() {
  console.log('=== VERIFICA FIX Q8 ===');
  
  try {
    // Test 1: Verifica che ci siano dati Q8
    console.log('\n1. Verifica dati Q8 nel database:');
    const { data: q8Records, error: q8Error } = await supabase
      .from('correspondences')
      .select('*')
      .not('q8', 'is', null)
      .not('q8', 'eq', '')
      .not('q8', 'eq', '------')
      .limit(5);
    
    console.log(`Record con Q8 validi: ${q8Records ? q8Records.length : 0}`);
    if (q8Records && q8Records.length > 0) {
      console.log('Esempi:');
      q8Records.forEach(record => {
        console.log(`- ${record.roloil} (${record.sae}) -> Q8: ${record.q8}`);
      });
    }
    
    // Test 2: Verifica VARIAX 140 specifico
    console.log('\n2. Verifica VARIAX 140:');
    const { data: variaxRecords } = await supabase
      .from('correspondences')
      .select('*')
      .eq('roloil', 'VARIAX 140');
    
    if (variaxRecords && variaxRecords.length > 0) {
      console.log(`Trovati ${variaxRecords.length} record per VARIAX 140:`);
      variaxRecords.forEach(record => {
        console.log(`- Brand: ${record.brand}, Q8: ${record.q8}`);
      });
    }
    
    // Test 3: Verifica struttura tabella incrociata
    console.log('\n3. Test trasformazione in tabella incrociata:');
    
    // Prendi tutti i dati
    const { data: allRecords } = await supabase
      .from('correspondences')
      .select('*')
      .limit(10);
    
    if (allRecords) {
      const crossMap = new Map();
      
      allRecords.forEach(record => {
        const key = `${record.roloil}-${record.sae}-${record.type}`;
        
        if (!crossMap.has(key)) {
          crossMap.set(key, {
            roloil: record.roloil,
            type: record.type,
            sae: record.sae
          });
        }
        
        const entry = crossMap.get(key);
        entry[record.brand] = record.product;
        
        // Aggiungi Q8 se presente
        if (record.q8 && record.q8 !== '------') {
          entry['Q8'] = record.q8;
        }
      });
      
      const crossTable = Array.from(crossMap.values());
      console.log(`Righe tabella incrociata: ${crossTable.length}`);
      
      // Mostra una riga con Q8
      const rowWithQ8 = crossTable.find(row => row['Q8']);
      if (rowWithQ8) {
        console.log('Esempio riga con Q8:', rowWithQ8);
      }
    }
    
    console.log('\n=== VERIFICA COMPLETATA ===');
    
  } catch (error) {
    console.error('Errore:', error);
  }
}

testQ8Fix().catch(console.error);