import { Response } from "express";
import { pool } from "../database/connection";
import { RequestAutenticado } from "../middlewares/auth";
import { gerarNomeAutor } from "../services/nomeAutor";
import { temLinguagemPreconceituosa } from "../services/filtroConteudo";

const CAMPOS = `id, zona, texto AS comentario, data AS "dataCriacao", id_usuario AS "idUsuario", COALESCE(nome_autor, 'Brasil 000') AS "nomeAutor"`;

export async function listarComentarios(req: RequestAutenticado, res: Response) {
  const resultado = await pool.query(
    `SELECT ${CAMPOS},
       COALESCE((
         SELECT json_agg(json_build_object('nome', c.nome, 'nivel', c.nivel) ORDER BY c.nome)
         FROM comentario_categoria cc
         JOIN categorias c ON c.id = cc.id_categoria
         WHERE cc.id_comentario = comentarios.id
       ), '[]'::json) AS tags
     FROM comentarios WHERE removido = FALSE ORDER BY data DESC`
  );
  res.json(resultado.rows);
}

export async function listarMeusComentarios(req: RequestAutenticado, res: Response) {
  const resultado = await pool.query(
    `SELECT ${CAMPOS} FROM comentarios WHERE id_usuario = $1 AND removido = FALSE ORDER BY data DESC LIMIT 5`,
    [req.usuario!.id],
  );
  return res.json(resultado.rows);
}

export async function criarComentario(req: RequestAutenticado, res: Response) {
  const { zona, comentario } = req.body;
  const idUsuario = req.usuario!.id;
  const nomeAutor = gerarNomeAutor();

  if (!campoValido(zona) || !campoValido(comentario)) {
    return res.status(400).json({ mensagem: "Zona e comentario sao obrigatorios" });
  }
  if (temLinguagemPreconceituosa(comentario)) {
    return res.status(400).json({ mensagem: "Troque ou remova a expressão preconceituosa antes de publicar." });
  }

  const resultado = await pool.query(
    `INSERT INTO comentarios (zona, texto, id_usuario, nome_autor)
     VALUES ($1, $2, $3, $4)
     RETURNING ${CAMPOS}`,
    [zona.trim(), comentario.trim(), idUsuario, nomeAutor]
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
  if (temLinguagemPreconceituosa(comentario)) {
    return res.status(400).json({ mensagem: "Troque ou remova a expressão preconceituosa antes de publicar." });
  }

  const resultado = await pool.query(
    `UPDATE comentarios SET zona = $1, texto = $2
     WHERE id = $3 AND id_usuario = $4 AND removido = FALSE
     RETURNING ${CAMPOS}`,
    [zona.trim(), comentario.trim(), id, idUsuario]
  );

  if (resultado.rowCount) return res.json(resultado.rows[0]);
  const existente = await pool.query("SELECT id FROM comentarios WHERE id = $1 AND removido = FALSE", [id]);
  if (!existente.rowCount) return res.status(404).json({ mensagem: "Comentario nao encontrado" });
  return res.status(403).json({ mensagem: "Voce so pode editar seus proprios comentarios" });
}

export async function deletarComentario(req: RequestAutenticado, res: Response) {
  const id = Number(req.params.id);
  const idUsuario = req.usuario!.id;

  const resultado = await pool.query(
    "UPDATE comentarios SET removido = TRUE WHERE id = $1 AND id_usuario = $2 AND removido = FALSE RETURNING id",
    [id, idUsuario],
  );
  if (resultado.rowCount) return res.status(204).send();
  const existente = await pool.query("SELECT id FROM comentarios WHERE id = $1 AND removido = FALSE", [id]);
  if (!existente.rowCount) return res.status(404).json({ mensagem: "Comentario nao encontrado" });
  return res.status(403).json({ mensagem: "Voce so pode apagar seus proprios comentarios" });
}

function campoValido(valor: unknown): valor is string {
  return typeof valor === "string" && valor.trim().length > 0;
}

export async function denunciarComentario(req: RequestAutenticado, res: Response) {
  const idComentario = Number(req.params.id);
  const motivo = req.body?.motivo;
  const idUsuario = req.usuario!.id;
  if (!Number.isInteger(idComentario) || idComentario <= 0 || !campoValido(motivo) || motivo.length > 300) {
    return res.status(400).json({ mensagem: "Escolha um motivo válido para a denúncia." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const comentario = await client.query(
      "SELECT id, id_usuario, removido FROM comentarios WHERE id = $1 FOR UPDATE",
      [idComentario],
    );
    if (!comentario.rowCount || comentario.rows[0].removido) {
      await client.query("ROLLBACK");
      return res.status(404).json({ mensagem: "Este comentário não está mais disponível." });
    }
    if (Number(comentario.rows[0].id_usuario) === idUsuario) {
      await client.query("ROLLBACK");
      return res.status(403).json({ mensagem: "Você não pode denunciar sua própria avaliação." });
    }

    const denunciaExistente = await client.query(
      "SELECT id FROM denuncia WHERE id_comentario = $1 AND id_usuario = $2 LIMIT 1",
      [idComentario, idUsuario],
    );
    if (denunciaExistente.rowCount) {
      await client.query("COMMIT");
      return res.json({ mensagem: "Você já denunciou este comentário.", comentarioRemovido: false });
    }

    await client.query(
      "INSERT INTO denuncia (motivo, id_usuario, id_comentario) VALUES ($1, $2, $3)",
      [motivo.trim(), idUsuario, idComentario],
    );
    const total = await client.query(
      "SELECT COUNT(DISTINCT id_usuario)::INTEGER AS total FROM denuncia WHERE id_comentario = $1",
      [idComentario],
    );
    const comentarioRemovido = Number(total.rows[0].total) >= 2;
    if (comentarioRemovido) {
      await client.query("UPDATE comentarios SET removido = TRUE WHERE id = $1", [idComentario]);
      await client.query(
        "UPDATE denuncia SET status = 'procedente' WHERE id_comentario = $1 AND status = 'pendente'",
        [idComentario],
      );
    }
    await client.query("COMMIT");
    return res.status(201).json({
      mensagem: comentarioRemovido
        ? "Denúncia registrada. O comentário foi ocultado após denúncias de duas pessoas diferentes."
        : "Denúncia registrada. Se outra pessoa também denunciar, o comentário será ocultado.",
      comentarioRemovido,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
