UPDATE categorias c
SET nivel = tag.nivel
FROM (VALUES
  ('Boa iluminação', 1),
  ('Policiamento presente', 1),
  ('Rua bem conservada', 1),
  ('Local movimentado', 1),
  ('Ambiente tranquilo', 1),
  ('Iluminação ruim', 2),
  ('Buracos na via', 2),
  ('Calçada danificada', 2),
  ('Alagamento', 2),
  ('Sinalização danificada', 2),
  ('Lixo acumulado', 2),
  ('Assalto ou roubo', 3),
  ('Furto', 3),
  ('Ameaça ou agressão', 3),
  ('Assédio', 3),
  ('Comércio de drogas', 3)
) AS tag(nome, nivel)
WHERE lower(btrim(c.nome)) = lower(tag.nome);

INSERT INTO categorias (nome, nivel)
SELECT tag.nome, tag.nivel
FROM (VALUES
  ('Boa iluminação', 1),
  ('Policiamento presente', 1),
  ('Rua bem conservada', 1),
  ('Local movimentado', 1),
  ('Ambiente tranquilo', 1),
  ('Iluminação ruim', 2),
  ('Buracos na via', 2),
  ('Calçada danificada', 2),
  ('Alagamento', 2),
  ('Sinalização danificada', 2),
  ('Lixo acumulado', 2),
  ('Assalto ou roubo', 3),
  ('Furto', 3),
  ('Ameaça ou agressão', 3),
  ('Assédio', 3),
  ('Comércio de drogas', 3)
) AS tag(nome, nivel)
WHERE NOT EXISTS (
  SELECT 1 FROM categorias existente
  WHERE lower(btrim(existente.nome)) = lower(tag.nome)
);
