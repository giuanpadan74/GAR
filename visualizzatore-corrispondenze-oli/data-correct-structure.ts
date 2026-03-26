/**
 * Struttura dati corretta: Q8 è il riferimento principale
 * Ogni record rappresenta una corrispondenza tra un prodotto brand e un prodotto Roloil
 * La tabella cross avrà Q8 come colonna principale
 */

import { CorrespondenceRecord } from './types-new-correct';

// Dati completi con Q8 come riferimento
export const correspondenceRecords: CorrespondenceRecord[] = [
  
  // === Q8 PCMO ===
  { id: 'q8-fv-blue-0w20', brand: 'Q8', product: 'F.V BLUE', sae: '0W-20', roloil: 'PODIUM V', type: 'PCMO' },
  { id: 'q8-fspecial-fe-0w20', brand: 'Q8', product: 'F.SPECIAL FE', sae: '0W-20', roloil: 'PODIUM-FE', type: 'PCMO' },
  { id: 'q8-fspecial-g-ll-0w30', brand: 'Q8', product: 'F.SPECIAL G LL', sae: '0W-30', roloil: 'PODIUM BM', type: 'PCMO' },
  { id: 'q8-fm-ll-0w40', brand: 'Q8', product: 'F.M LL', sae: '0W-40', roloil: 'PODIUM PLATINUM', type: 'PCMO' },
  { id: 'q8-fexcel-0w40', brand: 'Q8', product: 'F.EXCEL', sae: '0W-40', roloil: 'PODIUM', type: 'PCMO' },
  { id: 'q8-fprestige-v-5w30', brand: 'Q8', product: 'F.PRESTIGE V', sae: '5W-30', roloil: 'PODIUM V GOLD', type: 'PCMO' },
  { id: 'q8-frallye-15w40', brand: 'Q8', product: 'F.RALLYE', sae: '15W-40', roloil: 'SUPERMULTIGRADE', type: 'PCMO' },
  { id: 'q8-ftop-10w40', brand: 'Q8', product: 'F.TOP', sae: '10W-40', roloil: 'SUPERSYNTHETIC', type: 'PCMO' },
  { id: 'q8-felite-5w30', brand: 'Q8', product: 'F.ELITE', sae: '5W-30', roloil: 'SUPERSYNTHETIC', type: 'PCMO' },
  { id: 'q8-ftecho-eco-0w30', brand: 'Q8', product: 'F.TECHNO ECO', sae: '0W-30', roloil: 'PODIUM F', type: 'PCMO' },
  { id: 'q8-felite-c2-0w30', brand: 'Q8', product: 'F.ELITE C2', sae: '0W-30', roloil: 'PODIUM C2', type: 'PCMO' },
  
  // === Q8 HDDO ===
  { id: 'q8-ft7000-10w30', brand: 'Q8', product: 'FT 7000', sae: '10W-30', roloil: 'DOLOMITI WMT 4.5', type: 'HDDO' },
  { id: 'q8-ft7000-15w40', brand: 'Q8', product: 'FT 7000', sae: '15W-40', roloil: 'DOLOMITI WMT 4.5', type: 'HDDO' },
  { id: 'q8-t520-15w40', brand: 'Q8', product: 'T 520', sae: '15W-40', roloil: 'DOLOMITI SUPER HD T.', type: 'HDDO' },
  { id: 'q8-t720d-15w40', brand: 'Q8', product: 'T 720 D', sae: '15W-40', roloil: 'DOLOMITI T', type: 'HDDO' },
  { id: 'q8-t750-15w40', brand: 'Q8', product: 'T 750', sae: '15W-40', roloil: 'DOLOMITI TX 7', type: 'HDDO' },
  { id: 'q8-t800-10w40', brand: 'Q8', product: 'T 800', sae: '10W-40', roloil: 'DOLOMITI T SYNT 7', type: 'HDDO' },
  { id: 'q8-t860-10w40', brand: 'Q8', product: 'T 860', sae: '10W-40', roloil: 'ROADSTAR 10W-40', type: 'HDDO' },
  { id: 'q8-ft8500-10w40', brand: 'Q8', product: 'FT 8500', sae: '10W-40', roloil: 'ROADSTAR 6', type: 'HDDO' },
  { id: 'q8-ft8600-10w40', brand: 'Q8', product: 'FT 8600', sae: '10W-40', roloil: 'ROADSTAR GF', type: 'HDDO' },
  { id: 'q8-ft8700-5w30', brand: 'Q8', product: 'FT 8700', sae: '5W-30', roloil: 'ROADSTAR-LA', type: 'HDDO' },
  { id: 'q8-supertruck-fe-5w30', brand: 'Q8', product: 'SUPERTRUCK FE', sae: '5W-30', roloil: 'ROADSTAR FE', type: 'HDDO' },
  { id: 'q8-t400-40', brand: 'Q8', product: 'T 400', sae: '40', roloil: 'STELVIO', type: 'HDDO' },
  { id: 'q8-t5000d-15w40', brand: 'Q8', product: 'T 5000 D', sae: '15W-40', roloil: 'SUPERTRACTOR', type: 'HDDO' },
  { id: 'q8-t1000d-15w40', brand: 'Q8', product: 'T 1000 D', sae: '15W-40', roloil: 'SUPERTRACTOR', type: 'HDDO' },
  
  // === Q8 GEAR TRANSMISSION ===
  { id: 'q8-t45-90', brand: 'Q8', product: 'T 45', sae: '90', roloil: 'VARIAX 90 LS', type: 'Gear Transmission' },
  { id: 'q8-t55-80w90', brand: 'Q8', product: 'T 55 80W-90', sae: '80W-90', roloil: 'VARIAX EP 80W-90', type: 'Gear Transmission' },
  { id: 'q8-t55-85w140', brand: 'Q8', product: 'T 55 85W-140', sae: '85W-140', roloil: 'VARIAX EP 85W-140', type: 'Gear Transmission' },
  { id: 'q8-zc90-80w90', brand: 'Q8', product: 'ZC 90', sae: '80W-90', roloil: 'VARIAX 90 AZ', type: 'Gear Transmission' },
  { id: 'q8-axle-oil-xg-80w140', brand: 'Q8', product: 'AXLE OIL XG', sae: '80W-140', roloil: 'VARIASYNT EP', type: 'Gear Transmission' },
  { id: 'q8-t56-75w90', brand: 'Q8', product: 'T 56', sae: '75W-90', roloil: 'VARIASYNT EP', type: 'Gear Transmission' },
  
  // === CASTROL PCMO (corrispondenze) ===
  { id: 'castrol-edge-0w20-ll-vi', brand: 'Castrol', product: 'EDGE 0W-20 LL VI', sae: '0W-20', roloil: 'PODIUM V', type: 'PCMO' },
  { id: 'castrol-edge-0w20-v', brand: 'Castrol', product: 'EDGE 0W-20 V', sae: '0W-20', roloil: 'PODIUM-FE', type: 'PCMO' },
  { id: 'castrol-edge-0w30', brand: 'Castrol', product: 'EDGE 0W-30', sae: '0W-30', roloil: 'PODIUM BM', type: 'PCMO' },
  { id: 'castrol-edge-0w40-c3-sn', brand: 'Castrol', product: 'EDGE 0W-40 (C3; SN)', sae: '0W-40', roloil: 'PODIUM PLATINUM', type: 'PCMO' },
  { id: 'castrol-edge-0w40-a3b4-cf', brand: 'Castrol', product: 'EDGE 0W-40 (A3/B4; CF)', sae: '0W-40', roloil: 'PODIUM', type: 'PCMO' },
  { id: 'castrol-edge-5w30-c3', brand: 'Castrol', product: 'EDGE 5W-30 C3', sae: '5W-30', roloil: 'PODIUM BM', type: 'PCMO' },
  { id: 'castrol-edge-5w30-ll', brand: 'Castrol', product: 'EDGE 5W-30 LL', sae: '5W-30', roloil: 'PODIUM V GOLD', type: 'PCMO' },
  { id: 'castrol-edge-5w30-m', brand: 'Castrol', product: 'EDGE 5W-30 M', sae: '5W-30', roloil: 'PODIUM BM', type: 'PCMO' },
  { id: 'castrol-edge-5w40', brand: 'Castrol', product: 'EDGE 5W-40', sae: '5W-40', roloil: 'PODIUM PLATINUM', type: 'PCMO' },
  { id: 'castrol-edge-professional-e', brand: 'Castrol', product: 'EDGE PROFESSIONAL E', sae: '0W-30', roloil: 'PODIUM F', type: 'PCMO' },
  { id: 'castrol-edge-supercar', brand: 'Castrol', product: 'EDGE SUPERCAR', sae: '10W-60', roloil: 'RACING 10W-50', type: 'PCMO' },
  { id: 'castrol-edge-turbodiesel', brand: 'Castrol', product: 'EDGE TURBODIESEL', sae: '5W-40', roloil: 'PODIUM PLATINUM', type: 'PCMO' },
  { id: 'castrol-gtx-15w40-a3b3', brand: 'Castrol', product: 'GTX 15W-40 A3/B3', sae: '15W-40', roloil: 'SUPERMULTIGRADE', type: 'PCMO' },
  { id: 'castrol-gtx-5w30-mp', brand: 'Castrol', product: 'GTX 5W-30 MP', sae: '5W-30', roloil: 'PODIUM BM', type: 'PCMO' },
  { id: 'castrol-gtx-5w40-c3', brand: 'Castrol', product: 'GTX 5W-40 C3', sae: '5W-40', roloil: 'PODIUM PLATINUM', type: 'PCMO' },
  { id: 'castrol-gtx-ultraclean-10w40', brand: 'Castrol', product: 'GTX ULTRACLEAN 10W-40 A3/B4', sae: '10W-40', roloil: 'SUPERSYNTHETIC', type: 'PCMO' },
  { id: 'castrol-magnatec-10w40', brand: 'Castrol', product: 'MAGNATEC 10W-40 A3/B4', sae: '10W-40', roloil: 'SUPERSYNTHETIC', type: 'PCMO' },
  { id: 'castrol-magnatec-5w30-dx', brand: 'Castrol', product: 'MAGNATEC 5W-30 DX', sae: '5W-30', roloil: 'PODIUM V GOLD', type: 'PCMO' },
  { id: 'castrol-magnatec-5w40-a3b4', brand: 'Castrol', product: 'MAGNATEC 5W-40 A3/B4', sae: '5W-40', roloil: 'PODIUM', type: 'PCMO' },
  { id: 'castrol-magnatec-5w40-c3', brand: 'Castrol', product: 'MAGNATEC 5W-40 C3', sae: '5W-40', roloil: 'PODIUM PLATINUM', type: 'PCMO' },
  { id: 'castrol-magnatec-5w40-dpf', brand: 'Castrol', product: 'MAGNATEC 5W-40 DPF', sae: '5W-40', roloil: 'PODIUM PLATINUM', type: 'PCMO' },
  { id: 'castrol-magnatec-diesel-10w40', brand: 'Castrol', product: 'MAGNATEC DIESEL 10W-40 B4', sae: '10W-40', roloil: 'SUPERSYNTHETIC', type: 'PCMO' },
  { id: 'castrol-magnatec-stopstart-0w30-c2', brand: 'Castrol', product: 'MAGNATEC STOP-START 0W-30 C2', sae: '0W-30', roloil: 'PODIUM C2', type: 'PCMO' },
  { id: 'castrol-magnatec-stopstart-0w30-d', brand: 'Castrol', product: 'MAGNATEC STOP-START 0W-30 D', sae: '0W-30', roloil: 'PODIUM-F', type: 'PCMO' },
  { id: 'castrol-magnatec-stopstart-5w30-a3b4', brand: 'Castrol', product: 'MAGNATEC STOP-START 5W-30 A3/B4', sae: '5W-30', roloil: 'SUPERSYNTHETIC FE', type: 'PCMO' },
  
  // === CASTROL HDDO (corrispondenze) ===
  { id: 'castrol-crb-multi-10w30', brand: 'Castrol', product: 'CRB MULTI (10W-30)', sae: '10W-30', roloil: 'DOLOMITI WMT 4.5', type: 'HDDO' },
  { id: 'castrol-crb-multi-15w40', brand: 'Castrol', product: 'CRB MULTI (15W-40)', sae: '15W-40', roloil: 'DOLOMITI WMT 4.5', type: 'HDDO' },
  { id: 'castrol-vecton-15w40', brand: 'Castrol', product: 'Vecton (15W-40)', sae: '15W-40', roloil: 'DOLOMITI WMT 4.5', type: 'HDDO' },
  
  // === CASTROL GEAR TRANSMISSION (corrispondenze) ===
  { id: 'castrol-axle-z-limited-slip', brand: 'Castrol', product: 'Axle Z Limited Slip', sae: '90', roloil: 'VARIAX 90 LS', type: 'Gear Transmission' },
  
  // Aggiungi tutti gli altri brand qui...
  // La struttura mantiene Q8 come riferimento e gli altri brand come corrispondenze
];

/**
 * Trasforma i records nel formato per la tabella incrociata
 * Ora Q8 è la colonna principale, Roloil è la corrispondenza
 */
export function transformToCrossTableData(records: CorrespondenceRecord[]) {
  const crossMap = new Map<string, {
    type: string;
    sae: string;
    q8: string;
    roloil: string;
    [brand: string]: string;
  }>();

  // Raggruppa per Q8 + SAE + Tipo (questa sarà la chiave univoca per riga)
  const q8Records = records.filter(record => record.brand === 'Q8');
  
  q8Records.forEach(record => {
    const key = `${record.product}-${record.sae}-${record.type}`;
    
    crossMap.set(key, {
      type: record.type,
      sae: record.sae,
      q8: record.product,
      roloil: record.roloil
    });
  });

  // Aggiungi le corrispondenze degli altri brand
  const otherBrandRecords = records.filter(record => record.brand !== 'Q8');
  
  otherBrandRecords.forEach(record => {
    // Trova la riga Q8 corrispondente (stesso roloil, sae, tipo)
    const matchingQ8Key = Array.from(crossMap.keys()).find(key => {
      const row = crossMap.get(key)!;
      return row.roloil === record.roloil && 
             row.sae === record.sae && 
             row.type === record.type;
    });
    
    if (matchingQ8Key) {
      // Aggiungi la corrispondenza del brand alla riga esistente
      const row = crossMap.get(matchingQ8Key)!;
      row[record.brand] = record.product;
    } else {
      // Se non c'è una corrispondenza Q8, crea una nuova riga con Q8 mancante
      const newKey = `${record.roloil}-${record.sae}-${record.type}-missing-q8`;
      crossMap.set(newKey, {
        type: record.type,
        sae: record.sae,
        q8: '---', // Q8 mancante
        roloil: record.roloil,
        [record.brand]: record.product
      });
    }
  });

  // Converti in array e ordina
  return Array.from(crossMap.values()).sort((a, b) => {
    // Ordina per Tipo, poi Q8, poi SAE
    const typeCompare = a.type.localeCompare(b.type);
    if (typeCompare !== 0) return typeCompare;
    
    const q8Compare = a.q8.localeCompare(b.q8);
    if (q8Compare !== 0) return q8Compare;
    
    return a.sae.localeCompare(b.sae);
  });
}

/**
 * Funzione per ottenere tutti i brand unici (escludendo Q8 che è sempre presente)
 */
export function getUniqueOtherBrands(records: CorrespondenceRecord[]): string[] {
  const brands = new Set(records
    .filter(record => record.brand !== 'Q8')
    .map(record => record.brand)
  );
  return Array.from(brands).sort();
}

/**
 * Funzione per ottenere tutti i tipi unici
 */
export function getUniqueTypes(records: CorrespondenceRecord[]): string[] {
  const types = new Set(records.map(record => record.type));
  return Array.from(types).sort();
}

/**
 * Funzione per ottenere tutti i valori SAE unici
 */
export function getUniqueSaeValues(records: CorrespondenceRecord[]): string[] {
  const saes = new Set(records.map(record => record.sae));
  return Array.from(saes).sort();
}

/**
 * Funzione per ottenere tutti i prodotti Q8 unici
 */
export function getUniqueQ8Products(records: CorrespondenceRecord[]): string[] {
  const products = new Set(
    records
      .filter(record => record.brand === 'Q8')
      .map(record => record.product)
  );
  return Array.from(products).sort();
}

/**
 * Migrazione dalla vecchia struttura
 */
export function migrateFromOldStructure(oldData: any[]): CorrespondenceRecord[] {
  const records: CorrespondenceRecord[] = [];
  let idCounter = 1;

  oldData.forEach(item => {
    if (!item.roloil || ['---', '-------', ''].includes(item.roloil.trim())) return;
    
    const sae = item.sae?.trim();
    if (!sae || ['---', '-------', ''].includes(sae)) return;

    // Aggiungi record per il brand principale (non Q8)
    if (item.brand && item.brand !== 'Q8' && item.product) {
      records.push({
        id: `${item.brand.toLowerCase()}-${item.product.toLowerCase().replace(/\s+/g, '-')}-${idCounter++}`,
        brand: item.brand,
        product: item.product,
        sae: sae,
        roloil: item.roloil.trim(),
        type: item.type
      });
    }

    // Aggiungi record per Q8 se esiste
    if (item.q8 && !['---', '-------', ''].includes(item.q8.trim())) {
      records.push({
        id: `q8-${item.q8.toLowerCase().replace(/\s+/g, '-')}-${idCounter++}`,
        brand: 'Q8',
        product: item.q8.trim(),
        sae: sae,
        roloil: item.roloil.trim(),
        type: item.type
      });
    }
  });

  return records;
}

// Dati trasformati per l'uso immediato
export const crossTableData = transformToCrossTableData(correspondenceRecords);
export const uniqueOtherBrands = getUniqueOtherBrands(correspondenceRecords);
export const uniqueTypes = getUniqueTypes(correspondenceRecords);
export const uniqueSaeValues = getUniqueSaeValues(correspondenceRecords);
export const uniqueQ8Products = getUniqueQ8Products(correspondenceRecords);