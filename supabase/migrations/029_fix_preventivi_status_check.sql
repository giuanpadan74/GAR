-- =====================================================
-- MIGRAZIONE 029: Allineare lo status dei preventivi all'enum italiano
-- =====================================================
--
-- La tabella preventivi e' stata creata (migration 010) con un CHECK su status
-- che ammette solo valori inglesi: draft, sent, accepted, rejected, expired.
-- L'applicazione pero' usa l'enum PreventionStatus italiano (bozza, inviato,
-- accettato, rifiutato, scaduto), definito in types/listino.ts.
--
-- Conseguenza: ogni creazione preventivo falliva con violazione del CHECK,
-- per qualsiasi valore di status. Il default della tabella era 'draft'.
--
-- Qui il CHECK viene allargato ai valori italiani, mantenendo quelli inglesi
-- per compatibilita' con eventuali record gia' inseriti.
-- =====================================================

ALTER TABLE public.preventivi
  DROP CONSTRAINT IF EXISTS preventivi_status_check;

ALTER TABLE public.preventivi
  ADD CONSTRAINT preventivi_status_check
  CHECK (status IN (
    -- Italiano (usato dall'applicazione)
    'bozza', 'inviato', 'accettato', 'rifiutato', 'scaduto',
    -- Inglese (valori precedenti, mantenuti per compatibilita')
    'draft', 'sent', 'accepted', 'rejected', 'expired'
  ));

COMMENT ON CONSTRAINT preventivi_status_check ON public.preventivi IS
  'Stati del preventivo: valori italiani usati dall''app, valori inglesi mantenuti per compatibilita''; non aggiungerne di nuovi senza allineare l''enum in types/listino.ts';