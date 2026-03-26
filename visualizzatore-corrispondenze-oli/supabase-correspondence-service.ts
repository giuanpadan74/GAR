/**
 * Servizio Supabase per la gestione delle corrispondenze con transizione a struttura simmetrica
 * Gestisce la comunicazione con Supabase per la migrazione e il mantenimento della coerenza dati
 */

import { createClient } from '@supabase/supabase-js';
import { CorrespondenceRecord } from './types-new';

const supabaseUrl = 'https://tctndvmemnllloctyrpn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjdG5kdm1lbW5sbGxvY3R5cnBuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc2OTQ3MSwiZXhwIjoyMDc1MzQ1NDcxfQ.QZM75N0QiPqH6Xhcno9i0IeQzIrVqtS-TpK9bgN43kw';

export class SupabaseCorrespondenceService {
  private supabase = createClient(supabaseUrl, supabaseKey);

  /**
   * Ottieni tutte le corrispondenze
   */
  async getAllCorrespondences(): Promise<CorrespondenceRecord[]> {
    const { data, error } = await this.supabase
      .from('correspondences')
      .select('*')
      .order('brand', { ascending: true })
      .order('product', { ascending: true });

    if (error) {
      console.error('Errore nel recupero delle corrispondenze:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Aggiungi nuove corrispondenze in batch
   */
  async batchInsertCorrespondences(records: Omit<CorrespondenceRecord, 'id'>[]): Promise<{ 
    success: boolean; 
    inserted: number; 
    errors: string[];
    data?: CorrespondenceRecord[];
  }> {
    const { data, error } = await this.supabase
      .from('correspondences')
      .insert(records)
      .select();

    if (error) {
      console.error('Errore nell\'inserimento batch:', error);
      return { 
        success: false, 
        inserted: 0, 
        errors: [error.message] 
      };
    }

    return { 
      success: true, 
      inserted: data?.length || 0, 
      errors: [],
      data: data || []
    };
  }

  /**
   * Aggiorna corrispondenze esistenti
   */
  async batchUpdateCorrespondences(updates: { 
    id: string; 
    updates: Partial<CorrespondenceRecord>;
  }[]): Promise<{ 
    success: boolean; 
    updated: number; 
    errors: string[];
  }> {
    let totalUpdated = 0;
    const errors: string[] = [];

    // Esegui aggiornamenti individuali (Supabase non supporta batch update nativo)
    for (const update of updates) {
      try {
        const { error } = await this.supabase
          .from('correspondences')
          .update(update.updates)
          .eq('id', update.id);

        if (error) {
          errors.push(`Errore aggiornamento ${update.id}: ${error.message}`);
        } else {
          totalUpdated++;
        }
      } catch (err) {
        errors.push(`Eccezione per ${update.id}: ${err}`);
      }
    }

    return { 
      success: errors.length === 0, 
      updated: totalUpdated, 
      errors 
    };
  }

  /**
   * Esegui la migrazione completa verso struttura simmetrica
   */
  async executeSymmetricMigration(): Promise<{
    success: boolean;
    stats: {
      totalBefore: number;
      totalAfter: number;
      inserted: number;
      updated: number;
    };
    errors: string[];
    validation: {
      isSymmetric: boolean;
      issues: string[];
    };
  }> {
    try {
      // 1. Recupera dati attuali
      const currentRecords = await this.getAllCorrespondences();
      const totalBefore = currentRecords.length;

      // 2. Analizza e genera record mancanti
      const { MigrationService } = await import('./migration-service');
      const missingRecords = MigrationService.generateMissingRoloilQ8Records(currentRecords);

      // 3. Inserisci record mancanti
      let inserted = 0;
      let insertErrors: string[] = [];
      
      if (missingRecords.length > 0) {
        const insertResult = await this.batchInsertCorrespondences(missingRecords);
        inserted = insertResult.inserted;
        insertErrors = insertResult.errors;
      }

      // 4. Aggiorna record esistenti con valori Q8 mancanti
      const recordsToUpdate = currentRecords
        .filter(r => r.brand === 'Roloil' && !r.q8)
        .map(record => {
          // Trova il valore Q8 per questa combinazione
          const q8Value = currentRecords.find(r => 
            r.brand === 'Roloil' &&
            r.product === record.product && 
            r.sae === record.sae && 
            r.type === record.type && 
            r.q8
          )?.q8;

          if (q8Value) {
            return {
              id: record.id,
              updates: { q8: q8Value }
            };
          }
          return null;
        })
        .filter(Boolean) as { id: string; updates: { q8: string } }[];

      let updated = 0;
      let updateErrors: string[] = [];
      
      if (recordsToUpdate.length > 0) {
        const updateResult = await this.batchUpdateCorrespondences(recordsToUpdate);
        updated = updateResult.updated;
        updateErrors = updateResult.errors;
      }

      // 5. Valida risultato
      const finalRecords = await this.getAllCorrespondences();
      const validation = MigrationService.validateMigration(finalRecords);

      return {
        success: insertErrors.length === 0 && updateErrors.length === 0,
        stats: {
          totalBefore,
          totalAfter: finalRecords.length,
          inserted,
          updated
        },
        errors: [...insertErrors, ...updateErrors],
        validation: {
          isSymmetric: validation.isValid,
          issues: validation.issues
        }
      };

    } catch (error) {
      console.error('Errore nella migrazione:', error);
      return {
        success: false,
        stats: { totalBefore: 0, totalAfter: 0, inserted: 0, updated: 0 },
        errors: [`Errore generale: ${error}`],
        validation: { isSymmetric: false, issues: [] }
      };
    }
  }

  /**
   * Verifica la salute della struttura dati
   */
  async checkDataHealth(): Promise<{
    healthy: boolean;
    issues: string[];
    recommendations: string[];
    stats: {
      totalRecords: number;
      uniqueRoloil: number;
      uniqueQ8: number;
      symmetricPairs: number;
    };
  }> {
    try {
      const records = await this.getAllCorrespondences();
      const { MigrationService } = await import('./migration-service');
      
      const analysis = MigrationService.analyzeCurrentData(records);
      const validation = MigrationService.validateMigration(records);
      
      const healthy = validation.isValid && analysis.missingRoloilQ8 === 0;
      const issues = validation.issues;
      const recommendations = analysis.suggestions;
      
      return {
        healthy,
        issues,
        recommendations,
        stats: {
          totalRecords: analysis.totalRecords,
          uniqueRoloil: analysis.roloilUnique,
          uniqueQ8: analysis.q8Unique,
          symmetricPairs: validation.stats.symmetricCombinations
        }
      };
    } catch (error) {
      return {
        healthy: false,
        issues: [`Errore nel controllo: ${error}`],
        recommendations: [],
        stats: { totalRecords: 0, uniqueRoloil: 0, uniqueQ8: 0, symmetricPairs: 0 }
      };
    }
  }
}