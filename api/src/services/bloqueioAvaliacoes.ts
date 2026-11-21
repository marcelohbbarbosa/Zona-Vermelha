import { pool } from "../database/connection";

export async function obterBloqueioAvaliacoes(idUsuario: number): Promise<Date | null> {
  const resultado = await pool.query(
    "SELECT avaliacao_bloqueada_ate FROM usuarios WHERE id = $1",
    [idUsuario],
  );
  const bloqueadoAte = resultado.rows[0]?.avaliacao_bloqueada_ate;
  return bloqueadoAte && new Date(bloqueadoAte).getTime() > Date.now()
    ? new Date(bloqueadoAte)
    : null;
}

export function mensagemBloqueio(bloqueadoAte: Date) {
  return `Sua conta não pode publicar avaliações até ${bloqueadoAte.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}, após duas avaliações removidas por denúncias.`;
}
