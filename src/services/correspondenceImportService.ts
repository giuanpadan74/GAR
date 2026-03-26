import { supabase, withRetry } from '../lib/supabase';
import { toast } from 'sonner';

export interface ImportData {
  brand: string;        // OEM/Brand
  product: string;      // Product name
  q8: string;           // Q8 equivalent
  type?: string;        // Type (optional)
  sae?: string;         // SAE (optional)
}

export interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
  warnings: string[];
}

export interface ImportLog {
  id?: string;
  user_id: string;
  filename: string;
  total_records: number;
  successful_records: number;
  failed_records: number;
  errors: string[];
  warnings: string[];
  import_date: string;
  status: 'completed' | 'failed' | 'partial';
}

/**
 * Servizio per l'importazione bulk delle corrispondenze
 */
export class CorrespondenceImportService {
  /**
   * Importa corrispondenze da file e crea record nel database
   */
  async importCorrespondences(
    data: ImportData[], 
    filename: string, 
    userId: string
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
      warnings: []
    };

    // Raggruppa i dati per brand (OEM) per ottimizzare l'importazione
    const groupedData = this.groupDataByBrand(data);
    
    for (const [brand, records] of Object.entries(groupedData)) {
      try {
        // Per ogni brand, crea i record nel database
        const batchResult = await this.createBatchRecords(brand, records);
        result.success += batchResult.success;
        result.failed += batchResult.failed;
        result.errors.push(...batchResult.errors);
        result.warnings.push(...batchResult.warnings);
      } catch (error) {
        const errorMsg = `Errore nell'importazione del brand ${brand}: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`;
        result.errors.push(errorMsg);
        result.failed += records.length;
      }
    }

    // Log dell'operazione
    try {
      await this.logImportOperation(filename, userId, result);
    } catch (logError) {
      console.error('Errore nel logging dell\'importazione:', logError);
      result.warnings.push('Errore nel salvataggio del log di importazione');
    }

    return result;
  }

  /**
   * Raggruppa i dati per brand
   */
  private groupDataByBrand(data: ImportData[]): Record<string, ImportData[]> {
    return data.reduce((groups, record) => {
      const brand = record.brand.trim();
      if (!groups[brand]) {
        groups[brand] = [];
      }
      groups[brand].push(record);
      return groups;
    }, {} as Record<string, ImportData[]>);
  }

  /**
   * Crea un batch di record per un brand specifico
   */
  private async createBatchRecords(brand: string, records: ImportData[]): Promise<ImportResult> {
    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
      warnings: []
    };

    // Per ogni record, crea la corrispondenza
    for (const record of records) {
      try {
        // Verifica se esiste già un record simile
        const existingRecord = await this.findExistingRecord(brand, record.product);
        
        if (existingRecord) {
          // Aggiorna il record esistente con il nuovo valore Q8
        await this.updateExistingRecord(existingRecord.id, record.q8);
        result.warnings.push(`Record aggiornato: ${brand} - ${record.product}`);
        } else {
          // Crea un nuovo record
          await this.createNewRecord(brand, record);
        }
        
        result.success++;
      } catch (error) {
        result.failed++;
        const errorMsg = `Errore nel record ${brand} - ${record.product}: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`;
        result.errors.push(errorMsg);
      }
    }

    return result;
  }

  /**
   * Trova un record esistente per brand e product
   */
  private async findExistingRecord(brand: string, product: string): Promise<any | null> {
    // Normalizza il brand Roloil per la ricerca
    const normalizedBrand = brand.trim().toLowerCase() === 'roloil' ? 'Roloil' : brand.trim();
    
    const { data, error } = await withRetry(() =>
      supabase
        .from('correspondences')
        .select('id, brand, product, q8')
        .eq('brand', normalizedBrand)
        .eq('product', product)
        .maybeSingle()
    );

    if (error) {
      console.warn('Errore nella ricerca del record:', error);
      return null;
    }

    return data;
  }

  /**
   * Aggiorna un record esistente con il nuovo valore Q8
   */
  private async updateExistingRecord(id: string, q8: string): Promise<void> {
    const { error } = await withRetry(() =>
      supabase
        .from('correspondences')
        .update({ q8: q8?.trim().toUpperCase().replace(/-/g, ' ') || '------' })
        .eq('id', id)
    );

    if (error) {
      throw new Error(`Errore nell'aggiornamento del record: ${error.message}`);
    }
  }

  /**
   * Crea un nuovo record di corrispondenza
   */
  private async createNewRecord(brand: string, record: ImportData): Promise<void> {
    // Normalizza il brand Roloil per essere case-insensitive, altri brand rimangono nel formato originale
    const normalizedBrand = brand.trim().toLowerCase() === 'roloil' ? 'Roloil' : brand;
    
    // Usa i campi forniti o fallback a valori di default
    const finalType = record.type?.trim() || 'N/A'; // Type rimane nel formato originale
    const finalSae = record.sae?.trim().toUpperCase() || 'N/A'; // SAE in maiuscolo
    const finalQ8 = record.q8?.trim().toUpperCase().replace(/-/g, ' ') || '------'; // Q8 EQUIVALENT in maiuscolo con trattini sostituiti da spazi

    const { error } = await withRetry(() =>
      supabase
        .from('correspondences')
        .insert([{
          brand: normalizedBrand,
          product: record.product.trim().toUpperCase(), // PRODUCT in maiuscolo
          sae: finalSae,
          type: finalType,
          q8: finalQ8
        }])
    );

    if (error) {
      throw new Error(`Errore nella creazione del record: ${error.message}`);
    }
  }

  /**
   * Inferisci tipo e SAE dal nome del prodotto (logica di base)
   */
  private inferTypeAndSae(productName: string): { type: string; sae: string } {
    const upperProduct = productName.toUpperCase();
    
    // Pattern matching per SAE
    const saeMatch = upperProduct.match(/SAE\s*(\d+W?\d*)/);
    const sae = saeMatch ? `SAE ${saeMatch[1]}` : 'N/A';
    
    // Pattern matching per tipo
    if (upperProduct.includes('MOTOR OIL') || upperProduct.includes('OLIO')) {
      return { type: 'MOTOR OIL', sae };
    } else if (upperProduct.includes('GEAR') || upperProduct.includes('TRASMISSIONE')) {
      return { type: 'GEAR OIL', sae };
    } else if (upperProduct.includes('HYDRAULIC') || upperProduct.includes('IDRAULICO')) {
      return { type: 'HYDRAULIC OIL', sae };
    } else {
      return { type: 'OTHER', sae };
    }
  }

  /**
   * Registra l'operazione di importazione nel log
   */
  private async logImportOperation(
    filename: string, 
    userId: string, 
    result: ImportResult
  ): Promise<void> {
    console.log('Attempting to log import operation:', { filename, userId, result });
    console.log('UserId type:', typeof userId);
    console.log('UserId value:', userId);
    console.log('Is userId a valid UUID format?', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId));
    
    const logEntry: Omit<ImportLog, 'id'> = {
      user_id: userId,
      filename: filename,
      total_records: result.success + result.failed,
      successful_records: result.success,
      failed_records: result.failed,
      errors: result.errors.slice(0, 10), // Salva massimo 10 errori
      warnings: result.warnings.slice(0, 10), // Salva massimo 10 warning
      import_date: new Date().toISOString(),
      status: result.failed === 0 ? 'completed' : result.success === 0 ? 'failed' : 'partial'
    };

    console.log('Log entry to be inserted:', JSON.stringify(logEntry, null, 2));

    console.log('About to insert log entry...');
    
    // First, let's check if RLS is actually disabled
    const { data: rlsCheck, error: rlsError } = await supabase
      .from('import_logs')
      .select('*')
      .limit(1);
    
    if (rlsError) {
      console.error('RLS check failed:', rlsError);
    } else {
      console.log('RLS check succeeded, can read from table');
    }
    
    const { error } = await withRetry(() =>
      supabase.from('import_logs').insert([logEntry])
    );

    if (error) {
      console.error('Errore nel salvataggio del log:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Since RLS is disabled, this might be a different issue
      // Let's try to understand what's happening
      console.error('Since RLS is disabled, checking other possible issues...');
      
      // Try a minimal insert with just required fields
      console.log('Attempting ultra-minimal insert...');
      const ultraMinimalLog = {
        user_id: userId,
        filename: 'test_debug.log',
        total_records: 0,
        successful_records: 0,
        failed_records: 0,
        errors: [],
        warnings: [],
        import_date: new Date().toISOString(),
        status: 'failed' as const
      };
      
      const { error: ultraMinimalError } = await supabase.from('import_logs').insert([ultraMinimalLog]);
      if (ultraMinimalError) {
        console.error('Ultra-minimal insert also failed:', ultraMinimalError);
        console.error('This suggests the issue is not with data format but with permissions or table structure');
      } else {
        console.log('Ultra-minimal insert succeeded!');
        console.log('The issue might be with the data format or size of arrays');
      }
      
      throw new Error(`Errore nel salvataggio del log: ${error.message}`);
    }
    
    console.log('Import log saved successfully');
  }

  /**
   * Ottiene i log di importazione per un utente
   */
  async getImportLogs(userId: string, limit: number = 50): Promise<ImportLog[]> {
    const { data, error } = await withRetry(() =>
      supabase
        .from('import_logs')
        .select('*')
        .eq('user_id', userId)
        .order('import_date', { ascending: false })
        .limit(limit)
    );

    if (error) {
      throw new Error(`Errore nel recupero dei log: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Valida i dati prima dell'importazione
   */
  validateImportData(data: ImportData[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (data.length === 0) {
      errors.push('Nessun dato da importare');
      return { isValid: false, errors };
    }

    // Controlla record duplicati
    const seen = new Set<string>();
    const duplicates = new Set<string>();
    
    data.forEach((record, index) => {
      const key = `${record.brand.trim().toLowerCase()}-${record.product.trim().toLowerCase()}`;
      if (seen.has(key)) {
        duplicates.add(`${record.brand} - ${record.product}`);
      }
      seen.add(key);
    });

    if (duplicates.size > 0) {
      errors.push(`Record duplicati trovati: ${Array.from(duplicates).slice(0, 5).join(', ')}`);
    }

    // Controlla campi obbligatori
    const invalidRecords = data.filter((record, index) => {
      return !record.brand?.trim() || !record.product?.trim();
    });

    if (invalidRecords.length > 0) {
      errors.push(`${invalidRecords.length} record hanno campi obbligatori mancanti`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Istanza singleton del servizio
export const correspondenceImportService = new CorrespondenceImportService();