import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tctndvmemnllloctyrpn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjdG5kdm1lbW5sbGxvY3R5cnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3Njk0NzEsImV4cCI6MjA3NTM0NTQ3MX0._UkcN1RRxVS2uW2jVjJNtfHMyNYA-NPnT-8njsRqQr0'
);

async function checkQ8Data() {
  console.log('=== VERIFICA DATI Q8 NEL DATABASE ===');
  
  // Cerca il prodotto specifico dell'immagine
  const { data: variaxData, error: variaxError } = await supabase
    .from('correspondences')
    .select('*')
    .eq('roloil', 'VARIAX 140');
    
  console.log('Dati per VARIAX 140:');
  console.log(JSON.stringify(variaxData, null, 2));
  
  if (variaxError) {
    console.log('Errore nel recupero VARIAX 140:', variaxError);
  }
  
  // Conta tutti i record Q8
  const { data: allQ8, error: q8Error } = await supabase
    .from('correspondences')
    .select('*')
    .not('q8', 'is', null)
    .not('q8', 'eq', '');
    
  console.log('\nTotale record con corrispondenza Q8:', allQ8 ? allQ8.length : 0);
  
  if (allQ8 && allQ8.length > 0) {
    console.log('Esempi di corrispondenze Q8:');
    allQ8.slice(0, 5).forEach(record => {
      console.log(`- ${record.roloil} -> Q8: ${record.q8}`);
    });
  }
  
  // Verifica anche i brand disponibili
  const { data: brands, error: brandError } = await supabase
    .from('correspondences')
    .select('brand')
    .order('brand');
    
  const uniqueBrands = brands ? [...new Set(brands.map(b => b.brand))] : [];
  console.log('\nBrand disponibili:', uniqueBrands.join(', '));
  
  // Verifica se esistono record con brand Q8
  const { data: q8BrandData, error: q8BrandError } = await supabase
    .from('correspondences')
    .select('*')
    .eq('brand', 'Q8');
    
  console.log('\nRecord con brand Q8:', q8BrandData ? q8BrandData.length : 0);
  if (q8BrandData && q8BrandData.length > 0) {
    console.log('Esempi record Q8 brand:');
    q8BrandData.slice(0, 3).forEach(record => {
      console.log(`- ${record.product} (${record.sae}) -> Roloil: ${record.roloil}`);
    });
  }
}

checkQ8Data().catch(console.error);