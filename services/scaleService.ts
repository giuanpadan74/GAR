import { supabase } from './supabaseClient';

export interface Scale {
  id?: string;
  Scala: 'A' | 'B' | 'C' | 'D' | 'E' | 'P';
  Sconto: number;
  Provv: number;
  minprov: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ScaleFilters {
  scala?: string;
  search?: string;
  provvmin?: boolean;
}

export class ScaleService {
  /**
   * Recupera tutte le scale con filtri opzionali
   */
  static async getScales(filters?: ScaleFilters): Promise<Scale[]> {
    try {
      console.log('🔍 Recupero scale dalla tabella "scales"...', filters);
      
      let query = supabase
        .from('scales')
        .select('*')
        .order('Scala', { ascending: true })
        .order('Sconto', { ascending: true });

      // Applica filtri
      if (filters?.scala) {
        query = query.eq('Scala', filters.scala);
      }

      if (filters?.provvmin !== undefined) {
        query = query.eq('minprov', filters.provvmin);
      }

      if (filters?.search) {
        // Ricerca per scala o valori numerici
        const searchTerm = filters.search.toLowerCase();
        query = query.or(`Scala.ilike.%${searchTerm}%,Sconto.gte.${parseFloat(searchTerm) || 0},Provv.gte.${parseFloat(searchTerm) || 0}`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Errore nel recupero scale:', error);
        throw error;
      }

      console.log(`✅ Recuperate ${data?.length || 0} scale`);
      return data || [];
    } catch (error) {
      console.error('❌ Errore ScaleService.getScales:', error);
      throw error;
    }
  }

  /**
   * Recupera le scale per una specifica scala (A, B, C, D, E, P)
   */
  static async getScalesByType(scaleType: string): Promise<Scale[]> {
    try {
      console.log(`🔍 Recupero scale per tipo "${scaleType}"...`);
      
      const { data, error } = await supabase
        .from('scales')
        .select('*')
        .eq('Scala', scaleType)
        .order('Sconto', { ascending: true });

      if (error) {
        console.error('❌ Errore nel recupero scale per tipo:', error);
        throw error;
      }

      console.log(`✅ Recuperate ${data?.length || 0} scale per tipo ${scaleType}`);
      return data || [];
    } catch (error) {
      console.error('❌ Errore ScaleService.getScalesByType:', error);
      throw error;
    }
  }

  /**
   * Crea una nuova scala
   */
  static async createScale(scale: Omit<Scale, 'id' | 'created_at' | 'updated_at'>): Promise<Scale> {
    try {
      console.log('➕ Creazione nuova scala:', scale);

      // Verifica duplicati
      const existing = await this.getScales({ scala: scale.Scala });
      const duplicate = existing.find(s => s.Sconto === scale.Sconto);
      
      if (duplicate) {
        throw new Error(`Esiste già una scala ${scale.Scala} con sconto ${scale.Sconto}%`);
      }

      const { data, error } = await supabase
        .from('scales')
        .insert([scale])
        .select()
        .single();

      if (error) {
        console.error('❌ Errore nella creazione scala:', error);
        throw error;
      }

      console.log('✅ Scala creata con successo:', data);
      return data;
    } catch (error) {
      console.error('❌ Errore ScaleService.createScale:', error);
      throw error;
    }
  }

  /**
   * Aggiorna una scala esistente
   */
  static async updateScale(id: string, updates: Partial<Omit<Scale, 'id' | 'created_at' | 'updated_at'>>): Promise<Scale> {
    try {
      console.log('✏️ Aggiornamento scala:', { id, updates });

      // Se si sta cambiando scala o sconto, verifica duplicati
      if (updates.Scala && updates.Sconto !== undefined) {
        console.log('🔍 Verifica duplicati per:', { scale: updates.Scala, discount: updates.Sconto });
        
        // Recupera tutte le scale dello stesso tipo
        const { data: existing, error: fetchError } = await supabase
          .from('scales')
          .select('*')
          .eq('Scala', updates.Scala);

        if (fetchError) {
          console.error('❌ Errore nel recupero scale per verifica duplicati:', fetchError);
          throw fetchError;
        }

        // Verifica se esiste già una scala con lo stesso sconto (escludendo quella corrente)
        const duplicate = existing?.find(s => s.id !== id && s.Sconto === updates.Sconto);
        
        if (duplicate) {
          throw new Error(`Esiste già una scala ${updates.Scala} con sconto €${updates.Sconto}`);
        }
      }

      const { data, error } = await supabase
        .from('scales')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Errore nell\'aggiornamento scala:', error);
        throw error;
      }

      console.log('✅ Scala aggiornata con successo:', data);
      return data;
    } catch (error) {
      console.error('❌ Errore ScaleService.updateScale:', error);
      throw error;
    }
  }

  /**
   * Elimina una scala
   */
  static async deleteScale(id: string): Promise<void> {
    try {
      console.log('🗑️ Eliminazione scala:', id);

      const { error } = await supabase
        .from('scales')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Errore nell\'eliminazione scala:', error);
        throw error;
      }

      console.log('✅ Scala eliminata con successo');
    } catch (error) {
      console.error('❌ Errore ScaleService.deleteScale:', error);
      throw error;
    }
  }

  /**
   * Recupera i tipi di scala disponibili
   */
  static async getScaleTypes(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('scales')
        .select('Scala')
        .order('Scala');

      if (error) {
        console.error('❌ Errore nel recupero tipi scala:', error);
        throw error;
      }

      const uniqueTypes = [...new Set(data?.map(s => s.Scala) || [])];
      return uniqueTypes;
    } catch (error) {
      console.error('❌ Errore ScaleService.getScaleTypes:', error);
      throw error;
    }
  }

  /**
   * Recupera la provvigione minima per una scala
   */
  static async getMinProvvForScale(scaleType: string): Promise<Scale | null> {
    try {
      const { data, error } = await supabase
        .from('scales')
        .select('*')
        .eq('Scala', scaleType)
        .eq('minprov', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('❌ Errore nel recupero provvigione minima:', error);
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('❌ Errore ScaleService.getMinProvvForScale:', error);
      throw error;
    }
  }

  /**
   * Recupera il massimo sconto per una scala
   */
  static async getMaxDiscountForScale(scaleType: string): Promise<Scale | null> {
    try {
      const { data, error } = await supabase
        .from('scales')
        .select('*')
        .eq('Scala', scaleType)
        .order('Sconto', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Errore nel recupero massimo sconto:', error);
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('❌ Errore ScaleService.getMaxDiscountForScale:', error);
      throw error;
    }
  }

  /**
   * Valida i dati di una scala
   */
  static validateScale(scale: Partial<Scale>): string[] {
    const errors: string[] = [];

    if (!scale.Scala || !['A', 'B', 'C', 'D', 'E', 'P'].includes(scale.Scala)) {
      errors.push('La scala deve essere A, B, C, D, E o P');
    }

    if (scale.Sconto === undefined || scale.Sconto < 0) {
      errors.push('Lo sconto deve essere un numero positivo');
    }

    if (scale.Provv === undefined || scale.Provv < 0 || scale.Provv > 100) {
      errors.push('La provvigione deve essere un numero tra 0 e 100');
    }

    if (scale.minprov === undefined) {
      errors.push('Il campo minprov è obbligatorio');
    }

    return errors;
  }
}