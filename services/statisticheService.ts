/**
 * Servizio per la gestione delle statistiche Roloil
 * Fornisce funzioni per recuperare e calcolare statistiche di vendite, prodotti e preventivi
 */

import { supabase } from './supabaseClient';
import type { 
  Product, 
  Preventivo, 
  PreventiveStatus, 
  ProductCategory,
  PreventivoStats,
  ListinoStats 
} from '../types/listino';

// Interfacce per le statistiche
export interface StatisticheFilters {
  date_from?: string;
  date_to?: string;
  agent_id?: string;
}

export interface VenditeStats {
  totale_vendite: number;
  variazione_percentuale: number;
  vendite_per_mese: { mese: string; valore: number }[];
  fatturato_totale: number;
  obiettivo_raggiunto: number; // Percentuale
}

export interface ProdottiStats {
  totale_prodotti: number;
  prodotti_attivi: number;
  nuovi_prodotti: number;
  prezzo_medio: number;
}

export interface StatisticheGenerali {
  vendite: VenditeStats;
  prodotti: ProdottiStats;
  preventivi: PreventivoStats;
  periodo: {
    data_inizio: string;
    data_fine: string;
  };
}

/**
 * Servizio principale per le statistiche
 */
export class StatisticheService {
  
  /**
   * Recupera tutte le statistiche con filtri opzionali
   */
  static async getStatistiche(filtri?: StatisticheFilters): Promise<StatisticheGenerali> {
    try {
      const dataInizio = filtri?.date_from || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
      const dataFine = filtri?.date_to || new Date().toISOString().split('T')[0];

      // Recupera statistiche in parallelo
      const [venditeStats, prodottiStats, preventiviStats] = await Promise.all([
        this.getVenditeStats(filtri),
        this.getProdottiStats(filtri),
        this.getPreventiviStats(filtri)
      ]);

      return {
        vendite: venditeStats,
        prodotti: prodottiStats,
        preventivi: preventiviStats,
        periodo: {
          data_inizio: dataInizio,
          data_fine: dataFine
        }
      };
    } catch (error) {
      console.error('Errore nel recupero delle statistiche:', error);
      throw new Error('Impossibile recuperare le statistiche');
    }
  }

  /**
   * Recupera statistiche delle vendite
   */
  static async getVenditeStats(filtri?: StatisticheFilters): Promise<VenditeStats> {
    try {
      const dataInizio = filtri?.date_from || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
      const dataFine = filtri?.date_to || new Date().toISOString().split('T')[0];

      // Query per preventivi accettati nel periodo
      let query = supabase
        .from('preventivi')
        .select('*')
        .eq('status', PreventiveStatus.ACCETTATO)
        .gte('created_at', dataInizio)
        .lte('created_at', dataFine);

      if (filtri?.agent_id) {
        query = query.eq('agent_id', filtri.agent_id);
      }

      const { data: preventivi, error } = await query;
      
      if (error) throw error;

      // Calcola totale vendite e fatturato
      const totaleVendite = preventivi?.length || 0;
      const fatturatoTotale = preventivi?.reduce((sum, p) => sum + p.total, 0) || 0;

      // Calcola vendite per mese
      const venditePerMese = this.calcolaVenditePerMese(preventivi || []);

      // Calcola variazione percentuale (confronto con periodo precedente)
      const variazione = await this.calcolaVariazioneVendite(filtri);

      // Obiettivo fisso per ora (può essere configurabile)
      const obiettivoMensile = 50000;
      const mesiNelPeriodo = this.calcolaMesiNelPeriodo(dataInizio, dataFine);
      const obiettivoTotale = obiettivoMensile * mesiNelPeriodo;
      const obiettivoRaggiunto = obiettivoTotale > 0 ? (fatturatoTotale / obiettivoTotale) * 100 : 0;

      return {
        totale_vendite: totaleVendite,
        variazione_percentuale: variazione,
        vendite_per_mese: venditePerMese,
        fatturato_totale: fatturatoTotale,
        obiettivo_raggiunto: Math.min(obiettivoRaggiunto, 100)
      };
    } catch (error) {
      console.error('Errore nel recupero statistiche vendite:', error);
      throw new Error('Impossibile recuperare le statistiche delle vendite');
    }
  }

  /**
   * Recupera statistiche dei prodotti
   */
  static async getProdottiStats(filtri?: StatisticheFilters): Promise<ProdottiStats> {
    try {
      let query = supabase.from('products').select('*');

      const { data: prodotti, error } = await query;
      
      if (error) throw error;

      const totaleProdotti = prodotti?.length || 0;
      const prodottiAttivi = prodotti?.filter(p => p.is_active).length || 0;

      // Calcola nuovi prodotti (ultimi 30 giorni)
      const trentaGiorniFa = new Date();
      trentaGiorniFa.setDate(trentaGiorniFa.getDate() - 30);
      const nuoviProdotti = prodotti?.filter(p => 
        new Date(p.created_at) >= trentaGiorniFa
      ).length || 0;

      // Calcola prezzo medio
      const prezzoMedio = prodotti?.length > 0 
        ? prodotti.reduce((sum, p) => sum + p.apprli, 0) / prodotti.length 
        : 0;

      return {
        totale_prodotti: totaleProdotti,
        prodotti_attivi: prodottiAttivi,
        nuovi_prodotti: nuoviProdotti,
        prezzo_medio: prezzoMedio
      };
    } catch (error) {
      console.error('Errore nel recupero statistiche prodotti:', error);
      throw new Error('Impossibile recuperare le statistiche dei prodotti');
    }
  }

  /**
   * Recupera statistiche dei preventivi
   */
  static async getPreventiviStats(filtri?: StatisticheFilters): Promise<PreventivoStats> {
    try {
      const dataInizio = filtri?.date_from || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
      const dataFine = filtri?.date_to || new Date().toISOString().split('T')[0];

      let query = supabase
        .from('preventivi')
        .select('*')
        .gte('created_at', dataInizio)
        .lte('created_at', dataFine);

      if (filtri?.agent_id) {
        query = query.eq('agent_id', filtri.agent_id);
      }

      const { data: preventivi, error } = await query;
      
      if (error) throw error;

      const totalePreventivi = preventivi?.length || 0;

      // Raggruppa per status
      const preventiviPerStatus = preventivi?.reduce((acc, preventivo) => {
        acc[preventivo.status] = (acc[preventivo.status] || 0) + 1;
        return acc;
      }, {} as Record<PreventiveStatus, number>) || {} as Record<PreventiveStatus, number>;

      // Calcola valore totale e medio
      const valoreTotale = preventivi?.reduce((sum, p) => sum + p.total, 0) || 0;
      const valoreMedio = totalePreventivi > 0 ? valoreTotale / totalePreventivi : 0;

      // Calcola tasso di conversione
      const preventiviInviati = preventiviPerStatus[PreventiveStatus.INVIATO] || 0;
      const preventiviAccettati = preventiviPerStatus[PreventiveStatus.ACCETTATO] || 0;
      const tassoConversione = preventiviInviati > 0 
        ? (preventiviAccettati / (preventiviInviati + preventiviAccettati)) * 100 
        : 0;

      return {
        total_preventivi: totalePreventivi,
        preventivi_by_status: preventiviPerStatus,
        total_value: valoreTotale,
        average_value: valoreMedio,
        conversion_rate: tassoConversione
      };
    } catch (error) {
      console.error('Errore nel recupero statistiche preventivi:', error);
      throw new Error('Impossibile recuperare le statistiche dei preventivi');
    }
  }

  /**
   * Calcola vendite per mese
   */
  private static calcolaVenditePerMese(preventivi: Preventivo[]): { mese: string; valore: number }[] {
    const venditePerMese = preventivi.reduce((acc, preventivo) => {
      const data = new Date(preventivo.created_at);
      const mese = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[mese]) {
        acc[mese] = 0;
      }
      acc[mese] += preventivo.total;
      
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(venditePerMese)
      .map(([mese, valore]) => ({ mese, valore }))
      .sort((a, b) => a.mese.localeCompare(b.mese));
  }

  /**
   * Calcola variazione percentuale delle vendite rispetto al periodo precedente
   */
  private static async calcolaVariazioneVendite(filtri?: StatisticheFilters): Promise<number> {
    try {
      const dataInizio = filtri?.date_from || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
      const dataFine = filtri?.date_to || new Date().toISOString().split('T')[0];

      // Calcola periodo precedente
      const inizioPeriodo = new Date(dataInizio);
      const finePeriodo = new Date(dataFine);
      const durataPeriodo = finePeriodo.getTime() - inizioPeriodo.getTime();
      
      const inizioPrecedente = new Date(inizioPeriodo.getTime() - durataPeriodo);
      const finePrecedente = new Date(inizioPeriodo.getTime() - 1);

      // Query per periodo precedente
      let queryPrecedente = supabase
        .from('preventivi')
        .select('total')
        .eq('status', PreventiveStatus.ACCETTATO)
        .gte('created_at', inizioPrecedente.toISOString().split('T')[0])
        .lte('created_at', finePrecedente.toISOString().split('T')[0]);

      if (filtri?.agent_id) {
        queryPrecedente = queryPrecedente.eq('agent_id', filtri.agent_id);
      }

      const { data: preventiviPrecedenti } = await queryPrecedente;
      
      const fatturatoAttuale = await this.getFatturatoTotale(filtri);
      const fatturatoPrecedente = preventiviPrecedenti?.reduce((sum, p) => sum + p.total, 0) || 0;

      if (fatturatoPrecedente === 0) return 0;
      
      return ((fatturatoAttuale - fatturatoPrecedente) / fatturatoPrecedente) * 100;
    } catch (error) {
      console.error('Errore nel calcolo variazione vendite:', error);
      return 0;
    }
  }

  /**
   * Calcola il fatturato totale per il periodo specificato
   */
  private static async getFatturatoTotale(filtri?: StatisticheFilters): Promise<number> {
    const dataInizio = filtri?.date_from || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
    const dataFine = filtri?.date_to || new Date().toISOString().split('T')[0];

    let query = supabase
      .from('preventivi')
      .select('total')
      .eq('status', PreventiveStatus.ACCETTATO)
      .gte('created_at', dataInizio)
      .lte('created_at', dataFine);

    if (filtri?.agent_id) {
      query = query.eq('agent_id', filtri.agent_id);
    }

    const { data: preventivi } = await query;
    return preventivi?.reduce((sum, p) => sum + p.total, 0) || 0;
  }

  /**
   * Calcola il numero di mesi nel periodo specificato
   */
  private static calcolaMesiNelPeriodo(dataInizio: string, dataFine: string): number {
    const inizio = new Date(dataInizio);
    const fine = new Date(dataFine);
    
    const anni = fine.getFullYear() - inizio.getFullYear();
    const mesi = fine.getMonth() - inizio.getMonth();
    
    return Math.max(1, anni * 12 + mesi + 1);
  }
}

// Export del servizio come default e named export per compatibilità
export const statisticheService = StatisticheService;
export default StatisticheService;