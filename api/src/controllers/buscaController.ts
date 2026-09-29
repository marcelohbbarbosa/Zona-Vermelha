import { Request, Response } from "express";

export async function buscarLocais(req: Request, res: Response) {
  const consulta = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (consulta.length < 3) return res.status(400).json({ mensagem: "Digite pelo menos 3 caracteres." });

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.search = new URLSearchParams({
    format: "jsonv2",
    q: `${consulta}, Baixada Santista, Brasil`,
    countrycodes: "br",
    viewbox: "-47.5,-23.4,-45.5,-24.8",
    bounded: "1",
    limit: "8",
  }).toString();

  const resposta = await fetch(url, {
    headers: { "User-Agent": "ZonaVermelha/1.0 (zonavermelhabackend@gmail.com)" },
  });
  if (!resposta.ok) return res.status(502).json({ mensagem: "O serviço de busca está indisponível. Tente novamente." });

  const dados = await resposta.json() as Array<{ place_id: number; display_name: string; lat: string; lon: string }>;
  return res.json(dados.map((local) => ({
    id: local.place_id,
    nome: local.display_name,
    latitude: Number(local.lat),
    longitude: Number(local.lon),
  })));
}
