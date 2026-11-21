import { Router, Request, Response, NextFunction } from "express";
import { pool } from "../database/connection";
import { autenticar, RequestAutenticado } from "../middlewares/auth";

const router = Router();
type Coord = { latitude: number; longitude: number };
type Preferencias = { avoidYellow: boolean; avoidRed: boolean };

function validCoord(value: any): value is Coord {
  return value && Number.isFinite(value.latitude) && value.latitude >= -90 && value.latitude <= 90
    && Number.isFinite(value.longitude) && value.longitude >= -180 && value.longitude <= 180;
}

async function scoreGeometry(geometry: unknown, preferences: Preferencias) {
  const result = await pool.query(
    `WITH route AS (
       SELECT ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography AS geom
     )
     SELECT DISTINCT c.id AS "commentId", c.zona, cat.id AS "tagId", cat.nome AS category,
            cat.nivel AS level, c.data AS "reportedAt"
     FROM route r
     JOIN comentarios c ON c.localizacao IS NOT NULL
       AND c.removido = FALSE
       AND c.data >= NOW() - INTERVAL '90 days'
       AND ST_DWithin(c.localizacao, r.geom, 100)
     JOIN comentario_categoria cc ON cc.id_comentario = c.id
     JOIN categorias cat ON cat.id = cc.id_categoria
     WHERE cat.nivel IN (2, 3)
     ORDER BY c.data DESC`,
    [JSON.stringify(geometry)],
  );
  const risks = result.rows;
  const yellowCount = risks.filter((risk: any) => Number(risk.level) === 2).length;
  const redCount = risks.filter((risk: any) => Number(risk.level) === 3).length;
  const penalty = yellowCount * 15 + redCount * 40;
  return {
    blocked: (preferences.avoidYellow && yellowCount > 0) || (preferences.avoidRed && redCount > 0),
    avoidYellow: preferences.avoidYellow,
    avoidRed: preferences.avoidRed,
    yellowCount,
    redCount,
    penalty,
    riskScore: Math.min(100, penalty),
    risks,
  };
}

async function calculate(origin: Coord, destination: Coord, alternatives: number, preferences: Preferencias) {
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

  const routes = await Promise.all(data.routes.map(async (item: any, index: number) => ({
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
    risk: await scoreGeometry(item.geometry, preferences),
    recommended: false,
  })));
  const hasAvoidPreferences = preferences.avoidYellow || preferences.avoidRed;
  const available = routes.filter((item: any) => !item.risk.blocked)
    .sort((a: any, b: any) => {
      const score = (route: any) => route.durationSeconds + (hasAvoidPreferences ? route.risk.penalty * 60 : 0);
      return score(a) - score(b);
    });
  if (available[0]) available[0].recommended = true;
  return {
    provider: "OSRM",
    generatedAt: new Date().toISOString(),
    routes,
    recommendedRouteId: available[0]?.id ?? null,
    warning: available.length
      ? "A recomendação considera os comentários e as tags recentes próximos ao trajeto. Não garante segurança nem considera necessariamente o trânsito em tempo real."
      : "As alternativas encontradas cruzam zonas que você escolheu evitar. Você pode escolher uma delas manualmente ou mudar as opções de segurança.",
  };
}

router.post("/rotas/calcular", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      origin,
      destination,
      alternatives = 3,
      avoidYellow = false,
      avoidRed = false,
    } = req.body ?? {};
    if (!validCoord(origin) || !validCoord(destination) || !Number.isInteger(alternatives) || alternatives < 0 || alternatives > 3
      || typeof avoidYellow !== "boolean" || typeof avoidRed !== "boolean") {
      return res.status(400).json({ mensagem: "Informe origem, destino, alternativas e preferências de segurança válidas." });
    }
    const result = await calculate(origin, destination, alternatives, { avoidYellow, avoidRed });
    return res.json(result);
  } catch (error: any) {
    if (["ROUTING_PROVIDER_ERROR", "ROUTE_NOT_FOUND"].includes(error?.message)) {
      return res.status(502).json({ mensagem: error.message === "ROUTE_NOT_FOUND" ? "Não foi possível encontrar uma rota entre os pontos." : "O serviço de rotas está indisponível." });
    }
    return next(error);
  }
});

router.post("/rotas/salvar", autenticar, async (req: RequestAutenticado, res: Response, next: NextFunction) => {
  try {
    const { nome, origem, destino, origin, destination, route, avoidYellow = false, avoidRed = false } = req.body ?? {};
    const geometry = route?.geometry;
    const coordinates = geometry?.coordinates;
    if (!validCoord(origin) || !validCoord(destination) || typeof origem !== "string" || !origem.trim()
      || typeof destino !== "string" || !destino.trim() || !Array.isArray(coordinates) || coordinates.length < 2
      || !Number.isFinite(route?.distanceMeters) || !Number.isFinite(route?.durationSeconds)
      || typeof avoidYellow !== "boolean" || typeof avoidRed !== "boolean") {
      return res.status(400).json({ mensagem: "Calcule e selecione uma rota válida antes de salvá-la." });
    }
    const nomeRota = typeof nome === "string" && nome.trim() ? nome.trim().slice(0, 160) : `${origem.trim()} → ${destino.trim()}`.slice(0, 160);
    const saved = await pool.query(
      `INSERT INTO rota (
         nome, origem, destino, disponivel_offline, id_usuario,
         origem_latitude, origem_longitude, destino_latitude, destino_longitude,
         geometria, distancia_metros, duracao_segundos, risco, evitar_amarelas, evitar_vermelhas
       ) VALUES ($1,$2,$3,FALSE,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12::jsonb,$13,$14)
       RETURNING id, nome, origem, destino, disponivel_offline AS "disponivelOffline", criado_em AS "criadoEm"`,
      [nomeRota, origem.trim(), destino.trim(), req.usuario!.id,
        origin.latitude, origin.longitude, destination.latitude, destination.longitude,
        JSON.stringify(geometry), Math.round(route.distanceMeters), Math.round(route.durationSeconds),
        JSON.stringify(route.risk ?? {}), avoidYellow, avoidRed],
    );
    return res.status(201).json({ rota: saved.rows[0], mensagem: "Rota salva na sua conta." });
  } catch (error) { return next(error); }
});

router.post("/rotas/:id/baixar", autenticar, async (req: RequestAutenticado, res: Response, next: NextFunction) => {
  try {
    const saved = await pool.query(
      `UPDATE rota SET disponivel_offline = TRUE
       WHERE id = $1 AND id_usuario = $2
       RETURNING id, nome, origem, destino, geometria, distancia_metros AS "distanciaMetros",
                 duracao_segundos AS "duracaoSegundos", disponivel_offline AS "disponivelOffline"`,
      [req.params.id, req.usuario!.id],
    );
    if (!saved.rowCount) return res.status(404).json({ mensagem: "Salve a rota na sua conta antes de baixá-la." });
    return res.json({ rota: saved.rows[0], mensagem: "Rota marcada para uso offline." });
  } catch (error) { return next(error); }
});

export default router;
