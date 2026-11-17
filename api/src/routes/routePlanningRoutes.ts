import { Router, Request, Response, NextFunction } from "express";
import { pool } from "../database/connection";

const router = Router();
type Coord = { latitude: number; longitude: number };

function validCoord(v: any): v is Coord {
  return v && Number.isFinite(v.latitude) && v.latitude >= -90 && v.latitude <= 90
    && Number.isFinite(v.longitude) && v.longitude >= -180 && v.longitude <= 180;
}

async function scoreGeometry(geometry: any) {
  const result = await pool.query(
    `WITH route AS (
       SELECT ST_SetSRID(ST_GeomFromGeoJSON($1), 4326) AS geom
     )
     SELECT DISTINCT h.id, h.source_type AS "sourceType", h.category, h.severity,
       h.is_blocking AS "isBlocking", h.penalty, h.description
     FROM route_hazards h, route r
     WHERE h.active = TRUE
       AND h.valid_from <= NOW()
       AND (h.valid_until IS NULL OR h.valid_until > NOW())
       AND ST_Intersects(h.geom, r.geom)`,
    [JSON.stringify(geometry)]
  );
  const risks = result.rows;
  return {
    blocked: risks.some((risk: any) => risk.isBlocking),
    penalty: risks.reduce((sum: number, risk: any) => sum + Number(risk.penalty), 0),
    riskScore: Math.min(100, risks.reduce((sum: number, risk: any) => sum + Math.min(30, Number(risk.penalty) / 10), 0)),
    risks,
  };
}

async function calculate(origin: Coord, destination: Coord, alternatives = 3) {
  const count = Math.min(3, Math.max(0, Math.floor(alternatives)));
  const coordinates = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
  const url = new URL(`/route/v1/driving/${coordinates}`, process.env.OSRM_BASE_URL || "https://router.project-osrm.org");
  url.searchParams.set("alternatives", String(count));
  url.searchParams.set("steps", "true");
  url.searchParams.set("geometries", "geojson");
  url.searchParams.set("overview", "full");
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error("ROUTING_PROVIDER_ERROR");
  const data = await response.json() as any;
  if (data.code !== "Ok" || !Array.isArray(data.routes) || data.routes.length === 0) throw new Error("ROUTE_NOT_FOUND");

  const routes = await Promise.all(data.routes.map(async (item: any, index: number) => {
    const risk = await scoreGeometry(item.geometry);
    return {
      id: `route-${index + 1}`,
      distanceMeters: Math.round(item.distance),
      durationSeconds: Math.round(item.duration),
      geometry: item.geometry,
      steps: (item.legs || []).flatMap((leg: any) => leg.steps || []).map((step: any) => ({
        name: step.name || "",
        distanceMeters: Math.round(step.distance),
        durationSeconds: Math.round(step.duration),
        maneuver: step.maneuver,
      })),
      risk,
      recommended: false,
    };
  }));
  const available = routes.filter((item: any) => !item.risk.blocked)
    .sort((a: any, b: any) => (a.durationSeconds + a.risk.penalty * 60) - (b.durationSeconds + b.risk.penalty * 60));
  if (available[0]) available[0].recommended = true;
  return {
    provider: "OSRM",
    generatedAt: new Date().toISOString(),
    routes,
    recommendedRouteId: available[0]?.id ?? null,
    warning: available.length
      ? "A recomendação considera somente ocorrências cadastradas e vigentes. Não garante segurança."
      : "Nenhuma alternativa calculada está livre dos bloqueios cadastrados. Verifique informações locais e não presuma que exista uma rota segura.",
  };
}

router.post("/rotas/calcular", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { origin, destination, alternatives = 3 } = req.body ?? {};
    if (!validCoord(origin) || !validCoord(destination) || !Number.isInteger(alternatives) || alternatives < 0 || alternatives > 3) {
      return res.status(400).json({ mensagem: "Informe origem/destino com latitude e longitude válidas e alternatives entre 0 e 3." });
    }
    const result = await calculate(origin, destination, alternatives);
    const saved = await pool.query(
      `INSERT INTO route_requests(origin, destination, request_payload, response_payload)
       VALUES (ST_SetSRID(ST_MakePoint($1,$2),4326)::geography,
               ST_SetSRID(ST_MakePoint($3,$4),4326)::geography, $5::jsonb, $6::jsonb)
       RETURNING id`,
      [origin.longitude, origin.latitude, destination.longitude, destination.latitude,
        JSON.stringify({ origin, destination, alternatives }), JSON.stringify(result)]
    );
    return res.json({ requestId: saved.rows[0].id, ...result });
  } catch (error: any) {
    if (["ROUTING_PROVIDER_ERROR", "ROUTE_NOT_FOUND"].includes(error?.message)) {
      return res.status(502).json({ mensagem: error.message === "ROUTE_NOT_FOUND" ? "Não foi possível encontrar uma rota entre os pontos." : "O serviço de rotas está indisponível." });
    }
    return next(error);
  }
});

router.post("/rotas/:id/recalcular", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const old = await pool.query("SELECT request_payload FROM route_requests WHERE id = $1", [req.params.id]);
    if (!old.rowCount) return res.status(404).json({ mensagem: "Solicitação de rota não encontrada." });
    const payload = old.rows[0].request_payload;
    const result = await calculate(payload.origin, payload.destination, payload.alternatives ?? 3);
    const saved = await pool.query(
      `INSERT INTO route_requests(origin, destination, request_payload, response_payload)
       VALUES (ST_SetSRID(ST_MakePoint($1,$2),4326)::geography,
               ST_SetSRID(ST_MakePoint($3,$4),4326)::geography, $5::jsonb, $6::jsonb)
       RETURNING id`,
      [payload.origin.longitude, payload.origin.latitude, payload.destination.longitude, payload.destination.latitude,
        JSON.stringify(payload), JSON.stringify(result)]
    );
    return res.json({ requestId: saved.rows[0].id, recalculatedFrom: req.params.id, ...result });
  } catch (error) { return next(error); }
});

// Envia relato para moderação. Relatos pendentes não entram no cálculo.
router.post("/relatos-risco", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, description, latitude, longitude, occurredAt } = req.body ?? {};
    const allowed = ["alagamento", "deslizamento", "via_interditada", "arvore_caida", "tempestade", "outro"];
    if (!allowed.includes(category) || typeof description !== "string" || description.trim().length < 10 || description.length > 2000
      || !validCoord({ latitude, longitude })) {
      return res.status(400).json({ mensagem: "Categoria, descrição (10 a 2000 caracteres) e coordenadas válidas são obrigatórias." });
    }
    const result = await pool.query(
      `INSERT INTO route_reports(category, description, location, occurred_at)
       VALUES ($1,$2,ST_SetSRID(ST_MakePoint($3,$4),4326)::geography,$5)
       RETURNING id, category, description, status, created_at AS "createdAt"`,
      [category, description.trim(), longitude, latitude, occurredAt || null]
    );
    return res.status(201).json({ relato: result.rows[0], mensagem: "Relato enviado para moderação; ainda não influencia as rotas." });
  } catch (error) { return next(error); }
});

// Protótipo administrativo: antes de produção, trocar por autenticação e permissões reais.
router.patch("/admin/relatos-risco/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const expected = process.env.ROUTE_ADMIN_TOKEN;
    if (!expected || req.header("x-admin-token") !== expected) return res.status(401).json({ mensagem: "Não autorizado." });
    const { status, moderatorId, note } = req.body ?? {};
    if (!["approved", "rejected"].includes(status) || typeof moderatorId !== "string" || moderatorId.trim().length < 2) {
      return res.status(400).json({ mensagem: "Informe status approved/rejected e moderatorId." });
    }
    const old = await pool.query("SELECT status FROM route_reports WHERE id=$1", [req.params.id]);
    if (!old.rowCount) return res.status(404).json({ mensagem: "Relato não encontrado." });
    if (old.rows[0].status !== "pending") return res.status(409).json({ mensagem: "Esse relato já foi moderado." });
    const result = await pool.query(
      `UPDATE route_reports SET status=$1, moderator_id=$2, moderator_note=$3, moderated_at=NOW()
       WHERE id=$4 AND status='pending' RETURNING id,category,description,status`,
      [status, moderatorId.trim(), typeof note === "string" ? note.slice(0,1000) : null, req.params.id]
    );
    await pool.query(
      `INSERT INTO route_moderation_audit(report_id, previous_status, new_status, moderator_id, note)
       VALUES ($1,'pending',$2,$3,$4)`,
      [req.params.id, status, moderatorId.trim(), typeof note === "string" ? note.slice(0,1000) : null]
    );
    if (status === "approved") {
      const report = await pool.query("SELECT category, ST_X(location::geometry) AS longitude, ST_Y(location::geometry) AS latitude FROM route_reports WHERE id=$1", [req.params.id]);
      const item = report.rows[0];
      const penalties: Record<string, number> = { alagamento: 70, deslizamento: 90, via_interditada: 1000, arvore_caida: 80, tempestade: 55, outro: 20 };
      await pool.query(
        `INSERT INTO route_hazards(source_type, report_id, category, severity, is_blocking, penalty, geom, valid_from, valid_until)
         VALUES ('community',$1,$2,'moderate',$3,$4,
           ST_Buffer(ST_SetSRID(ST_MakePoint($5,$6),4326)::geography,100)::geometry, NOW(), NOW()+INTERVAL '6 hours')`,
        [req.params.id, item.category, item.category === "via_interditada", penalties[item.category] ?? 20, item.longitude, item.latitude]
      );
    }
    return res.json({ relato: result.rows[0] });
  } catch (error) { return next(error); }
});

export default router;
