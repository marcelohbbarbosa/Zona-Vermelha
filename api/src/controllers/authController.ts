import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../database/connection";

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function registrar(req: Request, res: Response) {
  const { email, senha } = req.body;

  if (!email || !senha || senha.length < 6) {
    return res.status(400).json({ mensagem: "Email e senha (mínimo 6 caracteres) são obrigatórios" });
  }

  const jaExiste = await pool.query("SELECT id FROM usuarios WHERE email = $1", [email]);
  if (jaExiste.rows.length > 0) {
    return res.status(409).json({ mensagem: "Email já cadastrado" });
  }

  const hash = await bcrypt.hash(senha, 10);
  const resultado = await pool.query(
    "INSERT INTO usuarios (email, senha) VALUES ($1, $2) RETURNING id, email",
    [email, hash]
  );

  const usuario = resultado.rows[0];
  const token = jwt.sign({ id: usuario.id, email: usuario.email }, JWT_SECRET, { expiresIn: "7d" });

  res.status(201).json({ usuario, token });
}

export async function login(req: Request, res: Response) {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ mensagem: "Email e senha são obrigatórios" });
  }

  const resultado = await pool.query("SELECT id, email, senha FROM usuarios WHERE email = $1", [email]);
  const usuario = resultado.rows[0];

  if (!usuario) {
    return res.status(401).json({ mensagem: "Credenciais inválidas" });
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senha);
  if (!senhaValida) {
    return res.status(401).json({ mensagem: "Credenciais inválidas" });
  }

  const token = jwt.sign({ id: usuario.id, email: usuario.email }, JWT_SECRET, { expiresIn: "7d" });

  res.json({ usuario: { id: usuario.id, email: usuario.email }, token });
}