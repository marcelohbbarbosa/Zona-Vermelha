-- Usa PostGIS já requerido pelas tabelas de zonas existentes.
CREATE TABLE IF NOT EXISTS route_reports (
  id BIGSERIAL PRIMARY KEY,
  category VARCHAR(40) NOT NULL CHECK (category IN ('alagamento','deslizamento','via_interditada','arvore_caida','tempestade','outro')),
  description VARCHAR(2000) NOT NULL,
  location geography(Point,4326) NOT NULL,
  occurred_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','expired')),
  moderator_id VARCHAR(120),
  moderator_note VARCHAR(1000),
  moderated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS route_hazards (
  id BIGSERIAL PRIMARY KEY,
  source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('official','community')),
  report_id BIGINT REFERENCES route_reports(id) ON DELETE CASCADE,
  official_source VARCHAR(120),
  official_record_id VARCHAR(200),
  category VARCHAR(40) NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'unknown' CHECK (severity IN ('low','moderate','high','critical','unknown')),
  is_blocking BOOLEAN NOT NULL DEFAULT FALSE,
  penalty INTEGER NOT NULL DEFAULT 0 CHECK (penalty BETWEEN 0 AND 100000),
  description TEXT,
  geom geometry(Geometry,4326) NOT NULL,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((source_type='community' AND report_id IS NOT NULL) OR source_type='official')
);

CREATE UNIQUE INDEX IF NOT EXISTS route_hazards_official_unique
  ON route_hazards(official_source, official_record_id)
  WHERE source_type='official' AND official_source IS NOT NULL AND official_record_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS route_hazards_geom_gix ON route_hazards USING GIST(geom);
CREATE INDEX IF NOT EXISTS route_reports_location_gix ON route_reports USING GIST(location);
CREATE INDEX IF NOT EXISTS route_hazards_active_valid_idx ON route_hazards(active, valid_from, valid_until);

CREATE TABLE IF NOT EXISTS route_requests (
  id BIGSERIAL PRIMARY KEY,
  origin geography(Point,4326) NOT NULL,
  destination geography(Point,4326) NOT NULL,
  request_payload JSONB NOT NULL,
  response_payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS route_moderation_audit (
  id BIGSERIAL PRIMARY KEY,
  report_id BIGINT NOT NULL REFERENCES route_reports(id),
  previous_status VARCHAR(20) NOT NULL,
  new_status VARCHAR(20) NOT NULL,
  moderator_id VARCHAR(120) NOT NULL,
  note VARCHAR(1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
