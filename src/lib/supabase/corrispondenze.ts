import { supabase } from '../supabase';
import { CorrispondenzaOlio, CorrispondenzeFilters } from '../../types/corrispondenze';
import { CorrispondenzaOlioRaw } from '../../types/corrispondenze-cross';

export async function getCorrispondenze(filters?: CorrispondenzeFilters): Promise<{
  data: CorrispondenzaOlio[];
  error: string | null;
}> {
  try {
    let query = supabase
      .from('correspondences')
      .select('*')
      .order('brand', { ascending: true })
      .range(0, 9999); // Aumenta il limite a 10000 record

    if (filters?.brand) {
      query = query.ilike('brand', `%${filters.brand}%`);
    }

    if (filters?.type) {
      query = query.ilike('type', `%${filters.type}%`);
    }

    if (filters?.product) {
      query = query.ilike('product', `%${filters.product}%`);
    }

    if (filters?.search) {
      query = query.or(`brand.ilike.%${filters.search}%,product.ilike.%${filters.search}%,sae.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: data as CorrispondenzaOlio[], error: null };
  } catch (error) {
    return { data: [], error: 'Errore nel recupero dei dati' };
  }
}

export async function getCorrispondenzeBrands(): Promise<string[]> {
  try {
    let all: string[] = [];
    const pageSize = 1000;
    let offset = 0;
    let hasMore = true;
    while (hasMore) {
      const { data, error } = await supabase
        .from('correspondences')
        .select('brand')
        .order('brand', { ascending: true })
        .range(offset, offset + pageSize - 1);
      if (error) {
        break;
      }
      const batch = (data || []).map((item: any) => item.brand);
      all.push(...batch);
      if (!data || data.length < pageSize) {
        hasMore = false;
      } else {
        offset += pageSize;
      }
    }
    const unique = Array.from(new Set(all.filter(Boolean)));
    return unique.sort((a, b) => a.localeCompare(b));
  } catch (error) {
    return [];
  }
}

export async function getCorrispondenzeTypes(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('correspondences')
      .select('type')
      .order('type', { ascending: true })
      .range(0, 9999); // Aumenta il limite a 10000 record

    if (error) {
      return [];
    }

    const types = data.map(item => item.type);
    return [...new Set(types)]; // Rimuovi duplicati
  } catch (error) {
    return [];
  }
}

export async function getCorrispondenzeRaw(): Promise<{
  data: CorrispondenzaOlioRaw[];
  error: string | null;
}> {
  try {
    console.log('[getCorrispondenzeRaw] Inizio query Supabase...');
    
    // Prima prova: contiamo tutti i record (senza head per evitare errori di rate limit)
    const { count, error: countError } = await supabase
      .from('correspondences')
      .select('*', { count: 'exact' });
    
    if (countError) {
      console.warn(`[getCorrispondenzeRaw] Errore nel conteggio: ${countError.message}`);
    } else {
      console.log(`[getCorrispondenzeRaw] Totale record nella tabella: ${count}`);
    }
    
    // Recupera tutti i record usando paginazione per evitare limiti
    let allData: any[] = [];
    const pageSize = 500; // Dimensione pagina più piccola per evitare errori
    let offset = 0;
    let hasMore = true;
    
    while (hasMore) {
      console.log(`[getCorrispondenzeRaw] Recupero pagina: offset=${offset}, limit=${pageSize}`);
      
      const { data, error } = await supabase
        .from('correspondences')
        .select('*')
        .order('brand', { ascending: true })
        .order('product', { ascending: true })
        .range(offset, offset + pageSize - 1);
      
      if (error) {
        console.error(`[getCorrispondenzeRaw] Errore durante paginazione:`, error);
        return { data: allData as CorrispondenzaOlioRaw[], error: error.message };
      }
      
      if (!data || data.length === 0) {
        hasMore = false;
      } else {
        allData = [...allData, ...data];
        offset += pageSize;
        
        // Se abbiamo meno dati del pageSize, abbiamo finito
        if (data.length < pageSize) {
          hasMore = false;
        }
      }
    }

    console.log(`[getCorrispondenzeRaw] Record totali recuperati: ${allData.length}`);
    
    if (allData.length >= 1000) {
      console.warn(`[getCorrispondenzeRaw] Recuperati ${allData.length} record con paginazione!`);
    }

    return { data: allData as CorrispondenzaOlioRaw[], error: null };
  } catch (error) {
    console.error(`[getCorrispondenzeRaw] Eccezione:`, error);
    return { data: [], error: 'Errore nel recupero dei dati' };
  }
}

export async function getCorrispondenzeRawPage(params: {
  page: number;
  pageSize: number;
  search?: string;
  brand?: string;
  type?: string;
  sae?: string;
}): Promise<{
  data: CorrispondenzaOlioRaw[];
  error: string | null;
  count: number;
  hasMore: boolean;
}>{
  try {
    const start = params.page * params.pageSize;
    const end = start + params.pageSize - 1;
    let query = supabase
      .from('correspondences')
      .select('*', { count: 'exact' })
      .order('brand', { ascending: true })
      .order('product', { ascending: true })
      .range(start, end);

    if (params.brand) {
      query = query.ilike('brand', `%${params.brand}%`);
    }
    if (params.type) {
      query = query.ilike('type', `%${params.type}%`);
    }
    if (params.sae) {
      query = query.ilike('sae', `%${params.sae}%`);
    }
    if (params.search) {
      query = query.or(
        `brand.ilike.%${params.search}%,product.ilike.%${params.search}%,sae.ilike.%${params.search}%,type.ilike.%${params.search}%,q8.ilike.%${params.search}%`
      );
    }

    const { data, error, count } = await query;
    if (error) {
      return { data: [], error: error.message, count: 0, hasMore: false };
    }
    const total = count || 0;
    const hasMore = end + 1 < total;
    return { data: (data as CorrispondenzaOlioRaw[]) || [], error: null, count: total, hasMore };
  } catch (e) {
    return { data: [], error: 'Errore nel recupero dei dati', count: 0, hasMore: false };
  }
}

export async function getCorrispondenzeRawFilteredAll(params: {
  search?: string;
  brand?: string;
  type?: string;
  sae?: string;
}): Promise<{
  data: CorrispondenzaOlioRaw[];
  error: string | null;
  count: number;
}> {
  try {
    let query = supabase
      .from('correspondences')
      .select('*', { count: 'exact' })
      .order('brand', { ascending: true })
      .order('product', { ascending: true })
      .range(0, 9999);

    if (params.brand) {
      query = query.ilike('brand', `%${params.brand}%`);
    }
    if (params.type) {
      query = query.ilike('type', `%${params.type}%`);
    }
    if (params.sae) {
      query = query.ilike('sae', `%${params.sae}%`);
    }
    if (params.search) {
      query = query.or(
        `brand.ilike.%${params.search}%,product.ilike.%${params.search}%,sae.ilike.%${params.search}%,type.ilike.%${params.search}%,q8.ilike.%${params.search}%`
      );
    }

    const { data, error, count } = await query;
    if (error) {
      return { data: [], error: error.message, count: 0 };
    }
    return { data: (data as CorrispondenzaOlioRaw[]) || [], error: null, count: count || 0 };
  } catch (e) {
    return { data: [], error: 'Errore nel recupero dei dati', count: 0 };
  }
}
