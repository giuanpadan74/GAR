import { CorrespondenceRecord } from './types-new';

/**
 * Nuova struttura dati simmetrica per tutte le corrispondenze
 * Ogni record rappresenta una corrispondenza tra un prodotto brand e un prodotto Roloil
 */
export const correspondenceRecords: CorrespondenceRecord[] = [
  // === CASTROL ===
  // PCMO Castrol
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

  // HDDO Castrol
  { id: 'castrol-crb-multi-10w30', brand: 'Castrol', product: 'CRB MULTI (10W-30)', sae: '10W-30', roloil: 'DOLOMITI WMT 4.5', type: 'HDDO' },
  { id: 'castrol-crb-multi-15w40', brand: 'Castrol', product: 'CRB MULTI (15W-40)', sae: '15W-40', roloil: 'DOLOMITI WMT 4.5', type: 'HDDO' },
  { id: 'castrol-vecton-15w40', brand: 'Castrol', product: 'Vecton (15W-40)', sae: '15W-40', roloil: 'DOLOMITI WMT 4.5', type: 'HDDO' },

  // GEAR TRANSMISSION Castrol
  { id: 'castrol-axle-z-limited-slip', brand: 'Castrol', product: 'Axle Z Limited Slip', sae: '90', roloil: 'VARIAX 90 LS', type: 'Gear Transmission' },

  // === Q8 ===
  // PCMO Q8
  { id: 'q8-formula-v-blue', brand: 'Q8', product: 'F.V BLUE', sae: '0W-20', roloil: 'PODIUM V', type: 'PCMO' },
  { id: 'q8-formula-special-fe', brand: 'Q8', product: 'F.SPECIAL FE', sae: '0W-20', roloil: 'PODIUM-FE', type: 'PCMO' },
  { id: 'q8-formula-special-g-ll', brand: 'Q8', product: 'F.SPECIAL G LL', sae: '0W-30', roloil: 'PODIUM BM', type: 'PCMO' },
  { id: 'q8-formula-m-ll', brand: 'Q8', product: 'F.M LL', sae: '0W-40', roloil: 'PODIUM PLATINUM', type: 'PCMO' },
  { id: 'q8-formula-excel', brand: 'Q8', product: 'F.EXCEL', sae: '0W-40', roloil: 'PODIUM', type: 'PCMO' },
  { id: 'q8-formula-prestige-v', brand: 'Q8', product: 'F.PRESTIGE V', sae: '5W-30', roloil: 'PODIUM V GOLD', type: 'PCMO' },
  { id: 'q8-formula-rallye', brand: 'Q8', product: 'F.RALLYE', sae: '15W-40', roloil: 'SUPERMULTIGRADE', type: 'PCMO' },
  { id: 'q8-formula-top', brand: 'Q8', product: 'F.TOP', sae: '10W-40', roloil: 'SUPERSYNTHETIC', type: 'PCMO' },
  { id: 'q8-formula-elite', brand: 'Q8', product: 'F.ELITE', sae: '5W-30', roloil: 'SUPERSYNTHETIC', type: 'PCMO' },
  { id: 'q8-formula-techno-eco', brand: 'Q8', product: 'F.TECHNO ECO', sae: '0W-30', roloil: 'PODIUM F', type: 'PCMO' },
  { id: 'q8-formula-elite-c2', brand: 'Q8', product: 'F.ELITE C2', sae: '0W-30', roloil: 'PODIUM C2', type: 'PCMO' },
  { id: 'q8-formula-v-blue-2', brand: 'Q8', product: 'F.V BLUE', sae: '0W-20', roloil: 'PODIUM V', type: 'PCMO' },

  // HDDO Q8
  { id: 'q8-ft7000', brand: 'Q8', product: 'FT 7000', sae: '10W-30', roloil: 'DOLOMITI WMT 4.5', type: 'HDDO' },
  { id: 'q8-ft7000-15w40', brand: 'Q8', product: 'FT 7000', sae: '15W-40', roloil: 'DOLOMITI WMT 4.5', type: 'HDDO' },
  { id: 'q8-t45', brand: 'Q8', product: 'T 45', sae: '90', roloil: 'VARIAX 90 LS', type: 'Gear Transmission' },
  { id: 'q8-t55-80w90', brand: 'Q8', product: 'T 55 80W-90', sae: '80W-90', roloil: 'VARIAX EP 80W-90', type: 'Gear Transmission' },
  { id: 'q8-t55-85w140', brand: 'Q8', product: 'T 55 85W-140', sae: '85W-140', roloil: 'VARIAX EP 85W-140', type: 'Gear Transmission' },
  { id: 'q8-t520', brand: 'Q8', product: 'T 520', sae: '15W-40', roloil: 'DOLOMITI SUPER HD T.', type: 'HDDO' },
  { id: 'q8-t720d', brand: 'Q8', product: 'T 720 D', sae: '15W-40', roloil: 'DOLOMITI T', type: 'HDDO' },
  { id: 'q8-t750', brand: 'Q8', product: 'T 750', sae: '15W-40', roloil: 'DOLOMITI TX 7', type: 'HDDO' },
  { id: 'q8-t800', brand: 'Q8', product: 'T 800', sae: '10W-40', roloil: 'DOLOMITI T SYNT 7', type: 'HDDO' },
  { id: 'q8-t860', brand: 'Q8', product: 'T 860', sae: '10W-40', roloil: 'ROADSTAR 10W-40', type: 'HDDO' },
  { id: 'q8-ft8500', brand: 'Q8', product: 'FT 8500', sae: '10W-40', roloil: 'ROADSTAR 6', type: 'HDDO' },
  { id: 'q8-ft8600', brand: 'Q8', product: 'FT 8600', sae: '10W-40', roloil: 'ROADSTAR GF', type: 'HDDO' },
  { id: 'q8-ft8700', brand: 'Q8', product: 'FT 8700', sae: '5W-30', roloil: 'ROADSTAR-LA', type: 'HDDO' },
  { id: 'q8-supertruck-fe', brand: 'Q8', product: 'SUPERTRUCK FE', sae: '5W-30', roloil: 'ROADSTAR FE', type: 'HDDO' },
  { id: 'q8-t400', brand: 'Q8', product: 'T 400', sae: '40', roloil: 'STELVIO', type: 'HDDO' },
  { id: 'q8-t5000d', brand: 'Q8', product: 'T 5000 D', sae: '15W-40', roloil: 'SUPERTRACTOR', type: 'HDDO' },
  { id: 'q8-t1000d', brand: 'Q8', product: 'T 1000 D', sae: '15W-40', roloil: 'SUPERTRACTOR', type: 'HDDO' },
  { id: 'q8-zc90', brand: 'Q8', product: 'ZC 90', sae: '80W-90', roloil: 'VARIAX 90 AZ', type: 'Gear Transmission' },
  { id: 'q8-axle-oil-xg', brand: 'Q8', product: 'AXLE OIL XG', sae: '80W-140', roloil: 'VARIASYNT EP', type: 'Gear Transmission' },
  { id: 'q8-t56', brand: 'Q8', product: 'T 56', sae: '75W-90', roloil: 'VARIASYNT EP', type: 'Gear Transmission' },

  // Aggiungi tutti gli altri brand qui...
  // Per ora includiamo solo i principali per dimostrare il concetto
];

/**
 * Funzione per generare records mancanti da rawProductData esistente
 * Questa funzione trasforma la vecchia struttura nella nuova
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

/**
 * Funzione per ottenere tutti i brand unici
 */
export function getUniqueBrands(records: CorrespondenceRecord[]): string[] {
  const brands = new Set(records.map(record => record.brand));
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
 * Funzione per trasformare i records nel formato per la tabella incrociata
 */
export function transformToCrossTableData(records: CorrespondenceRecord[]) {
  const crossMap = new Map<string, {
    roloil: string;
    type: string;
    sae: string;
    [brand: string]: string;
  }>();

  records.forEach(record => {
    const key = `${record.roloil}-${record.sae}-${record.type}`;
    
    if (!crossMap.has(key)) {
      crossMap.set(key, {
        roloil: record.roloil,
        type: record.type,
        sae: record.sae
      });
    }

    const entry = crossMap.get(key)!;
    entry[record.brand] = record.product;
  });

  return Array.from(crossMap.values()).sort((a, b) => 
    a.roloil.localeCompare(b.roloil) || a.sae.localeCompare(b.sae)
  );
}

// Dati trasformati per l'uso immediato
export const crossTableData = transformToCrossTableData(correspondenceRecords);
export const uniqueBrands = getUniqueBrands(correspondenceRecords);
export const uniqueTypes = getUniqueTypes(correspondenceRecords);
export const uniqueSaeValues = getUniqueSaeValues(correspondenceRecords);