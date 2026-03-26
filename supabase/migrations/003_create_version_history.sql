-- Tabella delle versioni applicative e stato corrente

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.version_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  version text NOT NULL,
  notes text,
  is_current boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Allinea schema se la tabella esiste già
ALTER TABLE public.version_history
  ADD COLUMN IF NOT EXISTS version text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS is_current boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- Garantisce una sola versione corrente
CREATE UNIQUE INDEX IF NOT EXISTS uq_version_history_current
  ON public.version_history (is_current)
  WHERE is_current = true;

-- Indice per ordinamento cronologico
CREATE INDEX IF NOT EXISTS idx_version_history_created_at
  ON public.version_history (created_at DESC);

-- Abilita RLS e politiche aperte (necessario per client anon senza Supabase Auth)
ALTER TABLE public.version_history ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'version_history' AND policyname = 'version_history_select_all'
  ) THEN
    CREATE POLICY version_history_select_all ON public.version_history FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'version_history' AND policyname = 'version_history_insert_all'
  ) THEN
    CREATE POLICY version_history_insert_all ON public.version_history FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'version_history' AND policyname = 'version_history_update_all'
  ) THEN
    CREATE POLICY version_history_update_all ON public.version_history FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'version_history' AND policyname = 'version_history_delete_all'
  ) THEN
    CREATE POLICY version_history_delete_all ON public.version_history FOR DELETE USING (true);
  END IF;
END $$;

-- Permessi minimi
GRANT SELECT, INSERT, UPDATE, DELETE ON public.version_history TO anon, authenticated;
