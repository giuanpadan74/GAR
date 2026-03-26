/**
 * Servizio di migrazione per trasformare la struttura dati da Roloil-centrica a Q8-centrica
 * Questo servizio gestisce la transizione verso la nuova struttura simmetrica
 */

import { CorrespondenceRecord } from '../visualizzatore-corrispondenze-oli/types-new';

export class MigrationService {
  
  /**
   * Analizza i dati attuali e suggerisce la migrazione
   */
  static analyzeCurrentData(records: CorrespondenceRecord[]): {
    totalRecords: number;
    roloilUnique: number;
    q8Unique: number;
    missingRoloilQ8: number;
    suggestions: string[];
  } {
    const roloilSet = new Set(records.map(r => r.roloil));
    const q8Set = new Set(records.map(r => r.q8).filter(Boolean));
    
    // Conta record Roloil senza corrispondenza Q8
    const missingQ8 = records.filter(r => 
      r.brand === 'Roloil' && !r.q8
    ).length;
    
    // Conta combinazioni uniche che necessitano di record Q8-Roloil
    const uniqueCombinations = new Set(
      records.map(r => `${r.roloil}-${r.sae}-${r.type}`)
    );
    
    const suggestions = [];
    
    if (missingQ8 > 0) {
      suggestions.push(`Aggiungere valori Q8 a ${missingQ8} record Roloil`);
    }
    
    if (q8Set.size > roloilSet.size) {
      suggestions.push(`Q8 ha più prodotti (${q8Set.size}) di Roloil (${roloilSet.size}) - ottimo per la transizione`);
    }
    
    suggestions.push(`Creare record Roloil-Q8 per ${uniqueCombinations.size} combinazioni uniche`);
    
    return {
      totalRecords: records.length,
      roloilUnique: roloilSet.size,
      q8Unique: q8Set.size,
      missingRoloilQ8: missingQ8,
      suggestions
    };
  }
  
  /**
   * Genera i record mancanti per la simmetria Roloil-Q8
   */
  static generateMissingRoloilQ8Records(records: CorrespondenceRecord[]): CorrespondenceRecord[] {
    const existingCombinations = new Set(
      records.map(r => `${r.roloil}-${r.sae}-${r.type}-${r.brand}`)
    );
    
    const newRecords: CorrespondenceRecord[] = [];
    
    // Per ogni combinazione unica roloil-sae-type
    const uniqueCombinations = new Set(
      records.map(r => `${r.roloil}-${r.sae}-${r.type}`)
    );
    
    for (const combo of uniqueCombinations) {
      const [roloil, sae, type] = combo.split('-');
      
      // Trova il valore Q8 per questa combinazione
      const q8Value = records.find(r => 
        r.roloil === roloil && r.sae === sae && r.type === type && r.q8
      )?.q8 || roloil; // Fallback a roloil se non trova Q8
      
      // Crea record Roloil se manca
      const roloilKey = `${combo}-Roloil`;
      if (!existingCombinations.has(roloilKey)) {
        newRecords.push({
          id: `mig-${roloilKey}-${Date.now()}`,
          brand: 'Roloil',
          product: roloil, // ✅ CORRETTO: Usa il valore roloil originale
          sae,
          roloil,
          type: type as any,
          q8: q8Value
        });
      }
    }
    
    return newRecords;
  }
  
  /**
   * Valida che la migrazione sia completa
   */
  static validateMigration(records: CorrespondenceRecord[]): {
    isValid: boolean;
    issues: string[];
    stats: {
      totalCombinations: number;
      symmetricCombinations: number;
      missingSymmetric: number;
    };
  } {
    const combinations = new Map<string, Set<string>>();
    
    // Raggruppa per combinazione roloil-sae-type
    records.forEach(record => {
      const key = `${record.roloil}-${record.sae}-${record.type}`;
      if (!combinations.has(key)) {
        combinations.set(key, new Set());
      }
      combinations.get(key)!.add(record.brand);
    });
    
    const totalCombinations = combinations.size;
    let symmetricCombinations = 0;
    const missingSymmetric: string[] = [];
    
    combinations.forEach((brands, combo) => {
      const hasRoloil = brands.has('Roloil');
      const hasQ8 = brands.has('Q8') || records.some(r => 
        `${r.roloil}-${r.sae}-${r.type}` === combo && r.q8
      );
      
      if (hasRoloil && hasQ8) {
        symmetricCombinations++;
      } else {
        missingSymmetric.push(combo);
      }
    });
    
    const isValid = symmetricCombinations === totalCombinations;
    const issues = missingSymmetric.map(combo => 
      `Manca simmetria Roloil-Q8 per combinazione: ${combo}`
    );
    
    return {
      isValid,
      issues,
      stats: {
        totalCombinations,
        symmetricCombinations,
        missingSymmetric: totalCombinations - symmetricCombinations
      }
    };
  }
  
  /**
   * Suggerisce la sequenza di migrazione ottimale
   */
  static getMigrationPlan(records: CorrespondenceRecord[]): {
    steps: string[];
    estimatedRecords: number;
    warnings: string[];
  } {
    const analysis = this.analyzeCurrentData(records);
    const missingRecords = this.generateMissingRoloilQ8Records(records);
    
    const steps = [
      '1. Backup del database attuale',
      '2. Esegui script SQL per aggiungere record mancanti',
      `3. Aggiungi ${missingRecords.length} record Roloil-Q8 mancanti`,
      '4. Valida la correttezza della migrazione',
      '5. Aggiorna l\'applicazione per usare la nuova logica',
      '6. Testa tutte le funzionalità'
    ];
    
    const warnings = [];
    if (analysis.q8Unique < analysis.roloilUnique) {
      warnings.push('Q8 ha meno prodotti di Roloil - considera se questa è la direzione corretta');
    }
    
    if (analysis.missingRoloilQ8 > 0) {
      warnings.push(`Ci sono ${analysis.missingRoloilQ8} record Roloil senza valore Q8 - saranno usati come fallback`);
    }
    
    return {
      steps,
      estimatedRecords: missingRecords.length,
      warnings
    };
  }
}