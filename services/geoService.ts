
import { Region, Province, Municipality } from '../types';
import { supabase } from './supabaseClient';

// --- REGIONS ---
const getRegions = async (): Promise<Region[]> => {
    const { data, error } = await supabase.from('regioni').select('*').order('nome_regione', { ascending: true });
    if (error) {
        console.error('Errore nel caricamento delle regioni:', error.message);
        return [];
    }
    return data || [];
};

const addRegion = async (region: Region) => {
    const { error } = await supabase.from('regioni').insert([region]);
    if (error) console.error("Errore nell'aggiunta della regione:", error.message);
    return !error;
}

const updateRegion = async (codice_regione: number, updates: Partial<Region>) => {
    const { error } = await supabase.from('regioni').update(updates).eq('codice_regione', codice_regione);
    if (error) console.error("Errore nell'aggiornamento della regione:", error.message);
    return !error;
}

const deleteRegion = async (codice_regione: number) => {
    const { error } = await supabase.from('regioni').delete().eq('codice_regione', codice_regione);
    if (error) console.error("Errore nell'eliminazione della regione:", error.message);
    return !error;
}


// --- PROVINCES ---
const getProvinces = async (): Promise<Province[]> => {
    const { data, error } = await supabase.from('province').select('*').order('nome_provincia', { ascending: true });
    if (error) {
        console.error('Errore nel caricamento delle province:', error.message);
        return [];
    }
    return data || [];
};

const addProvince = async (province: Province) => {
    const { error } = await supabase.from('province').insert([province]);
    if (error) {
        console.error("Errore nell'aggiunta della provincia:", error.message);
        return false;
    }
    return true;
}

const updateProvince = async (codice_provincia: number, updates: Partial<Province>) => {
    const { error } = await supabase.from('province').update(updates).eq('codice_provincia', codice_provincia);
    if (error) console.error("Errore nell'aggiornamento della provincia:", error.message);
    return !error;
}

const deleteProvince = async (codice_provincia: number) => {
    const { error } = await supabase.from('province').delete().eq('codice_provincia', codice_provincia);
    if (error) console.error("Errore nell'eliminazione della provincia:", error.message);
    return !error;
}


// --- MUNICIPALITIES ---
const getMunicipalitiesByProvince = async (provinceCode: number): Promise<Municipality[]> => {
    if (!provinceCode) return [];
    const { data, error } = await supabase
        .from('comuni')
        .select('codice_comune, nome_comune, codice_provincia, geometry')
        .eq('codice_provincia', provinceCode)
        .order('nome_comune', { ascending: true });
    if (error) {
        console.error('Errore nel caricamento dei comuni:', error.message);
        return [];
    }
    return data || [];
};

const getMunicipalitiesByCodes = async (codes: number[]): Promise<Municipality[]> => {
    if (!codes || codes.length === 0) return [];
    const { data, error } = await supabase
        .from('comuni')
        .select('codice_comune, nome_comune, codice_provincia, geometry')
        .in('codice_comune', codes);
    if (error) {
        console.error('Errore nel caricamento dei nomi dei comuni:', error.message);
        return [];
    }
    return data || [];
};

const getAllAssignedMunicipalities = async (agentAssignments: { agentId: number, municipalityCodes: number[] }[]): Promise<Municipality[]> => {
    const allCodes = agentAssignments.flatMap(assignment => assignment.municipalityCodes);
    if (allCodes.length === 0) return [];
    
    const { data, error } = await supabase
        .from('comuni')
        .select('codice_comune, nome_comune, codice_provincia, geometry')
        .in('codice_comune', allCodes)
        .not('geometry', 'is', null); // Solo comuni con geometria
    
    if (error) {
        console.error('Errore nel caricamento dei comuni assegnati:', error.message);
        return [];
    }
    return data || [];
};

const addMunicipality = async (municipality: Municipality) => {
    const { error } = await supabase.from('comuni').insert([municipality]);
    if (error) console.error("Errore nell'aggiunta del comune:", error.message);
    return !error;
}

const updateMunicipality = async (codice_comune: number, updates: Partial<Municipality>) => {
    const { error } = await supabase.from('comuni').update(updates).eq('codice_comune', codice_comune);
    if (error) console.error("Errore nell'aggiornamento del comune:", error.message);
    return !error;
}

const deleteMunicipality = async (codice_comune: number) => {
    const { error } = await supabase.from('comuni').delete().eq('codice_comune', codice_comune);
    if (error) console.error("Errore nell'eliminazione del comune:", error.message);
    return !error;
}

const getAllMunicipalities = async (): Promise<Municipality[]> => {
    const { data, error } = await supabase
        .from('comuni')
        .select('codice_comune, nome_comune, codice_provincia, geometry')
        .not('geometry', 'is', null) // Solo comuni con geometria
        .order('nome_comune', { ascending: true });
    
    if (error) {
        console.error('Errore nel caricamento di tutti i comuni:', error.message);
        return [];
    }
    return data || [];
};

const getMunicipalitiesByRegion = async (regionCode: number): Promise<Municipality[]> => {
    if (!regionCode) return [];
    
    // Prima recupera tutte le province della regione
    const { data: provincesData, error: provincesError } = await supabase
        .from('province')
        .select('codice_provincia')
        .eq('codice_regione', regionCode);
    
    if (provincesError) {
        console.error('Errore nel caricamento delle province per regione:', provincesError.message);
        return [];
    }
    
    if (!provincesData || provincesData.length === 0) {
        return [];
    }
    
    const provinceCodes = provincesData.map(p => p.codice_provincia);
    
    // Poi recupera tutti i comuni di queste province
    const { data: municipalitiesData, error: municipalitiesError } = await supabase
        .from('comuni')
        .select('codice_comune, nome_comune, codice_provincia, geometry')
        .in('codice_provincia', provinceCodes)
        .not('geometry', 'is', null) // Solo comuni con geometria
        .order('nome_comune', { ascending: true });
    
    if (municipalitiesError) {
        console.error('Errore nel caricamento dei comuni per regione:', municipalitiesError.message);
        return [];
    }
    
    return municipalitiesData || [];
};


const geoService = {
    getRegions,
    addRegion,
    updateRegion,
    deleteRegion,
    getProvinces,
    addProvince,
    updateProvince,
    deleteProvince,
    getMunicipalitiesByProvince,
    getMunicipalitiesByRegion,
    getMunicipalitiesByCodes,
    getAllAssignedMunicipalities,
    getAllMunicipalities,
    addMunicipality,
    updateMunicipality,
    deleteMunicipality,
};

export { geoService };
export default geoService;
