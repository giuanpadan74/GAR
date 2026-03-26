-- Vincoli e trigger per version_history

-- Regex formato versione vX.Y.Z dove X,Y,Z >= 0
ALTER TABLE public.version_history
  ADD CONSTRAINT version_history_version_format
  CHECK (version ~ '^v[0-9]+\.[0-9]+\.[0-9]+$');

-- Unicità della stringa version
CREATE UNIQUE INDEX IF NOT EXISTS uq_version_history_version ON public.version_history (version);

-- Trigger per assicurare unicità di is_current = true
CREATE OR REPLACE FUNCTION public.version_history_enforce_single_current()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_current IS TRUE THEN
    -- Imposta tutte le altre a false
    UPDATE public.version_history SET is_current = false WHERE id <> NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_version_history_single_current ON public.version_history;
CREATE TRIGGER trg_version_history_single_current
BEFORE INSERT OR UPDATE ON public.version_history
FOR EACH ROW EXECUTE FUNCTION public.version_history_enforce_single_current();
