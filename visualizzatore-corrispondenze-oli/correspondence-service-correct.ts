/**
 * Servizio di corrispondenze con logica corretta:
 * - Roloil è il riferimento principale
 * - Q8 è la colonna fissa di riferimento
 * - Altri brand sono colonne opzionali
 */

import { CorrespondenceRecord, CrossTableRow } from './types-new';

export class CorrespondenceServiceCorrect {
  private records: CorrespondenceRecord[] = [];

  constructor(initialRecords: CorrespondenceRecord[] = []) {
    this.records = [...initialRecords];
  }

  /**
   * Imposta i records (usato per inizializzazione)
   */
  setRecords(records: CorrespondenceRecord[]) {
    this.records = [...records];
  }

  /**
   * Ottieni tutti i records
   */
  getAllRecords(): CorrespondenceRecord[] {
    return [...this.records];
  }

  /**
   * Trasforma i records nel formato per la tabella incrociata
   * ORDINE CORRETTO: Roloil → Q8 → Altri Brand
   */
  transformToCrossTable(): CrossTableRow[] {
    const crossMap = new Map<string, CrossTableRow>();

    // Raggruppa per Roloil+SAE+Type (Roloil è il riferimento)
    this.records.forEach(record => {
      const key = `${record.roloil}-${record.sae}-${record.type}`;
      
      if (!crossMap.has(key)) {
        crossMap.set(key, {
          roloil: record.roloil,
          type: record.type,
          sae: record.sae,
          Q8: '---' // Default: Q8 mancante
        });
      }

      const entry = crossMap.get(key)!;
      
      if (record.brand === 'Q8') {
        // Q8 è la colonna principale di riferimento
        entry.Q8 = record.product;
      } else {
        // Altri brand sono colonne aggiuntive
        entry[record.brand] = record.product;
      }
    });

    // Ordina per Roloil, poi SAE
    return Array.from(crossMap.values()).sort((a, b) => 
      a.roloil.localeCompare(b.roloil) || a.sae.localeCompare(b.sae)
    );
  }

  /**
   * Ottieni tutti i prodotti Q8 unici (per colonne fisse)
   */
  getUniqueQ8Products(): string[] {
    const q8Products = this.records
      .filter(r => r.brand === 'Q8')
      .map(r => r.product)
      .filter((product, index, array) => array.indexOf(product) === index)
      .sort();
    
    return q8Products;
  }

  /**
   * Ottieni tutti i prodotti Roloil unici
   */
  getUniqueRoloilProducts(): string[] {
    const roloilProducts = new Set(this.records.map(r => r.roloil));
    return Array.from(roloilProducts).sort();
  }

  /**
   * Ottieni tutti i brand unici (escluso Q8)
   */
  getOptionalBrands(): string[] {
    const brands = new Set(
      this.records.filter(r => r.brand !== 'Q8').map(r => r.brand)
    );
    return Array.from(brands).sort();
  }

  /**
   * Trova o crea una corrispondenza Q8-Roloil
   */
  findOrCreateQ8Correspondence(
    q8Product: string,
    roloilProduct: string,
    sae: string,
    type: string
  ): CorrespondenceRecord {
    // Cerca corrispondenza Q8 esistente
    const existing = this.records.find(r => 
      r.brand === 'Q8' && 
      r.product === q8Product && 
      r.sae === sae && 
      r.type === type
    );

    if (existing) {
      return existing;
    }

    // Crea nuova corrispondenza Q8-Roloil
    const newRecord: CorrespondenceRecord = {
      id: this.generateId('Q8', q8Product, roloilProduct, sae),
      brand: 'Q8',
      product: q8Product,
      sae: sae,
      roloil: roloilProduct,
      type: type
    };

    this.records.push(newRecord);
    return newRecord;
  }

  /**
   * Aggiorna una corrispondenza Q8-Roloil
   */
  updateQ8Correspondence(
    q8Product: string,
    sae: string,
    type: string,
    newRoloil: string
  ): boolean {
    const record = this.records.find(r => 
      r.brand === 'Q8' && 
      r.product === q8Product && 
      r.sae === sae && 
      r.type === type
    );

    if (record) {
      record.roloil = newRoloil;
      return true;
    }

    return false;
  }

  /**
   * Aggiungi una corrispondenza per un altro brand
   */
  addBrandCorrespondence(
    brand: string,
    product: string,
    roloilProduct: string,
    sae: string,
    type: string
  ): CorrespondenceRecord {
    const newRecord: CorrespondenceRecord = {
      id: this.generateId(brand, product, roloilProduct, sae),
      brand: brand,
      product: product,
      sae: sae,
      roloil: roloilProduct,
      type: type
    };

    this.records.push(newRecord);
    return newRecord;
  }

  /**
   * Ottieni tutti i tipi unici
   */
  getUniqueTypes(): string[] {
    const types = new Set(this.records.map(r => r.type));
    return Array.from(types).sort();
  }

  /**
   * Ottieni tutti i valori SAE unici
   */
  getUniqueSaeValues(): string[] {
    const saes = new Set(this.records.map(r => r.sae));
    return Array.from(saes).sort();
  }

  /**
   * Trova records per criteri specifici
   */
  findRecords(filters: {
    brand?: string;
    product?: string;
    sae?: string;
    roloil?: string;
    type?: string;
  }): CorrespondenceRecord[] {
    return this.records.filter(record => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === undefined) return true;
        return record[key as keyof CorrespondenceRecord] === value;
      });
    });
  }

  /**
   * Genera ID univoco
   */
  private generateId(brand: string, product: string, roloil: string, sae: string): string {
    const timestamp = Date.now();
    const clean = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `${clean(brand)}-${clean(product)}-${clean(roloil)}-${clean(sae)}-${timestamp}`;
  }

  /**
   * Esporta in CSV
   */
  exportToCSV(): string {
    const headers = ['Brand', 'Product', 'SAE', 'Roloil', 'Type'];
    const rows = this.records.map(record => [
      record.brand,
      record.product,
      record.sae,
      record.roloil,
      record.type
    ]);
    
    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
  }
}

// Istanza globale
export const correspondenceServiceCorrect = new CorrespondenceServiceCorrect();