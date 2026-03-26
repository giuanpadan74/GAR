/**
 * Servizio per la gestione dei preventivi Roloil
 * Gestisce creazione, calcolo totali, righe preventivo e export PDF/Excel
 */

import { supabase } from './supabaseClient';
import { ListinoService } from './listinoService';
import type {
  Preventivo,
  PreventivoRiga,
  PreventivoDetailed,
  PreventivoRigaDetailed,
  CreatePreventivoInput,
  CreatePreventivoRigaInput,
  PreventivoFilters,
  PreventiveStatus,
  Product,
  DiscountScale,
  ExportOptions,
  CompanyInfo,
  PreventivoStats
} from '../types/listino';

/**
 * Servizio principale per la gestione dei preventivi
 */
export class PreventiviService {

  /**
   * Genera un nuovo numero preventivo
   */
  static async generatePreventivoNumber(): Promise<string> {
    try {
      const year = new Date().getFullYear();
      const { count } = await supabase
        .from('preventivi')
        .select('*', { count: 'exact' })
        .like('numero', `${year}%`);

      const nextNumber = (count || 0) + 1;
      return `${year}${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Errore nella generazione numero preventivo:', error);
      // Fallback con timestamp
      return `${new Date().getFullYear()}${Date.now().toString().slice(-4)}`;
    }
  }

  /**
   * Crea un nuovo preventivo
   */
  static async createPreventivo(preventivoData: CreatePreventivoInput): Promise<Preventivo> {
    try {
      const numero = await this.generatePreventivoNumber();
      
      const { data, error } = await supabase
        .from('preventivi')
        .insert([{
          ...preventivoData,
          numero,
          status: PreventiveStatus.BOZZA
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Errore nella creazione preventivo:', error);
      throw new Error('Impossibile creare il preventivo');
    }
  }

  /**
   * Recupera un preventivo per ID con dettagli completi
   */
  static async getPreventivoById(id: string): Promise<PreventivoDetailed | null> {
    try {
      const { data: preventivo, error: preventivoError } = await supabase
        .from('preventivi')
        .select(`
          *,
          discount_scales (*)
        `)
        .eq('id', id)
        .single();

      if (preventivoError && preventivoError.code !== 'PGRST116') throw preventivoError;
      if (!preventivo) return null;

      // Recupera le righe del preventivo con i dettagli dei prodotti
      const { data: righe, error: righeError } = await supabase
        .from('preventivo_righe')
        .select(`
          *,
          products (*)
        `)
        .eq('preventivo_id', id)
        .order('created_at', { ascending: true });

      if (righeError) throw righeError;

      return {
        ...preventivo,
        discount_scale: preventivo.discount_scales,
        righe: righe?.map(riga => ({
          ...riga,
          product: riga.products
        })) || []
      };
    } catch (error) {
      console.error('Errore nel recupero preventivo:', error);
      throw new Error('Impossibile recuperare il preventivo');
    }
  }

  /**
   * Recupera tutti i preventivi con filtri opzionali
   */
  static async getPreventivi(filters?: PreventivoFilters): Promise<Preventivo[]> {
    try {
      let query = supabase
        .from('preventivi')
        .select('*')
        .order('created_at', { ascending: false });

      // Applica filtri
      if (filters?.agent_id) {
        query = query.eq('agent_id', filters.agent_id);
      }
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.client_name) {
        query = query.ilike('client_name', `%${filters.client_name}%`);
      }
      
      if (filters?.numero) {
        query = query.ilike('numero', `%${filters.numero}%`);
      }
      
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Errore nel recupero preventivi:', error);
      throw new Error('Impossibile recuperare i preventivi');
    }
  }

  /**
   * Aggiunge una riga a un preventivo
   */
  static async addRigaPreventivo(rigaData: CreatePreventivoRigaInput): Promise<PreventivoRiga> {
    try {
      // Recupera il prodotto per calcolare i prezzi
      const product = await ListinoService.getProductById(rigaData.product_id);
      if (!product) {
        throw new Error('Prodotto non trovato');
      }

      // Calcola i totali della riga
      const subtotal = rigaData.quantity * rigaData.unit_price;
      const discountAmount = (subtotal * rigaData.discount_percentage) / 100;
      const discountedSubtotal = subtotal - discountAmount;
      const total = discountedSubtotal;

      const { data, error } = await supabase
        .from('preventivo_righe')
        .insert([{
          ...rigaData,
          subtotal: Math.round(subtotal * 100) / 100,
          total: Math.round(total * 100) / 100
        }])
        .select()
        .single();

      if (error) throw error;

      // Ricalcola i totali del preventivo
      await this.recalculatePreventivoTotals(rigaData.preventivo_id);

      return data;
    } catch (error) {
      console.error('Errore nell\'aggiunta riga preventivo:', error);
      throw new Error('Impossibile aggiungere la riga al preventivo');
    }
  }

  /**
   * Aggiorna una riga del preventivo
   */
  static async updateRigaPreventivo(
    rigaId: string, 
    updates: Partial<CreatePreventivoRigaInput>
  ): Promise<PreventivoRiga> {
    try {
      // Recupera la riga esistente
      const { data: existingRiga, error: fetchError } = await supabase
        .from('preventivo_righe')
        .select('*, products (*)')
        .eq('id', rigaId)
        .single();

      if (fetchError) throw fetchError;

      // Calcola i nuovi totali se necessario
      const quantity = updates.quantity ?? existingRiga.quantity;
      const unitPrice = updates.unit_price ?? existingRiga.unit_price;
      const discountPercentage = updates.discount_percentage ?? existingRiga.discount_percentage;

      const subtotal = quantity * unitPrice;
      const discountAmount = (subtotal * discountPercentage) / 100;
      const discountedSubtotal = subtotal - discountAmount;
      const total = discountedSubtotal;

      const { data, error } = await supabase
        .from('preventivo_righe')
        .update({
          ...updates,
          subtotal: Math.round(subtotal * 100) / 100,
          total: Math.round(total * 100) / 100
        })
        .eq('id', rigaId)
        .select()
        .single();

      if (error) throw error;

      // Ricalcola i totali del preventivo
      await this.recalculatePreventivoTotals(existingRiga.preventivo_id);

      return data;
    } catch (error) {
      console.error('Errore nell\'aggiornamento riga preventivo:', error);
      throw new Error('Impossibile aggiornare la riga del preventivo');
    }
  }

  /**
   * Rimuove una riga dal preventivo
   */
  static async removeRigaPreventivo(rigaId: string): Promise<void> {
    try {
      // Recupera l'ID del preventivo prima di eliminare
      const { data: riga, error: fetchError } = await supabase
        .from('preventivo_righe')
        .select('preventivo_id')
        .eq('id', rigaId)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('preventivo_righe')
        .delete()
        .eq('id', rigaId);

      if (error) throw error;

      // Ricalcola i totali del preventivo
      await this.recalculatePreventivoTotals(riga.preventivo_id);
    } catch (error) {
      console.error('Errore nella rimozione riga preventivo:', error);
      throw new Error('Impossibile rimuovere la riga dal preventivo');
    }
  }

  /**
   * Ricalcola i totali di un preventivo
   */
  static async recalculatePreventivoTotals(preventivoId: string): Promise<void> {
    try {
      // Recupera tutte le righe del preventivo
      const { data: righe, error: righeError } = await supabase
        .from('preventivo_righe')
        .select('*')
        .eq('preventivo_id', preventivoId);

      if (righeError) throw righeError;

      // Calcola i totali
      const subtotal = righe?.reduce((sum, riga) => sum + riga.subtotal, 0) || 0;
      const discountAmount = righe?.reduce((sum, riga) => {
        const rigaDiscount = (riga.subtotal * riga.discount_percentage) / 100;
        return sum + rigaDiscount;
      }, 0) || 0;
      const total = subtotal - discountAmount;

      // Aggiorna il preventivo
      const { error: updateError } = await supabase
        .from('preventivi')
        .update({
          subtotal: Math.round(subtotal * 100) / 100,
          discount_amount: Math.round(discountAmount * 100) / 100,
          total: Math.round(total * 100) / 100
        })
        .eq('id', preventivoId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Errore nel ricalcolo totali preventivo:', error);
      throw new Error('Impossibile ricalcolare i totali del preventivo');
    }
  }

  /**
   * Aggiorna un preventivo
   */
  static async updatePreventivo(id: string, updates: Partial<CreatePreventivoInput>): Promise<Preventivo> {
    try {
      const { data, error } = await supabase
        .from('preventivi')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Errore nell\'aggiornamento preventivo:', error);
      throw new Error('Impossibile aggiornare il preventivo');
    }
  }

  /**
   * Cambia lo stato di un preventivo
   */
  static async updatePreventivoStatus(id: string, status: PreventiveStatus): Promise<Preventivo> {
    try {
      const { data, error } = await supabase
        .from('preventivi')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Errore nell\'aggiornamento stato preventivo:', error);
      throw new Error('Impossibile aggiornare lo stato del preventivo');
    }
  }

  /**
   * Duplica un preventivo esistente
   */
  static async duplicatePreventivo(preventivoId: string): Promise<Preventivo> {
    try {
      const originalPreventivo = await this.getPreventivoById(preventivoId);
      if (!originalPreventivo) {
        throw new Error('Preventivo originale non trovato');
      }

      // Crea il nuovo preventivo
      const newPreventivo = await this.createPreventivo({
        agent_id: originalPreventivo.agent_id,
        client_name: `${originalPreventivo.client_name} (Copia)`,
        client_email: originalPreventivo.client_email,
        client_phone: originalPreventivo.client_phone,
        client_address: originalPreventivo.client_address,
        discount_scale_id: originalPreventivo.discount_scale_id,
        subtotal: 0,
        discount_amount: 0,
        total: 0,
        valid_until: originalPreventivo.valid_until,
        notes: originalPreventivo.notes
      });

      // Copia le righe
      for (const riga of originalPreventivo.righe) {
        await this.addRigaPreventivo({
          preventivo_id: newPreventivo.id,
          product_id: riga.product_id,
          quantity: riga.quantity,
          unit_price: riga.unit_price,
          discount_percentage: riga.discount_percentage,
          notes: riga.notes
        });
      }

      return newPreventivo;
    } catch (error) {
      console.error('Errore nella duplicazione preventivo:', error);
      throw new Error('Impossibile duplicare il preventivo');
    }
  }

  /**
   * Recupera statistiche sui preventivi
   */
  static async getPreventivoStats(agentId?: string): Promise<PreventivoStats> {
    try {
      let query = supabase.from('preventivi').select('*');
      
      if (agentId) {
        query = query.eq('agent_id', agentId);
      }

      const { data: preventivi, error } = await query;
      if (error) throw error;

      const stats: PreventivoStats = {
        total_preventivi: preventivi?.length || 0,
        preventivi_by_status: {
          [PreventiveStatus.BOZZA]: 0,
          [PreventiveStatus.INVIATO]: 0,
          [PreventiveStatus.ACCETTATO]: 0,
          [PreventiveStatus.RIFIUTATO]: 0,
          [PreventiveStatus.SCADUTO]: 0
        },
        total_value: 0,
        average_value: 0,
        conversion_rate: 0
      };

      if (preventivi && preventivi.length > 0) {
        // Conta per stato
        preventivi.forEach(p => {
          stats.preventivi_by_status[p.status as PreventiveStatus]++;
          stats.total_value += p.total || 0;
        });

        // Calcola media
        stats.average_value = Math.round((stats.total_value / preventivi.length) * 100) / 100;

        // Calcola tasso di conversione
        const inviati = stats.preventivi_by_status[PreventiveStatus.INVIATO];
        const accettati = stats.preventivi_by_status[PreventiveStatus.ACCETTATO];
        if (inviati + accettati > 0) {
          stats.conversion_rate = Math.round((accettati / (inviati + accettati)) * 100 * 100) / 100;
        }

        stats.total_value = Math.round(stats.total_value * 100) / 100;
      }

      return stats;
    } catch (error) {
      console.error('Errore nel calcolo statistiche preventivi:', error);
      throw new Error('Impossibile calcolare le statistiche dei preventivi');
    }
  }

  /**
   * Elimina un preventivo e le sue righe
   */
  static async deletePreventivo(id: string): Promise<void> {
    try {
      // Prima elimina le righe
      const { error: righeError } = await supabase
        .from('preventivo_righe')
        .delete()
        .eq('preventivo_id', id);

      if (righeError) throw righeError;

      // Poi elimina il preventivo
      const { error: preventivoError } = await supabase
        .from('preventivi')
        .delete()
        .eq('id', id);

      if (preventivoError) throw preventivoError;
    } catch (error) {
      console.error('Errore nell\'eliminazione preventivo:', error);
      throw new Error('Impossibile eliminare il preventivo');
    }
  }

  /**
   * Genera dati per export PDF/Excel (implementazione base)
   */
  static async generateExportData(
    preventivoId: string, 
    options: ExportOptions,
    companyInfo: CompanyInfo
  ): Promise<{
    preventivo: PreventivoDetailed;
    companyInfo: CompanyInfo;
    exportOptions: ExportOptions;
  }> {
    try {
      const preventivo = await this.getPreventivoById(preventivoId);
      if (!preventivo) {
        throw new Error('Preventivo non trovato');
      }

      return {
        preventivo,
        companyInfo,
        exportOptions: options
      };
    } catch (error) {
      console.error('Errore nella generazione dati export:', error);
      throw new Error('Impossibile generare i dati per l\'export');
    }
  }
}