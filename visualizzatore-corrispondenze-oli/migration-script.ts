/**
 * Script di migrazione per trasformare la vecchia struttura dati nella nuova
 * Questo script converte tutti i dati esistenti nel formato simmetrico
 */

import { rawProductData } from './data';
import { migrateFromOldStructure } from './data-new-structure';

/**
 * Esegue la migrazione completa dei dati
 */
export function runMigration() {
  console.log('🔄 Inizio migrazione dati...');
  
  const startTime = Date.now();
  
  try {
    // Migra tutti i dati dalla vecchia struttura alla nuova
    const migratedRecords = migrateFromOldStructure(rawProductData);
    
    const endTime = Date.now();
    const migrationTime = endTime - startTime;
    
    console.log(`✅ Migrazione completata in ${migrationTime}ms`);
    console.log(`📊 Record creati: ${migratedRecords.length}`);
    
    // Statistiche dettagliate
    const stats = generateMigrationStats(migratedRecords);
    console.log('📈 Statistiche migrazione:');
    console.log(`   - Brand totali: ${stats.totalBrands}`);
    console.log(`   - Tipi totali: ${stats.totalTypes}`);
    console.log(`   - Prodotti Roloil unici: ${stats.uniqueRoloilProducts}`);
    console.log(`   - Records per brand:`, stats.recordsPerBrand);
    console.log(`   - Records per tipo:`, stats.recordsPerType);
    
    // Verifica integrità
    const validation = validateMigration(migratedRecords);
    if (validation.isValid) {
      console.log('✅ Validazione superata');
    } else {
      console.log('⚠️  Problemi di validazione:', validation.issues);
    }
    
    return {
      success: true,
      records: migratedRecords,
      stats,
      validation
    };
    
  } catch (error) {
    console.error('❌ Errore durante la migrazione:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Genera statistiche sulla migrazione
 */
function generateMigrationStats(records: any[]) {
  const brands = new Set(records.map(r => r.brand));
  const types = new Set(records.map(r => r.type));
  const roloilProducts = new Set(records.map(r => r.roloil));
  
  const recordsPerBrand: Record<string, number> = {};
  const recordsPerType: Record<string, number> = {};
  
  records.forEach(record => {
    recordsPerBrand[record.brand] = (recordsPerBrand[record.brand] || 0) + 1;
    recordsPerType[record.type] = (recordsPerType[record.type] || 0) + 1;
  });
  
  return {
    totalRecords: records.length,
    totalBrands: brands.size,
    totalTypes: types.size,
    uniqueRoloilProducts: roloilProducts.size,
    recordsPerBrand,
    recordsPerType
  };
}

/**
 * Valida l'integrità dei dati migrati
 */
function validateMigration(records: any[]) {
  const issues: string[] = [];
  
  // Controlla campi obbligatori
  records.forEach((record, index) => {
    if (!record.id) issues.push(`Record ${index}: ID mancante`);
    if (!record.brand) issues.push(`Record ${index}: Brand mancante`);
    if (!record.product) issues.push(`Record ${index}: Prodotto mancante`);
    if (!record.sae) issues.push(`Record ${index}: SAE mancante`);
    if (!record.roloil) issues.push(`Record ${index}: Roloil mancante`);
    if (!record.type) issues.push(`Record ${index}: Tipo mancante`);
  });
  
  // Controlla duplicati
  const seenIds = new Set();
  const duplicateIds: string[] = [];
  
  records.forEach(record => {
    if (seenIds.has(record.id)) {
      duplicateIds.push(record.id);
    }
    seenIds.add(record.id);
  });
  
  if (duplicateIds.length > 0) {
    issues.push(`IDs duplicati: ${duplicateIds.join(', ')}`);
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}

/**
 * Confronta vecchia e nuova struttura per verificare la correttezza
 */
export function compareStructures(oldData: any[], newRecords: any[]) {
  console.log('🔍 Confronto strutture dati...');
  
  // Conta corrispondenze nella vecchia struttura
  const oldCorrespondences = oldData.filter(item => 
    item.roloil && 
    !['---', '-------', ''].includes(item.roloil.trim())
  );
  
  console.log(`Vecchia struttura: ${oldCorrespondences.length} corrispondenze valide`);
  console.log(`Nuova struttura: ${newRecords.length} records`);
  
  // Verifica che tutte le corrispondenze esistano
  const missingInNew: any[] = [];
  
  oldCorrespondences.forEach(oldItem => {
    // Cerca corrispondenza brand -> roloil
    const brandMatch = newRecords.find(newItem => 
      newItem.brand === oldItem.brand &&
      newItem.roloil === oldItem.roloil &&
      newItem.sae === oldItem.sae
    );
    
    if (!brandMatch && oldItem.product) {
      missingInNew.push({
        type: 'brand_correspondence',
        brand: oldItem.brand,
        product: oldItem.product,
        roloil: oldItem.roloil,
        sae: oldItem.sae
      });
    }
    
    // Cerca corrispondenza Q8 -> roloil
    if (oldItem.q8 && !['---', '-------', ''].includes(oldItem.q8.trim())) {
      const q8Match = newRecords.find(newItem => 
        newItem.brand === 'Q8' &&
        newItem.roloil === oldItem.roloil &&
        newItem.sae === oldItem.sae &&
        newItem.product === oldItem.q8.trim()
      );
      
      if (!q8Match) {
        missingInNew.push({
          type: 'q8_correspondence',
          brand: 'Q8',
          product: oldItem.q8.trim(),
          roloil: oldItem.roloil,
          sae: oldItem.sae
        });
      }
    }
  });
  
  if (missingInNew.length > 0) {
    console.log(`⚠️  ${missingInNew.length} corrispondenze mancanti nella nuova struttura:`);
    missingInNew.slice(0, 10).forEach(missing => {
      console.log(`   - ${missing.type}: ${missing.brand} ${missing.product} → ${missing.roloil} (${missing.sae})`);
    });
    if (missingInNew.length > 10) {
      console.log(`   ... e altri ${missingInNew.length - 10}`);
    }
  } else {
    console.log('✅ Tutte le corrispondenze sono state migrate correttamente');
  }
  
  return {
    missingInNew,
    totalMissing: missingInNew.length
  };
}

// Esegui la migrazione se questo file viene eseguito direttamente
if (require.main === module) {
  const result = runMigration();
  
  if (result.success) {
    // Confronta con i dati originali
    compareStructures(rawProductData, result.records);
    
    console.log('\n💾 Esempio di dati migrati:');
    console.log(JSON.stringify(result.records.slice(0, 3), null, 2));
  }
}