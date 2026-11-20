CREATE TABLE IF NOT EXISTS avaliacoes_regiao (
  id BIGSERIAL PRIMARY KEY,
  id_usuario BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  categoria VARCHAR(32) NOT NULL CHECK (categoria IN ('assalto','infraestrutura','acidente','iluminacao','outro')),
  avaliacao VARCHAR(12) NOT NULL CHECK (avaliacao IN ('verde','amarelo','vermelho')),
  comentario VARCHAR(1000),
  localizacao GEOGRAPHY(Point, 4326) NOT NULL,
  celula_lat INTEGER NOT NULL,
  celula_lng INTEGER NOT NULL,
  criada_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizada_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (id_usuario, celula_lat, celula_lng)
);

CREATE INDEX IF NOT EXISTS avaliacoes_regiao_localizacao_gix
  ON avaliacoes_regiao USING GIST (localizacao);
CREATE INDEX IF NOT EXISTS avaliacoes_regiao_data_idx
  ON avaliacoes_regiao (atualizada_em DESC);
