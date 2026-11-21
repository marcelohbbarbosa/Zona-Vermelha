ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS avaliacao_bloqueada_ate TIMESTAMPTZ;
