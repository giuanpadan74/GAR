import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ComparisonResult } from "../types";

// Inizializza il client Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const productSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    productName: { type: Type.STRING, description: "Il nome commerciale esatto del prodotto (es. 'Q8 FORMULA PRESTIGE V 5W 30'). Se non trovato, scrivi 'NON TROVATO'." },
    description: { type: Type.STRING, description: "Una breve descrizione tecnica del prodotto." },
    application: { type: Type.STRING, description: "Principale utilizzo (es. Motore, Idraulico, Guide)." },
    viscosityGrade: { type: Type.STRING, description: "Grado di viscosità ISO o SAE (es. ISO VG 46, SAE 10W 40)." },
    specifications: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "Lista delle specifiche principali (es. DIN 51524, API SN)."
    }
  },
  required: ["productName", "description", "application", "viscosityGrade", "specifications"]
};

const comparisonSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    searchedProduct: productSchema,
    q8: productSchema,
    analysis: { type: Type.STRING, description: "Breve spiegazione tecnica." }
  },
  required: ["searchedProduct", "q8", "analysis"]
};

export const findEquivalents = async (query: string): Promise<ComparisonResult> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Agisci come un Responsabile Tecnico Q8 Oils (Kuwait Petroleum).
      Analizza la richiesta: "${query}" per trovare l'esatto equivalente a catalogo.

      REGOLE CRITICHE SUI NOMI (CATALOGO UFFICIALE):
      1. Il nome del prodotto Q8 deve essere ESATTO come da scheda tecnica (TDS). 
         - NO: "Q8 LONGLIFE 5W30" (Nome generico errato, non esiste a listino)
         - SÌ: "Q8 FORMULA VX LONG LIFE 5W 30" o "Q8 FORMULA PRESTIGE V 5W 30"
      2. Usa le famiglie di prodotti corrette:
         - Auto: Q8 FORMULA... (es. Formula Excel, Formula Techno, Formula Prestige)
         - Heavy Duty: Q8 T... (es. T 750, T 905)
         - Idraulici: Q8 HAYDN, Q8 HANDEL, Q8 HELLER
         - Ingranaggi Ind.: Q8 GOYA
         - Guide: Q8 WAGNER, Q8 DYNOBEAR
      3. Se il prodotto non esiste o non sei sicuro, scrivi "NON TROVATO". NON inventare nomi.

      FORMATTAZIONE:
      - Tutto MAIUSCOLO.
      - Rimuovi trattini "-" (es. "5W-30" -> "5W 30").
      - Solo JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: comparisonSchema,
        temperature: 0.0, // Zero temperatura per massima determinismo e fedeltà ai dati
      }
    });

    const text = response.text;
    if (!text) throw new Error("Nessuna risposta generata dall'IA.");

    const result = JSON.parse(text) as ComparisonResult;

    // Post-processing
    if (result.q8 && result.q8.productName) {
      let name = result.q8.productName.toUpperCase().trim();
      
      if (name.includes("NON TROVATO") || name.includes("NOT FOUND") || name.includes("NESSUN")) {
         result.q8.productName = "NON TROVATO";
         result.q8.description = "Nessuna corrispondenza esatta trovata nel catalogo ufficiale Q8.";
         result.q8.specifications = [];
         result.q8.viscosityGrade = "-";
         result.q8.application = "-";
      } else {
         // Rinforzo pulizia trattini via codice
         name = name.replace(/-/g, ' ');
         // Rimuovi doppi spazi creati dalla rimozione trattini
         result.q8.productName = name.replace(/\s+/g, ' ').trim();
      }
    }
    
    if (result.searchedProduct && result.searchedProduct.productName) {
       result.searchedProduct.productName = result.searchedProduct.productName.toUpperCase();
    }

    return result;
  } catch (error) {
    console.error("Errore:", error);
    throw error;
  }
};