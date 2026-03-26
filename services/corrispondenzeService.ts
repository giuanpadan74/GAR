import { supabase } from '../src/lib/supabase';
import { CorrispondenzaOlioRaw } from '../src/types/corrispondenze-cross';
import { toast } from 'sonner';
import { findAllCorrispondenzeByRoloil } from '../src/utils/corrispondenze-edit';

export interface UpdateCorrispondenzaData {
  id: string;
  brand: string;
  product: string;
  sae: string;
  q8?: string | null;
  type: string;
}

export async function updateCorrispondenza(
  data: UpdateCorrispondenzaData
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('correspondences')
      .update({
        brand: data.brand,
        product: data.product,
        sae: data.sae,
        q8: data.q8,
        type: data.type,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.id);

    if (error) {
      console.error('Errore aggiornamento corrispondenza:', error);
      toast.error('Errore durante il salvataggio delle modifiche');
      return { success: false, error: error.message };
    }

    toast.success('Modifica salvata con successo');
    return { success: true };
  } catch (error) {
    console.error('Errore imprevisto:', error);
    toast.error('Errore durante il salvataggio delle modifiche');
    return { success: false, error: 'Errore durante il salvataggio' };
  }
}

export async function updateCorrispondenzaField(
  id: string,
  field: keyof UpdateCorrispondenzaData,
  value: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: Partial<UpdateCorrispondenzaData> = {
      [field]: value,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('correspondences')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Errore aggiornamento campo corrispondenza:', error);
      toast.error('Errore durante il salvataggio della modifica');
      return { success: false, error: error.message };
    }

    toast.success('Modifica salvata con successo');
    return { success: true };
  } catch (error) {
    console.error('Errore imprevisto:', error);
    toast.error('Errore durante il salvataggio della modifica');
    return { success: false, error: 'Errore durante il salvataggio' };
  }
}

export async function updateRoloilForAllCorrispondenze(
  oldRoloil: string,
  newRoloil: string,
  rawData: CorrispondenzaOlioRaw[]
): Promise<{ success: boolean; error?: string; updatedIds?: string[] }> {
  try {
    // Nella nuova struttura, i prodotti Roloil sono record con brand='Roloil'
    // e il nome del prodotto è nel campo 'product', non 'roloil'
    
    // Trova il record Roloil con il vecchio nome prodotto
    const { data: roloilRecord, error: findError } = await supabase
      .from('correspondences')
      .select('*')
      .eq('brand', 'Roloil')
      .eq('product', oldRoloil)
      .single();
    
    if (findError || !roloilRecord) {
      console.error('Record Roloil non trovato:', findError);
      return { success: false, error: 'Record Roloil non trovato' };
    }

    // Aggiorna il nome del prodotto Roloil
    const { error: updateError } = await supabase
      .from('correspondences')
      .update({
        product: newRoloil,
        updated_at: new Date().toISOString()
      })
      .eq('id', roloilRecord.id);

    if (updateError) {
      console.error('Errore aggiornamento Roloil:', updateError);
      toast.error('Errore durante il salvataggio delle modifiche');
      return { success: false, error: updateError.message };
    }

    toast.success('Prodotto Roloil aggiornato con successo');
    return { success: true, updatedIds: [roloilRecord.id] };
  } catch (error) {
    console.error('Errore imprevisto:', error);
    toast.error('Errore durante il salvataggio delle modifiche');
    return { success: false, error: 'Errore durante il salvataggio' };
  }
}

export async function updateTypeForAllCorrispondenze(
  roloilProduct: string,
  oldType: string,
  newType: string,
  rawData: CorrispondenzaOlioRaw[]
): Promise<{ success: boolean; error?: string; updatedIds?: string[] }> {
  try {
    // Nella nuova struttura, aggiorna tutti i record con lo stesso SAE e Type
    // dove il prodotto Roloil corrisponde
    
    // Trova il record Roloil corrispondente
    const { data: roloilRecord } = await supabase
      .from('correspondences')
      .select('*')
      .eq('brand', 'Roloil')
      .eq('product', roloilProduct)
      .eq('type', oldType)
      .single();
    
    if (!roloilRecord) {
      return { success: false, error: 'Record Roloil non trovato' };
    }

    // Aggiorna tutti i record con lo stesso SAE e vecchio Type
    const { data: recordsToUpdate, error: findError } = await supabase
      .from('correspondences')
      .select('id')
      .eq('sae', roloilRecord.sae)
      .eq('type', oldType);
    
    if (findError) {
      return { success: false, error: findError.message };
    }

    if (!recordsToUpdate || recordsToUpdate.length === 0) {
      return { success: true, updatedIds: [] };
    }

    const idsToUpdate = recordsToUpdate.map(record => record.id);

    // Aggiorna tutte le corrispondenze in una transazione batch
    const { error } = await supabase
      .from('correspondences')
      .update({
        type: newType,
        updated_at: new Date().toISOString()
      })
      .in('id', idsToUpdate);

    if (error) {
      console.error('Errore aggiornamento Type:', error);
      toast.error('Errore durante il salvataggio delle modifiche');
      return { success: false, error: error.message };
    }

    toast.success(`Modificate ${idsToUpdate.length} corrispondenze`);
    return { success: true, updatedIds: idsToUpdate };
  } catch (error) {
    console.error('Errore imprevisto:', error);
    toast.error('Errore durante il salvataggio delle modifiche');
    return { success: false, error: 'Errore durante il salvataggio' };
  }
}

export async function updateSaeForAllCorrispondenze(
  roloilProduct: string,
  type: string,
  oldSae: string,
  newSae: string,
  rawData: CorrispondenzaOlioRaw[]
): Promise<{ success: boolean; error?: string; updatedIds?: string[] }> {
  try {
    // Nella nuova struttura, aggiorna tutti i record con lo stesso prodotto Roloil, Type e vecchio SAE
    
    // Trova il record Roloil corrispondente
    const { data: roloilRecord } = await supabase
      .from('correspondences')
      .select('*')
      .eq('brand', 'Roloil')
      .eq('product', roloilProduct)
      .eq('type', type)
      .eq('sae', oldSae)
      .single();
    
    if (!roloilRecord) {
      return { success: false, error: 'Record Roloil non trovato' };
    }

    // Aggiorna tutti i record con lo stesso SAE e Type
    const { data: recordsToUpdate, error: findError } = await supabase
      .from('correspondences')
      .select('id')
      .eq('sae', oldSae)
      .eq('type', type);
    
    if (findError) {
      return { success: false, error: findError.message };
    }

    if (!recordsToUpdate || recordsToUpdate.length === 0) {
      return { success: true, updatedIds: [] };
    }

    const idsToUpdate = recordsToUpdate.map(record => record.id);

    // Aggiorna tutte le corrispondenze in una transazione batch
    const { error } = await supabase
      .from('correspondences')
      .update({
        sae: newSae,
        updated_at: new Date().toISOString()
      })
      .in('id', idsToUpdate);

    if (error) {
      console.error('Errore aggiornamento SAE:', error);
      toast.error('Errore durante il salvataggio delle modifiche');
      return { success: false, error: error.message };
    }

    toast.success(`Modificate ${idsToUpdate.length} corrispondenze`);
    return { success: true, updatedIds: idsToUpdate };
  } catch (error) {
    console.error('Errore imprevisto:', error);
    toast.error('Errore durante il salvataggio delle modifiche');
    return { success: false, error: 'Errore durante il salvataggio' };
  }
}

export async function createCorrispondenza(
  brand: string,
  product: string,
  sae: string,
  type: string,
  q8?: string
): Promise<{ success: boolean; error?: string; data?: CorrispondenzaOlioRaw }> {
  try {
    const newCorrispondenza = {
      brand,
      product,
      type,
      sae,
      q8: q8 || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('correspondences')
      .insert([newCorrispondenza])
      .select()
      .single();

    if (error) {
      console.error('Errore creazione corrispondenza:', error);
      toast.error('Errore durante la creazione della corrispondenza');
      return { success: false, error: error.message };
    }

    toast.success('Corrispondenza creata con successo');
    return { success: true, data: data as CorrispondenzaOlioRaw };
  } catch (error) {
    console.error('Errore imprevisto:', error);
    toast.error('Errore durante la creazione della corrispondenza');
    return { success: false, error: 'Errore durante la creazione' };
  }
}

export async function deleteCorrispondenza(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('correspondences')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Errore eliminazione corrispondenza:', error);
      toast.error('Errore durante l\'eliminazione della corrispondenza');
      return { success: false, error: error.message };
    }

    toast.success('Corrispondenza eliminata con successo');
    return { success: true };
  } catch (error) {
    console.error('Errore imprevisto:', error);
    toast.error('Errore durante l\'eliminazione della corrispondenza');
    return { success: false, error: 'Errore durante l\'eliminazione' };
  }
}