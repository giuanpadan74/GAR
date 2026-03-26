// Script di test per verificare il numero di record nella tabella correspondences
import { getSupabaseClient } from './src/lib/supabase.ts';

async function testCorrispondenze() {
  console.log('Test recupero corrispondenze...');
  
  const supabase = getSupabaseClient();
  
  // Test 1: Query senza range (default Supabase)
  console.log('\n1. Query senza range:');
  const { data: dataNoRange, error: errorNoRange, count: countNoRange } = await supabase
    .from('correspondences')
    .select('*', { count: 'exact' });
  
  console.log(`Record recuperati (senza range): ${dataNoRange?.length || 0}`);
  if (countNoRange) console.log(`Count exact: ${countNoRange}`);
  
  // Test 2: Query con range largo
  console.log('\n2. Query con range 0-9999:');
  const { data: dataRange9999, error: errorRange9999 } = await supabase
    .from('correspondences')
    .select('*')
    .range(0, 9999);
  
  console.log(`Record recuperati (range 0-9999): ${dataRange9999?.length || 0}`);
  
  // Test 3: Query con range molto largo
  console.log('\n3. Query con range 0-999999:');
  const { data: dataRange999999, error: errorRange999999 } = await supabase
    .from('correspondences')
    .select('*')
    .range(0, 999999);
  
  console.log(`Record recuperati (range 0-999999): ${dataRange999999?.length || 0}`);
  
  // Test 4: Conta totale con count
  console.log('\n4. Conta totale record:');
  const { count, error: countError } = await supabase
    .from('correspondences')
    .select('*', { count: 'exact', head: true });
  
  console.log(`Totale record nella tabella: ${count || 'N/A'}`);
  
  if (errorNoRange || errorRange9999 || errorRange999999 || countError) {
    console.error('Errori rilevati:', { errorNoRange, errorRange9999, errorRange999999, countError });
  }
}

testCorrispondenze().catch(console.error);