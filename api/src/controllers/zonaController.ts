import { Response } from "express";
import { pool } from "../database/connection";
import { RequestAutenticado } from "../middlewares/auth";
import { buscarCoordenadas } from "../services/geocodingService";

const CAMPOS_RETORNO = `
  id, bairro, rua, cidade, status, id_usuario, criado_em,
  ST_Y(localizacao::geometry) AS latitude,
  ST_X(localizacao::geometry) AS longitude
`;

const CIDADES_PERMITIDAS = [
  "santos",
  "são vicente",
  "sao vicente",
  "praia grande",
  "guarujá",
  "guaruja",
  "cubatão",
  "cubatao",
  "bertioga",
  "mongaguá",
  "mongagua",
  "itanhaém",
  "itanhaem",
  "peruíbe",
  "peruibe",
];

function cidadeEhValida(cidade: string): boolean {
  return CIDADES_PERMITIDAS.includes(cidade.trim().toLowerCase());
}

export async function criarZona(req: RequestAutenticado, res: Response) {
  const { bairro, rua, cidade, status } = req.body;
  const idUsuario = req.usuario!.id;

  if (!bairro || !rua || !cidade) {
    return res.status(400).json({ mensagem: "bairro, rua e cidade são obrigatórios" });
  }

  if (!cidadeEhValida(cidade)) {
    return res.status(400).json({
      mensagem: "Cidade fora da área de cobertura do app (Baixada Santista)",
    });
  }

  const coordenadas = await buscarCoordenadas(rua, bairro, cidade);

  if (!coordenadas) {
    return res.status(422).json({
      mensagem: "Não foi possível localizar esse endereço. Verifique bairro e rua e tente novamente.",
    });
  }

  const statusFinal = status ?? "nao_avaliada";

  const resultado = await pool.query(
    `INSERT INTO zona (bairro, rua, cidade, localizacao, status, id_usuario)
     VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography, $6, $7)
     RETURNING ${CAMPOS_RETORNO}`,
    [bairro, rua, cidade, coordenadas.longitude, coordenadas.latitude, statusFinal, idUsuario]
  );

  res.status(201).json(resultado.rows[0]);
}

export async function listarZonas(req: RequestAutenticado, res: Response) {
  const resultado = await pool.query(
    `SELECT ${CAMPOS_RETORNO} FROM zona ORDER BY criado_em DESC`
  );
  res.json(resultado.rows);
}

export async function atualizarStatusZona(req: RequestAutenticado, res: Response) {
  const id = Number(req.params.id);
  const { status } = req.body;

  if (!["segura", "insegura", "nao_avaliada"].includes(status)) {
    return res.status(400).json({ mensagem: "status deve ser 'segura', 'insegura' ou 'nao_avaliada'" });
  }

  const resultado = await pool.query(
    `UPDATE zona SET status = $1 WHERE id = $2 RETURNING id, status`,
    [status, id]
  );

  if (resultado.rows.length === 0) {
    return res.status(404).json({ mensagem: "Zona não encontrada" });
  }

  res.json(resultado.rows[0]);
}