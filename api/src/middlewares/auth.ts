import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

export interface RequestAutenticado extends Request {
  usuario?: { id: number; email: string };
}

export function autenticar(req: RequestAutenticado, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ mensagem: "Token não fornecido" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: number; email: string };
    req.usuario = payload;
    next();
  } catch {
    return res.status(401).json({ mensagem: "Token inválido ou expirado" });
  }
}