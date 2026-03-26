import { z } from 'zod';

/**
 * Schema di validazione per i campi modificabili dei prodotti
 * Basato sui requisiti della documentazione tecnica
 */
export const editableProductSchema = z.object({
  aplibint: z
    .string()
    .min(1, 'APLIBINT è obbligatorio')
    .max(50, 'APLIBINT non può superare i 50 caratteri')
    .regex(/^[a-zA-Z0-9\s\-_]*$/, 'APLIBINT contiene caratteri non validi'),
  
  brand: z
    .string()
    .max(100, 'Brand non può superare i 100 caratteri')
    .regex(/^[a-zA-Z0-9\s\-_.,()]*$/, 'Brand contiene caratteri non validi')
    .optional(),
  
  xde40: z
    .string()
    .max(50, 'XDE40 non può superare i 50 caratteri')
    .regex(/^[a-zA-Z0-9\s\-_]*$/, 'XDE40 contiene caratteri non validi')
    .optional(),
  
  xde60: z
    .string()
    .max(50, 'XDE60 non può superare i 50 caratteri')
    .regex(/^[a-zA-Z0-9\s\-_]*$/, 'XDE60 contiene caratteri non validi')
    .optional(),
  
  descrizione: z
    .string()
    .min(1, 'La descrizione è obbligatoria')
    .max(255, 'La descrizione non può superare i 255 caratteri')
    .regex(/^[a-zA-Z0-9\s\-_.,()]+$/, 'La descrizione contiene caratteri non validi'),
  
  apdesi: z
    .string()
    .max(255, 'APDESI non può superare i 255 caratteri')
    .regex(/^[a-zA-Z0-9\s\-_.,()]*$/, 'APDESI contiene caratteri non validi')
    .optional(),
  
  apunmi: z
    .string()
    .max(20, 'APUNMI non può superare i 20 caratteri')
    .regex(/^[a-zA-Z0-9\s\-_]*$/, 'APUNMI contiene caratteri non validi')
    .optional(),
  
  apprli: z
    .number()
    .positive('Il prezzo deve essere positivo')
    .min(0.01, 'Il prezzo minimo è 0.01€')
    .max(99999.99, 'Il prezzo massimo è 99999.99€')
    .refine(
      (val) => Number(val.toFixed(2)) === val || val.toString().split('.')[1]?.length <= 2,
      'Il prezzo può avere massimo 2 decimali'
    ),
  
  appesf: z
    .number()
    .min(0, 'Il peso specifico non può essere negativo')
    .refine(
      (val) => Number(val.toFixed(3)) === val || val.toString().split('.')[1]?.length <= 3,
      'Il peso specifico può avere massimo 3 decimali'
    ),
  
  CONOU: z
    .number()
    .min(0, 'Il valore CONOU non può essere negativo')
    .max(1, 'Il valore CONOU massimo è 1')
    .refine(
      (val) => Number(val.toFixed(5)) === val || val.toString().split('.')[1]?.length <= 5,
      'Il valore CONOU può avere massimo 5 decimali'
    ),
  
  aplib1: z
    .string()
    .max(50, 'APLIB1 non può superare i 50 caratteri')
    .regex(/^[a-zA-Z0-9\s\-_]*$/, 'APLIB1 contiene caratteri non validi')
    .optional(),
  
  // Campi promo
  promoDAL: z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Formato data non valido (dd/mm/yyyy)')
    .refine((val) => {
      if (!val) return true; // Campo opzionale
      const [day, month, year] = val.split('/').map(Number);
      const date = new Date(year, month - 1, day);
      return date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year;
    }, 'Data non valida')
    .optional(),
  
  promoAL: z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Formato data non valido (dd/mm/yyyy)')
    .refine((val) => {
      if (!val) return true; // Campo opzionale
      const [day, month, year] = val.split('/').map(Number);
      const date = new Date(year, month - 1, day);
      return date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year;
    }, 'Data non valida')
    .optional(),
  
  promoPrezzo: z
    .number()
    .positive('Il prezzo promo deve essere positivo')
    .min(0.01, 'Il prezzo promo minimo è 0.01€')
    .max(99999.99, 'Il prezzo promo massimo è 99999.99€')
    .refine(
      (val) => Number(val.toFixed(2)) === val || val.toString().split('.')[1]?.length <= 2,
      'Il prezzo promo può avere massimo 2 decimali'
    )
    .optional(),
  
  // Campo obsoleto
  obsoleto: z
    .boolean()
    .optional()
});

/**
 * Schema per la validazione di un singolo campo
 */
export const singleFieldSchema = {
  aplibint: editableProductSchema.shape.aplibint,
  brand: editableProductSchema.shape.brand,
  xde40: editableProductSchema.shape.xde40,
  xde60: editableProductSchema.shape.xde60,
  descrizione: editableProductSchema.shape.descrizione,
  apdesi: editableProductSchema.shape.apdesi,
  apunmi: editableProductSchema.shape.apunmi,
  apprli: editableProductSchema.shape.apprli,
  appesf: editableProductSchema.shape.appesf,
  CONOU: editableProductSchema.shape.CONOU,
  aplib1: editableProductSchema.shape.aplib1,
  promoDAL: editableProductSchema.shape.promoDAL,
  promoAL: editableProductSchema.shape.promoAL,
  promoPrezzo: editableProductSchema.shape.promoPrezzo,
  obsoleto: editableProductSchema.shape.obsoleto
};

/**
 * Tipo per i dati di input dell'editing
 */
export type EditableProductInput = z.infer<typeof editableProductSchema>;

/**
 * Tipo per i risultati di validazione
 */
export interface ValidationResult {
  success: boolean;
  errors: Record<string, string>;
  data?: EditableProductInput;
}

/**
 * Funzione per validare tutti i campi modificabili
 */
export function validateEditableProduct(data: Partial<EditableProductInput>): ValidationResult {
  try {
    const validatedData = editableProductSchema.parse(data);
    return {
      success: true,
      errors: {},
      data: validatedData
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return {
        success: false,
        errors
      };
    }
    return {
      success: false,
      errors: { general: 'Errore di validazione sconosciuto' }
    };
  }
}

/**
 * Funzione per validare un singolo campo
 */
export function validateSingleField(
  fieldName: keyof EditableProductInput,
  value: any
): { success: boolean; error?: string } {
  try {
    const schema = singleFieldSchema[fieldName];
    if (!schema) {
      return { success: false, error: 'Campo non valido' };
    }
    
    schema.parse(value);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || 'Valore non valido'
      };
    }
    return { success: false, error: 'Errore di validazione' };
  }
}

/**
 * Funzione per convertire i valori stringa in tipi appropriati
 */
export function parseFieldValue(fieldName: keyof EditableProductInput, value: string | boolean): any {
  switch (fieldName) {
    case 'apprli':
    case 'appesf':
    case 'CONOU':
    case 'promoPrezzo':
      const numValue = parseFloat(value as string);
      return isNaN(numValue) ? 0 : numValue;
    case 'descrizione':
    case 'aplib1':
    case 'promoDAL':
    case 'promoAL':
      return (value as string).trim();
    case 'obsoleto':
      return typeof value === 'boolean' ? value : value === 'true';
    default:
      return value;
  }
}