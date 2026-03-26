import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tctndvmemnllloctyrpn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjdG5kdm1lbW5sbGxvY3R5cnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3Njk0NzEsImV4cCI6MjA3NTM0NTQ3MX0._UkcN1RRxVS2uW2jVjJNtfHMyNYA-NPnT-8njsRqQr0'
);

async function checkDatabaseStructure() {
  console.log('=== VERIFICA STRUTTURA DATABASE ===');
  
  // Verifica la struttura della tabella
  const { data: tableInfo, error: tableError } = await supabase
    .from('correspondences')
    .select('*')
    .limit(1);
    
  if (tableInfo && tableInfo.length > 0) {
    console.log('Struttura record:');
    console.log(JSON.stringify(tableInfo[0], null, 2));
    
    // Verifica se esiste roloil come colonna
    const firstRecord = tableInfo[0];
    console.log('\nCampi disponibili:', Object.keys(firstRecord));
    console.log('Esiste colonna roloil:', 'roloil' in firstRecord);
  }
  
  // Verifica record Roloil
  const { data: roloilRecords, error: roloilError } = await supabase
    .from('correspondences')
    .select('*')
    .eq('brand', 'Roloil')
    .limit(3);
    
  console.log('\n=== RECORD CON BRAND ROLOIL ===');
  if (roloilRecords && roloilRecords.length > 0) {
    console.log(`Trovati ${roloilRecords.length} record Roloil:`);
    roloilRecords.forEach(record => {
      console.log(`- ID: ${record.id}`);
      console.log(`  Brand: ${record.brand}`);
      console.log(`  Product: ${record.product}`);
      console.log(`  SAE: ${record.sae}`);
      console.log(`  Type: ${record.type}`);
      console.log(`  Q8: ${record.q8}`);
      console.log('');
    });
  } else {
    console.log('Nessun record con brand Roloil trovato');
  }
  
  // Verifica totali per brand
  const { data: brandCounts, error: countError } = await supabase
    .from('correspondences')
    .select('brand', { count: 'exact' });
    
  if (brandCounts) {
    const counts = {};
    brandCounts.forEach(record => {
      counts[record.brand] = (counts[record.brand] || 0) + 1;
    });
    
    console.log('=== DISTRIBUZIONE PER BRAND ===');
    Object.entries(counts).forEach(([brand, count]) => {
      console.log(`${brand}: ${count} record`);
    });
  }
}

checkDatabaseStructure().catch(console.error);