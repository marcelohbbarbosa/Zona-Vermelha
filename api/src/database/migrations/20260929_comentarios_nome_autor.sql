ALTER TABLE comentarios
  ADD COLUMN IF NOT EXISTS nome_autor VARCHAR(80);

UPDATE comentarios
SET nome_autor = 'Brasil ' || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0')
WHERE nome_autor IS NULL;

ALTER TABLE comentarios
  ALTER COLUMN nome_autor SET NOT NULL;
