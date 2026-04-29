/**
 * Servizio per la gestione di prodotti e listini Roloil
 * Fornisce funzioni CRUD, ricerca, filtri e calcolo prezzi con scale di sconto
 */

import { supabase } from './supabaseClient';
// supabaseAdmin non più necessario - le policy RLS gestiscono i permessi admin
import * as XLSX from 'xlsx';
import type {
  Product,
  DiscountScale,
  ProductFilters,
  ProductWithDiscount,
  CreateProductInput,
  UpdateProductInput,
  ProductCategory,
  DiscountScaleType,
  ListinoStats,
  ValidationResult,
  ImportResult,
  Scale,
  CalculationResult,
  ScaleOption,
  ProductPaginatedResponse
} from '../types/listino';



/**
 * Servizio principale per la gestione del listino prodotti
 */
export class ListinoService {
  /**
   * Mappa i campi di ordinamento dal naming UI (camelCase) ai nomi colonna DB (snake_case)
   */
  private static mapSortField(field?: string): string {
    console.log('🔄 mapSortField called with field:', field);

    if (!field || field === 'none') {
      console.log('🔄 Returning default sort field: apcpro');
      return 'apcpro';
    }

    const mapping: Record<string, string> = {
      minimoAgente: 'minimo_agente',
      minimaProvvigione: 'minima_provvigione',
      apcpro: 'apcpro',
      aplibint: 'aplibint',
      descrizione: 'descrizione',
      apdesi: 'apdesi',
      brand: 'brand',
      apprli: 'apprli',
      aplib1: 'aplib1',
      xde40: 'xde40',
      xde60: 'xde60',
      appesf: 'appesf',
      apunmi: 'apunmi',
      promoPrezzo: 'promo_prezzo',
      promoDAL: 'promo_dal',
      promoAL: 'promo_al',
      imponibile: 'imponibile',
      provv: 'provv',
      prezzo_old: 'prezzo_old',
      prezzo_aprile_2026: 'prezzo_aprile_2026',
      variaz: 'variaz'
    };

    const mappedField = mapping[field] || field;
    console.log('🔄 Mapped field:', field, '->', mappedField);

    return mappedField;
  }

  /**
   * Recupera tutti i prodotti con filtri opzionali
   * VERSIONE OTTIMIZZATA: Include colonne pre-calcolate
   */
  static async getProducts(filters?: ProductFilters): Promise<Product[]> {
    try {
      console.log('🔍 getProducts called with filters:', filters);
      let query = supabase
        .from('products')
        .select(`
          *,
          minimo_agente,
          minima_provvigione,
          imponibile,
          provv
        `);

      // Applica filtri
      if (filters?.active !== undefined) {
        query = query.eq('is_active', filters.active);
      }

      if (filters?.search) {
        const searchTerm = filters.search.trim();
        if (searchTerm) {
          // LOGICA SEMPLIFICATA: solo % all'inizio e alla fine
          // NON sostituire spazi con %, cerca il testo esatto
          const simplePattern = `%${searchTerm}%`;

          // DEBUG: Log del pattern generato
          console.log('🔍 SEARCH DEBUG (SIMPLIFIED):');
          console.log('  Input originale:', filters.search);
          console.log('  Search term (trimmed):', searchTerm);
          console.log('  Simple pattern:', simplePattern);

          try {
            // Cerca il pattern in tutti e 3 i campi con OR
            query = query.or(`descrizione.ilike.${simplePattern},apdesi.ilike.${simplePattern},apcpro.ilike.${simplePattern}`);
            console.log('  ✅ Simple .or() query applied across all fields');
          } catch (error) {
            console.error('  ❌ Errore con .or(), uso fallback:', error);

            // Fallback: cerca solo nella descrizione
            query = query.ilike('descrizione', simplePattern);
            console.log('  ⚠️ Fallback: usando solo descrizione.ilike');
          }
        }
      }

      if (filters?.price_min !== undefined) {
        query = query.gte('apprli', filters.price_min);
      }

      if (filters?.price_max !== undefined) {
        query = query.lte('apprli', filters.price_max);
      }

      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      // Nuovi filtri dropdown
      if (filters?.brand) {
        query = query.eq('brand', filters.brand);
      }

      // Filtro APDESI - ora compatibile con la ricerca wildcard
      if (filters?.apdesi) {
        query = query.eq('apdesi', filters.apdesi);
      }

      if (filters?.xde40) {
        query = query.eq('xde40', filters.xde40);
      }

      if (filters?.xde60) {
        query = query.eq('xde60', filters.xde60);
      }

      if (filters?.aplib1) {
        console.log('🔍 APLIB1 FILTER DEBUG:');
        console.log('  filters.aplib1:', filters.aplib1);
        console.log('  typeof filters.aplib1:', typeof filters.aplib1);
        query = query.eq('aplib1', filters.aplib1);
        console.log('  ✅ APLIB1 filter applied to query');
      }

      // Filtro obsoleti
      if (filters?.obsoleto === true) {
        query = query.eq('obsoleto', true);
      } else {
        // Di default, nascondi i prodotti obsoleti
        query = query.or('obsoleto.eq.false,obsoleto.is.null');
      }

      // Applica ordinamento
      if (filters?.sort_field && filters.sort_field !== 'none') {
        const ascending = filters.sort_direction === 'asc';
        const sortColumn = ListinoService.mapSortField(filters.sort_field as string);
        query = query.order(sortColumn, { ascending });
        
        // Regola speciale: se ordiniamo per descrizione (o apdesi), aggiungiamo un ordinamento secondario
        // per quantità imballo (appesf) in ordine decrescente
        if (sortColumn === 'descrizione' || sortColumn === 'apdesi') {
          query = query.order('appesf', { ascending: false });
        }
      } else {
        // Ordinamento di default per codice prodotto
        query = query.order('apcpro', { ascending: true });
      }

      // Paginazione lato server (default: 50 per pagina)
      const pageSize = filters?.page_size ?? 50;
      const page = filters?.page ?? 1;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Errore nel recupero prodotti:', error);
      throw new Error('Impossibile recuperare i prodotti');
    }
  }

  /**
   * Recupera un prodotto per ID
   * VERSIONE OTTIMIZZATA: Include colonne pre-calcolate
   */
  static async getProductById(id: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          minimo_agente,
          minima_provvigione,
          imponibile,
          provv
        `)
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Errore nel recupero prodotto:', error);
      throw new Error('Impossibile recuperare il prodotto');
    }
  }

  /**
   * Recupera un prodotto per codice
   * VERSIONE OTTIMIZZATA: Include colonne pre-calcolate
   */
  static async getProductByCode(code: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          minimo_agente,
          minima_provvigione,
          imponibile,
          provv
        `)
        .eq('apcpro', code)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Errore nel recupero prodotto per codice:', error);
      throw new Error('Impossibile recuperare il prodotto');
    }
  }

  /**
   * Recupera valori unici per i filtri dropdown
   */
  static async getUniqueValues(field: 'brand' | 'apdesi' | 'xde40' | 'xde60' | 'aplib1' | 'appesf' | 'apunmi'): Promise<string[]> {
    try {
      console.log(`🔍 getUniqueValues called for field: ${field}`);
      const { data, error } = await supabase
        .from('products')
        .select(field)
        .not(field, 'is', null)
        .neq(field, '')
        .order(field);

      if (error) throw error;

      // Rimuovi duplicati e valori vuoti
      const uniqueValues = [...new Set(data.map(item => item[field]).filter(Boolean))];
      console.log(`✅ Found ${uniqueValues.length} unique values for ${field}:`, uniqueValues.slice(0, 5));
      return uniqueValues;
    } catch (error) {
      console.error(`❌ Errore nel recupero valori unici per ${field}:`, error);
      return [];
    }
  }

  /**
   * Recupera tutti i valori unici per tutti i filtri dropdown
   */
  static async getAllUniqueValues(): Promise<{
    brands: string[];
    apdesi: string[];
    xde40: string[];
    xde60: string[];
    aplib1: string[];
    appesf: string[];
    apunmi: string[];
  }> {
    try {
      const [brands, apdesi, xde40, xde60, aplib1, appesf, apunmi] = await Promise.all([
        this.getUniqueValues('brand'),
        this.getUniqueValues('apdesi'),
        this.getUniqueValues('xde40'),
        this.getUniqueValues('xde60'),
        this.getUniqueValues('aplib1'),
        this.getUniqueValues('appesf'),
        this.getUniqueValues('apunmi')
      ]);

      return { brands, apdesi, xde40, xde60, aplib1, appesf, apunmi };
    } catch (error) {
      console.error('Errore nel recupero di tutti i valori unici:', error);
      return { brands: [], apdesi: [], xde40: [], xde60: [], aplib1: [], appesf: [], apunmi: [] };
    }
  }

  /**
   * Recupera i valori XDE60 filtrati in base al valore XDE40 selezionato
   */
  static async getXDE60ValuesForXDE40(xde40Value: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('xde60')
        .eq('xde40', xde40Value)
        .not('xde60', 'is', null)
        .neq('xde60', '')
        .order('xde60');

      if (error) throw error;

      // Rimuovi duplicati e valori vuoti
      const uniqueValues = [...new Set(data.map(item => item.xde60).filter(Boolean))];
      return uniqueValues;
    } catch (error) {
      console.error(`Errore nel recupero valori XDE60 per XDE40 ${xde40Value}:`, error);
      return [];
    }
  }

  /**
   * Recupera tutti i valori unici per il campo Brand
   */
  static async getUniqueBrands(): Promise<string[]> {
    return this.getUniqueValues('brand');
  }

  /**
   * Recupera tutti i valori unici per il campo APDESI
   */
  static async getUniqueApdesi(): Promise<string[]> {
    return this.getUniqueValues('apdesi');
  }

  /**
   * Recupera tutti i valori unici per il campo XDE40
   */
  static async getUniqueXDE40(): Promise<string[]> {
    return this.getUniqueValues('xde40');
  }

  /**
   * Recupera tutti i valori unici per il campo XDE60
   */
  static async getUniqueXDE60(): Promise<string[]> {
    return this.getUniqueValues('xde60');
  }

  /**
   * Recupera tutti i valori unici per il campo APLIB1
   */
  static async getUniqueAplib1(): Promise<string[]> {
    return this.getUniqueValues('aplib1');
  }

  /**
   * Recupera tutti i valori unici per il campo APPESF
   */
  static async getUniqueAppesf(): Promise<string[]> {
    return this.getUniqueValues('appesf');
  }

  /**
   * Recupera tutti i valori unici per il campo APUNMI
   */
  static async getUniqueApunmi(): Promise<string[]> {
    return this.getUniqueValues('apunmi');
  }

  /**
   * Crea un nuovo prodotto o aggiorna se esiste già (upsert)
   * Ora accessibile a tutti gli utenti autenticati
   */
  static async createProduct(productData: CreateProductInput): Promise<Product> {
    try {
      // Valida i dati prima dell'inserimento
      const validation = this.validateProductData(productData);
      if (!validation.valid) {
        throw new Error(`Dati prodotto non validi: ${validation.errors.join(', ')}`);
      }

      // Usa il client normale - le policy RLS verificano che l'utente sia autenticato e attivo
      // Usa upsert per gestire duplicati su aplibint (unico campo veramente univoco)
      const { data, error } = await supabase
        .from('products')
        .upsert([productData], {
          onConflict: 'aplibint',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) throw error;
      // Assicura campi calcolati (minimo_agente, minima_provvigione, imponibile, provv)
      const ensured = await this.ensureComputedFieldsForProduct(data as Product);
      return ensured;
    } catch (error) {
      // Estrai il messaggio di errore in modo più dettagliato
      let errorMessage = 'Errore sconosciuto';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        // Gestisci errori Supabase che potrebbero avere strutture specifiche
        if ('message' in error) {
          errorMessage = String((error as any).message);
        } else if ('error' in error) {
          errorMessage = String((error as any).error);
        } else if ('details' in error) {
          errorMessage = String((error as any).details);
        } else {
          errorMessage = JSON.stringify(error);
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      console.error('Errore nella creazione/aggiornamento prodotto:', errorMessage);
      throw new Error(`Impossibile creare/aggiornare il prodotto: ${errorMessage}`);
    }
  }

  /**
   * Aggiorna un prodotto esistente
   * Ora accessibile a tutti gli utenti autenticati
   */
  static async updateProduct(
    id: string,
    updates: UpdateProductInput
  ): Promise<Product> {
    try {
      // Usa il client normale - le policy RLS verificano che l'utente sia autenticato e attivo
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      // Assicura campi calcolati
      const ensured = await this.ensureComputedFieldsForProduct(data as Product);
      return ensured;
    } catch (error) {
      // Estrai il messaggio di errore in modo più dettagliato
      let errorMessage = 'Errore sconosciuto nell\'aggiornamento';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        // Gestisci errori Supabase che potrebbero avere strutture specifiche
        if ('message' in error) {
          errorMessage = String((error as any).message);
        } else if ('error' in error) {
          errorMessage = String((error as any).error);
        } else if ('details' in error) {
          errorMessage = String((error as any).details);
        } else {
          errorMessage = JSON.stringify(error);
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      console.error('Errore nell\'aggiornamento prodotto:', errorMessage);
      throw new Error(`Impossibile aggiornare il prodotto: ${errorMessage}`);
    }
  }

  /**
   * Aggiorna un prodotto esistente con controlli admin e audit logging
   * Versione specifica per l'editing da parte degli amministratori
   */
  static async updateProductByAdmin(
    id: string,
    updates: UpdateProductInput,
    userId: string
  ): Promise<Product> {
    try {
      // DEBUG: Log degli input ricevuti
      console.log('🔍 DEBUG updateProductByAdmin - Input:', {
        id,
        updates,
        userId,
        updatesKeys: Object.keys(updates),
        promoPrezzo: updates.promoPrezzo,
        promoDAL: updates.promoDAL,
        promoAL: updates.promoAL
      });

      // Prima recupera il prodotto esistente per l'audit log
      const existingProduct = await this.getProductById(id);
      if (!existingProduct) {
        throw new Error('Prodotto non trovato');
      }

      // Valida i campi modificabili (solo quelli consentiti agli admin)
      const allowedFields = ['descrizione', 'apprli', 'appesf', 'CONOU', 'aplib1', 'promoDAL', 'promoAL', 'promoPrezzo', 'obsoleto'];
      const filteredUpdates: UpdateProductInput = {};

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          filteredUpdates[key as keyof UpdateProductInput] = value;
        }
      }

      // DEBUG: Log dei campi filtrati
      console.log('🔍 DEBUG updateProductByAdmin - Filtered Updates:', {
        filteredUpdates,
        filteredKeys: Object.keys(filteredUpdates),
        promoPrezzo: filteredUpdates.promoPrezzo,
        promoDAL: filteredUpdates.promoDAL,
        promoAL: filteredUpdates.promoAL
      });

      // Validazione specifica per i campi
      if (filteredUpdates.descrizione && filteredUpdates.descrizione.length > 255) {
        throw new Error('La descrizione non può superare i 255 caratteri');
      }

      if (filteredUpdates.apprli && (filteredUpdates.apprli <= 0 || filteredUpdates.apprli > 999999)) {
        throw new Error('Il prezzo deve essere compreso tra 0.01 e 999999');
      }

      if (filteredUpdates.appesf && (filteredUpdates.appesf <= 0 || filteredUpdates.appesf > 9999)) {
        throw new Error('Il peso specifico deve essere compreso tra 0.01 e 9999');
      }

      if (filteredUpdates.CONOU && (filteredUpdates.CONOU < 0 || filteredUpdates.CONOU > 999)) {
        throw new Error('La tassa CONOU deve essere compresa tra 0 e 999');
      }

      // Validazioni per i campi promo
      if (filteredUpdates.promoDAL && filteredUpdates.promoAL) {
        const startDate = new Date(filteredUpdates.promoDAL);
        const endDate = new Date(filteredUpdates.promoAL);
        if (startDate >= endDate) {
          throw new Error('La data di inizio promo deve essere precedente alla data di fine');
        }
      }

      if (filteredUpdates.promoPrezzo && filteredUpdates.promoPrezzo <= 0) {
        throw new Error('Il prezzo promo deve essere maggiore di 0');
      }

      // Prepara l'oggetto finale per l'update
      const finalUpdates = {
        ...filteredUpdates,
        updated_at: new Date().toISOString()
      };

      // DEBUG: Log dell'oggetto finale che verrà inviato al database
      console.log('🔍 DEBUG updateProductByAdmin - Final Updates for DB:', {
        finalUpdates,
        finalKeys: Object.keys(finalUpdates),
        promoPrezzo: finalUpdates.promoPrezzo,
        promoDAL: finalUpdates.promoDAL,
        promoAL: finalUpdates.promoAL
      });

      // Aggiorna il prodotto usando il client normale (con RLS)
      const { data, error } = await supabase
        .from('products')
        .update(finalUpdates)
        .eq('id', id)
        .select(`
          *,
          minimo_agente,
          minima_provvigione,
          imponibile,
          provv
        `)
        .single();

      // DEBUG: Log della risposta del database
      console.log('🔍 DEBUG updateProductByAdmin - DB Response:', {
        error,
        data: data ? {
          id: data.id,
          promoPrezzo: data.promoPrezzo,
          promoDAL: data.promoDAL,
          promoAL: data.promoAL,
          updated_at: data.updated_at
        } : null
      });

      if (error) {
        console.error('🚨 DEBUG updateProductByAdmin - DB Error:', error);
        throw error;
      }

      // Log dell'audit (il trigger del database si occuperà automaticamente del logging)
      console.log(`✅ Prodotto ${id} aggiornato dall'admin ${userId}`);

      // Assicura campi calcolati
      const ensured = await this.ensureComputedFieldsForProduct(data as Product);
      return ensured;
    } catch (error) {
      let errorMessage = 'Errore sconosciuto nell\'aggiornamento admin';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        if ('message' in error) {
          errorMessage = String(error.message);
        } else if ('error' in error) {
          errorMessage = String(error.error);
        } else if ('details' in error) {
          errorMessage = String(error.details);
        } else {
          errorMessage = JSON.stringify(error);
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      console.error('🚨 DEBUG updateProductByAdmin - Final Error:', errorMessage);
      throw new Error(`Impossibile aggiornare il prodotto: ${errorMessage}`);
    }
  }

  /**
   * Elimina un prodotto
   * Ora accessibile a tutti gli utenti autenticati (secondo le policy RLS aggiornate)
   */
  static async deleteProduct(
    id: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Errore nell\'eliminazione prodotto:', error);
      throw new Error('Impossibile eliminare il prodotto');
    }
  }

  /**
   * Duplica un prodotto con un nuovo APLIBINT
   */
  static async duplicateProduct(originalId: string, newAplibint: string): Promise<Product> {
    try {
      // Verifica che il nuovo APLIBINT non esista già
      const existingProduct = await this.getProductByAplibint(newAplibint);
      if (existingProduct) {
        throw new Error('APLIBINT già esistente');
      }

      // Recupera il prodotto originale
      const originalProduct = await this.getProductById(originalId);
      if (!originalProduct) {
        throw new Error('Prodotto originale non trovato');
      }

      // Crea una copia del prodotto escludendo id, created_at, updated_at e sostituendo aplibint
      const { id, created_at, updated_at, ...productData } = originalProduct;
      const duplicatedProductData: CreateProductInput = {
        ...productData,
        aplibint: newAplibint
      };

      // Crea il nuovo prodotto
      const newProduct = await this.createProduct(duplicatedProductData);
      return newProduct;
    } catch (error) {
      console.error('Errore nella duplicazione prodotto:', error);
      if (error instanceof Error) {
        throw error; // Rilancia l'errore originale se è già un Error
      }
      throw new Error('Impossibile duplicare il prodotto');
    }
  }

  /**
   * Recupera tutte le scale di sconto
   */
  static async getDiscountScales(): Promise<DiscountScale[]> {
    try {
      const { data, error } = await supabase
        .from('scales')
        .select('*')
        .order('Scala', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Errore nel recupero scale di sconto:', error);
      throw new Error('Impossibile recuperare le scale di sconto');
    }
  }

  /**
   * Recupera una scala di sconto per tipo
   */
  static async getDiscountScaleByType(scaleType: DiscountScaleType): Promise<DiscountScale | null> {
    try {
      const { data, error } = await supabase
        .from('scales')
        .select('*')
        .eq('Scala', scaleType)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Errore nel recupero scala di sconto:', error);
      throw new Error('Impossibile recuperare la scala di sconto');
    }
  }

  /**
   * Calcola il prezzo scontato per un prodotto
   */
  static calculateDiscountedPrice(
    basePrice: number,
    discountPercentage: number
  ): { discountedPrice: number; finalPrice: number; discountAmount: number } {
    const discountAmount = (basePrice * discountPercentage) / 100;
    const discountedPrice = basePrice - discountAmount;
    const finalPrice = discountedPrice;

    return {
      discountedPrice: Math.round(discountedPrice * 100) / 100,
      finalPrice: Math.round(finalPrice * 100) / 100,
      discountAmount: Math.round(discountAmount * 100) / 100
    };
  }

  /**
   * Applica una scala di sconto a una lista di prodotti
   */
  static async applyDiscountScale(
    products: Product[],
    scaleType: DiscountScaleType
  ): Promise<ProductWithDiscount[]> {
    try {
      const discountScale = await this.getDiscountScaleByType(scaleType);
      if (!discountScale) {
        throw new Error(`Scala di sconto ${scaleType} non trovata`);
      }

      return products.map(product => {
        const pricing = this.calculateDiscountedPrice(
          product.apprli,
          discountScale.discount_percentage
        );

        return {
          ...product,
          discount_percentage: discountScale.discount_percentage,
          discounted_price: pricing.discountedPrice,
          final_price: pricing.finalPrice
        };
      });
    } catch (error) {
      console.error('Errore nell\'applicazione scala di sconto:', error);
      throw new Error('Impossibile applicare la scala di sconto');
    }
  }

  /**
   * Cerca prodotti per testo
   */
  static async searchProducts(searchTerm: string): Promise<Product[]> {
    return this.getProducts({ search: searchTerm, active: true });
  }

  /**
   * Recupera statistiche del listino
   */
  static async getListinoStats(): Promise<ListinoStats> {
    try {
      const products = await this.getProducts();

      const stats: ListinoStats = {
        total_products: products.length,
        products_by_category: {} as Record<ProductCategory, number>,
        average_price: 0,
        price_range: { min: 0, max: 0 },
        products_with_conou: 0,
        active_products: products.filter(p => p.is_active).length
      };

      if (products.length > 0) {
        // Calcola statistiche prezzi
        const prices = products.map(p => p.apprli);
        stats.average_price = Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100;
        stats.price_range.min = Math.min(...prices);
        stats.price_range.max = Math.max(...prices);
      }

      return stats;
    } catch (error) {
      console.error('Errore nel calcolo statistiche:', error);
      throw new Error('Impossibile calcolare le statistiche del listino');
    }
  }

  /**
   * Valida i dati di un prodotto
   */
  static validateProductData(productData: Partial<Product>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validazioni obbligatorie
    if (!productData.apcpro?.trim()) {
      errors.push('Il codice prodotto è obbligatorio');
    }

    if (productData.apprli === undefined || productData.apprli <= 0) {
      errors.push('Il prezzo base deve essere maggiore di zero');
    }

    if (!productData.apunmi?.trim()) {
      errors.push('L\'unità di misura è obbligatoria');
    }

    // Validazioni formato
    if (productData.apcpro && productData.apcpro.length > 50) {
      errors.push('Il codice prodotto non può superare i 50 caratteri');
    }

    // Avvisi
    if (productData.apprli && productData.apprli > 1000) {
      warnings.push('Prezzo elevato: verificare che sia corretto');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Attiva/disattiva un prodotto
   */
  static async toggleProductStatus(id: string): Promise<Product> {
    try {
      const product = await this.getProductById(id);
      if (!product) {
        throw new Error('Prodotto non trovato');
      }

      return this.updateProduct(id, { is_active: !product.is_active });
    } catch (error) {
      console.error('Errore nel cambio stato prodotto:', error);
      throw new Error('Impossibile modificare lo stato del prodotto');
    }
  }

  /**
   * Importa prodotti da file Excel
   */
  static async importProductsFromExcel(file: File): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      totalRows: 0,
      importedRows: 0,
      updatedRows: 0,
      errors: [],
      warnings: []
    };

    try {
      // Leggi il file Excel
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });

      // Prendi il primo foglio
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Converti in JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      if (jsonData.length < 2) {
        result.errors.push('Il file Excel deve contenere almeno una riga di intestazione e una di dati');
        return result;
      }

      // Estrai le intestazioni (prima riga)
      const rawHeaders = jsonData[0] as any[];
      // Pulisci e normalizza le intestazioni
      const headers = rawHeaders.map((header, index) => {
        if (header === null || header === undefined) {
          return `Column_${index + 1}`;
        }
        return header.toString().trim();
      });

      const dataRows = jsonData.slice(1);

      result.totalRows = dataRows.length;

      // Debug: log delle intestazioni lette
      console.log('Intestazioni lette dal file Excel:', headers);
      console.log('Prima intestazione (colonna A):', headers[0]);

      // Mappa le intestazioni ai campi del database
      const fieldMapping = this.createFieldMapping(headers);

      // Debug: log della mappatura
      console.log('Mappatura campi creata:', fieldMapping);

      if (fieldMapping.aplibint === undefined) {
        result.errors.push(`Campo APLIBINT non trovato nel file Excel. Questo campo è obbligatorio come codice univoco. Intestazioni trovate: ${headers.join(', ')}`);
        return result;
      }

      // Processa ogni riga
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const rowNumber = i + 2; // +2 perché partiamo dalla riga 1 e saltiamo l'intestazione

        try {
          const productData = this.mapRowToProduct(row, fieldMapping, headers);

          if (!productData.aplibint) {
            result.warnings.push(`Riga ${rowNumber}: APLIBINT mancante, riga saltata`);
            continue;
          }

          // Valida i dati del prodotto
          const validation = this.validateProductData(productData);
          if (!validation.valid) {
            result.errors.push(`Riga ${rowNumber}: ${validation.errors.join(', ')}`);
            continue;
          }

          // Aggiungi eventuali warning
          if (validation.warnings.length > 0) {
            result.warnings.push(`Riga ${rowNumber}: ${validation.warnings.join(', ')}`);
          }

          // Usa upsert per creare o aggiornare il prodotto automaticamente
          await this.createProduct(productData as CreateProductInput);
          result.importedRows++;

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
          result.errors.push(`Riga ${rowNumber}: ${errorMessage}`);
        }
      }

      result.success = result.errors.length === 0 || (result.importedRows + result.updatedRows) > 0;

    } catch (error) {
      console.error('Errore durante l\'importazione Excel:', error);
      result.errors.push(`Errore generale: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
    }

    return result;
  }

  /**
   * Crea la mappatura tra le intestazioni Excel e i campi del database
   */
  static createFieldMapping(headers: string[]): Record<string, number> {
    const mapping: Record<string, number> = {};

    // Mappa i campi principali (case-insensitive)
    const fieldMappings = {
      'aplibint': ['aplibint', 'APLIBINT', 'Aplibint'],
      'apcpro': ['apcpro', 'APCPRO', 'codice', 'Apcpro'],
      'apcimb': ['apcimb', 'APCIMB', 'Apcimb'],
      'brand': ['brand', 'BRAND', 'marca', 'Brand'],
      'descrizione': ['descrizione', 'DESCRIZIONE', 'nome', 'Descrizione'],
      'apdesi': ['apdesi', 'APDESI', 'descrizione_estesa', 'Apdesi'],
      'appesf': ['appesf', 'APPESF', 'peso_specifico', 'Appesf'],
      'apunmi': ['apunmi', 'APUNMI', 'unita_misura', 'Apunmi'],
      'xde40': ['xde40', 'XDE40', 'viscosita_40', 'Xde40'],
      'xde60': ['xde60', 'XDE60', 'viscosita_60', 'Xde60'],
      'apprli': ['apprli', 'APPRLI', 'prezzo', 'Apprli'],
      'aplib1': ['aplib1', 'APLIB1', 'Aplib1'],
      'aplib7': ['aplib7', 'APLIB7', 'Aplib7'],
      'CONOU': ['conou', 'CONOU', 'conouRate', 'conourate', 'CONOURATE', 'Conou']
    };

    // Per ogni campo del database, cerca la corrispondenza nelle intestazioni
    for (const [dbField, possibleHeaders] of Object.entries(fieldMappings)) {
      for (let i = 0; i < headers.length; i++) {
        const header = headers[i]?.toString().trim();

        // Debug per campi critici
        if (dbField === 'aplibint' || dbField === 'CONOU') {
          console.log(`Controllo ${dbField} - Header ${i}: "${header}"`);
        }

        // Confronto case-insensitive più robusto
        if (header && possibleHeaders.some(ph => {
          const match = ph.toLowerCase() === header.toLowerCase();
          if ((dbField === 'aplibint' || dbField === 'CONOU') && match) {
            console.log(`${dbField} trovato! Header: "${header}" corrisponde a "${ph}" alla posizione ${i}`);
          }
          return match;
        })) {
          mapping[dbField] = i;
          if (dbField === 'aplibint' || dbField === 'CONOU') {
            console.log(`${dbField} mappato alla colonna ${i}`);
          }
          break;
        }
      }
    }

    console.log('Mappatura finale dei campi:', mapping);
    return mapping;
  }

  /**
   * Mappa una riga Excel ai campi del prodotto
   */
  static mapRowToProduct(
    row: any[],
    fieldMapping: Record<string, number>,
    headers: string[]
  ): Partial<Product> {
    const product: Partial<Product> = {
      is_active: true // Default per nuovi prodotti
    };

    // Mappa i campi usando la mappatura
    for (const [dbField, columnIndex] of Object.entries(fieldMapping)) {
      if (columnIndex !== undefined && row[columnIndex] !== undefined && row[columnIndex] !== null) {
        const value = row[columnIndex];

        switch (dbField) {
          case 'aplibint':
          case 'apcpro':
          case 'apcimb':
          case 'brand':
          case 'descrizione':
          case 'apdesi':
          case 'apunmi':
          case 'xde40':
          case 'xde60':
          case 'aplib1':
          case 'aplib7':
            product[dbField as keyof Product] = value?.toString().trim() || '';
            break;

          case 'appesf':
          case 'apprli':
            const numValue = typeof value === 'number' ? value : parseFloat(value?.toString().replace(',', '.') || '0');
            if (!isNaN(numValue)) {
              product[dbField as keyof Product] = numValue;
            }
            break;

          case 'CONOU':
            console.log(`CONOU - Valore originale: "${value}" (tipo: ${typeof value})`);
            const conouValue = typeof value === 'number' ? value : parseFloat(value?.toString().replace(',', '.') || '0');
            console.log(`CONOU - Valore convertito: ${conouValue} (isNaN: ${isNaN(conouValue)})`);
            if (!isNaN(conouValue)) {
              // Arrotonda a massimo 5 decimali
              const roundedConouValue = parseFloat(conouValue.toFixed(5));
              product[dbField as keyof Product] = roundedConouValue;
              console.log(`CONOU - Valore finale assegnato (arrotondato a 5 decimali): ${roundedConouValue}`);
            } else {
              console.log(`CONOU - Valore scartato perché NaN`);
            }
            break;
        }
      }
    }



    return product;
  }

  /**
   * Recupera un prodotto per APLIBINT
   */
  static async getProductByAplibint(aplibint: string): Promise<Product | null> {
    try {
      // Usa il client normale - la lettura è permessa a tutti gli autenticati
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('aplibint', aplibint)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Errore nel recupero prodotto per APLIBINT:', error);
      return null;
    }
  }

  // =====================================================
  // METODI PER IL CALCOLATORE PREZZI E SCALE
  // =====================================================

  /**
   * Recupera tutte le scale di commissioni dalla tabella 'scales'
   */
  static async getScales(): Promise<Scale[]> {
    try {
      console.log('🔍 Recupero scale dalla tabella "scales"...');

      const { data, error } = await supabase
        .from('scales')
        .select('*')
        .order('Scala', { ascending: true })
        .order('Sconto', { ascending: true });

      if (error) throw error;

      console.log(`✅ Trovati ${data?.length || 0} record nella tabella 'scales'`);

      // Converte i dati dalla struttura della tabella 'scales' al formato Scale
      const scales = (data || []).map(item => ({
        id: item.id,
        scale: item.Scala,
        commission: item.Provv, // Provv è già in decimale (0.05 = 5%)
        discount: item.Sconto, // Sconto è in euro fissi, non percentuale
        is_active: true,
        provv_minima: false,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));

      return scales;
    } catch (error) {
      console.error('Errore nel recupero scale:', error);
      throw new Error('Impossibile recuperare le scale di commissioni');
    }
  }

  /**
   * Recupera le scale per una specifica scala (A, B, C, D, E, P)
   */
  static async getScalesByType(scaleType: string): Promise<Scale[]> {
    try {
      console.log(`🔍 Recupero scale per tipo "${scaleType}" dalla tabella "scales"...`);

      const { data, error } = await supabase
        .from('scales')
        .select('*')
        .eq('Scala', scaleType)
        .order('Sconto', { ascending: true });

      if (error) throw error;

      console.log(`✅ Trovati ${data?.length || 0} record per scala "${scaleType}"`);

      // Converte i dati dalla struttura della tabella 'scales' al formato Scale
      const scales = (data || []).map(item => ({
        id: item.id,
        scale: item.Scala,
        commission: item.Provv, // Provv è già in decimale (0.05 = 5%)
        discount: item.Sconto, // Sconto è in euro fissi, non percentuale
        is_active: true,
        provv_minima: false,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));

      return scales;
    } catch (error) {
      console.error(`Errore nel recupero scale per tipo ${scaleType}:`, error);
      throw new Error(`Impossibile recuperare le scale di tipo ${scaleType}`);
    }
  }

  /**
   * Calcola MINAGE dato un prodotto e uno sconto
   * MINAGE = APPRLI - sconto
   */
  static calculateMinage(basePrice: number, discount: number): number {
    return Math.max(0, basePrice - discount);
  }

  /**
   * Calcola IMPONIBILE e PROVV coerenti con la logica SQL (migr. 020/021/022)
   * - IMPONIBILE = QTÀ IMBALLO × MINIMO_AGENTE
   * - PROVV = IMPONIBILE × MINIMA_PROVVIGIONE
   * Nota: in assenza di un campo dedicato, "QTÀ IMBALLO" corrisponde a `appesf`.
   */
  static calculateImponibileAndProvv(
    minimoAgente: number | null | undefined,
    minimaProvvigione: number | null | undefined,
    appesf?: number | null | undefined
  ): { imponibile: number | null; provv: number | null } {
    if (
      minimoAgente === null || minimoAgente === undefined ||
      minimaProvvigione === null || minimaProvvigione === undefined
    ) {
      return { imponibile: null, provv: null };
    }

    // QTÀ IMBALLO: usiamo il valore appesf come quantità imballo
    const qtaImballo = Number(appesf ?? 0);
    const imponibile = Math.max(0, qtaImballo * minimoAgente);
    const provvEuro = Math.max(0, imponibile * minimaProvvigione);

    const round2 = (v: number) => Math.round(v * 100) / 100;
    return { imponibile: round2(imponibile), provv: round2(provvEuro) };
  }

  /**
   * Garantisce che le colonne calcolate (minimo_agente, minima_provvigione, imponibile, provv)
   * siano valorizzate per il prodotto passato, aggiornando il DB se necessario.
   */
  private static async ensureComputedFieldsForProduct(product: Product): Promise<Product> {
    try {
      let minimoAgente = product.minimo_agente ?? null;
      let minimaProvvigione = product.minima_provvigione ?? null;

      // Se mancano i valori minimi, prova a recuperarli/calcolarli
      if (minimoAgente === null || minimaProvvigione === null) {
        const recalculated = await this.calculateMissingValuesForProduct(product);
        minimoAgente = recalculated.minimoAgente;
        minimaProvvigione = recalculated.minimaProvvigione;
      }

      const { imponibile, provv } = this.calculateImponibileAndProvv(minimoAgente, minimaProvvigione, product.appesf);

      // Evita di sovrascrivere valori già calcolati dal trigger DB
      const hasDbComputed = product.imponibile != null && product.provv != null;
      const needsUpdate =
        (product.minimo_agente ?? null) !== minimoAgente ||
        (product.minima_provvigione ?? null) !== minimaProvvigione ||
        (!hasDbComputed && ((product.imponibile ?? null) !== imponibile || (product.provv ?? null) !== provv));

      if (!needsUpdate) {
        return product;
      }

      const patch: Partial<Product> = {
        minimo_agente: minimoAgente,
        minima_provvigione: minimaProvvigione,
        // Scrivi IMPONIBILE/PROVV solo se non già presenti (per rispettare calcolo lato DB)
        ...(hasDbComputed ? {} : { imponibile, provv }),
        updated_at: new Date().toISOString()
      };

      const { data: updated, error: updErr } = await supabase
        .from('products')
        .update(patch)
        .eq('id', product.id)
        .select()
        .single();

      if (updErr) {
        console.error('❌ Errore aggiornando campi calcolati:', updErr);
        // Se non riusciamo ad aggiornare, restituiamo il product originale
        return product;
      }

      return updated as Product;
    } catch (error) {
      console.error('❌ ensureComputedFieldsForProduct error:', error);
      return product;
    }
  }

  /**
   * Trova la provvigione corrispondente a uno sconto per una scala specifica
   */
  static async findCommissionByDiscount(
    scaleType: string,
    discount: number
  ): Promise<number | null> {
    try {
      const scales = await this.getScalesByType(scaleType);

      // Trova la scala con lo sconto più vicino (<=)
      const matchingScale = scales
        .filter(scale => scale.discount <= discount)
        .sort((a, b) => b.discount - a.discount)[0];

      return matchingScale ? matchingScale.commission : null;
    } catch (error) {
      console.error('Errore nel trovare provvigione per sconto:', error);
      return null;
    }
  }

  /**
   * Trova lo sconto corrispondente a una provvigione per una scala specifica
   */
  static async findDiscountByCommission(
    scaleType: string,
    commission: number
  ): Promise<number | null> {
    try {
      const scales = await this.getScalesByType(scaleType);

      // Trova la scala con la provvigione più vicina (<=)
      const matchingScale = scales
        .filter(scale => scale.commission <= commission)
        .sort((a, b) => b.commission - a.commission)[0];

      return matchingScale ? matchingScale.discount : null;
    } catch (error) {
      console.error('Errore nel trovare sconto per provvigione:', error);
      return null;
    }
  }

  /**
   * Calcolo bidirezionale: dato un input (provvigione o sconto) calcola l'altro valore
   */
  static async calculateBidirectional(
    basePrice: number,
    scaleType: string,
    mode: 'commission-to-discount' | 'discount-to-commission',
    inputValue: number
  ): Promise<CalculationResult | null> {
    try {
      let commission: number;
      let discount: number;

      if (mode === 'commission-to-discount') {
        commission = inputValue;
        const foundDiscount = await this.findDiscountByCommission(scaleType, commission);
        if (foundDiscount === null) return null;
        discount = foundDiscount;
      } else {
        discount = inputValue;
        const foundCommission = await this.findCommissionByDiscount(scaleType, discount);
        if (foundCommission === null) return null;
        commission = foundCommission;
      }

      const minage = this.calculateMinage(basePrice, discount);

      return {
        minage,
        provv: commission,
        discount,
        scale: scaleType
      };
    } catch (error) {
      console.error('Errore nel calcolo bidirezionale:', error);
      return null;
    }
  }

  /**
   * Recupera prodotti per ricerca APLIBINT (per il calcolatore)
   * VERSIONE OTTIMIZZATA: Include colonne pre-calcolate
   */
  static async searchProductsByAplibint(searchTerm: string): Promise<Product[]> {
    try {
      if (!searchTerm.trim()) return [];

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          minimo_agente,
          minima_provvigione,
          imponibile,
          provv
        `)
        .ilike('aplibint', `%${searchTerm.trim()}%`)
        .eq('is_active', true)
        .order('aplibint', { ascending: true })
        .limit(20); // Limita i risultati per performance

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Errore nella ricerca prodotti per APLIBINT:', error);
      throw new Error('Impossibile cercare i prodotti');
    }
  }

  /**
   * Formatta le scale per i dropdown del calcolatore
   */
  static formatScalesForDropdown(scales: Scale[]): ScaleOption[] {
    return scales.map(scale => ({
      scale: scale.scale,
      commission: scale.commission,
      discount: scale.discount,
      label: `${scale.scale} - Provv: ${(scale.commission * 100).toFixed(2)}% - Sconto: €${scale.discount.toFixed(2)}`
    }));
  }

  /**
   * Calcola MinimoAgente e MinimaProvvigione per un prodotto
   * NUOVA LOGICA: 
   * - MinimoAgente = APPRLI - sconto del record con PROVV MINIMA = TRUE
   * - MinimaProvvigione = commissione del record con PROVV MINIMA = TRUE
   * - Fallback: se non esiste PROVV MINIMA = TRUE, usa il massimo sconto
   */
  /**
   * Calcola le colonne virtuali per un prodotto
   * VERSIONE OTTIMIZZATA: Usa solo valori pre-calcolati dal database
   */
  static async calculateVirtualColumns(
    product: Product
  ): Promise<{ minimoAgente: number | null; minimaProvvigione: number | null }> {
    try {
      // STRATEGIA 1: Se il prodotto ha già i valori pre-calcolati, usali
      if (product.minimo_agente !== undefined && product.minima_provvigione !== undefined) {
        return {
          minimoAgente: product.minimo_agente,
          minimaProvvigione: product.minima_provvigione
        };
      }

      // STRATEGIA 2: Recupera i valori pre-calcolati dal database
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('minimo_agente, minima_provvigione')
        .eq('id', product.id)
        .single();

      if (!productError && productData) {
        return {
          minimoAgente: productData.minimo_agente,
          minimaProvvigione: productData.minima_provvigione
        };
      }

      // Se non ci sono valori pre-calcolati, ritorna null
      console.warn('⚠️ Valori pre-calcolati non disponibili per prodotto:', product.aplibint);
      return { minimoAgente: null, minimaProvvigione: null };

    } catch (error) {
      console.error('❌ Errore nella lettura colonne virtuali:', error);
      return { minimoAgente: null, minimaProvvigione: null };
    }
  }

  /**
   * Ricalcola i valori mancanti per i prodotti che non hanno minimo_agente o minima_provvigione
   * Utilizza la logica delle scale per calcolare i valori corretti
   */
  static async recalculateMissingValues(products: Product[]): Promise<Product[]> {
    try {
      console.log('🔄 Inizio ricalcolo valori mancanti per', products.length, 'prodotti');

      const updatedProducts: Product[] = [];

      for (const product of products) {
        // Verifica se il prodotto ha valori mancanti
        const hasMissingValues =
          product.minimo_agente === null ||
          product.minimo_agente === undefined ||
          product.minima_provvigione === null ||
          product.minima_provvigione === undefined;

        if (!hasMissingValues) {
          // Il prodotto ha già tutti i valori, lo aggiungiamo così com'è
          const { imponibile, provv } = this.calculateImponibileAndProvv(
            product.minimo_agente,
            product.minima_provvigione
          );
          const ensuredProduct = {
            ...product,
            imponibile: product.imponibile ?? imponibile,
            provv: product.provv ?? provv,
          };
          updatedProducts.push(ensuredProduct);
          continue;
        }

        // Il prodotto ha valori mancanti, li ricalcoliamo
        console.log('🔄 Ricalcolo valori per prodotto:', product.aplibint, 'scala:', product.aplib1);

        try {
          const recalculatedValues = await this.calculateMissingValuesForProduct(product);

          // Aggiorna il prodotto con i nuovi valori
          const { imponibile, provv } = this.calculateImponibileAndProvv(
            recalculatedValues.minimoAgente,
            recalculatedValues.minimaProvvigione
          );
          const updatedProduct = {
            ...product,
            minimo_agente: recalculatedValues.minimoAgente,
            minima_provvigione: recalculatedValues.minimaProvvigione,
            imponibile,
            provv
          };

          updatedProducts.push(updatedProduct);

          console.log('✅ Valori ricalcolati per', product.aplibint, ':', {
            minimo_agente: recalculatedValues.minimoAgente,
            minima_provvigione: recalculatedValues.minimaProvvigione,
            imponibile,
            provv
          });

        } catch (error) {
          console.error('❌ Errore nel ricalcolo per prodotto', product.aplibint, ':', error);
          // In caso di errore, mantieni il prodotto originale
          updatedProducts.push(product);
        }
      }

      console.log('✅ Ricalcolo completato per', updatedProducts.length, 'prodotti');
      return updatedProducts;

    } catch (error) {
      console.error('❌ Errore generale nel ricalcolo valori mancanti:', error);
      throw new Error('Errore nel ricalcolo dei valori mancanti');
    }
  }

  /**
   * Calcola i valori mancanti per un singolo prodotto
   */
  private static async calculateMissingValuesForProduct(
    product: Product
  ): Promise<{ minimoAgente: number | null; minimaProvvigione: number | null }> {
    try {
      // Se il prodotto non ha una scala (aplib1), non possiamo calcolare
      if (!product.aplib1 || !product.apprli) {
        console.warn('⚠️ Prodotto senza scala o prezzo:', product.aplibint);
        return { minimoAgente: null, minimaProvvigione: null };
      }

      // Recupera le scale per il tipo di scala del prodotto
      const scales = await this.getScalesByType(product.aplib1);

      if (!scales || scales.length === 0) {
        console.warn('⚠️ Nessuna scala trovata per tipo:', product.aplib1);
        return { minimoAgente: null, minimaProvvigione: null };
      }

      // Cerca il record con PROVV MINIMA = TRUE
      let targetScale = scales.find(scale => scale.provv_minima === true);

      // Se non esiste PROVV MINIMA = TRUE, usa il massimo sconto disponibile
      if (!targetScale) {
        targetScale = scales.reduce((max, current) =>
          current.discount > max.discount ? current : max
        );
        console.log('⚠️ PROVV MINIMA non trovata per scala', product.aplib1, ', uso massimo sconto:', targetScale.discount);
      }

      // Calcola i valori
      const minimoAgente = this.calculateMinage(product.apprli, targetScale.discount);
      const minimaProvvigione = targetScale.commission;

      return {
        minimoAgente: Math.round(minimoAgente * 100) / 100, // Arrotonda a 2 decimali
        minimaProvvigione: Math.round(minimaProvvigione * 10000) / 10000 // Mantieni precisione per le commissioni
      };

    } catch (error) {
      console.error('❌ Errore nel calcolo valori per prodotto:', error);
      return { minimoAgente: null, minimaProvvigione: null };
    }
  }

  static async getProductsPaginated(filters?: ProductFilters): Promise<ProductPaginatedResponse> {
    try {
      console.log('🔍 getProductsPaginated called with filters:', filters);
      const pageSize = filters?.page_size ?? 50;
      const page = filters?.page ?? 1;

      let query = supabase
        .from('products')
        .select(`
          *,
          minimo_agente,
          minima_provvigione,
          imponibile,
          provv
        `, { count: 'exact' });

      // Applica filtri (stessa logica di getProducts)
      if (filters?.active !== undefined) {
        query = query.eq('is_active', filters.active);
      }

      if (filters?.search) {
        const searchTerm = filters.search.trim();
        if (searchTerm) {
          const simplePattern = `%${searchTerm}%`;
          try {
            query = query.or(`descrizione.ilike.${simplePattern},apdesi.ilike.${simplePattern},apcpro.ilike.${simplePattern}`);
          } catch (error) {
            console.error('  ❌ Errore con .or() in getProductsPaginated, fallback:', error);
            query = query.ilike('descrizione', simplePattern);
          }
        }
      }

      if (filters?.price_min !== undefined) {
        query = query.gte('apprli', filters.price_min);
      }
      if (filters?.price_max !== undefined) {
        query = query.lte('apprli', filters.price_max);
      }
      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters?.brand) {
        query = query.eq('brand', filters.brand);
      }
      if (filters?.apdesi) {
        query = query.eq('apdesi', filters.apdesi);
      }
      if (filters?.xde40) {
        query = query.eq('xde40', filters.xde40);
      }
      if (filters?.xde60) {
        query = query.eq('xde60', filters.xde60);
      }
      if (filters?.aplib1) {
        query = query.eq('aplib1', filters.aplib1);
      }
      
      // Filtro obsoleti in paginazione
      if (filters?.obsoleto === true) {
        query = query.eq('obsoleto', true);
      } else {
        // Di default, nascondi i prodotti obsoleti
        query = query.or('obsoleto.eq.false,obsoleto.is.null');
      }

      // Ordinamento
      if (filters?.sort_field && filters.sort_field !== 'none') {
        const ascending = filters.sort_direction === 'asc';
        const sortColumn = ListinoService.mapSortField(filters.sort_field as string);
        query = query.order(sortColumn, { ascending });
        
        // Regola speciale: se ordiniamo per descrizione (o apdesi), aggiungiamo un ordinamento secondario
        // per quantità imballo (appesf) in ordine decrescente
        if (sortColumn === 'descrizione' || sortColumn === 'apdesi') {
          query = query.order('appesf', { ascending: false });
        }
      } else {
        query = query.order('apcpro', { ascending: true });
      }

      // Paginazione
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;
      if (error) throw error;
      return { products: data || [], count: count || 0 };
    } catch (error) {
      console.error('Errore nel recupero prodotti paginati:', error);
      throw new Error('Impossibile recuperare i prodotti paginati');
    }
  }

  /**
   * Forza il ricalcolo delle colonne virtuali (minimo_agente, minima_provvigione, imponibile, provv)
   * direttamente in SQL lato server, utilizzando la funzione calculate_virtual_columns.
   * Opzione onlyMissing: limita l'aggiornamento ai prodotti con valori mancanti.
   */
  static async forceRecalculateVirtualColumns(options?: { onlyMissing?: boolean }): Promise<{ updated: number }> {
    try {
      const onlyMissing = options?.onlyMissing === true;

      // Costruisci la clausola WHERE
      const baseWhere = `p.apprli IS NOT NULL AND p.aplib1 IN ('A','B','C','D','E','P')`;
      const missingWhere = onlyMissing
        ? ` AND (p.minimo_agente IS NULL OR p.minima_provvigione IS NULL OR p.imponibile IS NULL OR p.provv IS NULL)`
        : '';

      const sql = `
        WITH updated AS (
          UPDATE public.products p
          SET 
            minimo_agente = cv.minimo_agente,
            minima_provvigione = cv.minima_provvigione,
            imponibile = cv.imponibile,
            provv = cv.provv,
            updated_at = NOW()
          FROM LATERAL calculate_virtual_columns(p.apprli, p.aplib1, p.appesf) AS cv
          WHERE ${baseWhere}${missingWhere}
          RETURNING 1
        )
        SELECT COUNT(*)::int AS updated_count FROM updated;
      `;

      // Usa il client normale - richiede autorizzazione admin via RLS
      const { data, error } = await supabase.rpc('exec_sql', { sql });
      if (error) {
        console.error('❌ Errore nel ricalcolo colonne virtuali (SQL):', error);
        throw error;
      }

      const updated = Array.isArray(data) && data[0] && typeof data[0].updated_count === 'number'
        ? data[0].updated_count
        : 0;

      console.log(`✅ Ricalcolo colonne virtuali completato. Aggiornati ${updated} prodotti.`);
      return { updated };
    } catch (error) {
      console.error('❌ Errore generale in forceRecalculateVirtualColumns:', error);
      throw new Error('Impossibile ricalcolare le colonne virtuali');
    }
  }

  /**
   * Backfill manuale: aggiorna IMPONIBILE/PROVV per prodotti con valori mancanti.
   * Considera solo prodotti con APPRLI e APLIB1 valorizzati.
   */
  static async backfillImponibileAndProvvMissing(limit = 10000): Promise<{ processed: number; updated: number; errors: number }> {
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .or('imponibile.is.null,provv.is.null')
        .not('apprli', 'is', null)
        .not('aplib1', 'is', null)
        .limit(limit);

      if (error) throw error;

      let processed = 0;
      let updated = 0;
      let errors = 0;

      for (const p of (products || []) as Product[]) {
        processed++;
        try {
          const before = {
            minimo_agente: p.minimo_agente ?? null,
            minima_provvigione: p.minima_provvigione ?? null,
            imponibile: p.imponibile ?? null,
            provv: p.provv ?? null,
          };
          const ensured = await this.ensureComputedFieldsForProduct(p);
          const after = {
            minimo_agente: ensured.minimo_agente ?? null,
            minima_provvigione: ensured.minima_provvigione ?? null,
            imponibile: ensured.imponibile ?? null,
            provv: ensured.provv ?? null,
          };
          const changed = JSON.stringify(before) !== JSON.stringify(after);
          if (changed) updated++;
        } catch (e) {
          console.error('❌ Backfill errore prodotto', p.id, e);
          errors++;
        }
      }

      console.log(`✅ Backfill completato. Processati ${processed}, aggiornati ${updated}, errori ${errors}.`);
      return { processed, updated, errors };
    } catch (error) {
      console.error('❌ Errore generale nel backfill IMPONIBILE/PROVV:', error);
      throw new Error('Impossibile eseguire il backfill per IMPONIBILE/PROVV');
    }
  }

  /**
   * Funzionalità di ricalcolo manuale e verifica admin rimosse.
   * Il ricalcolo avviene tramite trigger SQL e funzioni automatiche.
   */

}

// Esporta un'istanza del servizio per compatibilità
export const listinoService = ListinoService;
