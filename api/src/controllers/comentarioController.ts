import { Request, Response } from "express";
import { Comentario } from "../types/comentario";

let comentarios: Comentario[] = [];
let proximoId = 1;

export function listarComentarios(req: Request, res: Response) {
  res.json(comentarios);
}

export function criarComentario(req: Request, res: Response) {
  const { zona, comentario } = req.body;

  if (!campoValido(zona) || !campoValido(comentario)) {
    return res.status(400).json({ mensagem: "Zona e comentario sao obrigatorios" });
  }

  const novoComentario: Comentario = {
    id: proximoId,
    zona: zona.trim(),
    comentario: comentario.trim(),
    dataCriacao: new Date()
  };

  comentarios.push(novoComentario);
  proximoId++;

  res.status(201).json(novoComentario);
}

export function atualizarComentario(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { zona, comentario } = req.body;

  const comentarioExistente = comentarios.find((item) => item.id === id);

  if (!comentarioExistente) {
    return res.status(404).json({ mensagem: "Comentario nao encontrado" });
  }

  if (!campoValido(zona) || !campoValido(comentario)) {
    return res.status(400).json({ mensagem: "Zona e comentario sao obrigatorios" });
  }

  comentarioExistente.zona = zona.trim();
  comentarioExistente.comentario = comentario.trim();

  res.json(comentarioExistente);
}

export function deletarComentario(req: Request, res: Response) {
  const id = Number(req.params.id);

  const comentarioExiste = comentarios.some((item) => item.id === id);

  if (!comentarioExiste) {
    return res.status(404).json({ mensagem: "Comentario nao encontrado" });
  }

  comentarios = comentarios.filter((item) => item.id !== id);

  res.status(204).send();
}

function campoValido(valor: unknown): valor is string {
  return typeof valor === "string" && valor.trim().length > 0;
}
