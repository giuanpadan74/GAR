/**
 * Utility centralizzate per la gestione delle date promo.
 *
 * Convenzione del progetto:
 *  - DB / API   → formato ISO  YYYY-MM-DD  (es. "2026-08-05")
 *  - UI / input  → formato IT   dd/mm/yyyy  (es. "05/08/2026")
 *
 * Le funzioni qui sotto sono la singola fonte di verità usata da
 * EditableProductRow, NewProductModal e productValidation.
 */

/**
 * Converte una data ISO (YYYY-MM-DD, anche con timestamp/timezone)
 * proveniente dal DB nel formato italiano dd/mm/yyyy per la visualizzazione.
 *
 * Ritorna stringa vuota se il valore è vuoto o non parsabile.
 */
export const formatDateToItalian = (isoDate: string | null | undefined): string => {
  if (!isoDate) return '';

  const value = String(isoDate).trim();
  if (!value) return '';

  try {
    // 1) Corrispondenza esatta YYYY-MM-DD (data pura dal tipo DATE di Postgres)
    const isoRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
    const match = value.match(isoRegex);
    if (match) {
      const [, year, month, day] = match;
      return `${day}/${month}/${year}`;
    }

    // 2) Data con orario / timezone (es. "2026-08-05T00:00:00+00:00" o "2026-08-05 00:00:00")
    //    Estraiamo solo la parte della data per evitare conversioni di fuso orario.
    const dateTimeMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})[T\s]/);
    if (dateTimeMatch) {
      const [, year, month, day] = dateTimeMatch;
      return `${day}/${month}/${year}`;
    }

    // 3) Fallback generico con Date UTC
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';
    const day = date.getUTCDate().toString().padStart(2, '0');
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '';
  }
};

/**
 * Converte una data nel formato italiano dd/mm/yyyy nel formato ISO YYYY-MM-DD
 * per l'invio al database.
 *
 * Ritorna stringa vuota se il valore è vuoto o non valido.
 */
export const formatDateToISO = (italianDate: string | null | undefined): string => {
  if (!italianDate) return '';

  const value = String(italianDate).trim();
  if (!value) return '';

  try {
    // Accetta dd/mm/yyyy
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = value.match(dateRegex);
    if (!match) return '';

    const [, day, month, year] = match;
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    // Validazione range base
    if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900) {
      return '';
    }

    // Creazione data UTC + controllo anti-overflow (es. 30/02 non valido)
    const date = new Date(Date.UTC(yearNum, monthNum - 1, dayNum));
    if (
      isNaN(date.getTime()) ||
      date.getUTCDate() !== dayNum ||
      date.getUTCMonth() !== monthNum - 1 ||
      date.getUTCFullYear() !== yearNum
    ) {
      return '';
    }

    const isoDay = dayNum.toString().padStart(2, '0');
    const isoMonth = monthNum.toString().padStart(2, '0');
    return `${yearNum}-${isoMonth}-${isoDay}`;
  } catch {
    return '';
  }
};

/**
 * Verifica che una stringa sia una data italiana valida nel formato dd/mm/yyyy.
 * Stringa vuota è considerata valida (campo opzionale).
 */
export const isValidItalianDate = (dateString: string | null | undefined): boolean => {
  if (!dateString) return true;
  const value = String(dateString).trim();
  if (!value) return true;
  const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  return dateRegex.test(value) && formatDateToISO(value) !== '';
};

/**
 * Primo giorno del mese corrente in formato dd/mm/yyyy.
 * Utile come valore predefinito per le promo.
 */
export const getFirstDayOfCurrentMonth = (): string => {
  const now = new Date();
  const day = '01';
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const year = now.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Ultimo giorno del mese corrente in formato dd/mm/yyyy.
 */
export const getLastDayOfCurrentMonth = (): string => {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const day = lastDay.getDate().toString().padStart(2, '0');
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const year = now.getFullYear();
  return `${day}/${month}/${year}`;
};
