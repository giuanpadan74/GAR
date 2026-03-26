import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tctndvmemnllloctyrpn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjdG5kdm1lbW5sbGxvY3R5cnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3Njk0NzEsImV4cCI6MjA3NTM0NTQ3MX0._UkcN1RRxVS2uW2jVjJNtfHMyNYA-NPnT-8njsRqQr0'
);

async function analyzeRecordRelationships() {
  console.log('=== ANALISI RELAZIONI TRA RECORD ===');
  
  // Prendi un record Roloil e vedi come sono collegati gli altri record
  const { data: roloilRecords, error: roloilError } = await supabase
    .from('correspondences')
    .select('*')
    .eq('brand', 'Roloil')
    .limit(3);
    
  if (roloilRecords && roloilRecords.length > 0) {
    console.log('\n=== RECORD ROLOIL ===');
    roloilRecords.forEach(record => {
      console.log(`Roloil: ${record.product} (${record.sae}) - Type: ${record.type}`);
    });
    
    // Per ogni record Roloil, trova le corrispondenze
    for (const roloilRecord of roloilRecords) {
      console.log(`\n--- Corrispondenze per ${roloilRecord.product} ---`);
      
      const { data: corrispondenze, error: corrError } = await supabase
        .from('correspondences')
        .select('*')
        .neq('brand', 'Roloil')
        .eq('sae', roloilRecord.sae)
        .eq('type', roloilRecord.type);
        
      if (corrispondenze && corrispondenze.length > 0) {
        console.log(`Trovate ${corrispondenze.length} corrispondenze:`);
        corrispondenze.forEach(corr => {
          console.log(`  - ${corr.brand}: ${corr.product} (Q8: ${corr.q8})`);
        });
      } else {
        console.log('Nessuna corrispondenza trovata');
      }
    }
  }
  
  // Verifica se c'è un pattern per collegare i record
  console.log('\n=== VERIFICA PATTERN DI COLLEGAMENTO ===');
  
  // Controlla se i record condividono lo stesso SAE e Type
  const { data: groupedBySaeType, error: groupError } = await supabase
    .from('correspondences')
    .select('*')
    .order('sae')
    .order('type')
    .order('brand');
    
  if (groupedBySaeType) {
    const groups = {};
    groupedBySaeType.forEach(record => {
      const key = `${record.sae}-${record.type}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(record);
    });
    
    console.log('\nGruppi per SAE-Type (primi 5):');
    Object.entries(groups).slice(0, 5).forEach(([key, records]) => {
      console.log(`${key}: ${records.length} record`);
      const roloilRecord = records.find(r => r.brand === 'Roloil');
      if (roloilRecord) {
        console.log(`  Roloil: ${roloilRecord.product}`);
        const otherBrands = records.filter(r => r.brand !== 'Roloil');
        otherBrands.forEach(brand => {
          console.log(`  ${brand.brand}: ${brand.product}`);
        });
      }
    });
  }
}

analyzeRecordRelationships().catch(console.error);