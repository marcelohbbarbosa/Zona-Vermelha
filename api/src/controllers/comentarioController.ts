import { Response } from "express";
import { pool } from "../database/connection";
import { RequestAutenticado } from "../middlewares/auth";

const CAMPOS = `id, zona, texto AS comentario, data AS "dataCriacao", id_usuario AS "idUsuario"`;

export async function listarComentarios(req: RequestAutenticado, res: Response) {
  const resultado = await pool.query(
    `SELECT ${CAMPOS} FROM comentarios WHERE removido = FALSE ORDER BY data DESC`
  );
  res.json(resultado.rows);
}

export async function criarComentario(req: RequestAutenticado, res: Response) {
  const { zona, comentario } = req.body;
  const idUsuario = req.usuario!.id;

  if (!campoValido(zona) || !campoValido(comentario)) {
    return res.status(400).json({ mensagem: "Zona e comentario sao obrigatorios" });
  }

  const resultado = await pool.query(
    `INSERT INTO comentarios (zona, texto, id_usuario)
     VALUES ($1, $2, $3)
     RETURNING ${CAMPOS}`,
    [zona.trim(), comentario.trim(), idUsuario]
  );

  res.status(201).json(resultado.rows[0]);
}

export async function atualizarComentario(req: RequestAutenticado, res: Response) {
  const id = Number(req.params.id);
  const { zona, comentario } = req.body;
  const idUsuario = req.usuario!.id;

  if (!campoValido(zona) || !campoValido(comentario)) {
    return res.status(400).json({ mensagem: "Zona e comentario sao obrigatorios" });
  }

  const existente = await pool.query(
    "SELECT id_usuario FROM comentarios WHERE id = $1 AND removido = FALSE",
    [id]
  );

  if (existente.rows.length === 0) {
    return res.status(404).json({ mensagem: "Comentario nao encontrado" });
  }

  if (existente.rows[0].id_usuario !== idUsuario) {
    return res.status(403).json({ mensagem: "Voce so pode editar seus proprios comentarios" });
  }

  const resultado = await pool.query(
    `UPDATE comentarios SET zona = $1, texto = $2 WHERE id = $3
     RETURNING ${CAMPOS}`,
    [zona.trim(), comentario.trim(), id]
  );

  res.json(resultado.rows[0]);
}

export async function deletarComentario(req: RequestAutenticado, res: Response) {
  const id = Number(req.params.id);
  const idUsuario = req.usuario!.id;

  const existente = await pool.query(
    "SELECT id_usuario FROM comentarios WHERE id = $1 AND removido = FALSE",
    [id]
  );

  if (existente.rows.length === 0) {
    return res.status(404).json({ mensagem: "Comentario nao encontrado" });
  }

  if (existente.rows[0].id_usuario !== idUsuario) {
    return res.status(403).json({ mensagem: "Voce so pode apagar seus proprios comentarios" });
  }

  await pool.query("UPDATE comentarios SET removido = TRUE WHERE id = $1", [id]);

  res.status(204).send();
}

function campoValido(valor: unknown): valor is string {
  return typeof valor === "string" && valor.trim().length > 0;
}