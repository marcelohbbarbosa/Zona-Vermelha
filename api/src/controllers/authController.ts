import { randomBytes, createHash } from "crypto";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../database/connection";
import { enviarEmail } from "../services/emailService";
import { RequestAutenticado } from "../middlewares/auth";

const JWT_SECRET = process.env.JWT_SECRET;
const API_URL = (process.env.API_PUBLIC_URL || "https://zona-vermelha-backend.onrender.com").replace(/\/$/, "");

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function tokenAleatorio() {
  return randomBytes(32).toString("hex");
}

function emailValido(email: unknown): email is string {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function pagina(mensagem: string) {
  return `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Zona Vermelha</title><body style="font:16px sans-serif;max-width:520px;margin:48px auto;padding:0 20px"><h1>Zona Vermelha</h1><p>${mensagem}</p></body></html>`;
}

export async function registrar(req: Request, res: Response) {
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const { senha } = req.body;

  if (!emailValido(email) || typeof senha !== "string" || senha.length < 6) {
    return res.status(400).json({ mensagem: "Informe um e-mail válido e uma senha com pelo menos 6 caracteres." });
  }

  const token = tokenAleatorio();
  const senhaHash = await bcrypt.hash(senha, 10);
  try {
    const resultado = await pool.query(
      `INSERT INTO usuarios (email, senha, email_verificado, token_verificacao_hash, token_verificacao_expira_em)
       VALUES ($1, $2, FALSE, $3, NOW() + INTERVAL '24 hours') RETURNING id, email`,
      [email, senhaHash, hashToken(token)],
    );
    const link = `${API_URL}/auth/verificar-email?token=${token}`;
    try {
      await enviarEmail(email, "Confirme seu e-mail - Zona Vermelha", `<p>Para confirmar seu e-mail, <a href="${link}">clique aqui</a>. O link expira em 24 horas.</p>`);
    } catch {
      return res.status(503).json({ mensagem: "Conta criada, mas não foi possível enviar o e-mail. Tente solicitar um novo link mais tarde." });
    }
    return res.status(201).json({ mensagem: "Cadastro criado. Confira seu e-mail para confirmar a conta.", usuario: resultado.rows[0] });
  } catch (erro: any) {
    if (erro?.code === "23505") return res.status(409).json({ mensagem: "Email já cadastrado" });
    throw erro;
  }
}

export async function verificarEmail(req: Request, res: Response) {
  const token = typeof req.query.token === "string" ? req.query.token : "";
  if (!token) return res.status(400).send(pagina("O link de confirmação está incompleto."));
  const resultado = await pool.query(
    `UPDATE usuarios SET email_verificado = TRUE, token_verificacao_hash = NULL, token_verificacao_expira_em = NULL
     WHERE token_verificacao_hash = $1 AND token_verificacao_expira_em > NOW() RETURNING id`,
    [hashToken(token)],
  );
  if (!resultado.rowCount) return res.status(400).send(pagina("Este link expirou ou já foi utilizado. Solicite outro link de confirmação."));
  return res.send(pagina("E-mail confirmado. Agora você pode entrar no aplicativo."));
}

export async function reenviarConfirmacao(req: Request, res: Response) {
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  if (!emailValido(email)) return res.status(400).json({ mensagem: "Informe um e-mail válido." });

  const token = tokenAleatorio();
  const resultado = await pool.query(
    `UPDATE usuarios SET token_verificacao_hash = $2, token_verificacao_expira_em = NOW() + INTERVAL '24 hours'
     WHERE email = $1 AND email_verificado = FALSE RETURNING email`,
    [email, hashToken(token)],
  );
  if (resultado.rowCount) {
    const link = `${API_URL}/auth/verificar-email?token=${token}`;
    await enviarEmail(email, "Confirme seu e-mail - Zona Vermelha", `<p><a href="${link}">Clique aqui para confirmar seu e-mail</a>. O link expira em 24 horas.</p>`);
  }
  return res.json({ mensagem: "Se houver uma conta pendente para esse endereço, enviaremos um novo link." });
}

export async function solicitarRedefinicao(req: Request, res: Response) {
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  if (!emailValido(email)) return res.status(400).json({ mensagem: "Informe um e-mail válido." });

  const token = tokenAleatorio();
  const resultado = await pool.query(
    `UPDATE usuarios SET token_redefinicao_hash = $2, token_redefinicao_expira_em = NOW() + INTERVAL '1 hour'
     WHERE email = $1 AND email_verificado = TRUE RETURNING email`,
    [email, hashToken(token)],
  );
  if (resultado.rowCount) {
    const link = `${API_URL}/auth/redefinir-senha?token=${token}`;
    await enviarEmail(email, "Redefina sua senha - Zona Vermelha", `<p>Este link expira em uma hora. <a href="${link}">Clique aqui para escolher uma nova senha</a>.</p>`);
  }
  return res.json({ mensagem: "Se houver uma conta confirmada para esse endereço, enviaremos instruções para redefinir a senha." });
}

export async function redefinirSenha(req: Request, res: Response) {
  const { token, senha } = req.body;
  if (typeof token !== "string" || typeof senha !== "string" || senha.length < 6) {
    return res.status(400).json({ mensagem: "Token inválido ou senha menor que 6 caracteres." });
  }
  const senhaHash = await bcrypt.hash(senha, 10);
  const resultado = await pool.query(
    `UPDATE usuarios SET senha = $2, token_redefinicao_hash = NULL, token_redefinicao_expira_em = NULL
     WHERE token_redefinicao_hash = $1 AND token_redefinicao_expira_em > NOW() RETURNING id`,
    [hashToken(token), senhaHash],
  );
  if (!resultado.rowCount) return res.status(400).json({ mensagem: "Link inválido ou expirado. Solicite uma nova redefinição." });
  return res.json({ mensagem: "Senha atualizada." });
}

export function paginaRedefinirSenha(req: Request, res: Response) {
  const token = typeof req.query.token === "string" ? req.query.token : "";
  if (!/^[a-f0-9]{64}$/.test(token)) return res.status(400).send(pagina("O link de redefinição é inválido."));
  return res.send(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Redefinir senha</title><body style="font:16px sans-serif;max-width:520px;margin:48px auto;padding:0 20px"><h1>Redefina sua senha</h1><form id="f"><label>Nova senha (mínimo 6 caracteres)<br><input id="s" type="password" minlength="6" required></label><button>Salvar senha</button></form><p id="m"></p><script>document.getElementById('f').onsubmit=async e=>{e.preventDefault();const r=await fetch('/auth/redefinir-senha',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:'${token}',senha:document.getElementById('s').value})});const d=await r.json();document.getElementById('m').textContent=d.mensagem;}</script></body></html>`);
}

export async function login(req: Request, res: Response) {
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const { senha } = req.body;
  if (!emailValido(email) || typeof senha !== "string") {
    return res.status(400).json({ mensagem: "E-mail e senha são obrigatórios." });
  }

  const resultado = await pool.query("SELECT id, email, senha, email_verificado FROM usuarios WHERE email = $1", [email]);
  const usuario = resultado.rows[0];
  if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
    return res.status(401).json({ mensagem: "Credenciais inválidas" });
  }
  if (!usuario.email_verificado) {
    return res.status(403).json({ mensagem: "Confirme seu e-mail antes de entrar.", codigo: "EMAIL_NAO_CONFIRMADO" });
  }
  if (!JWT_SECRET) throw new Error("JWT_SECRET não está configurada.");
  const token = jwt.sign({ id: usuario.id, email: usuario.email }, JWT_SECRET, { expiresIn: "7d" });
  return res.json({ usuario: { id: usuario.id, email: usuario.email }, token });
}

export async function perfil(req: RequestAutenticado, res: Response) {
  const resultado = await pool.query(
    "SELECT id, email, email_verificado AS \"emailVerificado\" FROM usuarios WHERE id = $1",
    [req.usuario!.id],
  );
  if (!resultado.rowCount) return res.status(404).json({ mensagem: "Conta não encontrada." });
  return res.json(resultado.rows[0]);
}
