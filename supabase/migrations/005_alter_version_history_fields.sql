-- Aggiorna schema version_history per supportare campi richiesti

-- Aggiunge campi implementation_date e description
ALTER TABLE public.version_history
  ADD COLUMN IF NOT EXISTS implementation_date date NOT NULL DEFAULT current_date,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS version_number text;

-- Aggiorna vincolo formato versione per accettare sia "vX.Y.Z" che "X.Y.Z"
ALTER TABLE public.version_history
  DROP CONSTRAINT IF EXISTS version_history_version_format;

ALTER TABLE public.version_history
  ADD CONSTRAINT version_history_version_format
  CHECK ((version ~ '^(v)?[0-9]+\.[0-9]+\.[0-9]+$') OR (version_number ~ '^(v)?[0-9]+\.[0-9]+\.[0-9]+$'));

-- Indice unico su version già creato in migrazione precedente; qui solo assicurazione
CREATE UNIQUE INDEX IF NOT EXISTS uq_version_history_version ON public.version_history (COALESCE(version, version_number));
