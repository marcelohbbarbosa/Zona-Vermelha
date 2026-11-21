import { Router, Request, Response, NextFunction } from "express";
import { pool } from "../database/connection";
import { autenticar, RequestAutenticado } from "../middlewares/auth";
import { gerarNomeAutor } from "../services/nomeAutor";
import { temLinguagemPreconceituosa } from "../services/filtroConteudo";

const router = Router();
// Células de aproximadamente 400 m, que cobrem em geral 4 a 8 quarteirões.
const TAMANHO_CELULA = 0.004;
const TAGS = [
  { id: "boa_iluminacao", nome: "Boa iluminação", nivel: 1 },
  { id: "policiamento_presente", nome: "Policiamento presente", nivel: 1 },
  { id: "via_conservada", nome: "Rua bem conservada", nivel: 1 },
  { id: "local_movimentado", nome: "Local movimentado", nivel: 1 },
  { id: "ambiente_tranquilo", nome: "Ambiente tranquilo", nivel: 1 },
  { id: "iluminacao_ruim", nome: "Iluminação ruim", nivel: 2 },
  { id: "buracos_na_via", nome: "Buracos na via", nivel: 2 },
  { id: "calcada_danificada", nome: "Calçada danificada", nivel: 2 },
  { id: "alagamento", nome: "Alagamento", nivel: 2 },
  { id: "sinalizacao_danificada", nome: "Sinalização danificada", nivel: 2 },
  { id: "lixo_acumulado", nome: "Lixo acumulado", nivel: 2 },
  { id: "assalto", nome: "Assalto ou roubo", nivel: 3 },
  { id: "furto", nome: "Furto", nivel: 3 },
  { id: "ameaca_agressao", nome: "Ameaça ou agressão", nivel: 3 },
  { id: "assedio", nome: "Assédio", nivel: 3 },
  { id: "comercio_drogas", nome: "Comércio de drogas", nivel: 3 },
] as const;
const TAG_POR_ID = new Map(TAGS.map((tag) => [tag.id, tag]));

type Coord = { latitude: number; longitude: number };

function coordenadasValidas(latitude: unknown, longitude: unknown): latitude is number {
  return typeof latitude === "number" && Number.isFinite(latitude) && latitude >= -90 && latitude <= 90
    && typeof longitude === "number" && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;
}

function celula(latitude: number, longitude: number) {
  return { lat: Math.floor(latitude / TAMANHO_CELULA), lng: Math.floor(longitude / TAMANHO_CELULA) };
}

function corDoNivel(nivel: number) {
  return nivel === 1 ? "verde" : nivel === 2 ? "amarelo" : "vermelho";
}

function resultadoCor(niveis: number[]) {
  const verdes = niveis.filter((nivel) => nivel === 1).length;
  const amarelos = niveis.filter((nivel) => nivel === 2).length;
  const vermelhos = niveis.filter((nivel) => nivel >= 3).length;
  const total = verdes + amarelos + vermelhos;
  const pontuacao = total ? (verdes * 2 - amarelos - vermelhos * 2) / total : 0;
  const status = total === 0 ? "sem_dados" : pontuacao >= 0.75 ? "verde" : pontuacao <= -1.5 ? "vermelho" : "amarelo";
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
      `SELECT FLOOR(ST_Y(c.localizacao::geometry) / $5)::INTEGER AS "celulaLat",
              FLOOR(ST_X(c.localizacao::geometry) / $5)::INTEGER AS "celulaLng",
              cat.nivel
       FROM comentarios c
       JOIN comentario_categoria cc ON cc.id_comentario = c.id
       JOIN categorias cat ON cat.id = cc.id_categoria
       WHERE c.removido = FALSE
         AND c.localizacao IS NOT NULL
         AND c.data >= NOW() - INTERVAL '90 days'
         AND cat.nivel IN (1, 2, 3)
         AND ST_Intersects(c.localizacao, ST_MakeEnvelope($1,$2,$3,$4,4326)::geography)`,
      [oeste, sul, leste, norte, TAMANHO_CELULA],
    );
    const grupos = new Map<string, { celulaLat: number; celulaLng: number; niveis: number[] }>();
    for (const row of resultado.rows) {
      const key = `${row.celulaLat}:${row.celulaLng}`;
      const grupo = grupos.get(key) ?? { celulaLat: row.celulaLat, celulaLng: row.celulaLng, niveis: [] as number[] };
      grupo.niveis.push(Number(row.nivel));
      grupos.set(key, grupo);
    }
    return res.json([...grupos.values()].map((grupo) => ({
      celulaLat: grupo.celulaLat,
      celulaLng: grupo.celulaLng,
      latitude: (grupo.celulaLat + 0.5) * TAMANHO_CELULA,
      longitude: (grupo.celulaLng + 0.5) * TAMANHO_CELULA,
      ...resultadoCor(grupo.niveis),
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
      `SELECT c.id, c.zona, c.texto AS comentario, c.data AS "criadaEm",
              c.id_usuario AS "idUsuario", COALESCE(c.nome_autor, 'Brasil 000') AS "nomeAutor",
              COALESCE(json_agg(json_build_object('id', cat.id, 'nome', cat.nome, 'nivel', cat.nivel))
                FILTER (WHERE cat.id IS NOT NULL), '[]'::json) AS tags
       FROM comentarios c
       LEFT JOIN comentario_categoria cc ON cc.id_comentario = c.id
       LEFT JOIN categorias cat ON cat.id = cc.id_categoria
       WHERE c.removido = FALSE
         AND c.localizacao IS NOT NULL
         AND c.data >= NOW() - INTERVAL '90 days'
         AND FLOOR(ST_Y(c.localizacao::geometry) / $1)::INTEGER = $2
         AND FLOOR(ST_X(c.localizacao::geometry) / $1)::INTEGER = $3
       GROUP BY c.id
       ORDER BY c.data DESC`,
      [TAMANHO_CELULA, lat, lng],
    );
    const niveis = resultado.rows.flatMap((relato: any) =>
      (relato.tags as { nivel: number }[]).map((tag) => Number(tag.nivel)).filter((nivel) => nivel >= 1 && nivel <= 3),
    );
    return res.json({
      latitude: (lat + 0.5) * TAMANHO_CELULA,
      longitude: (lng + 0.5) * TAMANHO_CELULA,
      ...resultadoCor(niveis),
      relatos: resultado.rows.slice(0, 50).map((relato: any) => ({
        ...relato,
        tags: (relato.tags as { id: number; nome: string; nivel: number }[]).map((tag) => ({
          ...tag,
          cor: corDoNivel(Number(tag.nivel)),
        })),
      })),
    });
  } catch (error) { return next(error); }
});

router.post("/avaliacoes-regiao", autenticar, async (req: RequestAutenticado, res: Response, next: NextFunction) => {
  const { latitude, longitude, zona, tags, comentario } = req.body ?? {};
  if (!coordenadasValidas(latitude, longitude) || typeof zona !== "string" || !zona.trim() || zona.trim().length > 200
    || !Array.isArray(tags) || tags.length === 0 || tags.length > TAGS.length
    || !tags.every((tag: unknown) => typeof tag === "string" && TAG_POR_ID.has(tag as typeof TAGS[number]["id"]))
    || (comentario != null && (typeof comentario !== "string" || comentario.trim().length > 1000))) {
    return res.status(400).json({ mensagem: "Informe a zona, pelo menos uma tag, coordenadas válidas e um comentário de até 1000 caracteres." });
  }
  if (typeof comentario === "string" && temLinguagemPreconceituosa(comentario)) {
    return res.status(400).json({ mensagem: "Troque ou remova a expressão preconceituosa antes de publicar." });
  }

  const tagsUnicas = [...new Set(tags as string[])];
  const definicoes = tagsUnicas.map((id) => TAG_POR_ID.get(id as typeof TAGS[number]["id"])!);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const categorias = await client.query(
      `SELECT DISTINCT ON (lower(btrim(nome))) id, nome, nivel
       FROM categorias
       WHERE lower(btrim(nome)) = ANY($1::text[])
       ORDER BY lower(btrim(nome)), id`,
      [definicoes.map((tag) => tag.nome.toLocaleLowerCase("pt-BR"))],
    );
    if (categorias.rowCount !== definicoes.length) throw new Error("TAGS_DO_BANCO_INCOMPLETAS");

    const nomeAutor = gerarNomeAutor();
    const criado = await client.query(
      `INSERT INTO comentarios (texto, id_usuario, zona, nome_autor, localizacao)
       VALUES ($1,$2,$3,$4,ST_SetSRID(ST_MakePoint($5,$6),4326)::geography)
       RETURNING id, zona, texto AS comentario, data AS "criadaEm", id_usuario AS "idUsuario", nome_autor AS "nomeAutor"`,
      [comentario?.trim() || null, req.usuario!.id, zona.trim(), nomeAutor, longitude, latitude],
    );
    const relato = criado.rows[0];
    for (const categoria of categorias.rows) {
      await client.query(
        "INSERT INTO comentario_categoria (id_comentario, id_categoria) VALUES ($1,$2)",
        [relato.id, categoria.id],
      );
    }
    await client.query("COMMIT");
    return res.status(201).json({
      relato: {
        ...relato,
        tags: categorias.rows.map((tag: any) => ({ ...tag, cor: corDoNivel(Number(tag.nivel)) })),
      },
      mensagem: "Sua avaliação foi registrada junto aos comentários da região.",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return next(error);
  } finally {
    client.release();
  }
});

export default router;
