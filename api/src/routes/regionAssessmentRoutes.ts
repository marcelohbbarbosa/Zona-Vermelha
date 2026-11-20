import { Router, Request, Response, NextFunction } from "express";
import { pool } from "../database/connection";
import { autenticar, RequestAutenticado } from "../middlewares/auth";

const router = Router();
const TAMANHO_CELULA = 0.002;
const CATEGORIAS = ["assalto", "infraestrutura", "acidente", "iluminacao", "outro"];
const AVALIACOES = ["verde", "amarelo", "vermelho"];

function coordenadasValidas(latitude: unknown, longitude: unknown): latitude is number {
  return typeof latitude === "number" && Number.isFinite(latitude) && latitude >= -90 && latitude <= 90
    && typeof longitude === "number" && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;
}

function celula(latitude: number, longitude: number) {
  return { lat: Math.floor(latitude / TAMANHO_CELULA), lng: Math.floor(longitude / TAMANHO_CELULA) };
}

function resultadoCor(rows: any[]) {
  const total = rows.length;
  const verdes = rows.filter((row) => row.avaliacao === "verde").length;
  const amarelos = rows.filter((row) => row.avaliacao === "amarelo").length;
  const vermelhos = rows.filter((row) => row.avaliacao === "vermelho").length;
  const pontuacao = total ? (verdes * 2 - amarelos - vermelhos * 2) / total : 0;
  const status = total === 0 ? "sem_dados" : pontuacao >= 0.75 ? "verde" : pontuacao <= -1 ? "vermelho" : "amarelo";
  return { status, total, verdes, amarelos, vermelhos, pontuacao: Number(pontuacao.toFixed(2)) };
}

router.get("/avaliacoes-mapa", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const norte = Number(req.query.norte);
    const sul = Number(req.query.sul);
    const leste = Number(req.query.leste);
    const oeste = Number(req.query.oeste);
    if (![norte, sul, leste, oeste].every(Number.isFinite) || norte < sul || leste < oeste
      || norte > 90 || sul < -90 || leste > 180 || oeste < -180) {
      return res.status(400).json({ mensagem: "Informe os limites válidos da área visível do mapa." });
    }

    const resultado = await pool.query(
      `WITH celulas_visiveis AS (
         SELECT DISTINCT celula_lat, celula_lng
         FROM avaliacoes_regiao
         WHERE atualizada_em >= NOW() - INTERVAL '90 days'
           AND ST_Intersects(localizacao, ST_MakeEnvelope($1,$2,$3,$4,4326)::geography)
       )
       SELECT a.celula_lat AS "celulaLat", a.celula_lng AS "celulaLng", a.avaliacao
       FROM avaliacoes_regiao a
       JOIN celulas_visiveis v USING (celula_lat, celula_lng)
       WHERE a.atualizada_em >= NOW() - INTERVAL '90 days'
       ORDER BY a.atualizada_em DESC`,
      [oeste, sul, leste, norte],
    );
    const grupos = new Map<string, { celulaLat: number; celulaLng: number; ratings: any[] }>();
    for (const row of resultado.rows) {
      const key = `${row.celulaLat}:${row.celulaLng}`;
      const grupo = grupos.get(key) ?? { celulaLat: row.celulaLat, celulaLng: row.celulaLng, ratings: [] as any[] };
      grupo.ratings.push(row);
      grupos.set(key, grupo);
    }
    return res.json([...grupos.values()].map((grupo) => ({
      celulaLat: grupo.celulaLat,
      celulaLng: grupo.celulaLng,
      latitude: (grupo.celulaLat + 0.5) * TAMANHO_CELULA,
      longitude: (grupo.celulaLng + 0.5) * TAMANHO_CELULA,
      ...resultadoCor(grupo.ratings),
    })));
  } catch (error) { return next(error); }
});

router.get("/avaliacoes-regiao", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const latitude = Number(req.query.latitude);
    const longitude = Number(req.query.longitude);
    if (!coordenadasValidas(latitude, longitude)) {
      return res.status(400).json({ mensagem: "Informe latitude e longitude válidas." });
    }
    const { lat, lng } = celula(latitude, longitude);
    const resultado = await pool.query(
      `SELECT id, categoria, avaliacao, comentario, criada_em AS "criadaEm", atualizada_em AS "atualizadaEm"
       FROM avaliacoes_regiao
       WHERE celula_lat=$1 AND celula_lng=$2 AND atualizada_em >= NOW() - INTERVAL '90 days'
       ORDER BY atualizada_em DESC LIMIT 50`,
      [lat, lng],
    );
    return res.json({
      latitude: (lat + 0.5) * TAMANHO_CELULA,
      longitude: (lng + 0.5) * TAMANHO_CELULA,
      ...resultadoCor(resultado.rows),
      relatos: resultado.rows,
    });
  } catch (error) { return next(error); }
});

router.post("/avaliacoes-regiao", autenticar, async (req: RequestAutenticado, res: Response, next: NextFunction) => {
  try {
    const { latitude, longitude, categoria, avaliacao, comentario } = req.body ?? {};
    if (!coordenadasValidas(latitude, longitude) || !CATEGORIAS.includes(categoria) || !AVALIACOES.includes(avaliacao)
      || (comentario != null && (typeof comentario !== "string" || comentario.trim().length > 1000))) {
      return res.status(400).json({ mensagem: "Local, categoria e avaliação válidos são obrigatórios. O comentário pode ter até 1000 caracteres." });
    }
    const { lat, lng } = celula(latitude, longitude);
    const resultado = await pool.query(
      `INSERT INTO avaliacoes_regiao (id_usuario,categoria,avaliacao,comentario,localizacao,celula_lat,celula_lng)
       VALUES ($1,$2,$3,$4,ST_SetSRID(ST_MakePoint($5,$6),4326)::geography,$7,$8)
       ON CONFLICT (id_usuario,celula_lat,celula_lng) DO UPDATE SET
         categoria=EXCLUDED.categoria, avaliacao=EXCLUDED.avaliacao,
         comentario=EXCLUDED.comentario, localizacao=EXCLUDED.localizacao,
         atualizada_em=NOW()
       RETURNING id, categoria, avaliacao, comentario, criada_em AS "criadaEm", atualizada_em AS "atualizadaEm"`,
      [req.usuario!.id, categoria, avaliacao, comentario?.trim() || null, longitude, latitude, lat, lng],
    );
    return res.status(201).json({ relato: resultado.rows[0], mensagem: "Sua avaliação da região foi registrada." });
  } catch (error) { return next(error); }
});

export default router;
