/**
 * Test per la nuova struttura simmetrica delle corrispondenze
 * Verifica la corretta transizione da Roloil-centrico a Q8-centrico
 */

import { MigrationService } from '../visualizzatore-corrispondenze-oli/migration-service';
import { CorrespondenceRecord } from '../visualizzatore-corrispondenze-oli/types-new';

// Dati di test simulati
const testData: CorrespondenceRecord[] = [
  // Record esistenti con struttura attuale
  {
    id: '1',
    brand: 'Q8',
    product: 'Q8 Formula Advanced 5W-30',
    sae: '5W-30',
    roloil: 'ROL 5W-30 SYNTH',
    type: 'PCMO',
    q8: 'Q8 Formula Advanced 5W-30'
  },
  {
    id: '2',
    brand: 'Shell',
    product: 'Shell Helix Ultra 5W-30',
    sae: '5W-30',
    roloil: 'ROL 5W-30 SYNTH',
    type: 'PCMO',
    q8: 'Q8 Formula Advanced 5W-30'
  },
  {
    id: '3',
    brand: 'Mobil',
    product: 'Mobil 1 5W-30',
    sae: '5W-30',
    roloil: 'ROL 5W-30 SYNTH',
    type: 'PCMO',
    q8: null // Manca il valore Q8
  },
  {
    id: '4',
    brand: 'Q8',
    product: 'Q8 Formula Truck 10W-40',
    sae: '10W-40',
    roloil: 'ROL 10W-40 TRUCK',
    type: 'HDDO',
    q8: 'Q8 Formula Truck 10W-40'
  },
  {
    id: '5',
    brand: 'Castrol',
    product: 'Castrol GTX 10W-40',
    sae: '10W-40',
    roloil: 'ROL 10W-40 TRUCK',
    type: 'HDDO',
    q8: null // Manca il valore Q8
  }
];

function runTests() {
  console.log('🧪 Inizio test migrazione struttura dati...\n');

  // Test 1: Analisi dati attuali
  console.log('📊 Test 1: Analisi dati attuali');
  const analysis = MigrationService.analyzeCurrentData(testData);
  console.log('Analisi:', analysis);
  console.log('✅ Test 1 completato\n');

  // Test 2: Generazione record mancanti
  console.log('🔧 Test 2: Generazione record mancanti');
  const missingRecords = MigrationService.generateMissingRoloilQ8Records(testData);
  console.log('Record da creare:', missingRecords);
  console.log(`✅ Trovati ${missingRecords.length} record mancanti\n`);

  // Test 3: Validazione prima della migrazione
  console.log('🔍 Test 3: Validazione prima della migrazione');
  const validationBefore = MigrationService.validateMigration(testData);
  console.log('Validazione:', validationBefore);
  console.log(`❌ Struttura valida: ${validationBefore.isValid}\n`);

  // Test 4: Simulazione migrazione
  console.log('🚀 Test 4: Simulazione migrazione');
  const allRecordsAfterMigration = [...testData, ...missingRecords];
  const validationAfter = MigrationService.validateMigration(allRecordsAfterMigration);
  console.log('Validazione dopo migrazione:', validationAfter);
  console.log(`✅ Struttura valida: ${validationAfter.isValid}\n`);

  // Test 5: Piano di migrazione
  console.log('📋 Test 5: Piano di migrazione');
  const migrationPlan = MigrationService.getMigrationPlan(testData);
  console.log('Piano:', migrationPlan);
  console.log('✅ Test 5 completato\n');

  // Test 6: Verifica coerenza Q8
  console.log('🎯 Test 6: Verifica coerenza Q8');
  const q8Consistency = verifyQ8Consistency(allRecordsAfterMigration);
  console.log('Coerenza Q8:', q8Consistency);
  console.log(`✅ Coerenza valida: ${q8Consistency.isConsistent}\n`);

  // Riepilogo
  console.log('📈 Riepilogo Test:');
  console.log(`• Record originali: ${testData.length}`);
  console.log(`• Record dopo migrazione: ${allRecordsAfterMigration.length}`);
  console.log(`• Record creati: ${missingRecords.length}`);
  console.log(`• Struttura valida: ${validationAfter.isValid}`);
  console.log(`• Tutti i Q8 coerenti: ${q8Consistency.isConsistent}`);
  
  return {
    success: validationAfter.isValid && q8Consistency.isConsistent,
    originalCount: testData.length,
    finalCount: allRecordsAfterMigration.length,
    createdCount: missingRecords.length,
    isValid: validationAfter.isValid,
    isConsistent: q8Consistency.isConsistent
  };
}

function verifyQ8Consistency(records: CorrespondenceRecord[]): {
  isConsistent: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  const q8ByCombination = new Map<string, string>();

  // Raggruppa per combinazione roloil-sae-type
  records.forEach(record => {
    const key = `${record.roloil}-${record.sae}-${record.type}`;
    
    if (record.q8) {
      if (q8ByCombination.has(key)) {
        const existingQ8 = q8ByCombination.get(key)!;
        if (existingQ8 !== record.q8) {
          issues.push(`Incoerenza Q8 per ${key}: "${existingQ8}" vs "${record.q8}"`);
        }
      } else {
        q8ByCombination.set(key, record.q8);
      }
    }
  });

  // Verifica che ogni combinazione abbia un Q8
  const combinationsWithoutQ8 = [...new Set(records.map(r => `${r.roloil}-${r.sae}-${r.type}`))]
    .filter(key => !q8ByCombination.has(key));

  if (combinationsWithoutQ8.length > 0) {
    issues.push(`Combinazioni senza Q8: ${combinationsWithoutQ8.join(', ')}`);
  }

  return {
    isConsistent: issues.length === 0,
    issues
  };
}

// Esegui i test
if (typeof window !== 'undefined') {
  // In ambiente browser
  window.runMigrationTests = runTests;
  console.log('🧪 Test disponibili: window.runMigrationTests()');
} else {
  // In ambiente Node.js
  const results = runTests();
  console.log('\n🏁 Test completati:', results.success ? '✅ SUCCESSO' : '❌ FALLITO');
  process.exit(results.success ? 0 : 1);
}

export { runTests };